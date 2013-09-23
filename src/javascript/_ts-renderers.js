Ext.define('TSRenderers', {
    singleton: true,
    red: '#ff9999',
    yellow: '#ffffcc',
    green: '#ccffcc',
    defaultF: function(value,metaData,record,rowIndex,colIndex,store,view){
        return value;
    },
    estimateHealth: function(value,metaData) {
        
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
        metaData.style = "background-color: " + color;
        return "<div style='text-align:center;background-color:" + color + "'>"+ percent + "%</div>";
    },
    inProgressHealth: function(value,metaData) {
        if ( value < 0 ) {
            return " ";
        }
        var percent = parseInt( 100 * value, 10 );
        var color = TSRenderers.green;
        if ( percent > 25 ) {
            color = TSRenderers.yellow;
        }
        if ( percent > 35 ) {
            color = TSRenderers.red;
        }
        metaData.style = "background-color: " + color;
        return "<div style='text-align:center;background-color:" + color + "'>"+ percent + "%</div>";
    },
    halfAcceptedHealth: function(value,metaData) {
        if ( value < 0 ) {
            return " ";
        }
        var percent = parseInt( 100 * value, 10 );
        var text = percent + "%";
        
        var color = TSRenderers.green;
        if ( percent > 50 ) {
            color = TSRenderers.yellow;
        }
        if ( percent > 75 ) {
            color = TSRenderers.red;
        }
        if ( percent === 200 ) {
            text = "Never";
        }
        metaData.style = "background-color: " + color;
        return "<div style='text-align:center;background-color:" + color + "'>"+ text + "</div>";
    },
    incompletionHealth: function(value,metaData) {
        if ( value < 0 ) {
            return " ";
        }
        var percent = parseInt( 100 * value, 10 );
        var text = percent + "%";
        
        var color = TSRenderers.green;
        if ( percent > 9 ) {
            color = TSRenderers.yellow;
        }
        if ( percent > 20 ) {
            color = TSRenderers.red;
        }
        if ( percent === 200 ) {
            color = "white";
            text = "No Data";
        }
        metaData.style = "background-color: " + color;
        return "<div style='text-align:center;background-color:" + color + "'>"+ text + "</div>";
    },
    acceptanceHealth: function(value,metaData) {
        if ( value < 0 ) {
            return " ";
        }
        var percent = parseInt( 100 * value, 10 );
        var text = percent + "%";
        
        var color = TSRenderers.green;
        if ( percent < 91 ) {
            color = TSRenderers.yellow;
        }
        if ( percent < 50 ) {
            color = TSRenderers.red;
        }
        if ( percent === 200 ) {
            color = "white";
            text = "No Data";
        }
        metaData.style = "background-color: " + color;
        return "<div style='text-align:center;background-color:" + color + "'>"+ text + "</div>";
    },
    
    shortDate: function(value) {
        return Rally.util.DateTime.formatWithNoYearWithDefault(value);
    }
    
});