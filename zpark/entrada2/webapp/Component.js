sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "entrada2/model/models",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, models, JSONModel) {
    "use strict";

    return UIComponent.extend("entrada2.Component", {
        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            
            // criar modelo de dados compartilhados
            var oSharedModel = new JSONModel({});
            this.setModel(oSharedModel, "sharedData");
            
            // criar modelo de disponibilidade global para ser usado em todas as views
            var oDisponibilidadeModel = new JSONModel({
                LugaresMotoLivres: 0,
                LugaresLigeiroLivres: 0,
                LugaresPesadoLivres: 0,
                LugaresMotoTotal: 20,    // Total de vagas para motos
                LugaresLigeiroTotal: 65, // Total de vagas para ligeiros
                LugaresPesadoTotal: 15   // Total de vagas para pesados
            });
            this.setModel(oDisponibilidadeModel, "disponibilidadeModel");
            
            // carregar disponibilidade inicial
            this._carregarDisponibilidadeInicial();
            
            // configurar atualização automática da disponibilidade a cada 60 segundos
            setInterval(this._atualizarDisponibilidade.bind(this), 60000);
        },
        
        /**
         * Carrega os dados de disponibilidade iniciais
         * @private
         */
        _carregarDisponibilidadeInicial: function() {
            var oModel = this.getModel(); // modelo OData principal
            var oDisponibilidadeModel = this.getModel("disponibilidadeModel");
            
            if (!oModel) {
                console.error("Modelo OData indisponível para carregar disponibilidade");
                return;
            }
            
            // tentar ler usando a API OData v4
            try {
                var oDisponibilidadeBinding = oModel.bindList("/Disponibilidade", null, null, null, {
                    $select: ["IdDisponibilidade", "LugaresMotoLivres", "LugaresLigeiroLivres", "LugaresPesadoLivres", 
                             "LugaresMotoTotal", "LugaresLigeiroTotal", "LugaresPesadoTotal"]
                });
                
                oDisponibilidadeBinding.requestContexts(0, 1).then(function(aContexts) {
                    if (aContexts && aContexts.length > 0) {
                        var oDisponibilidade = aContexts[0].getObject();
                        
                        // atualizar modelo de disponibilidade
                        oDisponibilidadeModel.setData({
                            LugaresMotoLivres: oDisponibilidade.LugaresMotoLivres,
                            LugaresLigeiroLivres: oDisponibilidade.LugaresLigeiroLivres,
                            LugaresPesadoLivres: oDisponibilidade.LugaresPesadoLivres,
                            LugaresMotoTotal: oDisponibilidade.LugaresMotoTotal || 20,
                            LugaresLigeiroTotal: oDisponibilidade.LugaresLigeiroTotal || 65,
                            LugaresPesadoTotal: oDisponibilidade.LugaresPesadoTotal || 15
                        });
                        
                        console.log("Disponibilidade inicial carregada:", oDisponibilidade);
                    }
                }).catch(function(oError) {
                    console.error("Erro ao carregar disponibilidade inicial:", oError);
                });
            } catch (e) {
                console.error("Erro ao carregar disponibilidade inicial:", e);
            }
        },
        
        /**
         * Atualiza os dados de disponibilidade
         * @private
         */
        _atualizarDisponibilidade: function() {
            var oModel = this.getModel(); // modelo OData principal
            var oDisponibilidadeModel = this.getModel("disponibilidadeModel");
            
            if (!oModel) {
                console.error("Modelo OData indisponível para atualizar disponibilidade");
                return;
            }
            
            // tentar ler usando a API OData v4
            try {
                var oDisponibilidadeBinding = oModel.bindList("/Disponibilidade", null, null, null, {
                    $select: ["IdDisponibilidade", "LugaresMotoLivres", "LugaresLigeiroLivres", "LugaresPesadoLivres",
                             "LugaresMotoTotal", "LugaresLigeiroTotal", "LugaresPesadoTotal"]
                });
                
                oDisponibilidadeBinding.requestContexts(0, 1).then(function(aContexts) {
                    if (aContexts && aContexts.length > 0) {
                        var oDisponibilidade = aContexts[0].getObject();
                        
                        // obter valores atuais do modelo
                        var oCurrentData = oDisponibilidadeModel.getData();
                        
                        // atualizar modelo de disponibilidade
                        oDisponibilidadeModel.setData({
                            LugaresMotoLivres: oDisponibilidade.LugaresMotoLivres,
                            LugaresLigeiroLivres: oDisponibilidade.LugaresLigeiroLivres,
                            LugaresPesadoLivres: oDisponibilidade.LugaresPesadoLivres,
                            // Manter os valores totais que já existem ou usar os do backend, se disponíveis
                            LugaresMotoTotal: oDisponibilidade.LugaresMotoTotal || oCurrentData.LugaresMotoTotal,
                            LugaresLigeiroTotal: oDisponibilidade.LugaresLigeiroTotal || oCurrentData.LugaresLigeiroTotal,
                            LugaresPesadoTotal: oDisponibilidade.LugaresPesadoTotal || oCurrentData.LugaresPesadoTotal
                        });
                        
                        console.log("Disponibilidade atualizada:", oDisponibilidade);
                    }
                }).catch(function(oError) {
                    console.error("Erro ao atualizar disponibilidade:", oError);
                });
            } catch (e) {
                console.error("Erro ao atualizar disponibilidade:", e);
            }
        }
    });
});