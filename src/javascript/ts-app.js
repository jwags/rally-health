Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
    logger: new Rally.technicalservices.logger(),
    
    items: [ 
    ],
    launch: function() {       
       // this.alerter = this.down('#alert_area').add({xtype:'tsaccessiblealert'});
        
    }
    
    
});