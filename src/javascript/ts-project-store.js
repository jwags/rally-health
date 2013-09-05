/*
 * A store that holds projects
 * (DOES NOT update project information, must be passed projects)
 */
Ext.define('Rally.technicalservices.ProjectStore',{
    extend: 'Rally.data.custom.Store',
    alias: 'store.projectree',
    model: 'Rally.technicalservices.ProjectModel'
    
});