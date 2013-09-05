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
        {name:'text',type:'string',convert:useName}
    ],
    hasMany:[{model:'Rally.technicalservices.ProjectModel', name:'children'}],
    associations: [
        {type:'belongsTo',model:'Rally.technicalservices.ProjectModel', setterName: 'setParent', getterName:'getParent', primaryKey:'ObjectID',foreignKey:'parent_id'}
    ],
    addChild: function(child) {
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
    }
});