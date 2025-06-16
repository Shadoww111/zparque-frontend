sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Formata um status para exibição
         * @param {string} sStatus Status a ser formatado (E = Entrada, S = Saída)
         * @returns {string} Status formatado
         */
        formatarStatus: function (sStatus) {
            var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
            
            switch (sStatus) {
                case "E":
                    return resourceBundle.getText("statusEntrada");
                case "S":
                    return resourceBundle.getText("statusSaida");
                default:
                    return sStatus;
            }
        },
        
        /**
         * Formata um valor de disponibilidade para o estado visual
         * @param {number} iValor Valor a ser avaliado
         * @param {number} iLimite1 Limite para estado crítico
         * @param {number} iLimite2 Limite para estado de aviso
         * @returns {string} Estado (Error, Warning, Success)
         */
        formatarEstadoDisponibilidade: function (iValor, iLimite1, iLimite2) {
            if (iValor <= iLimite1) {
                return "Error";
            } else if (iValor <= iLimite2) {
                return "Warning";
            } else {
                return "Success";
            }
        },
        
        /**
         * Formata uma data para exibição
         * @param {string} sDate Data em formato ISO ou timestamp
         * @returns {string} Data formatada
         */
        formatarData: function (sDate) {
            if (!sDate) {
                return "";
            }
            
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd/MM/yyyy HH:mm:ss"
            });
            
            var oDate = new Date(sDate);
            return oDateFormat.format(oDate);
        },
        
        /**
         * Formata um valor para exibição como moeda
         * @param {number} fValor Valor a ser formatado
         * @param {string} sMoeda Moeda (opcional)
         * @returns {string} Valor formatado
         */
        formatarValor: function (fValor, sMoeda) {
            if (fValor === undefined || fValor === null) {
                return "";
            }
            
            var oNumberFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
                currencyCode: false,
                decimals: 2
            });
            
            return oNumberFormat.format(fValor) + (sMoeda ? " " + sMoeda : "");
        },
        
        /**
         * Formata um valor booleano para "Sim" ou "Não"
         * @param {string} sValue Valor a ser formatado ("X" = true)
         * @returns {string} "Sim" ou "Não"
         */
        formatarBooleano: function (sValue) {
            return sValue === "X" ? "Sim" : "Não";
        }
    };
});