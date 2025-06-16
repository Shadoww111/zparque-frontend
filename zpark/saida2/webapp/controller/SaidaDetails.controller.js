sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/Filter",  // Added missing Filter import
    "sap/ui/model/FilterOperator"  // Added FilterOperator import
], function (BaseController, JSONModel, DateFormat, Filter, FilterOperator) {  // Added parameters
    "use strict";
    
    return BaseController.extend("saida2.controller.SaidaDetails", {
        onInit: function () {
            // Inicializar modelo para os detalhes da saída
            var oSaidaModel = new JSONModel({
                idMovimento: "",
                matricula: "",
                dataEntrada: "",
                dataSaida: "",
                duracaoHoras: 0,
                valorBruto: 0,
                desconto: 0,
                valorLiquido: 0,
                moeda: "EUR",
                tipoVeiculo: "",
                isClienteRegistrado: false,
                cliente: "",
                nomeCliente: "",
                nif: "",
                veiculo: "",
                status: ""
            });
            this.setModel(oSaidaModel, "saidaModel");
            
            // Configurar o router
            this.getRouter().getRoute("RouteSaidaDetails").attachPatternMatched(this.onRouteMatched, this);
        },
        
        onRouteMatched: function(oEvent) {
            var oArguments = oEvent.getParameter("arguments");
            var sIdMovimento = oArguments.idMovimento || "";
            var sMatricula = oArguments.matricula || "";
            var bIsRegistrado = oArguments.registrado === "true";
            
            // Obter os dados compartilhados pela View1
            var oComponent = this.getOwnerComponent();
            var oSharedData = oComponent.getModel("sharedData").getData();
            
            if (oSharedData && oSharedData.idMovimento === sIdMovimento) {
                // Dados encontrados no modelo compartilhado
                var oSaidaModel = this.getModel("saidaModel");
                oSaidaModel.setData(oSharedData);

                if (oSharedData && oSharedData.idMovimento === sIdMovimento) {
                  
                    if (!oSharedData.isClienteRegistrado) {
                        oSharedData.nomeCliente = "";
                        oSharedData.nif = "";
                        oSharedData.cliente = this.getI18nText("clienteNaoRegistrado");
                    }
                    
                    var oSaidaModel = this.getModel("saidaModel");
                    oSaidaModel.setData(oSharedData);
                }
                
                console.log("Dados de saída carregados do modelo compartilhado:", oSharedData);
            } else {
                // Se não encontrou dados compartilhados, tentar carregar do backend
                this._carregarDadosMovimento(sIdMovimento);
            }
            
            // Atualizar disponibilidade
            this.atualizarDisponibilidade();
        },
        
   /**
 * Carrega dados do movimento a partir do backend
 * @param {string} sIdMovimento ID do movimento
 * @private
 */
_carregarDadosMovimento: function(sIdMovimento) {
    var oSaidaModel = this.getModel("saidaModel");
    var oODataModel = this.getOwnerComponent().getModel();
    var that = this;
    
    if (!oODataModel || !sIdMovimento) {
        return;
    }
    
    // Obter a matrícula que deve ser utilizada como parte da chave composta
    var sMatricula = "";
    var oArgs = this.getRouter().getHashChanger().getHash().split("/");
    if (oArgs.length >= 3) {
        sMatricula = oArgs[2];
    } else {
        // Se não encontrar na URL, tentar obter do modelo compartilhado
        var oSharedData = this.getOwnerComponent().getModel("sharedData").getData();
        if (oSharedData && oSharedData.matricula) {
            sMatricula = oSharedData.matricula;
        }
    }
    
    if (!sMatricula) {
        console.error("Matrícula não encontrada para carregar dados");
        this._usarDadosCompartilhados();
        return;
    }
    
    try {
        // Construir chave composta com IdMovimento e Matricula
        var sKey = "IdMovimento=" + sIdMovimento + ",Matricula='" + sMatricula + "'";
        var sPath = "/Entrada(" + sKey + ")";
        console.log("Tentando carregar dados com path:", sPath);
        
        var oContextBinding = oODataModel.bindContext(sPath);
        
        // Requisitar dados
        oContextBinding.requestObject().then(function(oData) {
            if (oData) {
                console.log("Dados carregados:", oData);
                
                // Formatar datas
                var sDataEntrada = that._formatarData(new Date(oData.DataEntrada));
                var sDataSaida = that._formatarData(new Date(oData.DataSaida || new Date()));
                
                // Atualizar modelo
                oSaidaModel.setData({
                    idMovimento: oData.IdMovimento,
                    matricula: oData.Matricula,
                    dataEntrada: sDataEntrada,
                    dataSaida: sDataSaida,
                    duracaoHoras: oData.DuracaoHoras ? oData.DuracaoHoras.toFixed(2) : "0.00",
                    valorBruto: oData.ValorBruto ? oData.ValorBruto.toFixed(2) : "0.00",
                    desconto: oData.Desconto || 0,
                    valorLiquido: oData.ValorLiquido ? oData.ValorLiquido.toFixed(2) : "0.00",
                    moeda: oData.Moeda || "EUR",
                    status: oData.Status
                });
                
                // Carregar informações adicionais
                if (oData.IdTipoVeiculo) {
                    that._carregarInfoTipoVeiculo(oData.IdTipoVeiculo);
                }
                
                if (oData.IdCliente) {
                    that._carregarInfoCliente(oData.IdCliente);
                }
                
                if (oData.IdVeiculo) {
                    that._carregarInfoVeiculo(oData.IdVeiculo);
                }
            } else {
                console.error("Dados não encontrados para o movimento:", sIdMovimento);
                that._tentarComSaida(sIdMovimento, sMatricula);
            }
        }).catch(function(oError) {
            console.error("Erro ao carregar dados:", oError);
            
            // Tentar carregar da entidade Saida
            that._tentarComSaida(sIdMovimento, sMatricula);
        });
    } catch (oError) {
        console.error("Erro ao criar binding:", oError);
        that._tentarComSaida(sIdMovimento, sMatricula);
    }
},

/**
 * Tenta carregar dados usando a entidade Saida
 * @param {string} sIdMovimento ID do movimento
 * @param {string} sMatricula Matrícula do veículo
 * @private
 */
_tentarComSaida: function(sIdMovimento, sMatricula) {
    var oSaidaModel = this.getModel("saidaModel");
    var oODataModel = this.getOwnerComponent().getModel();
    var that = this;
    
    try {
        // Construir chave composta com IdMovimento e Matricula
        var sKey = "IdMovimento=" + sIdMovimento + ",Matricula='" + sMatricula + "'";
        var sPath = "/Saida(" + sKey + ")";
        console.log("Tentando carregar dados de Saida:", sPath);
        
        var oContextBinding = oODataModel.bindContext(sPath);
        
        // Requisitar dados
        oContextBinding.requestObject().then(function(oData) {
            if (oData) {
                console.log("Dados de Saida carregados:", oData);
                
                // Formatar datas
                var sDataEntrada = that._formatarData(new Date(oData.DataEntrada));
                var sDataSaida = that._formatarData(new Date(oData.DataSaida || new Date()));
                
                // Atualizar modelo
                oSaidaModel.setData({
                    idMovimento: oData.IdMovimento,
                    matricula: oData.Matricula,
                    dataEntrada: sDataEntrada,
                    dataSaida: sDataSaida,
                    duracaoHoras: oData.DuracaoHoras ? oData.DuracaoHoras.toFixed(2) : "0.00",
                    valorBruto: oData.ValorBruto ? oData.ValorBruto.toFixed(2) : "0.00",
                    desconto: oData.Desconto || 0,
                    valorLiquido: oData.ValorLiquido ? oData.ValorLiquido.toFixed(2) : "0.00",
                    moeda: oData.Moeda || "EUR",
                    status: oData.Status
                });
                
                // Carregar informações adicionais
                if (oData.IdTipoVeiculo) {
                    that._carregarInfoTipoVeiculo(oData.IdTipoVeiculo);
                }
                
                if (oData.IdCliente) {
                    that._carregarInfoCliente(oData.IdCliente);
                }
                
                if (oData.IdVeiculo) {
                    that._carregarInfoVeiculo(oData.IdVeiculo);
                }
            } else {
                console.error("Dados de Saida não encontrados:", sIdMovimento);
                that._usarDadosCompartilhados();
            }
        }).catch(function(oError) {
            console.error("Erro ao carregar dados de Saida:", oError);
            that._usarDadosCompartilhados();
        });
    } catch (oError) {
        console.error("Erro ao criar binding para Saida:", oError);
        that._usarDadosCompartilhados();
    }
},

/*
 * Usa os dados compartilhados quando não é possível carregar do backend
 * @private
 */
_usarDadosCompartilhados: function() {
    var oSaidaModel = this.getModel("saidaModel");
    var oSharedData = this.getOwnerComponent().getModel("sharedData").getData();
    
    if (oSharedData && oSharedData.idMovimento) {
        console.log("Usando dados compartilhados:", oSharedData);
        oSaidaModel.setData(oSharedData);
    } else {
        this._mostrarErroMovimentoInvalido();
    }
},


        
      /**
 * Carrega informações sobre o tipo de veículo
 * @param {string} sIdTipoVeiculo ID do tipo de veículo
 * @private
 */
_carregarInfoTipoVeiculo: function(sIdTipoVeiculo) {
    var oSaidaModel = this.getModel("saidaModel");
    var oODataModel = this.getOwnerComponent().getModel();
    var that = this;
    
    if (!oODataModel || !sIdTipoVeiculo) {
        return;
    }
    
    try {
        var sPath = "/TipoVeiculo(IdTipo=" + sIdTipoVeiculo + ")";
        var oContextBinding = oODataModel.bindContext(sPath);
        
        oContextBinding.requestObject().then(function(oData) {
            if (oData) {
                oSaidaModel.setProperty("/tipoVeiculo", oData.Descricao);
            }
        }).catch(function(oError) {
            console.error("Erro ao carregar tipo de veículo:", oError);
            
            // Definir um valor padrão
            var sTipoVeiculo = "";
            switch (parseInt(sIdTipoVeiculo)) {
                case 1: sTipoVeiculo = "Ligeiro"; break;
                case 2: sTipoVeiculo = "Motociclo"; break;
                case 3: sTipoVeiculo = "Pesado"; break;
                default: sTipoVeiculo = "Desconhecido";
            }
            oSaidaModel.setProperty("/tipoVeiculo", sTipoVeiculo);
        });
    } catch (oError) {
        console.error("Erro ao criar binding para tipo de veículo:", oError);
    }
},

/**
 * Carrega informações sobre o cliente
 * @param {string} sIdCliente ID do cliente
 * @private
 */
_carregarInfoCliente: function(sIdCliente) {
    var oSaidaModel = this.getModel("saidaModel");
    var oODataModel = this.getOwnerComponent().getModel();
    var that = this;
    
    if (!oODataModel || !sIdCliente) {
        return;
    }
    
    try {
        var sPath = "/Cliente(" + sIdCliente + ")";
        var oContextBinding = oODataModel.bindContext(sPath);
        
        oContextBinding.requestObject().then(function(oData) {
            if (oData) {
                oSaidaModel.setProperty("/isClienteRegistrado", true);
                oSaidaModel.setProperty("/cliente", "Cliente registrado");
                oSaidaModel.setProperty("/nomeCliente", oData.Nome);
                oSaidaModel.setProperty("/nif", oData.Nif);
            }
        }).catch(function(oError) {
            console.error("Erro ao carregar informações do cliente:", oError);
            oSaidaModel.setProperty("/isClienteRegistrado", true);
            oSaidaModel.setProperty("/cliente", "Cliente registrado");
        });
    } catch (oError) {
        console.error("Erro ao criar binding para cliente:", oError);
    }
},

/**
 * Carrega informações sobre o veículo
 * @param {string} sIdVeiculo ID do veículo
 * @private
 */
_carregarInfoVeiculo: function(sIdVeiculo) {
    var oSaidaModel = this.getModel("saidaModel");
    var oODataModel = this.getOwnerComponent().getModel();
    var that = this;
    
    if (!oODataModel || !sIdVeiculo) {
        return;
    }
    
    try {
        var sPath = "/Veiculo(" + sIdVeiculo + ")";
        var oContextBinding = oODataModel.bindContext(sPath);
        
        oContextBinding.requestObject().then(function(oData) {
            if (oData) {
                oSaidaModel.setProperty("/veiculo", oData.Marca + " " + oData.Modelo);
            }
        }).catch(function(oError) {
            console.error("Erro ao carregar informações do veículo:", oError);
        });
    } catch (oError) {
        console.error("Erro ao criar binding para veículo:", oError);
    }
},
        
        /**
         * Exibe erro quando o movimento não é encontrado ou não é válido
         * @private
         */
        _mostrarErroMovimentoInvalido: function() {
            // Implementação para exibir erro
            console.error("Movimento inválido ou não encontrado");
            
            // Voltar para a tela inicial após alguns segundos
            setTimeout(function() {
                this.navBack();
            }.bind(this), 3000);
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
         * Navega para a tela de nova saída
         */
        onNovaSaida: function() {
            this.getRouter().navTo("RouteView1");
        }
    });
});