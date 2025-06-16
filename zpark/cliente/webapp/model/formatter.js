sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Formata data e hora
         * @param {date} oDate - data para formatar
         * @returns {string} data formatada
         */
        formatDateTime: function (oDate) {
            if (!oDate) {
                return "-";
            }
            
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd/MM/yyyy HH:mm"
            });
            
            return oDateFormat.format(new Date(oDate));
        },
        
        /**
         * Formata números
         * @param {number} nValue - valor para formatar
         * @returns {string} valor formatado
         */
        formatNumeric: function (nValue) {
            if (nValue === null || nValue === undefined) {
                return "-";
            }
            
            return parseFloat(nValue).toFixed(2);
        },
        
        /**
         * Formata valores monetários
         * @param {number} nValue - valor para formatar
         * @param {string} sCurrency - moeda
         * @returns {string} valor formatado
         */
        formatCurrency: function (nValue, sCurrency) {
            if (nValue === null || nValue === undefined) {
                return "-";
            }
            
            var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
                currencyCode: false,
                customCurrencies: {
                    "EUR": {
                        symbol: "€",
                        decimals: 2
                    }
                }
            });
            
            // Default para EUR se não especificado
            var sEffectiveCurrency = sCurrency || "EUR";
            
            return oCurrencyFormat.format(nValue, sEffectiveCurrency);
        },
        
        /**
         * Formata o status do movimento
         * @param {string} sStatus - código do status
         * @returns {string} descrição do status
         */
        formatMovimentoStatus: function (sStatus) {
            // Se o status não estiver definido, retornar placeholder
            if (sStatus === undefined || sStatus === null) {
                return "Desconhecido";
            }
            
            // Mapeamento de códigos de status para descrições
            var oStatusMap = {
                "S": "Saiu",
                "E": "Entrou",
              
            };
            
            // Retornar descrição correspondente ou código original se não mapeado
            return oStatusMap[sStatus] ||/* "Status " +*/ sStatus;
        },
        
        /**
         * Determina o estado de UI para um status de movimento
         * @param {string} sStatus - código do status
         * @returns {string} estado sap.ui para o ObjectStatus
         */
        formatMovimentoStatusState: function (sStatus) {
            // Se o status não estiver definido, retornar placeholder
            if (sStatus === undefined || sStatus === null) {
                return "None";
            }
            
            // Mapeamento de códigos de status para estados de UI
            var oStateMap = {
                "P": "Warning",  // Pendente
                "A": "Success",  // Ativo
                "C": "Success",  // Concluído
                "F": "Information", // Faturado
                "1": "Success",  // Ativo (numérico)
                "2": "Success",  // Concluído (numérico)
                "3": "Information", // Faturado (numérico)
                "0": "Warning"   // Pendente (numérico)
            };
            
            // Retornar estado correspondente ou None se não mapeado
            return oStateMap[sStatus] || "None";
        }
    };
});