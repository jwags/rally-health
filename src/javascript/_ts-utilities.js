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
     * an array of the items with the items exploded (in order, top down)
     * 
     */
    hashToOrderedArray: function(hash,child_field_name) {
        var me = this;
        var the_array = [hash];
        console.log("hashToOrderedArray",hash,child_field_name);
        
        var kids = hash[child_field_name];
        Ext.Array.each(kids, function(kid){
            the_array.push(kid);
        });
        
        Ext.Array.each(kids, function(kid){
            var kid_array = me.hashToOrderedArray(kid,child_field_name);
            the_array = Ext.Array.merge(the_array,kid_array);
        });
        
        console.log('returning',the_array);
        return the_array;
    }
});