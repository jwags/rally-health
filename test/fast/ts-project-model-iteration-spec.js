describe("Fast Project Model tests for associating with an iteration",function(){
    var wednesday;
    var tuesday;
    var monday;
    var thursday;
    var friday;
    var saturday;
    var sunday;
    
    beforeEach(function () {
        friday = new Date(2013,8,20,0,0,0);
        saturday = new Date(2013,8,21,0,0,0);
        sunday = new Date(2013,8,22,0,0,0);
        monday = new Date(2013,8,23,0,0,0);
        tuesday = new Date(2013,8,24,0,0,0);
        wednesday = new Date(2013,8,25,0,0,0);
        thursday = new Date(2013,8,26,0,0,0);
    });
  
    describe("When associating an Iteration by hash",function(){
       it('should return iteration information',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: monday,
                EndDate: shiftDayBeginningToEnd(wednesday)
            };
            project.addIteration(iteration);

            expect(project.get('iteration_name')).toEqual("Sprint 1");
            expect(project.get('iteration_end_date')).toEqual(shiftDayBeginningToEnd(wednesday));
            expect(project.get('iteration_start_date')).toEqual(monday);
            expect(project.get('number_of_days_in_sprint')).toEqual(3);
        });
    });
    
    describe("When associating an Iteration", function(){
        it('should return iteration information',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = Ext.create('mockIteration',{
                StartDate: monday,
                EndDate: shiftDayBeginningToEnd(wednesday),
                Name: "Sprint 1",
                ObjectID: 8675309
            });
            project.addIteration(iteration);
            
            expect(project.get('iteration_name')).toEqual("Sprint 1");
            expect(project.get('iteration_end_date')).toEqual(shiftDayBeginningToEnd(wednesday));
            expect(project.get('iteration_start_date')).toEqual(monday);
            expect(project.get('number_of_days_in_sprint')).toEqual(3);
        });
        
        it('should return days in iteration excluding weekend',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: friday,
                EndDate: shiftDayBeginningToEnd(tuesday)
            };
            project.addIteration(iteration);
            
            expect(project.get('number_of_days_in_sprint')).toEqual(3);
        });
        
    });
    
    
});