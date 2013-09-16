var useName = function(value,record) {
    if ( record.get('Name') ) {
        return record.get('Name');
    } 
    return null;
}

var useObjectID = function(value,record) {
    if ( record.get('ObjectID') ) {
        return record.get('ObjectID');
    } 
    return 0;
}

Ext.define('Rally.technicalservices.ProjectModel',{
    extend: 'Ext.data.Model',
    fields: [
        {name:'ObjectID', type: 'int'},
        {name:'Name',type:'string'},
        {name:'parent_id',type:'int'},
        {name:'id',type:'int',convert:useObjectID},
        {name:'text',type:'string',convert:useName},
        {name:'number_of_days_in_sprint',type:'int',defaultValue:-1},
        /*  following values are calculated */
        {name:'child_count',type:'int',defaultValue:0},
        {name:'health_ratio_estimated',type:'float',defaultValue:0},
        {name:'health_ratio_in-progress',type:'float',defaultValue:0},
        {name:'health_half_accepted_ratio',type:'float',defaultValue:2},
        {name:'health_end_incompletion_ratio',type:'float',defaultValue:2},
        {name:'health_end_acceptance_ratio',type:'float',defaultValue:2}
    ],
    hasMany:[{model:'Rally.technicalservices.ProjectModel', name:'children'}],
    associations: [
        {type:'belongsTo',model:'Rally.technicalservices.ProjectModel', setterName: 'setParent', getterName:'getParent', primaryKey:'ObjectID',foreignKey:'parent_id'}
    ],
    addChild: function(child) {
        this.set('health_ratio_estimated',-1);
        this.set('health_ratio_in-progress',-1);
        this.set('health_half_accepted_ratio',-1);
        this.set('health_end_incompletion_ratio',-1);
        this.set('health_end_acceptance_ratio',-1);

        if ( child.get('parent_id') !== this.get('ObjectID') ) {
            child.setParent(this.get('ObjectID'));
        }
        if ( this.get('children') ) {
            var kids = this.get('children');
            kids.push(child);
            this.set('children',kids);
        } else {
            this.set('children',[child]);
        }
        this.set('child_count',this.get('children').length);
    },
    /**
     * override because we just want the kids without going through a load process
     */
    getAssociatedData: function(){
        var children = [];
        var kids = this.get('children');
        Ext.Array.each( kids, function(kid) {
            children.push(kid.getData(true));
        });
        return { 'children': children };
    },
    /**
     * Given an array of iteration cumulative flow objects, calculate a few health metrics
     */
    setIterationCumulativeFlowData: function(icfd){
        var me = this;
        this.daily_totals = {};
        if ( this.get('child_count')  > 0 ) {
            this.set('health_ratio_in-progress',-1);
        } else {
                    
            Ext.Array.each(icfd, function(cf) {
                var card_date = cf.get('CreationDate');
                // eliminate weekends
                if ( !card_date || ( card_date.getDay() > 0 && card_date.getDay() < 6 )) {
                    var card_estimate = cf.get('CardEstimateTotal');
                    var card_state = cf.get('CardState');
                    
                    if ( !me.daily_totals.All ) { me.daily_totals.All = {}; }
                    if ( !me.daily_totals[card_state]){ me.daily_totals[card_state] = {} }
                    
                    if ( !me.daily_totals.All[card_date] ) { me.daily_totals.All[card_date] = 0; }
                    if ( !me.daily_totals[card_state][card_date] ) { me.daily_totals[card_state][card_date] = 0; }
        
                    me.daily_totals.All[card_date] += card_estimate;
                    me.daily_totals[card_state][card_date] += card_estimate;
                }
            });
            
            this._setAverageInProgress();
            this._setHalfAcceptanceRatio();
            this._setAcceptanceRatio();
            this._setIncompletionRatio();
        }
    },
    /**
     * Given a hash of hashes structured as:
     * 
     * The outer hash key is state (plus "All")
     * The inner hash key is date (in JS date format)
     * The inner value is the sum of estimates for that day
     */
    _setAverageInProgress:function(){
        var all_hash = this.getDailyTotalByState();
        var ip_hash = this.getDailyTotalByState("In-Progress");

        if (!all_hash || !ip_hash) { 
            this.set('health_ratio_in-progress',0); 
        } else {
            var totals = [];

            for ( var card_date in all_hash ) {
                var day_total = all_hash[card_date];
                var day_ip = ip_hash[card_date] || 0;
                
                totals.push( day_ip/day_total );
            }
            this.set('health_ratio_in-progress',Ext.util.Format.number(Ext.Array.mean(totals),"0.00"));
        }
    },
    /**
     * Given a hash of hashes structured as:
     * 
     * The outer hash key is state (plus "All")
     * The inner hash key is date (in JS date format)
     * The inner value is the sum of estimates for that day
     */
    _setHalfAcceptanceRatio:function(){
        var all_hash = this.getDailyTotalByState();
        var accepted_hash = this.getDailyTotalByState("Accepted");

        if (!all_hash || !accepted_hash) { 
            this.set('health_half_accepted_ratio',0); 
        } else {
            var day_index = -1;
            var day_counter = 0;
            for ( var card_date in all_hash ) {
                    day_counter++;
                    
                    var day_total = all_hash[card_date];
                    var day_accepted = accepted_hash[card_date] || 0;
                    
                    if ( day_accepted/day_total >= 0.5 && day_index === -1 ) {
                        day_index = day_counter;
                    } else if ( day_accepted/day_total < 0.5 && day_index > -1 ) {
                        // if we slipped back to under 50%
                        day_index = -1;
                    }
            }
            var ratio = 2;
            if ( day_index > -1 ) {
                if ( this.get('number_of_days_in_sprint') > -1 ) {
                    day_counter = this.get('number_of_days_in_sprint');
                }
                ratio = Ext.util.Format.number(day_index/day_counter,"0.00");
            }
            this.set('health_half_accepted_ratio',ratio);
        }
    },
    /**
     * Given a hash of hashes structured as:
     * 
     * The outer hash key is state (plus "All")
     * The inner hash key is date (in JS date format)
     * The inner value is the sum of estimates for that day
     */
    _setIncompletionRatio:function(){
        var all_hash = this.getDailyTotalByState();
        var accepted_hash = this.getDailyTotalByState("Accepted");
        var completion_hash = this.getDailyTotalByState("Completed");
        
        if (!all_hash) { 
            this.set('health_end_incompletion_ratio',0); 
        } else {
            var card_dates = Ext.Object.getKeys(all_hash);
            var last_date = card_dates.pop();
            
            var last_total = all_hash[last_date];
            var last_accepted = 0;
            var last_completed = 0;
            if ( accepted_hash ) {
                last_accepted = accepted_hash[last_date] || 0;
            }
            if ( completion_hash ) {
                last_completed = completion_hash[last_date] || 0;
            }
            var ratio = 1 - ( (last_completed+last_accepted)/last_total );
            ratio = Ext.util.Format.number(ratio,"0.00");
            
            this.set('health_end_incompletion_ratio',ratio);
        }
    },
    /**
     * Given a hash of hashes structured as:
     * 
     * The outer hash key is state (plus "All")
     * The inner hash key is date (in JS date format)
     * The inner value is the sum of estimates for that day
     */
    _setAcceptanceRatio:function(){
        var all_hash = this.getDailyTotalByState();
        var accepted_hash = this.getDailyTotalByState("Accepted");
        
        if (!all_hash) { 
            this.set('health_end_acceptance_ratio',0); 
        } else {
            var card_dates = Ext.Object.getKeys(all_hash);
            var last_date = card_dates.pop();
            
            var last_total = all_hash[last_date];
            var last_accepted = 0;
            var last_completed = 0;
            if ( accepted_hash ) {
                last_accepted = accepted_hash[last_date] || 0;
            }
            
            var ratio = last_accepted/last_total;
            ratio = Ext.util.Format.number(ratio,"0.00");
            
            this.set('health_end_acceptance_ratio',ratio);
        }
    },
    /*
     * Given a state, what are the total values in that state for each date?
     * 
     * return full total when no state provided
     */
    getDailyTotalByState: function(state) {
        if ( !state ) { state = "All"; }
        return this.daily_totals[state];
    },
    /**
     * Given an array of artifacts (stories and defects), calculate some health metrics
     * 
     */
    setIterationArtifacts: function(artifacts){
        // parents don't roll up.  set to -1
        if ( this.get('child_count')  > 0 ) {
            this.set('health_ratio_estimated',-1);
        } else {
            var plan_estimate_total = 0;
            var count_of_estimated_artifacts = 0;
            
            Ext.Array.each(artifacts,function(artifact){
                var plan_estimate = artifact.get('PlanEstimate') || 0;
                plan_estimate_total += plan_estimate;
                if ( plan_estimate > 0 ) {
                    count_of_estimated_artifacts++;
                }
            });
            
            if ( artifacts.length > 0 ) {
                this.set('health_ratio_estimated',(count_of_estimated_artifacts/artifacts.length));
            }
        }
    },
    resetHealth: function() {
        if ( this.get('child_count')  > 0 ) {
            this.set('health_ratio_estimated',-1);
            this.set('health_ratio_in-progress',-1);
            this.set('health_half_accepted_ratio',-1);
            this.set('health_end_incompletion_ratio',-1);
            this.set('health_end_acceptance_ratio',-1);
        } else {
            this.set('health_ratio_estimated',0);
            this.set('health_ratio_in-progress',0);
            this.set('health_half_accepted_ratio',2);
            this.set('health_end_incompletion_ratio',2);
            this.set('health_end_acceptance_ratio',2);
        }
    }
});