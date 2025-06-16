sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, DateFormat, Filter, FilterOperator) {
    "use strict";
    return BaseController.extend("entrada2.controller.EntryDetails", {
        onInit: function () {
            // Inicializar modelo para os detalhes da entrada
            var oEntryModel = new JSONModel({
                matricula: "",
                dataHoraEntrada: "",
                tipoVeiculo: "",
                dataEntrada: "",
                cliente: "",
                nomeCliente: "",
                isClienteRegistrado: false,
                disponibilidade: {
                    LugaresMotoLivres: 0,
                    LugaresLigeiroLivres: 0,
                    LugaresPesadoLivres: 0
                }
            });
            this.setModel(oEntryModel, "entryModel");
            
            // Verificar se o modelo de disponibilidade global está disponível
            if (!this.getOwnerComponent().getModel("disponibilidadeModel")) {
                // Se não estiver, criar um modelo local
                var oDisponibilidadeModel = new JSONModel({
                    LugaresMotoLivres: 0,
                    LugaresLigeiroLivres: 0,
                    LugaresPesadoLivres: 0
                });
                this.getOwnerComponent().setModel(oDisponibilidadeModel, "disponibilidadeModel");
            }
            
            // Configurar o router
            this.getRouter().getRoute("RouteEntryDetails").attachPatternMatched(this.onRouteMatched, this);
            
            // Atualizar a disponibilidade quando a tela for aberta
            this.atualizarDisponibilidade();
        },
        
        onRouteMatched: function(oEvent) {
            var oArguments = oEvent.getParameter("arguments");
            var sMatricula = oArguments.matricula || "";
            var sIdEntrada = oArguments.idEntrada || "0";
            var bIsRegistrado = oArguments.registrado === "true";
            
            // Obter os dados compartilhados pelo View1
            var oComponent = this.getOwnerComponent();
            var oSharedData = oComponent.getModel("sharedData").getData();
            
            // Adicionar log para depuração
            console.log("Argumentos recebidos:", oArguments);
            console.log("Dados compartilhados:", oSharedData);
            
            if (oSharedData && oSharedData.matricula === sMatricula) {
                // Dados encontrados no modelo compartilhado
                var oEntryModel = this.getModel("entryModel");
                
                // Verificar se temos o nome do cliente
                var sNomeCliente = "";
                var sClienteStatus = "Cliente não registrado";
                
                if (bIsRegistrado) {
                    sClienteStatus = "Cliente registrado";
                    
                    // Verificar se temos o nome real do cliente nos dados compartilhados
                    if (oSharedData.cliente && oSharedData.cliente !== "Cliente Registrado" && 
                        oSharedData.cliente !== "Cliente registrado" && 
                        oSharedData.cliente !== "cliente registrado") {
                        sNomeCliente = oSharedData.cliente;
                    } else if (oSharedData.nomeCliente) {
                        sNomeCliente = oSharedData.nomeCliente;
                    }
                }
                
                // Atualizar o modelo com os dados recebidos
                oEntryModel.setData({
                    matricula: oSharedData.matricula,
                    dataHoraEntrada: oSharedData.dataHoraEntrada,
                    tipoVeiculo: oSharedData.tipoVeiculo || "Desconhecido",
                    dataEntrada: oSharedData.dataHoraEntrada,
                    cliente: sClienteStatus,
                    nomeCliente: sNomeCliente,
                    isClienteRegistrado: bIsRegistrado,
                    nif: oSharedData.nif || "",
                    veiculo: oSharedData.veiculo || "",
                    eletrico: oSharedData.eletrico || "Não",
                    disponibilidade: oSharedData.disponibilidade || {
                        LugaresMotoLivres: 0,
                        LugaresLigeiroLivres: 0,
                        LugaresPesadoLivres: 0
                    }
                });
                
                // Se estamos com cliente registrado mas ainda não temos o nome, tentar buscar do backend
                if (bIsRegistrado && !sNomeCliente && oSharedData.idCliente) {
                    this._carregarNomeCliente(oSharedData.idCliente);
                }
                
                // Atualizar o modelo de disponibilidade global com os dados disponíveis
                var oDisponibilidadeModel = this.getOwnerComponent().getModel("disponibilidadeModel");
                if (oDisponibilidadeModel && oSharedData.disponibilidade) {
                    oDisponibilidadeModel.setData({
                        LugaresMotoLivres: oSharedData.disponibilidade.LugaresMotoLivres,
                        LugaresLigeiroLivres: oSharedData.disponibilidade.LugaresLigeiroLivres,
                        LugaresPesadoLivres: oSharedData.disponibilidade.LugaresPesadoLivres
                    });
                }
                
                console.log("Modelo de entrada atualizado:", this.getModel("entryModel").getData());
            } else {
                // Se não encontrou dados compartilhados, tentar carregar do backend
                this._carregarDadosEntrada(sMatricula, sIdEntrada, bIsRegistrado);
                // Também carrega a disponibilidade atual
                this.atualizarDisponibilidade();
            }
        },
        
        /**
         * Carrega informações de disponibilidade do parque
         * Este método foi substituído pelo método atualizarDisponibilidade no BaseController
         * @private
         * @deprecated
         */
        _carregarDisponibilidade: function() {
            // Este método agora chama o método centralizado do BaseController
            this.atualizarDisponibilidade();
        },
        
        /**
         * Evento ao pressionar botão para nova entrada
         */
        onNovaEntrada: function() {
            // Atualizar disponibilidade antes de navegar
            this.atualizarDisponibilidade();
            this.getRouter().navTo("RouteView1");
        },
        
        onRouteMatched: function(oEvent) {
            var oArguments = oEvent.getParameter("arguments");
            var sMatricula = oArguments.matricula || "";
            var sIdEntrada = oArguments.idEntrada || "0";
            var bIsRegistrado = oArguments.registrado === "true";
            
            // Obter os dados compartilhados pelo View1
            var oComponent = this.getOwnerComponent();
            var oSharedData = oComponent.getModel("sharedData").getData();
            
            // Adicionar log para depuração
            console.log("Argumentos recebidos:", oArguments);
            console.log("Dados compartilhados:", oSharedData);
            
            if (oSharedData && oSharedData.matricula === sMatricula) {
                // Dados encontrados no modelo compartilhado
                var oEntryModel = this.getModel("entryModel");
                
                // Verificar se temos o nome do cliente
                var sNomeCliente = "";
                var sClienteStatus = "Cliente não registrado";
                
                if (bIsRegistrado) {
                    sClienteStatus = "Cliente registrado";
                    
                    // Verificar se temos o nome real do cliente nos dados compartilhados
                    if (oSharedData.cliente && oSharedData.cliente !== "Cliente Registrado" && 
                        oSharedData.cliente !== "Cliente registrado" && 
                        oSharedData.cliente !== "cliente registrado") {
                        sNomeCliente = oSharedData.cliente;
                    }
                }
                
                // Atualizar o modelo com os dados recebidos
                oEntryModel.setData({
                    matricula: oSharedData.matricula,
                    dataHoraEntrada: oSharedData.dataHoraEntrada,
                    tipoVeiculo: oSharedData.tipoVeiculo || "Desconhecido",
                    dataEntrada: oSharedData.dataHoraEntrada,
                    cliente: sClienteStatus,
                    nomeCliente: sNomeCliente,
                    isClienteRegistrado: bIsRegistrado,
                    nif: oSharedData.nif || "",
                    veiculo: oSharedData.veiculo || "",
                    eletrico: oSharedData.eletrico || "Não",
                    disponibilidade: oSharedData.disponibilidade || {
                        LugaresMotoLivres: 0,
                        LugaresLigeiroLivres: 0,
                        LugaresPesadoLivres: 0
                    }
                });
                
                // Se estamos com cliente registrado mas ainda não temos o nome, tentar buscar do backend
                if (bIsRegistrado && !sNomeCliente && oSharedData.idCliente) {
                    this._carregarNomeCliente(oSharedData.idCliente);
                }
                
                console.log("Modelo de entrada atualizado:", this.getModel("entryModel").getData());
            } else {
                // Se não encontrou dados compartilhados, tentar carregar do backend
                this._carregarDadosEntrada(sMatricula, sIdEntrada, bIsRegistrado);
                // Também carrega a disponibilidade atual
                this._carregarDisponibilidade();
            }
        },
        
        /**
         * Carrega dados de uma entrada específica do backend
         * @param {string} sMatricula Matrícula do veículo
         * @param {string} sIdEntrada ID da entrada (opcional)
         * @param {boolean} bIsRegistrado Flag indicando se o cliente é registrado
         * @private
         */
        _carregarDadosEntrada: function(sMatricula, sIdEntrada, bIsRegistrado) {
            var oEntryModel = this.getModel("entryModel");
            var oODataModel = this.getOwnerComponent().getModel();
            
            if (!oODataModel || !sMatricula) {
                return;
            }
            
            // Filtrar entradas pela matrícula (e ID se disponível)
            var aFilters = [
                new Filter("Matricula", FilterOperator.EQ, sMatricula)
            ];
            
            if (sIdEntrada && sIdEntrada !== "0") {
                aFilters.push(new Filter("IdEntrada", FilterOperator.EQ, sIdEntrada));
            }
            
            var oEntradaBinding = oODataModel.bindList("/Entrada", null, null, aFilters, {
                $select: ["IdEntrada", "Matricula", "DataHoraEntrada", "IdTipoVeiculo", "IdCliente", "IdVeiculo"]
            });
            
            oEntradaBinding.requestContexts(0, 1).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var oData = aContexts[0].getObject();
                    
                    // Determinar o estado do cliente
                    var sClienteStatus = bIsRegistrado ? "Cliente registrado" : "Cliente não registrado";
                    var sNomeCliente = "";
                    
                    // Buscar a descrição do tipo de veículo
                    this._carregarTipoVeiculo(oData.IdTipoVeiculo).then(function(sTipoVeiculoDesc) {
                        // Definir os dados básicos
                        var oEntryData = {
                            matricula: oData.Matricula,
                            dataHoraEntrada: oData.DataHoraEntrada,
                            tipoVeiculo: sTipoVeiculoDesc || "Desconhecido",
                            dataEntrada: oData.DataHoraEntrada,
                            cliente: sClienteStatus,
                            nomeCliente: sNomeCliente,
                            isClienteRegistrado: bIsRegistrado
                        };
                        
                        // Atualizar o modelo
                        oEntryModel.setData(oEntryData);
                        
                        // Se for cliente registrado, tentar obter o nome do cliente
                        if (bIsRegistrado && oData.IdCliente) {
                            this._carregarNomeCliente(oData.IdCliente);
                        }
                    }.bind(this));
                }
            }.bind(this)).catch(function(oError) {
                console.error("Erro ao carregar dados da entrada:", oError);
            });
        },
        
        /**
         * Carrega o nome do cliente
         * @param {string} sIdCliente ID do cliente
         * @private
         */
        _carregarNomeCliente: function(sIdCliente) {
            var oEntryModel = this.getModel("entryModel");
            var oODataModel = this.getOwnerComponent().getModel();
            
            if (!oODataModel || !sIdCliente) {
                return;
            }
            
            var oClienteFilter = new Filter("IdCliente", FilterOperator.EQ, sIdCliente);
            var oClienteBinding = oODataModel.bindList("/Cliente", null, null, [oClienteFilter], {
                $select: ["IdCliente", "Nome"]
            });
            
            oClienteBinding.requestContexts(0, 1).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var sNomeCliente = aContexts[0].getObject().Nome;
                    oEntryModel.setProperty("/nomeCliente", sNomeCliente);
                }
            }).catch(function(oError) {
                console.error("Erro ao carregar nome do cliente:", oError);
            });
        },
        
        /**
         * Carrega a descrição do tipo de veículo
         * @param {string} sIdTipoVeiculo ID do tipo de veículo
         * @returns {Promise} Promise com a descrição do tipo de veículo
         * @private
         */
        _carregarTipoVeiculo: function(sIdTipoVeiculo) {
            return new Promise(function(resolve) {
                var oODataModel = this.getOwnerComponent().getModel();
                
                if (!oODataModel || !sIdTipoVeiculo) {
                    resolve("");
                    return;
                }
                
                var oTipoVeiculoFilter = new Filter("IdTipo", FilterOperator.EQ, sIdTipoVeiculo);
                var oTipoVeiculoBinding = oODataModel.bindList("/TipoVeiculo", null, null, [oTipoVeiculoFilter], {
                    $select: ["IdTipo", "Descricao"]
                });
                
                oTipoVeiculoBinding.requestContexts(0, 1).then(function(aContexts) {
                    if (aContexts && aContexts.length > 0) {
                        var sTipoVeiculoDesc = aContexts[0].getObject().Descricao;
                        resolve(sTipoVeiculoDesc);
                    } else {
                        resolve("");
                    }
                }).catch(function() {
                    resolve("");
                });
            }.bind(this));
        },
        
        /**
         * Carrega informações de disponibilidade do parque
         * @private
         */
        _carregarDisponibilidade: function() {
            var oEntryModel = this.getModel("entryModel");
            var oODataModel = this.getOwnerComponent().getModel();
            
            if (!oODataModel) {
                return;
            }
            
            var oDisponibilidadeBinding = oODataModel.bindList("/Disponibilidade", null, null, null, {
                $select: ["IdDisponibilidade", "LugaresMotoLivres", "LugaresLigeiroLivres", "LugaresPesadoLivres"]
            });
            
            oDisponibilidadeBinding.requestContexts(0, 1).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var oDisponibilidade = aContexts[0].getObject();
                    oEntryModel.setProperty("/disponibilidade", oDisponibilidade);
                    console.log("Disponibilidade carregada na tela de detalhes:", oDisponibilidade);
                }
            }).catch(function(oError) {
                console.error("Erro ao carregar disponibilidade:", oError);
            });
        },
        
        /**
         * Formata uma data para exibição
         * @param {Date} dData Data a ser formatada
         * @returns {string} Data formatada
         * @private
         */
        _formatarData: function(dData) {
            var oDateFormat = DateFormat.getDateTimeInstance({
                pattern: "dd/MM/yyyy HH:mm:ss"
            });
            return oDateFormat.format(dData);
        },
        
        /**
         * Navega de volta para a tela anterior
         */
        onNavBack: function() {
            this.navBack();
        },
        
        /**
         * Navega para a tela de nova entrada
         */
        onNovaEntrada: function() {
            this.getRouter().navTo("RouteView1");
        }
    });
});