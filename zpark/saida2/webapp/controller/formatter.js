sap.ui.define([], function () {
    "use strict";
    
    return {
        /**
         * Formats the timestamp from backend format to readable date and time
         * @param {string} sTimestamp - Timestamp in ISO format
         * @return {string} Formatted date and time
         */
        formatDateTime: function (sTimestamp) {
            if (!sTimestamp) {
                return "";
            }
            
            var oDate = new Date(sTimestamp);
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd/MM/yyyy HH:mm:ss"
            });
            
            return oDateFormat.format(oDate);
        },
        
        /**
         * Formats the duration in hours to a more readable format
         * @param {number} fHours - Duration in hours
         * @return {string} Formatted duration
         */
        formatDuration: function (fHours) {
            if (fHours === undefined || fHours === null) {
                return "";
            }
            
            // Convert to hours and minutes
            var iHours = Math.floor(fHours);
            var iMinutes = Math.round((fHours - iHours) * 60);
            
            var sResult = "";
            
            if (iHours > 0) {
                sResult += iHours + (iHours === 1 ? " hora" : " horas");
            }
            
            if (iMinutes > 0) {
                if (sResult) {
                    sResult += " e ";
                }
                sResult += iMinutes + (iMinutes === 1 ? " minuto" : " minutos");
            }
            
            if (!sResult) {
                sResult = "Menos de 1 minuto";
            }
            
            return sResult;
        },
        
        /**
         * Formats currency values with 2 decimal places
         * @param {number} fValue - Currency value
         * @return {string} Formatted currency
         */
        formatCurrency: function (fValue) {
            if (fValue === undefined || fValue === null) {
                return "";
            }
            
            var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
                maxFractionDigits: 2,
                minFractionDigits: 2
            });
            
            // Format only the number, not the currency code
            return oCurrencyFormat.format(fValue);
        },
        
        /**
         * Formats the status code to a readable status text
         * @param {string} sStatus - Status code (E or S)
         * @return {string} Status text
         */
        formatStatus: function (sStatus) {
            if (!sStatus) {
                return "";
            }
            
            switch (sStatus) {
                case "E":
                    return "Entrada Registrada";
                case "S":
                    return "Saída Registrada";
                default:
                    return sStatus;
            }
        },
        
        /**
         * Determines state color based on status
         * @param {string} sStatus - Status code (E or S)
         * @return {string} UI5 semantic state
         */
        formatStatusState: function (sStatus) {
            if (!sStatus) {
                return "None";
            }
            
            switch (sStatus) {
                case "E":
                    return "Warning";
                case "S":
                    return "Success";
                default:
                    return "None";
            }
        }
    };
});