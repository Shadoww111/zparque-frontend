sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, MessageBox, BusyIndicator, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("cliente.controller.View1", {
        onInit: function () {
            // Inicializar modelos
            var oViewModel = new JSONModel({});
            this.setModel(oViewModel, "viewModel");
            
            // Configurar o router
            this.getRouter().getRoute("RouteView1").attachPatternMatched(this.onRouteMatched, this);
        },

        onRouteMatched: function (oEvent) {
            // Se voltar atrás limpa o input
            this.getView().byId("nifInput").setValue("");
            this.getView().byId("messageStrip").setVisible(false);

            // Adicionando automaticamente o cursor do Input
            jQuery.sap.delayedCall(500, this, function() {
                this.getView().byId("nifInput").focus();
            });
        },

        onSearch: function (oEvent, button = false) {
            var oInput = this.byId("nifInput");
            var sNIF = oInput.getValue();
            var oMessageStrip = this.byId("messageStrip");
            
            // Resetar o estado do input
            oInput.setValueState("None");
            oMessageStrip.setVisible(false);
            
            // Validação do input
            if (!sNIF) {
                oInput.setValueState("Error");
                oInput.setValueStateText(this.getI18nText("nifRequired"));
                oMessageStrip.setText(this.getI18nText("nifRequired"));
                oMessageStrip.setType("Warning");
                oMessageStrip.setVisible(true);
                return;
            }
            
            // Validação do formato do NIF
            if (!/^\d{9}$/.test(sNIF)) {
                oInput.setValueState("Error");
                oInput.setValueStateText(this.getI18nText("nifInvalid"));
                oMessageStrip.setText(this.getI18nText("nifInvalid"));
                oMessageStrip.setType("Error");
                oMessageStrip.setVisible(true);
                return;
            }
            
            // Mostrar indicador de busca
            BusyIndicator.show(0);
            
            // Buscar cliente
            this.buscarClientePorNIF(sNIF);
        },
        
        buscarClientePorNIF: function(sNIF) {
            var that = this;
            var oModel = this.getOwnerComponent().getModel();
            var oMessageStrip = this.byId("messageStrip");
            
            // Filtrar pelo NIF
            var sFilter = "Nif eq '" + sNIF + "'";
            
            // URL para o serviço OData
            var sServiceUrl = oModel.sServiceUrl || "";
            var sUrl = sServiceUrl + "/ClientePortal?$filter=" + encodeURIComponent(sFilter);
            
            jQuery.ajax({
                url: sUrl,
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function(oData) {
                    BusyIndicator.hide();
                    
                    if (oData && oData.value && oData.value.length > 0) {
                        // Cliente encontrado
                        var oCliente = oData.value[0];
                        
                        // Navegar para os detalhes do cliente
                        that.getRouter().navTo("RouteClientDetails", {
                            nif: sNIF
                        });
                    } else {
                        // Cliente não encontrado
                        var sMessage = that.getI18nText("clientNotFound", [sNIF]);
                        oMessageStrip.setText(sMessage);
                        oMessageStrip.setType("Error");
                        oMessageStrip.setVisible(true);
                        
                        that.byId("nifInput").setValueState("Error");
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    
                    // Erro na busca
                    var sMessage = that.getI18nText("errorSearching", [errorThrown || textStatus]);
                    oMessageStrip.setText(sMessage);
                    oMessageStrip.setType("Error");
                    oMessageStrip.setVisible(true);
                    
                    console.error("Erro na busca:", jqXHR.status, errorThrown);
                }
            });
        },
        
        onClear: function() {
            // Limpar o campo de entrada
            this.getView().byId("nifInput").setValue("");
            
            // Esconder mensagens
            var oMessageStrip = this.getView().byId("messageStrip");
            oMessageStrip.setVisible(false);
            
            // Resetar estado do campo
            this.getView().byId("nifInput").setValueState("None");
            
            // Focar no campo de input
            this.getView().byId("nifInput").focus();
        }
    });
});