Ext.define('TSDescriptions', {
    singleton: true,
    defaultF: function(value,metaData,record,rowIndex,colIndex,store,view){
        return value;
    },
    get_description: function(column) {
        var me = this;
        
        var data_index = column;
        var data_name = null;
        if ( typeof(column) !== "string" ) {
            data_index = column.dataIndex;
        } else {
            column = {
                dataIndex: data_index,
                text: null
            }
        }
        
        if ( typeof this[data_index] == "string") {
            var tpl = new Ext.XTemplate( me[data_index] );
            
            return tpl.apply(column);
        } else {
            return data_name;
        }
    },
    health_churn: "<b>{text}</b> <br/><br/>A measure of the change in the iteration's scope.<br/><br/>" +
         "It is defined as the standard deviation of the total scheduled <br/>" +
         "into the sprint divided by the average daily total.",
                  
    health_churn_direction: "<b>{text}</b> is an indicator of the general direction of scope change.<br/><br/>" +
        "It is determined by examining every day's change from the day before and adding or subtracting <br/>" +
        "the delta to determine whether scope has been added more often than subtracted. (The first day of <br/>" +
        "the iteration is excluded from this calculation.)",
        
    number_of_days_in_sprint: "<b>{text}</b> represents the number of full days in the iteration <br/>" +
            "(Excluding weekends)",
    health_ratio_estimated: "<b>{text}</b><br/><br/>" +
        "<b>Description</b><br/><br/>" +
        "Represents the ratio of work items (stories and defects) that have estimates.<br/><br/>" +
        "<b>How it is calculated</b><br/><br/>" +
        "Divide the number of work items (stories and defects) in the iteration that have a plan <br/>" +
        "estimate that is not null by the total number of items in the iteration multiplied by 100. <br/><br/>" +
        "<b>Coaching Tip</b><br/><br/>" + 
        "If there is a very high percentage or stories without estimates, other measures will not <br/>" + 
        "be meaningful.  This is really only useful for the beginning of an iteration, and perhaps <br/>" + 
        "for an iteration in early flight, but not for an iteration that has ended.  The idea is to <br/>" + 
        "catch this early in an iteration so other charts/graphs etc are useful for teams.  A good <br/>" + 
        "practice is to have a ready backlog as and entrance criteria to an iteration planning session, <br/>" + 
        "a ready backlog means three things, sized, ranked, and stories are elaborated sufficiently with <br/>" + 
        "acceptance criteria to enable conversation and confirmation during planning.",
    health_end_acceptance_ratio: "<b>{text}</b> is the percentage of items that were accepted before<br/>" +
            "the iteration ended.",
    health_ratio_in_progress: "<b>{text}</b> represents the average of the daily percentages of items<br/>" +
            "marked as In Progress",
    health_half_accepted_ratio:"<b>{text}</b> represents the point in the iteration where at least 50%<br/>" +
            "of the scheduled items were accepted.  (If an accepted item rolls back in state, the search for a new<br/>" +
            "halfway mark restarts.)",
    health_end_incompletion_ratio:"<b>{text}</b>"

});