Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.logger(),
    items: [ { xtype:'container',itemId:'selector_box', padding: 5, layout: { type:'hbox'} }, { xtype:'container', itemId:'grid_box', padding: 5 } ],
    launch: function() {
        this._getProjects();
        this._addIterationSelector();
    },
    _getProjects: function() {
        var me = this;
        this.project_array = null;
        var selected_project_oid = this.getContext().getProject().ObjectID;
        
        Ext.create('Rally.data.WsapiDataStore',{
            model:'Project',
            autoLoad: true,
            listeners: {
                load: function(store,projects) {
                    var ts_project_hash = this._makeTSProjectHash(projects);
                    var ts_project_array = Rally.technicalservices.util.Utilities.structureProjects(ts_project_hash,true);
                    var ts_selected_project = Rally.technicalservices.util.Utilities.getProjectById(ts_project_array,selected_project_oid);
                    
                    this.project_array = Rally.technicalservices.util.Utilities.hashToOrderedArray(ts_selected_project.getData(true),"children");
                    this._processData();
                },
                scope: this
            }
        });
        
    },
    _addIterationSelector: function() {
        this.iteration_selector = this.down("#selector_box").add({
            xtype:'rallyiterationcombobox',
            listeners: {
                ready: function(cb){
                    this.logger.log(this,"ready");
                    this._updateIterationDisplay(cb);
                },
                change: function(cb,new_value,old_value){
                    this.logger.log(this,"change");
                    this._updateIterationDisplay(cb);
                },
                scope: this
            }
        });
        this.down('#selector_box').add({
            xtype:'container',
            itemId: 'iteration_range_box',
            tpl: [
                "{start_date} - {end_date}",
                '<tpl if="day_counter &gt; -1">',
                "<br/>This is day {day_counter} of the iteration",
                '</tpl>'
            ]
        });
    },
    _updateIterationDisplay: function(combobox) {
        var timebox = combobox.getRecord();
        var start_date = timebox.get(combobox.getStartDateField());
        var end_date = timebox.get(combobox.getEndDateField());
        var day_counter = -1;
        var today = new Date();
        if ( today >= start_date && today <= end_date ) {
            day_counter = Rally.util.DateTime.getDifference(today,start_date,"day");
        }
        var formatted_start_date = Rally.util.DateTime.formatWithNoYearWithDefault(start_date);
        var formatted_end_date = Rally.util.DateTime.formatWithNoYearWithDefault(end_date);
        
        this.down('#iteration_range_box').update({
            start_date:formatted_start_date,
            end_date:formatted_end_date,
            day_counter:day_counter
        });
        this.logger.log(this,start_date,end_date);
    },
    _processData:function() {
        //
        if ( this.project_array ) {
            this._makeGrid(this.project_array);
        }
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
        if ( this.grid ) { this.grid.destroy(); }
        
        this.grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            height: 400,
            columnCfgs: [{text:'Project',dataIndex:'Name',flex: 1}]
        });
        this.down('#grid_box').add(this.grid);
    }
});