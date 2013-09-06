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
        /*  following values are calculated */
        {name:'child_count',type:'int',defaultValue:0},
        {name:'health_ratio_estimated',type:'float',defaultValue:0}
    ],
    hasMany:[{model:'Rally.technicalservices.ProjectModel', name:'children'}],
    associations: [
        {type:'belongsTo',model:'Rally.technicalservices.ProjectModel', setterName: 'setParent', getterName:'getParent', primaryKey:'ObjectID',foreignKey:'parent_id'}
    ],
    addChild: function(child) {
        this.set('health_ratio_estimated',-1);
        
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
        if ( this.get('children') && this.get('children').length > 0 ) {
            this.set('health_ratio_estimated',-1);
        } else {
            this.set('health_ratio_estimated',0);
        }
    }
});