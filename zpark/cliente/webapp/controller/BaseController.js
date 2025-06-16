sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, UIComponent, Filter, FilterOperator) {
    "use strict";
    return Controller.extend("cliente.controller.BaseController", {
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        getI18nText: function (sText) {
            return this.getResourceBundle().getText(sText);
        },
        resetValueState: function (oEvent) {
            oEvent.getSource().setValueState("None");
        }
    });
});