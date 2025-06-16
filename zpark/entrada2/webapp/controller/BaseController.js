sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History"
], function (Controller, UIComponent, History) {
    "use strict";
    return Controller.extend("entrada2.controller.BaseController", {
        /**
         * Método conveniente para acessar o componente do Router
         * @public
         * @returns {sap.ui.core.routing.Router} O router do componente
         */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },
        /**
         * Método conveniente para obter o modelo por nome
         * @public
         * @param {string} [sName] Nome do modelo
         * @returns {sap.ui.model.Model} O modelo pelo nome
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },
        /**
         * Método conveniente para definir o modelo
         * @public
         * @param {sap.ui.model.Model} oModel O modelo que será definido
         * @param {string} [sName] O nome do modelo
         * @returns {sap.ui.mvc.View} A view atual
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },
        /**
         * Método conveniente para obter texto i18n
         * @public
         * @param {string} sKey Chave i18n
         * @param {string[]} [aArgs] Lista opcional de parâmetros
         * @returns {string} Texto traduzido
         */
        getI18nText: function (sKey, aArgs) {
            var oI18nModel = this.getOwnerComponent().getModel("i18n");
            var oBundle = oI18nModel.getResourceBundle();
            return oBundle.getText(sKey, aArgs);
        },
        /**
         * Método conveniente para navegar para trás
         * @public
         * @param {boolean} [bReplace=false] Se deve substituir a entrada atual do histórico
         */
        navBack: function (bReplace) {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                // A aplicação veio de uma página anterior
                window.history.go(-1);
            } else {
                // A aplicação está na página inicial
                this.getRouter().navTo("RouteView1", {}, bReplace);
            }
        },
        
        /**
         * Método para atualizar a disponibilidade no modelo global
         * @public
         */
        atualizarDisponibilidade: function() {
            var oODataModel = this.getOwnerComponent().getModel();
            var oDisponibilidadeModel = this.getOwnerComponent().getModel("disponibilidadeModel");
            
            if (!oODataModel || !oDisponibilidadeModel) {
                console.error("Modelos não disponíveis para atualizar disponibilidade");
                return;
            }
            
            try {
                var oDisponibilidadeBinding = oODataModel.bindList("/Disponibilidade", null, null, null, {
                    $select: ["IdDisponibilidade", "LugaresMotoLivres", "LugaresLigeiroLivres", "LugaresPesadoLivres"]
                });
                
                oDisponibilidadeBinding.requestContexts(0, 1).then(function(aContexts) {
                    if (aContexts && aContexts.length > 0) {
                        var oDisponibilidade = aContexts[0].getObject();
                        
                        // atualizar modelo de disponibilidade
                        oDisponibilidadeModel.setData({
                            LugaresMotoLivres: oDisponibilidade.LugaresMotoLivres,
                            LugaresLigeiroLivres: oDisponibilidade.LugaresLigeiroLivres,
                            LugaresPesadoLivres: oDisponibilidade.LugaresPesadoLivres
                        });
                        
                        console.log("Disponibilidade atualizada manualmente:", oDisponibilidade);
                    }
                }).catch(function(oError) {
                    console.error("Erro ao atualizar disponibilidade manualmente:", oError);
                });
            } catch (e) {
                console.error("Erro ao atualizar disponibilidade manualmente:", e);
            }
        }
    });
});