Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.logger(),
    items: [ { itemId:'grid_box' } ],
    launch: function() {
        var me = this;
        this.logger.log(this,this.getContext());
        var selected_project_oid = this.getContext().getProject().ObjectID;
        this.logger.log(selected_project_oid);
        
        Ext.create('Rally.data.WsapiDataStore',{
            model:'Project',
            autoLoad: true,
            listeners: {
                load: function(store,projects) {
                    this.logger.log(this,projects);
                    var ts_project_hash = this._makeTSProjectHash(projects);
                    var ts_project_array = Rally.technicalservices.util.Utilities.structureProjects(ts_project_hash,true);
                    this.logger.log(this,"project array",ts_project_array);
                    
                    var ts_selected_hash = Rally.technicalservices.util.Utilities.getProjectById(ts_project_array,selected_project_oid);
                    this.logger.log(this,"selected",ts_selected_hash);
                    
                    var grid_array = Rally.technicalservices.util.Utilities.hashToOrderedArray(ts_selected_hash.getData(true),"children");
                    this._makeGrid(grid_array);
                },
                scope: this
            }
        });
        
    },
    // given a set of Rally project objects, turn them into TS projects
    // the key of the hash is the project's ObjectID
    _makeTSProjectHash: function(projects) {
        var structured_projects = {}; // key is oid
        
        // change into our version of the project model
        // and put into a hash so we can find them easily for adding children
        Ext.Array.each(projects,function(project){
            var parent = project.get('Parent');
            var parent_oid = null;
            
            if ( parent ) { 
                parent_oid = parent.ObjectID; 
            }
            structured_projects[project.get('ObjectID')] = Ext.create('Rally.technicalservices.ProjectModel',{
                ObjectID: project.get('ObjectID'),
                parent_id: parent_oid,
                Name: project.get('Name')
            });
        });
        return structured_projects;
    },
    /*
     * Given an array of projects, make a grid
     */
    _makeGrid: function(projects) {
        var store = Ext.create('Rally.technicalservices.ProjectStore',{
            data: projects
        });
        
        this.grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            height: 400,
            columnCfgs: [{text:'Project',dataIndex:'Name',flex: 1}]
        });
        this.down('#grid_box').add(this.grid);
    }
});