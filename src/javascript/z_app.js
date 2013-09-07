Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.logger(),
    items: [ { xtype:'container',itemId:'selector_box', padding: 5, layout: { type:'hbox'} }, { xtype:'container', itemId:'grid_box', padding: 5 } ],
    _selected_timebox: null,
    _project_store: null,
    launch: function() {
        this._getProjects();
        this._addIterationSelector();
    },
    _getProjects: function() {
        var me = this;
        this._projects = [];
        var selected_project_oid = this.getContext().getProject().ObjectID;
        
        Ext.create('Rally.data.WsapiDataStore',{
            model:'Project',
            autoLoad: true,
            listeners: {
                load: function(store,projects) {
                    var ts_project_hash = this._makeTSProjectHash(projects);
                    var ts_project_array = Rally.technicalservices.util.Utilities.structureProjects(ts_project_hash,true);
                    var ts_selected_project = Rally.technicalservices.util.Utilities.getProjectById(ts_project_array,selected_project_oid);
                    var ts_selected_projects = Rally.technicalservices.util.Utilities.hashToOrderedArray(ts_selected_project.getData(true),"children");

                    this._project_store = Ext.create('Rally.technicalservices.ProjectStore',{
                        data: ts_selected_projects
                    });
                    
                    this._project_store.load(function() { me._processData(); } );
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
        this._selected_timebox = combobox.getRecord();
        var start_date = this._selected_timebox.get(combobox.getStartDateField());
        var end_date = this._selected_timebox.get(combobox.getEndDateField());
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
        
        this._processData();
    },
    _processData:function() {
        var me = this;
        if ( me._project_store && me._selected_timebox) {
            me._return_counter = 0; // the calls for iterations are asynchronous, so we need to count returns
            var projects = me._project_store.getRecords();
            
            me.logger.log(this,"Sending requests for " + projects.length + " projects");
            Ext.Array.each(projects,function(project){
                project.resetHealth();
                me._setArtifactHealth(me._selected_timebox.get('Name'),project);
                me._setCumulativeHealth(me._selected_timebox.get('Name'),project);
            });

            this._makeGrid(this._project_store);
        }
    },
    /*
     * (health related to data we can get from the cumulative flow records)
     * 
     * Given the name of an iteration and a TSProject, go get the iteration cumulative flow records
     * 
     */
    _setCumulativeHealth:function(iteration_name,project){
        var me = this;
        // sadly, all iteration records are separate.  we have to get the one for this project and then get the
        // cumulative flow data
        Ext.create('Rally.data.WsapiDataStore',{
            model:'Iteration',
            fetch: 'ObjectID',
            autoLoad: true,
            filters: [
                {property:'Name',value:iteration_name},
                {property:'Project.ObjectID',value:project.get('ObjectID')}
            ],
            listeners: {
                load: function(store,records) {
                    me.logger.log(this,project.get('Name'),"iteration",records);
                    if ( records.length === 0 ) {
                        project.resetHealth();
                        me.logger.log(this, project.get('Name') , "No iteration found for project ");
                    }else{
                        var iteration_oid = records[0].get('ObjectID');
                        Ext.create('Rally.data.WsapiDataStore',{
                            model:'IterationCumulativeFlowData',
                            autoLoad: true,
                            filters: [{property:'IterationObjectID',value:iteration_oid}],
                            listeners: {
                                load: function(store,records){
                                    if ( records.length === 0 ) {
                                        me.logger.log(this, project.get('Name'), "No cumulative flow data found for project ");
                                    } else {
                                        me.logger.log(this,project.get('Name'),'CFD',records);
                                        project.setIterationCumulativeFlowData(records);
                                    }
                                }
                            }
                        });
                    }
                }
            }
        })
    },
    /*
     * (health related to data we can get from the artifacts themselves)
     * Given the name of an iteration and a TSProject, go get the iteration stories and defects
     * associated with an iteration with that name, then let the TSProject calculate various metrics
     */
    _setArtifactHealth: function(iteration_name,project) {
        this.logger.log(this,"_setArtifactHealth",iteration_name,project);
        var me = this;
        
        var artifacts = []; // have to get both stories and defects
        var filters = [
            {property:'Iteration.Name',value:iteration_name},
            {property:'Project.ObjectID',value:project.get('ObjectID')}
        ];
        
        var fetch = ['ObjectID','PlanEstimate','ScheduleState'];
        
        Ext.create('Rally.data.WsapiDataStore',{
            model: 'UserStory',
            autoLoad: true,
            filters: filters,
            fetch: fetch,
            listeners: {
                load: function(store,records){
                    artifacts = records;
                    Ext.create('Rally.data.WsapiDataStore',{
                        model:'Defect',
                        autoLoad: true,
                        filters: filters,
                        fetch: fetch,
                        listeners: {
                            load: function(store,records){
                                artifacts = Ext.Array.push(artifacts,records);
                                me.logger.log(this,project.get('Name'),artifacts.length);
                                project.setIterationArtifacts(artifacts);
                            }
                        }
                    });
                }
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
    _makeGrid: function(store) {
        
        if ( this.grid ) { this.grid.destroy(); }
        
        this.grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            height: 400,
            columnCfgs: [
                {text:'Project',dataIndex:'Name',flex: 1},
                {text:'Estimation Ratio',dataIndex:'health_ratio_estimated',renderer: TSRenderers.estimateHealth},
                {text:'Average Daily In-Progress',dataIndex:'health_ratio_in-progress',renderer: TSRenderers.inProgressHealth}
            ]
        });
        this.down('#grid_box').add(this.grid);
    }
});