describe("Fast Project Model tests for ICFD health",function(){
    var today;
    var today_minus_1
    var today_minus_2
    
    beforeEach(function () {
        today = new Date();
        today_minus_1 = Rally.util.DateTime.add(today,"day",-1);
        today_minus_2 = Rally.util.DateTime.add(today,"day",-2);
        today_minus_3 = Rally.util.DateTime.add(today,"day",-3);
    });
  
    describe("When adding ICFD data", function(){
        it('should reset health measures',function() {
            var child = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            var parent = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Parent',
                ObjectID: 1236
            });
            
            parent.addChild(child);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_2 });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_2 });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_2 });
            
            parent.setIterationCumulativeFlowData([ accepted_day_1,in_p_day_1,defined_day_1]);
            child.setIterationCumulativeFlowData([ accepted_day_1,in_p_day_1,defined_day_1]);
            
            parent.resetHealth();
            child.resetHealth();
            expect(child.get('health_ratio_in-progress')).toEqual(0);
            expect(parent.get('health_ratio_in-progress')).toEqual(-1);
            expect(child.get('health_half_accepted_ratio')).toEqual(2);
            expect(parent.get('health_half_accepted_ratio')).toEqual(-1);
        });
    });
    
    describe("When adding ICFD data to projects calculate daily totals",function(){
        it('should determine total daily plan estimates',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 20% in progress
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_2 });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_2 });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_2 });
            // Day 2, 40% in progress
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 2, CreationDate: today_minus_1 });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 4, CreationDate: today_minus_1 });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_1 });
            // Day 3, 15% in progress 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 8, CreationDate: today });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: today });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: today });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            
            var expected_daily_totals = {};
            expected_daily_totals[today_minus_2] = 5;
            expected_daily_totals[today_minus_1] = 10;
            expected_daily_totals[today] = 11
            
            expect(project.getDailyTotalByState()).toEqual(expected_daily_totals);
            
            var expected_daily_progress_totals = {};
            expected_daily_progress_totals[today_minus_2] = 1;
            expected_daily_progress_totals[today_minus_1] = 4;
            expected_daily_progress_totals[today] = 3;
            
            expect(project.getDailyTotalByState('In-Progress')).toEqual(expected_daily_progress_totals);
        });
    });
    
    describe("When adding ICFD data to projects to calculate daily in-progress",function(){
        it('should determine average daily plan estimates',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 20% in progress
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_2 });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_2 });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_2 });
            // Day 2, 40% in progress
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 2, CreationDate: today_minus_1 });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 4, CreationDate: today_minus_1 });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_1 });
            // Day 3, 15% in progress 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 17, CreationDate: today });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: today });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: today });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_ratio_in-progress')).toEqual(0.25);
        });

        it('should not calculate a ratio for parents',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Parent',
                ObjectID: 1235
            });
            
            var child = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1234
            });
            
            project.addChild(child);
            
            // Day 1, 20% in progress
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_2 });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_2 });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_2 });
            
            project.setIterationCumulativeFlowData([ accepted_day_1,in_p_day_1,defined_day_1]);
            expect(project.get('health_ratio_in-progress')).toEqual(-1);
            
        });
    });
    
    describe("When adding ICFD data to projects to calculate acceptance completion",function(){
        it('should determine day count for half accepted',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_2 });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_2 });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_2 });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: today_minus_1 });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_1 });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: today_minus_1 });
            // Day 3, a lot accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 17, CreationDate: today });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: today });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: today });
            
            project.set('iteration_day_count',3);
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(0.67);
        });
        
        it('should determine day count for half accepted then unaccepted',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_3 });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_3 });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_3 });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: today_minus_2 });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_2 });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: today_minus_2 });
            // Day 3, 0% accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_1 });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: today_minus_1 });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: today_minus_1 });
            // Day 4, 75% accepted
            var accepted_day_4 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 3, CreationDate: today });
            var in_p_day_4 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today });
            var defined_day_4 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: today });
            
            project.set('iteration_day_count',4);
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3,
                accepted_day_4,in_p_day_4,defined_day_4
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(1);
        });

                
        it('should return 2 if not 50% accepted',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_3 });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_3 });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_3 });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: today_minus_2 });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_2 });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: today_minus_2 });
            // Day 3, 0% accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today_minus_1 });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: today_minus_1 });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: today_minus_1 });
            // Day 4, 75% accepted
            var accepted_day_4 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: today });
            var in_p_day_4 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: today });
            var defined_day_4 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: today });
            
            project.set('iteration_day_count',4);
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3,
                accepted_day_4,in_p_day_4,defined_day_4
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(2);
        });
        
        it('should determine day count for half accepted (when assuming number of days from flow)',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 5, CreationDate: today_minus_2 });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_2 });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: today_minus_2 });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: today_minus_1 });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: today_minus_1 });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: today_minus_1 });
            // Day 3, a lot accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 17, CreationDate: today });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: today });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: today });
            
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(0.33);
        });
    });    
});