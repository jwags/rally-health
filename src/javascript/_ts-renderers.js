Ext.define('TSRenderers', {
    singleton: true,
    red: '#ff9999',
    yellow: '#ffffcc',
    green: '#ccffcc',
    defaultF: function(value,metaData,record,rowIndex,colIndex,store,view){
        return value;
    },
    estimateHealth: function(value) {
        if ( value < 0 ) {
            return " ";
        }
        var percent = parseInt( 100 * value, 10 );
        var color = TSRenderers.green;
        if ( percent < 91 ) {
            color = TSRenderers.yellow;
        }
        if ( percent < 61 ) {
            color = TSRenderers.red;
        }
        return "<div style='text-align:center;background-color:" + color + "'>"+ percent + "%</div>";
    }
    
});