sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/Filter", // Adicionar esta linha
    "sap/ui/model/FilterOperator" // E esta linha
], function (BaseController, JSONModel, MessageBox, BusyIndicator, MessageToast, DateFormat, Filter, FilterOperator) {
    // Continua com o restante do código...
    "use strict";

    return BaseController.extend("entrada2.controller.View1", {
        onInit: function () {
            // Inicializar modelos
            var oViewModel = new JSONModel({
                matricula: "",
                idTipoVeiculo: "1", // Padrão = Ligeiro
                isMatriculaRegistrada: false,
                clienteInfo: {},
                veiculoInfo: {},
                disponibilidade: {
                    LugaresMotoLivres: 0,
                    LugaresLigeiroLivres: 0,
                    LugaresPesadoLivres: 0
                },
                TiposVeiculo: [
                    { IdTipo: "1", Descricao: "Ligeiro" },
                    { IdTipo: "2", Descricao: "Motociclo" },
                    { IdTipo: "3", Descricao: "Pesado" }
                ],
                // Mensagens para o cliente
                mensagemCliente: "",
                tipoMensagem: "Information", // Success, Warning, Error, Information
                
                // Dados da entrada registrada
                dadosEntrada: {},
                mostrarDadosEntrada: false,
                
                // Data atual formatada para exibição
                dataAtual: this._formatarData(new Date())
            });
            this.setModel(oViewModel, "viewModel");
            
            // Configurar o router
            this.getRouter().getRoute("RouteView1").attachPatternMatched(this.onRouteMatched, this);
            
            // Inicializar o modelo compartilhado no Component se ainda não existir
            var oComponent = this.getOwnerComponent();
            if (!oComponent.getModel("sharedData")) {
                oComponent.setModel(new JSONModel({}), "sharedData");
            }
            
            // Carregar os tipos de veículos do backend
            this._carregarTiposVeiculo();
            
            // Carregar informações de disponibilidade do parque
            this._carregarDisponibilidade();
        },
        onAfterRendering: function() {
            // Aplicar as classes de animação
            this._applyAnimations();
        },
        
        _applyAnimations: function() {
            // Adicionar animações aos elementos
            var that = this;
            setTimeout(function() {
                that.byId("matriculaInput").focus();
            }, 500);
        },
        onRouteMatched: function (oEvent) {
            // Se voltar atrás limpa o input
            this.getView().byId("matriculaInput").setValue("");
            this.getView().byId("messageStrip").setVisible(false);

            // Adicionando automaticamente o cursor do Input
            jQuery.sap.delayedCall(500, this, function() {
                this.getView().byId("matriculaInput").focus();
            });
            
            // Recarregar a disponibilidade atualizada do backend
            this._carregarDisponibilidade();
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
         * Carrega todos os tipos de veículos disponíveis
         * @private
         */
        _carregarTiposVeiculo: function() {
            var oViewModel = this.getView().getModel("viewModel");
            var oODataModel = this.getOwnerComponent().getModel();
            
            if (!oODataModel) {
                console.log("Modelo OData indisponível para carregar tipos de veículo");
                return;
            }
            
            var oTipoVeiculoBinding = oODataModel.bindList("/TipoVeiculo", null, null, null, { 
                $select: ["IdTipo", "Descricao"] 
            });
            
            oTipoVeiculoBinding.requestContexts(0, 100).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var aTiposVeiculo = aContexts.map(function(oContext) {
                        return {
                            IdTipo: oContext.getObject().IdTipo,
                            Descricao: oContext.getObject().Descricao
                        };
                    });
                    
                    oViewModel.setProperty("/TiposVeiculo", aTiposVeiculo);
                    console.log("Tipos de veículo carregados:", aTiposVeiculo);
                }
            }).catch(function(oError) {
                console.error("Erro ao carregar tipos de veículos:", oError);
            });
        },
        
        /**
 * Atualiza a disponibilidade de forma simplificada
 * @param {string|number} tipoVeiculo Tipo do veículo
 * @private
 */
_atualizarDisponibilidadeSimples: function(tipoVeiculo) {
    try {
        var oViewModel = this.getView().getModel("viewModel");
        var oDisponibilidade = oViewModel.getProperty("/disponibilidade");
        
        if (!oDisponibilidade) {
            return;
        }
        
        // Criar uma cópia dos dados atuais
        var oNovaDisponibilidade = JSON.parse(JSON.stringify(oDisponibilidade));
        
        // Atualizar o tipo específico
        var nTipoVeiculo = parseInt(tipoVeiculo);
        
        if (nTipoVeiculo === 1) { // Ligeiro
            oNovaDisponibilidade.LugaresLigeiroLivres = Math.max(0, oDisponibilidade.LugaresLigeiroLivres - 1);
        } else if (nTipoVeiculo === 2) { // Motociclo
            oNovaDisponibilidade.LugaresMotoLivres = Math.max(0, oDisponibilidade.LugaresMotoLivres - 1);
        } else if (nTipoVeiculo === 3) { // Pesado
            oNovaDisponibilidade.LugaresPesadoLivres = Math.max(0, oDisponibilidade.LugaresPesadoLivres - 1);
        }
        
        // Atualizar o modelo local para feedback imediato
        oViewModel.setProperty("/disponibilidade", oNovaDisponibilidade);
        
        // Atualizar também o modelo global de disponibilidade
        var oDisponibilidadeModel = this.getOwnerComponent().getModel("disponibilidadeModel");
        if (oDisponibilidadeModel) {
            oDisponibilidadeModel.setData({
                LugaresMotoLivres: oNovaDisponibilidade.LugaresMotoLivres,
                LugaresLigeiroLivres: oNovaDisponibilidade.LugaresLigeiroLivres,
                LugaresPesadoLivres: oNovaDisponibilidade.LugaresPesadoLivres
            });
        }
        
        // Atualizar também o modelo compartilhado
        var oComponent = this.getOwnerComponent();
        if (oComponent.getModel("sharedData")) {
            var oSharedData = oComponent.getModel("sharedData").getData() || {};
            oSharedData.disponibilidade = oNovaDisponibilidade;
            oComponent.getModel("sharedData").setData(oSharedData);
        }
        
        // Recarregar dados da disponibilidade após alguns segundos
        setTimeout(this._carregarDisponibilidade.bind(this), 1500);
        
    } catch (e) {
        console.error("Erro ao atualizar disponibilidade:", e);
    }
},

/**
 * Carrega informações de disponibilidade do parque
 * @private
 */
_carregarDisponibilidade: function() {
    var oViewModel = this.getView().getModel("viewModel");
    var oODataModel = this.getOwnerComponent().getModel();
    
    if (!oODataModel) {
        console.log("Modelo OData indisponível para carregar disponibilidade");
        return;
    }
    
    var oDisponibilidadeBinding = oODataModel.bindList("/Disponibilidade", null, null, null, {
        $select: ["IdDisponibilidade", "LugaresMotoLivres", "LugaresLigeiroLivres", "LugaresPesadoLivres"]
    });
    
    oDisponibilidadeBinding.requestContexts(0, 1).then(function(aContexts) {
        if (aContexts && aContexts.length > 0) {
            var oDisponibilidade = aContexts[0].getObject();
            oViewModel.setProperty("/disponibilidade", oDisponibilidade);
            
            // Atualizar também no modelo global de disponibilidade
            var oDisponibilidadeModel = this.getOwnerComponent().getModel("disponibilidadeModel");
            if (oDisponibilidadeModel) {
                oDisponibilidadeModel.setData({
                    LugaresMotoLivres: oDisponibilidade.LugaresMotoLivres,
                    LugaresLigeiroLivres: oDisponibilidade.LugaresLigeiroLivres,
                    LugaresPesadoLivres: oDisponibilidade.LugaresPesadoLivres
                });
            }
            
            // Atualizar também no modelo compartilhado para uso em outras telas
            var oComponent = this.getOwnerComponent();
            if (oComponent.getModel("sharedData")) {
                var oSharedData = oComponent.getModel("sharedData").getData() || {};
                oSharedData.disponibilidade = oDisponibilidade;
                oComponent.getModel("sharedData").setData(oSharedData);
            }
            
            console.log("Disponibilidade carregada:", oDisponibilidade);
        }
    }.bind(this)).catch(function(oError) {
        console.error("Erro ao carregar disponibilidade:", oError);
    });
},
        
        /**
         * Valida o formato da matrícula
         * @param {string} sMatricula Matrícula para validar
         * @returns {object} Resultado da validação
         * @private
         */
        _validarFormatoMatricula: function(sMatricula) {
            // Se estiver vazio
            if (!sMatricula || sMatricula.trim() === "") {
                return {
                    valido: false,
                    tipo: "Error",
                    mensagem: "A matrícula não pode estar vazia"
                };
            }
            
            // Normalizar a matrícula (remover espaços extras e hífens)
            sMatricula = sMatricula.trim().toUpperCase().replace(/-/g, "").replace(/ /g, "");
            
            // Verificar se tem 6 caracteres
            if (sMatricula.length !== 6) {
                return {
                    valido: false,
                    tipo: "Error",
                    mensagem: "A matrícula deve ter 6 caracteres"
                };
            }
            
            // Verificar se só tem letras e números
            var regexAlfanumerico = /^[A-Z0-9]{6}$/;
            if (!regexAlfanumerico.test(sMatricula)) {
                return {
                    valido: false,
                    tipo: "Error",
                    mensagem: "A matrícula deve conter apenas letras e números"
                };
            }
            
            // Verificar formatos permitidos para matrículas portuguesas
            // Padrão 1: 2 letras + 2 números + 2 letras (AA00AA)
            var padrao1 = /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/;
            // Padrão 2: 2 números + 2 letras + 2 números (00AA00)
            var padrao2 = /^[0-9]{2}[A-Z]{2}[0-9]{2}$/;
            // Padrão 3: 2 números + 2 números + 2 letras (0000AA)
            var padrao3 = /^[0-9]{4}[A-Z]{2}$/;
            // Padrão 4: 2 letras + 2 números + 2 números (AA0000)
            var padrao4 = /^[A-Z]{2}[0-9]{4}$/;
            
            if (!padrao1.test(sMatricula) && !padrao2.test(sMatricula) && 
                !padrao3.test(sMatricula) && !padrao4.test(sMatricula)) {
                return {
                    valido: false,
                    tipo: "Warning",
                    mensagem: "Formato de matrícula não está no padrão comum"
                };
            }
            
            // Matrícula válida
            return {
                valido: true,
                matriculaNormalizada: sMatricula
            };
        },
        
        /**
         * Manipula o evento de alteração do campo de matrícula
         * @param {sap.ui.base.Event} oEvent Evento de alteração
         */
        onMatriculaChange: function(oEvent) {
            var oInput = oEvent.getSource();
            var sMatricula = oEvent.getParameter("value").toUpperCase();
            
            // Remover hífens e espaços
            sMatricula = sMatricula.trim().toUpperCase().replace(/-/g, "").replace(/ /g, "");
            
            // Atualizar o input com a matrícula sem hífens
            oInput.setValue(sMatricula);
            
            // Validar o formato da matrícula
            var oValidacao = this._validarFormatoMatricula(sMatricula);
            
            if (!oValidacao.valido) {
                // Definir estado de erro no campo
                oInput.setValueState(oValidacao.tipo);
                oInput.setValueStateText(oValidacao.mensagem);
                
                // Limpar informações do cliente
                this.getView().getModel("viewModel").setProperty("/isMatriculaRegistrada", false);
                this.getView().getModel("viewModel").setProperty("/clienteInfo", {});
                this.getView().getModel("viewModel").setProperty("/veiculoInfo", {});
                this.getView().getModel("viewModel").setProperty("/mensagemCliente", oValidacao.mensagem);
                this.getView().getModel("viewModel").setProperty("/tipoMensagem", oValidacao.tipo);
                
                // Mostrar mensagem de erro
                this.getView().byId("messageStrip").setText(oValidacao.mensagem);
                this.getView().byId("messageStrip").setType(oValidacao.tipo);
                this.getView().byId("messageStrip").setVisible(true);
                
                return;
            }
            
            // Formato válido, limpar estado de erro
            oInput.setValueState("None");
            
            // Atualizar a matrícula no modelo
            this.getView().getModel("viewModel").setProperty("/matricula", oValidacao.matriculaNormalizada);
            
            // Esconder mensagem de erro
            this.getView().byId("messageStrip").setVisible(false);
            
            // Verificar a matrícula no sistema
            this._verificarMatricula();
        },
        
        /**
         * Verifica se a matrícula já está cadastrada
         * @private
         */
        _verificarMatricula: function() {
            var oViewModel = this.getView().getModel("viewModel");
            var sMatricula = oViewModel.getProperty("/matricula");
            
            if (!sMatricula || sMatricula.trim() === "") {
                // Definir estado de erro no campo
                this.getView().byId("matriculaInput").setValueState("Error");
                this.getView().byId("matriculaInput").setValueStateText("Informe a matrícula do veículo");
                
                // Definir mensagem de erro
                oViewModel.setProperty("/mensagemCliente", "Informe a matrícula do veículo");
                oViewModel.setProperty("/tipoMensagem", "Error");
                
                // Mostrar mensagem de erro
                this.getView().byId("messageStrip").setText("Informe a matrícula do veículo");
                this.getView().byId("messageStrip").setType("Error");
                this.getView().byId("messageStrip").setVisible(true);
                return;
            }
            
            BusyIndicator.show(0);
            
            var oODataModel = this.getOwnerComponent().getModel();
            
            if (!oODataModel) {
                BusyIndicator.hide();
                oViewModel.setProperty("/mensagemCliente", "Erro: Modelo OData não disponível");
                oViewModel.setProperty("/tipoMensagem", "Error");
                
                // Mostrar mensagem de erro
                this.getView().byId("messageStrip").setText("Erro: Modelo OData não disponível");
                this.getView().byId("messageStrip").setType("Error");
                this.getView().byId("messageStrip").setVisible(true);
                return;
            }
            
            // Ocultar dados de entrada anterior, se existir
            oViewModel.setProperty("/mostrarDadosEntrada", false);
            
            // Filtrar veículos pela matrícula
            var oFilter = new sap.ui.model.Filter("Matricula", sap.ui.model.FilterOperator.EQ, sMatricula);
            var oVeiculoBinding = oODataModel.bindList("/Veiculo", null, null, [oFilter], {
                $select: ["IdVeiculo", "Matricula", "Marca", "Modelo", "IdTipoVeiculo", "IdCliente", "Eletrico", "TipoVeiculoDescricao"]
            });
            
            oVeiculoBinding.requestContexts(0, 1)
                .then(function(aContexts) {
                    BusyIndicator.hide();
                    
                    if (aContexts && aContexts.length > 0) {
                        // Matrícula encontrada - é um cliente registrado
                        var oVeiculo = aContexts[0].getObject();
                        
                        oViewModel.setProperty("/isMatriculaRegistrada", true);
                        oViewModel.setProperty("/veiculoInfo", oVeiculo);
                        oViewModel.setProperty("/idTipoVeiculo", oVeiculo.IdTipoVeiculo);
                        
                        // Definir mensagem de sucesso
                        oViewModel.setProperty("/mensagemCliente", "Veiculo registrado: " + oVeiculo.Marca + " " + oVeiculo.Modelo);
                        oViewModel.setProperty("/tipoMensagem", "Success");
                        
                        // Mostrar mensagem
                        this.getView().byId("messageStrip").setText("Veiculo registrado: " + oVeiculo.Marca + " " + oVeiculo.Modelo);
                        this.getView().byId("messageStrip").setType("Success");
                        this.getView().byId("messageStrip").setVisible(true);
                        
                        // Buscar informações do cliente
                        this._carregarInfoCliente(oVeiculo.IdCliente);
                        
                        // Verificar se a matrícula já está no estacionamento
                        this._verificarMatriculaNoEstacionamento(sMatricula);
                    } else {
                        // Matrícula não encontrada - não é um cliente registrado
                        oViewModel.setProperty("/isMatriculaRegistrada", false);
                        oViewModel.setProperty("/clienteInfo", {});
                        oViewModel.setProperty("/veiculoInfo", {});
                        
                        // Verificar se a matrícula já está no estacionamento
                        this._verificarMatriculaNoEstacionamento(sMatricula);
                        
                        // Definir mensagem informativa (apenas se não estiver no estacionamento)
                        if (oViewModel.getProperty("/tipoMensagem") !== "Error") {
                            oViewModel.setProperty("/mensagemCliente", "Veículo não registrado. Por favor, selecione o tipo de veículo.");
                            oViewModel.setProperty("/tipoMensagem", "Information");
                            
                            // Mostrar mensagem
                            this.getView().byId("messageStrip").setText("Veículo não registrado. Por favor, selecione o tipo de veículo.");
                            this.getView().byId("messageStrip").setType("Information");
                            this.getView().byId("messageStrip").setVisible(true);
                        }
                    }
                }.bind(this))
                .catch(function(oError) {
                    BusyIndicator.hide();
                    
                    // Definir mensagem de erro
                    oViewModel.setProperty("/mensagemCliente", "Erro ao verificar matrícula");
                    oViewModel.setProperty("/tipoMensagem", "Error");
                    
                    // Mostrar mensagem de erro
                    this.getView().byId("messageStrip").setText("Erro ao verificar matrícula");
                    this.getView().byId("messageStrip").setType("Error");
                    this.getView().byId("messageStrip").setVisible(true);
                    
                    // Em caso de erro, considerar como não registrado
                    oViewModel.setProperty("/isMatriculaRegistrada", false);
                    oViewModel.setProperty("/clienteInfo", {});
                    oViewModel.setProperty("/veiculoInfo", {});
                    
                    console.error("Erro ao verificar matrícula:", oError);
                }.bind(this));
        },
        
        /**
 * Verifica se a matrícula já está no estacionamento
 * @param {string} sMatricula Matrícula para verificar
 * @private
 */
_verificarMatriculaNoEstacionamento: function(sMatricula) {
    var oViewModel = this.getView().getModel("viewModel");
    var oODataModel = this.getOwnerComponent().getModel();
    var that = this;
    
    if (!oODataModel || !sMatricula) {
        return;
    }
    
    // Mostrar indicador de ocupado durante a verificação
    sap.ui.core.BusyIndicator.show(0);
    
    // Verificar se existe alguma entrada ativa (sem saída) para esta matrícula
    var oFilters = new sap.ui.model.Filter({
        filters: [
            new sap.ui.model.Filter("Matricula", sap.ui.model.FilterOperator.EQ, sMatricula),
            new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "E")
        ],
        and: true
    });
    
    var oEntradaBinding = oODataModel.bindList("/Movimento", null, null, oFilters, {
        $select: ["IdMovimento", "Matricula", "DataEntrada"]
    });
    
    return new Promise(function(resolve, reject) {
        oEntradaBinding.requestContexts(0, 1).then(function(aContexts) {
            sap.ui.core.BusyIndicator.hide();
            
            if (aContexts && aContexts.length > 0) {
                // A matrícula já está no estacionamento
                var sErrorMsg = "A matrícula " + sMatricula + " já está no estacionamento!";
                oViewModel.setProperty("/mensagemCliente", sErrorMsg);
                oViewModel.setProperty("/tipoMensagem", "Error");
                
                // Mostrar mensagem de erro
                that.getView().byId("messageStrip").setText(sErrorMsg);
                that.getView().byId("messageStrip").setType("Error");
                that.getView().byId("messageStrip").setVisible(true);
                
                // Opcionalmente, mostrar um MessageBox
                sap.m.MessageBox.error(sErrorMsg, {
                    title: "Erro na Verificação",
                    onClose: function() {
                        // Focar novamente no campo da matrícula para correção
                        that.getView().byId("matriculaInput").focus();
                    }
                });
                
                resolve(true); // Já está no estacionamento
            } else {
                resolve(false); // Não está no estacionamento
            }
        }).catch(function(oError) {
            sap.ui.core.BusyIndicator.hide();
            console.error("Erro ao verificar matrícula no estacionamento:", oError);
            resolve(false); // Em caso de erro, assumir que não está no estacionamento
        });
    });
},
        
        /**
         * Carrega informações do cliente
         * @param {string} sIdCliente ID do cliente
         * @private
         */
        _carregarInfoCliente: function(sIdCliente) {
            var oViewModel = this.getView().getModel("viewModel");
            var oODataModel = this.getOwnerComponent().getModel();
            
            if (!oODataModel || !sIdCliente) {
                oViewModel.setProperty("/mensagemCliente", "Erro ao carregar dados do cliente");
                oViewModel.setProperty("/tipoMensagem", "Error");
                
                // Mostrar mensagem de erro
                this.getView().byId("messageStrip").setText("Erro ao carregar dados do cliente");
                this.getView().byId("messageStrip").setType("Error");
                this.getView().byId("messageStrip").setVisible(true);
                return;
            }
            
            // Tentar carregar cliente
            var sFilter = "IdCliente eq " + sIdCliente;
            var oClienteBinding = oODataModel.bindList("/Cliente", null, null, sFilter, {
                $select: ["IdCliente", "Nome", "Nif", "TipoClienteDescricao", "Telefone", "Email"]
            });
            
            oClienteBinding.requestContexts(0, 1).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var oData = aContexts[0].getObject();
                    oViewModel.setProperty("/clienteInfo", oData);
                    
                    // Atualizar mensagem com nome do cliente
                    oViewModel.setProperty("/mensagemCliente", "Cliente identificado: " + oData.Nome);
                    oViewModel.setProperty("/tipoMensagem", "Success");
                    
                    // Mostrar mensagem
                    this.getView().byId("messageStrip").setText("Cliente identificado: " + oData.Nome);
                    this.getView().byId("messageStrip").setType("Success");
                    this.getView().byId("messageStrip").setVisible(true);
                } else {
                    // Cliente não encontrado
                    oViewModel.setProperty("/mensagemCliente", "Veículo registrado, mas não foi possível identificar o cliente");
                    oViewModel.setProperty("/tipoMensagem", "Warning");
                    
                    // Mostrar mensagem
                    this.getView().byId("messageStrip").setText("Veículo registrado, mas não foi possível identificar o cliente");
                    this.getView().byId("messageStrip").setType("Warning");
                    this.getView().byId("messageStrip").setVisible(true);
                }
            }.bind(this)).catch(function(oError) {
                oViewModel.setProperty("/mensagemCliente", "Erro ao carregar informações do cliente");
                oViewModel.setProperty("/tipoMensagem", "Error");
                
                // Mostrar mensagem de erro
                this.getView().byId("messageStrip").setText("Erro ao carregar informações do cliente");
                this.getView().byId("messageStrip").setType("Error");
                this.getView().byId("messageStrip").setVisible(true);
                
                console.error("Erro ao carregar informações do cliente:", oError);
            });
        },
        
        /**
 * Registra a entrada do veículo
 */
onRegisterEntry: function() {
    var oViewModel = this.getView().getModel("viewModel");
    var sMatricula = this.getView().byId("matriculaInput").getValue();
    var sIdTipoVeiculo = oViewModel.getProperty("/idTipoVeiculo");
    var bIsRegistrado = oViewModel.getProperty("/isMatriculaRegistrada");
    var oMessageStrip = this.getView().byId("messageStrip");
    
    // Validar matrícula
    var oValidacao = this._validarFormatoMatricula(sMatricula);
    if (!oValidacao.valido) {
        oViewModel.setProperty("/mensagemCliente", oValidacao.mensagem);
        oViewModel.setProperty("/tipoMensagem", oValidacao.tipo);
        this.getView().byId("matriculaInput").setValueState(oValidacao.tipo);
        this.getView().byId("matriculaInput").setValueStateText(oValidacao.mensagem);
        
        // Mostrar mensagem de erro
        oMessageStrip.setText(oValidacao.mensagem);
        oMessageStrip.setType(oValidacao.tipo);
        oMessageStrip.setVisible(true);
        return;
    }
    
    if (!bIsRegistrado && (!sIdTipoVeiculo || sIdTipoVeiculo === "")) {
        oViewModel.setProperty("/mensagemCliente", "Selecione o tipo de veículo");
        oViewModel.setProperty("/tipoMensagem", "Error");
        
        // Mostrar mensagem de erro
        oMessageStrip.setText("Selecione o tipo de veículo");
        oMessageStrip.setType("Error");
        oMessageStrip.setVisible(true);
        return;
    }
    
    // Verificar disponibilidade para o tipo de veículo selecionado
    var oDisponibilidade = oViewModel.getProperty("/disponibilidade");
    var nTipoVeiculoSelecionado = parseInt(sIdTipoVeiculo);
    
    // Verificar se há vagas disponíveis para o tipo de veículo
    if ((nTipoVeiculoSelecionado === 1 && oDisponibilidade.LugaresLigeiroLivres <= 0) ||
        (nTipoVeiculoSelecionado === 2 && oDisponibilidade.LugaresMotoLivres <= 0) ||
        (nTipoVeiculoSelecionado === 3 && oDisponibilidade.LugaresPesadoLivres <= 0)) {
        
        var sTipoVeiculoDesc = this._obterDescricaoTipoVeiculo(sIdTipoVeiculo);
        oViewModel.setProperty("/mensagemCliente", "Não há vagas disponíveis para " + sTipoVeiculoDesc);
        oViewModel.setProperty("/tipoMensagem", "Error");
        
        // Mostrar mensagem de erro
        oMessageStrip.setText("Não há vagas disponíveis para " + sTipoVeiculoDesc);
        oMessageStrip.setType("Error");
        oMessageStrip.setVisible(true);
        
        sap.m.MessageBox.error("Não há vagas disponíveis para " + sTipoVeiculoDesc, {
            title: "Estacionamento Lotado"
        });
        
        return;
    }
    
    // Verificar primeiro se a matrícula já está no estacionamento antes de prosseguir
    var that = this;
    this._verificarMatriculaNoEstacionamento(sMatricula).then(function(bJaEstaNoEstacionamento) {
        if (bJaEstaNoEstacionamento) {
            // Se já está no estacionamento, não prosseguir
            return;
        }
        
        // Se chegou aqui, o veículo não está no estacionamento, pode prosseguir
        that._criarRegistroEntrada(sMatricula, sIdTipoVeiculo, bIsRegistrado);
    });
},
        
        /**
         * Cria o registro de entrada no backend
         * @param {string} sMatricula Matrícula do veículo
         * @param {string} sIdTipoVeiculo ID do tipo de veículo
         * @param {boolean} bIsRegistrado Flag indicando se o cliente é registrado
         * @private
         */
        _criarRegistroEntrada: function(sMatricula, sIdTipoVeiculo, bIsRegistrado) {
            var oViewModel = this.getView().getModel("viewModel");
            var oODataModel = this.getOwnerComponent().getModel();
            
            // Dados para criação do movimento de entrada
            var oEntrada = {
                Matricula: sMatricula,
                IsActiveEntity: true
            };
            
            // Garantir que o IdTipoVeiculo esteja no formato correto
            try {
                oEntrada.IdTipoVeiculo = parseInt(sIdTipoVeiculo);
                if (isNaN(oEntrada.IdTipoVeiculo)) {
                    oEntrada.IdTipoVeiculo = sIdTipoVeiculo;
                }
            } catch (e) {
                oEntrada.IdTipoVeiculo = sIdTipoVeiculo;
            }
            
            if (bIsRegistrado) {
                // Cliente registrado
                var oVeiculo = oViewModel.getProperty("/veiculoInfo");
                if (oVeiculo.IdCliente) {
                    try {
                        oEntrada.IdCliente = parseInt(oVeiculo.IdCliente);
                        if (isNaN(oEntrada.IdCliente)) {
                            oEntrada.IdCliente = oVeiculo.IdCliente;
                        }
                    } catch (e) {
                        oEntrada.IdCliente = oVeiculo.IdCliente;
                    }
                }
                if (oVeiculo.IdVeiculo) {
                    try {
                        oEntrada.IdVeiculo = parseInt(oVeiculo.IdVeiculo);
                        if (isNaN(oEntrada.IdTipoVeiculo)) {
                            oEntrada.IdTipoVeiculo = oVeiculo.IdTipoVeiculo;
                        }
                    } catch (e) {
                        oEntrada.IdTipoVeiculo = oVeiculo.IdTipoVeiculo;
                    }
                }
            }
            
            // Armazenar o tipo de veículo para atualizar a disponibilidade depois
            var tipoVeiculo = oEntrada.IdTipoVeiculo;
            
            try {
                // Criar registro de entrada
                var oEntradaBinding = oODataModel.bindList("/Entrada");
                var oContext = oEntradaBinding.create(oEntrada);
                
                oContext.created().then(function(oData) {
                    BusyIndicator.hide();
                    
                    // Atualizar disponibilidade
                    this._atualizarDisponibilidadeSimples(tipoVeiculo);
                    
                    // Mostrar dados da entrada
                    this._mostrarDadosEntrada(oData);
                    
                    // Definir mensagem de sucesso baseada no tipo de cliente
                    if (bIsRegistrado) {
                        var oCliente = oViewModel.getProperty("/clienteInfo");
                        var sNomeCliente = oCliente && oCliente.Nome ? oCliente.Nome : "registrado";
                        oViewModel.setProperty("/mensagemCliente", "Entrada registrada com sucesso para o cliente " + sNomeCliente);
                    } else {
                        oViewModel.setProperty("/mensagemCliente", "Entrada registrada com sucesso!");
                    }
                    oViewModel.setProperty("/tipoMensagem", "Success");
                    
                }.bind(this)).catch(function(oError) {
                    BusyIndicator.hide();
                    this._tratarErroEntrada(oError);
                }.bind(this));
            } catch (e) {
                BusyIndicator.hide();
                oViewModel.setProperty("/mensagemCliente", "Erro ao processar o registro: " + e.message);
                oViewModel.setProperty("/tipoMensagem", "Error");
                
                // Mostrar mensagem de erro
                this.getView().byId("messageStrip").setText("Erro ao processar o registro: " + e.message);
                this.getView().byId("messageStrip").setType("Error");
                this.getView().byId("messageStrip").setVisible(true);
            }
        },
        
  /**
 * Exibe os dados da entrada registrada
 * @param {object} oData Dados da entrada
 * @private
 */
_mostrarDadosEntrada: function(oData) {
    var oViewModel = this.getView().getModel("viewModel");
    var bIsRegistrado = oViewModel.getProperty("/isMatriculaRegistrada");
    var oVeiculo = oViewModel.getProperty("/veiculoInfo");
    var oCliente = oViewModel.getProperty("/clienteInfo");
    var oDataEntrada = oData || {};
    
    // Obter a disponibilidade atual
    var oDisponibilidade = oViewModel.getProperty("/disponibilidade");
    
    // Obtém o ID do tipo de veículo selecionado
    var sIdTipoVeiculo = oViewModel.getProperty("/idTipoVeiculo");
    
    // Obtém a descrição do tipo de veículo
    var sTipoVeiculoDesc = "";
    
    if (bIsRegistrado && oVeiculo.TipoVeiculoDescricao) {
        // Para veículos registrados, usa a descrição do veículo
        sTipoVeiculoDesc = oVeiculo.TipoVeiculoDescricao;
    } else {
        // Para não registrados, obtém a descrição do ComboBox
        var oComboBox = this.getView().byId("tipoVeiculoComboBox");
        var oSelectedItem = oComboBox.getSelectedItem();
        
        if (oSelectedItem) {
            // Se tem um item selecionado, pega o texto dele
            sTipoVeiculoDesc = oSelectedItem.getText();
        } else {
            // Se não tem item selecionado, busca nos tipos de veículo
            sTipoVeiculoDesc = this._obterDescricaoTipoVeiculo(sIdTipoVeiculo);
        }
    }
    
    // Adicionando log para depuração
    console.log("Tipo Veículo ID:", sIdTipoVeiculo);
    console.log("Tipo Veículo Descrição:", sTipoVeiculoDesc);
    
    // Obter o nome real do cliente, se disponível
    var sNomeCliente = "";
    if (bIsRegistrado && oCliente && oCliente.Nome) {
        sNomeCliente = oCliente.Nome;
    }
    
    // Preparar os dados da entrada
    var oDadosEntrada = {
        idEntrada: oDataEntrada.IdEntrada || "0",
        dataHoraEntrada: oDataEntrada.DataHoraEntrada || this._formatarData(new Date()),
        matricula: oDataEntrada.Matricula || oViewModel.getProperty("/matricula"),
        tipoVeiculo: sTipoVeiculoDesc, // Usa a descrição obtida
        cliente: bIsRegistrado ? "Cliente registrado" : "Cliente não registrado",
        nomeCliente: sNomeCliente, // Nome real do cliente
        idCliente: bIsRegistrado && oCliente ? oCliente.IdCliente : "",
        nif: bIsRegistrado ? (oCliente.Nif || "") : "",
        veiculo: bIsRegistrado ? (oVeiculo.Marca + " " + oVeiculo.Modelo) : "",
        eletrico: bIsRegistrado ? (oVeiculo.Eletrico === "X" ? "Sim" : "Não") : "Não",
        disponibilidade: oDisponibilidade
    };
    
    // Atualizar o modelo com os dados da entrada
    oViewModel.setProperty("/dadosEntrada", oDadosEntrada);
    oViewModel.setProperty("/mostrarDadosEntrada", true);
    
    // Mostrar mensagem de sucesso
    this.getView().byId("messageStrip").setText("Entrada registrada com sucesso!");
    this.getView().byId("messageStrip").setType("Success");
    this.getView().byId("messageStrip").setVisible(true);
    
    // Compartilhar dados entre telas via model do Component
    var oComponent = this.getOwnerComponent();
    if (!oComponent.getModel("sharedData")) {
        oComponent.setModel(new JSONModel({}), "sharedData");
    }
    
    // Incluir os dados de disponibilidade no modelo compartilhado
    oComponent.getModel("sharedData").setData(oDadosEntrada);
    
    var sMatricula = oDataEntrada.Matricula || oViewModel.getProperty("/matricula");
    var sIdEntrada = oDataEntrada.IdEntrada || "0";
    
    // Log para debug
    console.log("Navegando para detalhes da entrada:", sMatricula, bIsRegistrado, sIdEntrada);
    console.log("Dados completos para detalhes:", oDadosEntrada);
    
    // Navegar para a tela de detalhes
    this.getRouter().navTo("RouteEntryDetails", {
        matricula: sMatricula,
        registrado: bIsRegistrado ? "true" : "false",
        idEntrada: sIdEntrada
    }, false);
},
        
        /**
         * Obtém a descrição do tipo de veículo pelo ID
         * @param {string} sIdTipoVeiculo ID do tipo de veículo
         * @returns {string} Descrição do tipo de veículo
         * @private
         */
        _obterDescricaoTipoVeiculo: function(sIdTipoVeiculo) {
            var aTiposVeiculo = this.getView().getModel("viewModel").getProperty("/TiposVeiculo");
            var oTipoVeiculo = aTiposVeiculo.find(function(oTipo) {
                return oTipo.IdTipo === sIdTipoVeiculo;
            });
            
            return oTipoVeiculo ? oTipoVeiculo.Descricao : "";
        },
        
        /**
         * Atualiza a disponibilidade de forma simplificada
         * @param {string|number} tipoVeiculo Tipo do veículo
         * @private
         */
        _atualizarDisponibilidadeSimples: function(tipoVeiculo) {
            try {
                var oViewModel = this.getView().getModel("viewModel");
                var oDisponibilidade = oViewModel.getProperty("/disponibilidade");
                
                if (!oDisponibilidade) {
                    return;
                }
                
                // Criar uma cópia dos dados atuais
                var oNovaDisponibilidade = JSON.parse(JSON.stringify(oDisponibilidade));
                
                // Atualizar o tipo específico
                var nTipoVeiculo = parseInt(tipoVeiculo);
                
                if (nTipoVeiculo === 1) { // Ligeiro
                    oNovaDisponibilidade.LugaresLigeiroLivres = Math.max(0, oDisponibilidade.LugaresLigeiroLivres - 1);
                } else if (nTipoVeiculo === 2) { // Motociclo
                    oNovaDisponibilidade.LugaresMotoLivres = Math.max(0, oDisponibilidade.LugaresMotoLivres - 1);
                } else if (nTipoVeiculo === 3) { // Pesado
                    oNovaDisponibilidade.LugaresPesadoLivres = Math.max(0, oDisponibilidade.LugaresPesadoLivres - 1);
                }
                
                // Atualizar o modelo local para feedback imediato
                oViewModel.setProperty("/disponibilidade", oNovaDisponibilidade);
                
                // Atualizar também o modelo compartilhado
                var oComponent = this.getOwnerComponent();
                if (oComponent.getModel("sharedData")) {
                    var oSharedData = oComponent.getModel("sharedData").getData() || {};
                    oSharedData.disponibilidade = oNovaDisponibilidade;
                    oComponent.getModel("sharedData").setData(oSharedData);
                }
                
                // Recarregar dados da disponibilidade após alguns segundos
                setTimeout(this._carregarDisponibilidade.bind(this), 1500);
                
            } catch (e) {
                console.error("Erro ao atualizar disponibilidade:", e);
            }
        },
        
        /**
         * Trata erros na entrada de veículos
         * @param {object} oError Objeto de erro
         * @private
         */
        _tratarErroEntrada: function(oError) {
            var oViewModel = this.getView().getModel("viewModel");
            
            // Tentar extrair a mensagem de erro
            var sErrorMsg = "Erro ao registrar entrada";
            
            if (oError.error && oError.error.message) {
                sErrorMsg = oError.error.message;
            } else if (oError.message) {
                sErrorMsg = oError.message;
            }
            
            // Verificar se é o erro específico de matrícula já no estacionamento
            if (sErrorMsg.includes("já está no estacionamento") || 
                oError.toString().includes("já está no estacionamento")) {
                sErrorMsg = "A matrícula já está no estacionamento!";
            } else if (sErrorMsg.includes("SQL") || sErrorMsg.includes("500")) {
                // Se for um erro interno do servidor ou SQL, mostrar uma mensagem mais amigável
                console.error("Erro técnico:", sErrorMsg);
                sErrorMsg = "Não foi possível processar a entrada. A matrícula já pode estar no estacionamento.";
            }
            
            // Atualizar mensagem de erro no modelo
            oViewModel.setProperty("/mensagemCliente", sErrorMsg);
            oViewModel.setProperty("/tipoMensagem", "Error");
            
            // Mostrar mensagem de erro
            this.getView().byId("messageStrip").setText(sErrorMsg);
            this.getView().byId("messageStrip").setType("Error");
            this.getView().byId("messageStrip").setVisible(true);
            
            // Mostrar o MessageBox para erros críticos
            if (sErrorMsg === "A matrícula já está no estacionamento!") {
                MessageBox.error(sErrorMsg, {
                    title: "Erro na Entrada",
                    onClose: function() {
                        // Focar no campo de matrícula
                        this.getView().byId("matriculaInput").focus();
                    }.bind(this)
                });
            }
        },
        
        /**
         * Reseta o formulário após o registro
         */
        onNovaEntrada: function() {
            this._resetarFormulario();
        },
        
        /**
         * Reseta o formulário
         * @private
         */
        _resetarFormulario: function() {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/matricula", "");
            oViewModel.setProperty("/isMatriculaRegistrada", false);
            oViewModel.setProperty("/clienteInfo", {});
            oViewModel.setProperty("/veiculoInfo", {});
            oViewModel.setProperty("/mensagemCliente", "");
            oViewModel.setProperty("/tipoMensagem", "Information");
            oViewModel.setProperty("/mostrarDadosEntrada", false);
            
            // Limpar estado do campo de matrícula
            var oMatriculaInput = this.getView().byId("matriculaInput");
            if (oMatriculaInput) {
                oMatriculaInput.setValueState("None");
                oMatriculaInput.setValue("");
                oMatriculaInput.focus();
            }
            
            // Esconder mensagem
            this.getView().byId("messageStrip").setVisible(false);
            
            // Recarregar disponibilidade para garantir dados atualizados
            this._carregarDisponibilidade();
        },
        
        /**
         * Manipula o evento de submissão da matrícula (tecla Enter)
         */
        onMatriculaSubmit: function() {
            // Usar a mesma lógica do onRegisterEntry
            this.onRegisterEntry();
        },
        
        /**
         * Limpa o campo de matrícula
         */
        onClear: function() {
            this._resetarFormulario();
        }
    });
});