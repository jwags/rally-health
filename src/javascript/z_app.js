Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.logger(),
    items: [ 
        { xtype:'container',itemId:'selector_box', padding: 5, layout: { type:'hbox'} }, 
        { xtype:'container', itemId:'grid_box', padding: 5 }
    ],
    _project_store: null,
    launch: function() {
        this.number_of_iterations = 3;
        this._addIterationCountSelector();
    },
    _addIterationCountSelector: function() {
        
        var counter_store = Ext.create('Rally.data.custom.Store',{
            data: [
                {
                    Name: 3
                },
                {
                    Name: 4
                },
                {
                    Name: 5
                },
                {
                    Name: 6
                },
                {
                    Name: 7
                },
                {
                    Name: 8
                },
                {
                    Name: 9
                },
                {
                    Name: 10
                }
            ]
        });
        var me = this;
        
        this.down('#selector_box').add({
            xtype: 'rallycombobox',
            fieldLabel: 'Number of Iterations',
            store: counter_store,
            displayField: 'Name',
            valueField: 'Name',
            width: 150,
            labelWidth: 100,
            value: me.number_of_iterations,
            listeners: {
                scope: this,
                ready: function(cb) {
                    me.logger.log(this,"ready",cb.getValue());
                    me.number_of_iterations = cb.getValue();
                    me._getIterations();
                },
                change: function(cb) {
                    me.logger.log(this,"change",cb.getValue());
                    me.number_of_iterations = cb.getValue();
                    me._getIterations();
                }
            }
        });
    },
    _getIterations: function() {
        var me = this;
        var number_of_iterations = this.number_of_iterations;
        var today_iso = Rally.util.DateTime.toIsoString(new Date());
        Ext.create('Rally.data.WsapiDataStore',{
            model:'Iteration',
            limit: number_of_iterations,
            pageSize: number_of_iterations,
            autoLoad: true,
            sorters: [{ property: 'EndDate', direction: 'DESC' }],
            filters: [{ property: 'EndDate', operator: '<', value: today_iso}],
            context: { projectScopeDown: false },
            listeners: {
                scope: this,
                load: function(store,iterations){
                    this.logger.log(this,iterations);
                    var ts_iterations = this._makeTSIterationArray(iterations);
                    this.logger.log(this,ts_iterations);
                    
                    this._project_store = Ext.create('Rally.technicalservices.ProjectStore',{
                        data: ts_iterations
                    });
                    
                    this._project_store.load(function() { me._processData(); } );
                }
            }
        });
    },
    _getProjects: function() {
        var me = this;
        this._projects = [];
        var selected_project_oid = this.getContext().getProject().ObjectID;

        Ext.create('Rally.data.WsapiDataStore',{
            model:'Project',
            limit: 'Infinity',
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
                    if ( cb.getValue() ) {
                        this.getEl().mask("Loading");
                        this._updateIterationDisplay(cb);
                    } else {
                        this.logger.log(this,"No iteration selected");
                    }
                },
                change: function(cb,new_value,old_value){
                    this.logger.log(this,"change");
                    if ( cb.getValue() ) {
                        this.getEl().mask("Loading");
                        this._updateIterationDisplay(cb);
                    } else {
                        this.logger.log(this,"No iteration selected");
                    }
                },
                scope: this
            }
        });
        this.down('#selector_box').add({
            xtype:'container',
            itemId: 'iteration_range_box',
            tpl: [
                "{start_date} - {end_date} ({number_of_days} days)",
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
            day_counter = Rally.technicalservices.util.Utilities.daysBetween(today,start_date,"true") + 1;
        }
        var number_of_days_in_sprint = Rally.technicalservices.util.Utilities.daysBetween(end_date,start_date,"true") + 1;
        
        this._selected_timebox.set('number_of_days_in_sprint',number_of_days_in_sprint);
        
        var formatted_start_date = Rally.util.DateTime.formatWithNoYearWithDefault(start_date);
        var formatted_end_date = Rally.util.DateTime.formatWithNoYearWithDefault(end_date);
        
        this.down('#iteration_range_box').update({
            start_date:formatted_start_date,
            end_date:formatted_end_date,
            day_counter:day_counter,
            number_of_days: number_of_days_in_sprint
        });
        
        this._processData();
    },
    _processData:function() {
        this.logger.log(this,"Processing Data");
        var me = this;
        if ( me._project_store ) {
            me._return_counter = 0; // the calls for iterations are asynchronous, so we need to count returns
            var projects = me._project_store.getRecords();
            
            Ext.Array.each(projects,function(project){
                project.resetHealth();
                //project.set('number_of_days_in_sprint',me._selected_timebox.get('number_of_days_in_sprint'));
                me._setArtifactHealth(project.get('iteration_name'),project);
                me._setCumulativeHealth(project.get('iteration_name'),project);
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
        
        // we've switched to the "project" object have the id of the iteration
        var iteration_oid = project.get('ObjectID');
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
            {property:'Iteration.Name',value:iteration_name}
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
    // given a set of Rally iteration objects, turn them into TS projects
    // the key of the hash is the project's ObjectID
    _makeTSIterationArray: function(iterations) {
        var iteration_array = []; // key is oid
        
        // change into our version of the project model
        Ext.Array.each(iterations,function(iteration){
            
            var iteration_row = Ext.create('Rally.technicalservices.ProjectModel',{
                ObjectID: iteration.get('ObjectID'),
                Name: iteration.get('Name')
            });
            
            iteration_row.addIteration(iteration);
            iteration_array.push(iteration_row);
            
        });
        
        return iteration_array;
    },
    /*
     * Given an array of projects, make a grid
     */
    _makeGrid: function(store) {
        
        if ( this.grid ) { this.grid.destroy(); }
        
        var column_listeners_churn = {
            scope: this,
            headerclick: function( ct, column, e, t, eOpts ) {
                this.logger.log(ct, "column", column);
                this.logger.log(ct, "e", e);
                this.logger.log(ct, "t", t);
                this.logger.log(ct, "eOpts", eOpts);
                if (this.popover){this.popover.destroy();}
                this.popover = Ext.create('Rally.ui.popover.Popover',{
                    target: Ext.get(t),
                    items: [{xtype:'container',html:"Churn is a measure of the change in the iteration's scope.<br/><br/>" +
                            "It is defined as the standard deviation of the total scheduled into the sprint divided by the " +
                            "average daily total."}]
                });
                this.popover.show();
            }
        };
        var column_listeners_churn_direction = {
            scope: this,
            headerclick: function( ct, column, e, t, eOpts ) {
                this.logger.log(ct, "column", column);
                this.logger.log(ct, "e", e);
                this.logger.log(ct, "t", t);
                this.logger.log(ct, "eOpts", eOpts);
                if (this.popover){this.popover.destroy();}
                this.popover = Ext.create('Rally.ui.popover.Popover',{
                    target: Ext.get(t),
                    items: [{xtype:'container',html:"Churn Direction is an indicator of the general direction of scope change.<br/><br/>" +
                            "It is determined by examining every day's change from the day before and adding or subtracting <br/>" +
                            "the delta to determine whether scope has been added more often than subtracted. (The first day of <br/>" +
                            "the iteration is excluded from this calculation.)"}]
                });
                this.popover.show();
            }
        };
        this.grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            height: 400,
            sortableColumns: false,
            columnCfgs: [
                {text:'Iteration',dataIndex:'iteration_name',flex: 2},
                {text:'Start Date',dataIndex:'iteration_start_date',renderer:TSRenderers.shortDate},
                {text:'End Date',dataIndex:'iteration_end_date',renderer:TSRenderers.shortDate},
                {text:'# Days',dataIndex:'number_of_days_in_sprint'},
                {text:'Estimation Ratio (Current)',dataIndex:'health_ratio_estimated',renderer: TSRenderers.estimateHealth},
                {text:'Average Daily In-Progress',dataIndex:'health_ratio_in-progress',renderer: TSRenderers.inProgressHealth},
                {text:'50% Accepted Point', dataIndex:'health_half_accepted_ratio',renderer:TSRenderers.halfAcceptedHealth},
                {text:'Last Day Incompletion Ratio',dataIndex:'health_end_incompletion_ratio',renderer:TSRenderers.incompletionHealth},
                {text:'Last Day Acceptance Ratio',dataIndex:'health_end_acceptance_ratio',renderer:TSRenderers.acceptanceHealth},
                {text:'Churn',dataIndex:'health_churn',renderer:TSRenderers.churnHealth,listeners: column_listeners_churn },
                {text:'Churn Direction',dataIndex:'health_churn_direction',renderer:TSRenderers.churnDirection,listeners: column_listeners_churn_direction}
            ]
        });
        this.down('#grid_box').add(this.grid);
        this.getEl().unmask();
    }
});