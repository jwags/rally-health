Ext.define('Rally.technicalservices.util.Utilities', {
    singleton: true,
    hashToArray: function(hash) {
        var result = [];
        for ( var key in hash ) {
            result.push(hash[key]);
        }
        return result;
    },
    /*
     * Given a hash of TS projects where the key is the object id of the project,
     * return an array of TS projects with their parent/child relationships wired up
     */
    structureProjects: function(structured_projects, add_root) {
        var me = this;
        var potential_root = Ext.create('Rally.technicalservices.ProjectModel',{
            Name: 'Workspace',
            ObjectID: null
        });
        
        for ( var pid in structured_projects ) {
            var child = structured_projects[pid];
            if ( child.get('parent_id') && structured_projects[child.get('parent_id')] ) {
                var parent = structured_projects[child.get('parent_id')];
                parent.addChild(child);
            } else if ( add_root ) {
                potential_root.addChild(child);
            }
        }
        
        var results = this.hashToArray(structured_projects);
        if ( add_root ) {
            results.unshift(potential_root);
        }
        return results
    },
    /*
     * Given a hash that represents an item with children, return
     * an array of the items with the items exploded (in order, top down (follow a branch then come back to next branch))
     * 
     * That is, order is parent 1, child 1a, child 1b, parent 2, child 2a
     */
    hashToOrderedArray: function(hash,child_field_name) {
        var me = this;
        var the_array = [hash];
        
        var kids = hash[child_field_name];
// add this back if we want the order to be parent 1, parent 2, child 1a, child 1b, child 2a
//        Ext.Array.each(kids, function(kid){
//            the_array.push(kid);
//        });
        
        Ext.Array.each(kids, function(kid){
            var kid_array = me.hashToOrderedArray(kid,child_field_name);
            the_array = Ext.Array.merge(the_array,kid_array);
        });
        
        return the_array;
    },
    /**
     * Given a hash with nested hashes of similar strucure (nested by field "children"), 
     * find the item in the hash 
     *   where the given field has the given value
     */
    getFromHashByField: function(hash,by_field_name,by_field_value){
        var me = this;
        var result = null;
        if (hash[by_field_name] == by_field_value) {
            return hash;
        }
        if ( hash.children ) {
            Ext.Array.each(hash.children,function(child){
                result = me.getFromHashByField(child,by_field_name,by_field_value);
                if (result) {
                    return false;
                }
            });
        }
        return result;
    },
    /** 
     * Given an array ot TSProjects, get one out of the array by its ID
     */
    getProjectById: function(project_array,object_id) {
        var result = null;
        var field_name = "ObjectID";
        Ext.Array.each(project_array, function(project) {
            if (project.get(field_name) == object_id) {
                result = project;
            }
        });
        return result;
    },
    daysBetween: function(begin_date_js,end_date_js,skip_weekends){
        var dDate1 = Ext.clone(begin_date_js).setHours(0,0,0,0);
        var dDate2 = Ext.clone(end_date_js).setHours(0,0,0,0);
        
        if ( dDate1 == dDate2 ) { return 0; }
        if (typeof dDate1 === "number") { dDate1 = new Date(dDate1); }
        if (typeof dDate2 === "number") { dDate2 = new Date(dDate2); }
            
        if ( !skip_weekends ) {
            return Math.abs( Rally.util.DateTime.getDifference(dDate1,dDate2,'day') );
        } else {
            // from the sOverflow
            var iWeeks, iDateDiff, iAdjust = 0;
            if (dDate2 < dDate1) 
            { 
                var x = dDate2;
                dDate2 = dDate1;
                dDate1 = x;
            }
            var iWeekday1 = dDate1.getDay(); // day of week
            var iWeekday2 = dDate2.getDay();
            iWeekday1 = (iWeekday1 == 0) ? 7 : iWeekday1; // change Sunday from 0 to 7
            iWeekday2 = (iWeekday2 == 0) ? 7 : iWeekday2;
            if ((iWeekday1 > 5) && (iWeekday2 > 5)) iAdjust = 1; // adjustment if both days on weekend
            iWeekday1 = (iWeekday1 > 5) ? 5 : iWeekday1; // only count weekdays
            iWeekday2 = (iWeekday2 > 5) ? 5 : iWeekday2;
    
            // calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
            iWeeks = Math.floor((dDate2.getTime() - dDate1.getTime()) / 604800000)
    
            if (iWeekday1 <= iWeekday2) {
              iDateDiff = (iWeeks * 5) + (iWeekday2 - iWeekday1)
            } else {
              iDateDiff = ((iWeeks + 1) * 5) - (iWeekday1 - iWeekday2)
            }
    
            iDateDiff -= iAdjust // take into account both days on weekend
    
            if ( iDateDiff < 0 ) { iDateDiff = 0; }
            return (iDateDiff); 
        }
    }
});