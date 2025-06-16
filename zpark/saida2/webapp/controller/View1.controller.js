sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, MessageBox, BusyIndicator, MessageToast, DateFormat, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("saida2.controller.View1", {
        
        onInit: function () {
            // Inicializar modelos
            var oViewModel = new JSONModel({
                matricula: "",
                isMatriculaValida: false,
                clienteInfo: {},
                veiculoInfo: {},
                movimentoInfo: {},
                mensagemCliente: "",
                tipoMensagem: "Information",
                dadosSaida: {},
                mostrarDadosSaida: false,
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
            
            // Criar modelo de disponibilidade se ainda não existir
            if (!oComponent.getModel("disponibilidadeModel")) {
                var oDisponibilidadeModel = new JSONModel({
                    LugaresMotoLivres: 0,
                    LugaresLigeiroLivres: 0,
                    LugaresPesadoLivres: 0,
                    LugaresMotoTotal: 20,
                    LugaresLigeiroTotal: 65,
                    LugaresPesadoTotal: 15
                });
                oComponent.setModel(oDisponibilidadeModel, "disponibilidadeModel");
            }
            
            // Carregar informações de disponibilidade do parque
            this._carregarDisponibilidade();
        },

        onRouteMatched: function (oEvent) {
            // Limpar o input quando voltar para esta view
            this.getView().byId("matriculaInput").setValue("");
            this.getView().byId("messageStrip").setVisible(false);

            // Adicionar automaticamente o foco ao Input
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
                    mensagem: this.getI18nText("matriculaRequired")
                };
            }
            
            // Normalizar a matrícula (remover espaços extras e hífens)
            sMatricula = sMatricula.trim().toUpperCase().replace(/-/g, "").replace(/ /g, "");
            
            // Verificar se tem 6 caracteres
            if (sMatricula.length !== 6) {
                return {
                    valido: false,
                    tipo: "Error",
                    mensagem: this.getI18nText("formatoMatriculaError")
                };
            }
            
            // Verificar se só tem letras e números
            var regexAlfanumerico = /^[A-Z0-9]{6}$/;
            if (!regexAlfanumerico.test(sMatricula)) {
                return {
                    valido: false,
                    tipo: "Error",
                    mensagem: this.getI18nText("formatoMatriculaOnlyChars")
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
                    mensagem: this.getI18nText("formatoMatriculaWarning")
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
                
                // Limpar informações
                this.getView().getModel("viewModel").setProperty("/isMatriculaValida", false);
                this.getView().getModel("viewModel").setProperty("/clienteInfo", {});
                this.getView().getModel("viewModel").setProperty("/veiculoInfo", {});
                this.getView().getModel("viewModel").setProperty("/movimentoInfo", {});
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
            
            // Verificar se a matrícula está no estacionamento
            this._verificarMatriculaNoEstacionamento(oValidacao.matriculaNormalizada);
        },
        
        /**
         * Verifica se a matrícula está no estacionamento e pode registrar saída
         * @param {string} sMatricula Matrícula para verificar
         * @private
         */
        _verificarMatriculaNoEstacionamento: function(sMatricula) {
            var oViewModel = this.getView().getModel("viewModel");
            var oODataModel = this.getOwnerComponent().getModel();
            var that = this;

            oViewModel.setProperty("/clienteInfo", {});
            oViewModel.setProperty("/veiculoInfo", {});
            
            if (!oODataModel || !sMatricula) {
                return;
            }
            
            // Mostrar indicador de ocupado durante a verificação
            BusyIndicator.show(0);
            
            // Verificar se existe alguma entrada ativa (sem saída) para esta matrícula
            // Status E = Entrada (veículo no estacionamento)
            var oFilters = [
                new Filter("Matricula", FilterOperator.EQ, sMatricula),
                new Filter("Status", FilterOperator.EQ, "E") // Status E = Entrada sem saída
            ];
            
            // Verificamos na entidade Saida primeiro, pois é a entidade principal para saídas
            var sPath = "/Saida";
            
            // Log para debug
            console.log("Verificando matrícula: " + sMatricula + " com Status = 'E' na entidade Saida");
            
            // Executar a consulta usando a API OData v4
            var oEntradaBinding = oODataModel.bindList(sPath, null, null, oFilters);
            
            oEntradaBinding.requestContexts().then(function(aContexts) {
                BusyIndicator.hide();
                
                // Verificar resultados
                console.log("Resultados da consulta:", aContexts ? aContexts.length : 0);
                
                if (aContexts && aContexts.length > 0) {
                    // Veículo está no estacionamento (tem Status = 'E'), pode registrar saída
                    var oMovimento = aContexts[0].getObject();
                    
                    // Verificação extra de status - garantir que é "E"
                    if (oMovimento.Status === "E") {
                        console.log("Veículo encontrado com Status 'E':", oMovimento);
                        
                        oViewModel.setProperty("/isMatriculaValida", true);
                        oViewModel.setProperty("/movimentoInfo", oMovimento);
                        
                        // Definir mensagem de sucesso
                        var sMsg = that.getI18nText("veiculoEncontradoEstacionamento", [sMatricula]);
                        oViewModel.setProperty("/mensagemCliente", sMsg);
                        oViewModel.setProperty("/tipoMensagem", "Success");
                        
                        // Mostrar mensagem
                        that.getView().byId("messageStrip").setText(sMsg);
                        that.getView().byId("messageStrip").setType("Success");
                        that.getView().byId("messageStrip").setVisible(true);
                        
                        // Buscar informações adicionais do veículo e cliente se disponíveis
                        if (oMovimento.IdVeiculo) {
                            that._carregarInfoVeiculo(oMovimento.IdVeiculo);
                        }
                        
                        if (oMovimento.IdCliente) {
                            that._carregarInfoCliente(oMovimento.IdCliente);
                        }
                    } else {
                        // Caso estranho: veículo encontrado, mas status não é "E"
                        console.log("Veículo encontrado mas Status não é 'E':", oMovimento);
                        _mostrarVeiculoNaoEstacionado(sMatricula);
                    }
                } else {
                    // Veículo não está no estacionamento, não pode registrar saída
                    console.log("Veículo não encontrado com Status 'E'");
                    _mostrarVeiculoNaoEstacionado(sMatricula);
                }
            }).catch(function(oError) {
                // Erro ao verificar matrícula
                BusyIndicator.hide();
                
                console.error("Erro ao verificar matrícula no estacionamento:", oError);
                
                oViewModel.setProperty("/isMatriculaValida", false);
                oViewModel.setProperty("/movimentoInfo", {});
                
                // Definir mensagem de erro
                var sMsg = that.getI18nText("erroVerificarMatricula");
                oViewModel.setProperty("/mensagemCliente", sMsg);
                oViewModel.setProperty("/tipoMensagem", "Error");
                
                // Mostrar mensagem
                that.getView().byId("messageStrip").setText(sMsg);
                that.getView().byId("messageStrip").setType("Error");
                that.getView().byId("messageStrip").setVisible(true);
            });
            
            // Função auxiliar para mostrar mensagem veículo não estacionado
            function _mostrarVeiculoNaoEstacionado(sMatricula) {
                oViewModel.setProperty("/isMatriculaValida", false);
                oViewModel.setProperty("/movimentoInfo", {});
                
                // Definir mensagem de erro
                var sMsg = that.getI18nText("veiculoNaoEstacionamento", [sMatricula]);
                oViewModel.setProperty("/mensagemCliente", sMsg);
                oViewModel.setProperty("/tipoMensagem", "Error");
                
                // Mostrar mensagem
                that.getView().byId("messageStrip").setText(sMsg);
                that.getView().byId("messageStrip").setType("Error");
                that.getView().byId("messageStrip").setVisible(true);
            }
        },
        
        /**
         * Carrega informações do veículo
         * @param {string} sIdVeiculo ID do veículo
         * @private
         */
        _carregarInfoVeiculo: function(sIdVeiculo) {
            var oViewModel = this.getView().getModel("viewModel");
            var oODataModel = this.getOwnerComponent().getModel();
            var that = this;
            
            if (!oODataModel || !sIdVeiculo) {
                return;
            }
            
            var oVeiculoFilter = new Filter("IdVeiculo", FilterOperator.EQ, sIdVeiculo);
            var oVeiculoBinding = oODataModel.bindList("/Veiculo", null, null, [oVeiculoFilter], {
                $select: ["IdVeiculo", "Matricula", "Marca", "Modelo", "IdTipoVeiculo", "IdCliente", "Eletrico"]
            });
            
            oVeiculoBinding.requestContexts(0, 1).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var oVeiculo = aContexts[0].getObject();
                    oViewModel.setProperty("/veiculoInfo", oVeiculo);
                    
                    // Buscar descrição do tipo de veículo
                    that._carregarDescricaoTipoVeiculo(oVeiculo.IdTipoVeiculo);
                }
            }).catch(function(oError) {
                console.error("Erro ao carregar informações do veículo:", oError);
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
            var that = this;
            
            if (!oODataModel || !sIdCliente) {
                return;
            }
            
            var oClienteFilter = new Filter("IdCliente", FilterOperator.EQ, sIdCliente);
            var oClienteBinding = oODataModel.bindList("/Cliente", null, null, [oClienteFilter], {
                $select: ["IdCliente", "Nome", "Nif", "TipoClienteDescricao", "Telefone", "Email", "IdTipoCliente"]
            });
            
            oClienteBinding.requestContexts(0, 1).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var oCliente = aContexts[0].getObject();
                    oViewModel.setProperty("/clienteInfo", oCliente);
                    
                    // Atualizar mensagem com nome do cliente
                    var sMsg = that.getI18nText("clienteEncontrado", [oCliente.Nome]);
                    oViewModel.setProperty("/mensagemCliente", sMsg);
                    
                    // Mostrar mensagem
                    that.getView().byId("messageStrip").setText(sMsg);
                    
                    // Carregar informações de desconto do tipo de cliente
                    that._carregarInfoTipoCliente(oCliente.IdTipoCliente);
                }
            }).catch(function(oError) {
                console.error("Erro ao carregar informações do cliente:", oError);
            });
        },
        
        /**
         * Carrega informações do tipo de cliente (para descontos)
         * @param {string} sIdTipoCliente ID do tipo de cliente
         * @private
         */
        _carregarInfoTipoCliente: function(sIdTipoCliente) {
            var oViewModel = this.getView().getModel("viewModel");
            var oODataModel = this.getOwnerComponent().getModel();
            var that = this;
            
            if (!oODataModel || !sIdTipoCliente) {
                return;
            }
            
            var oTipoClienteFilter = new Filter("IdTipo", FilterOperator.EQ, sIdTipoCliente);
            var oTipoClienteBinding = oODataModel.bindList("/TipoCliente", null, null, [oTipoClienteFilter], {
                $select: ["IdTipo", "Descricao", "DescontoLigeiro", "DescontoMoto", "DescontoPesado"]
            });
            
            oTipoClienteBinding.requestContexts(0, 1).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var oTipoCliente = aContexts[0].getObject();
                    var oClienteInfo = oViewModel.getProperty("/clienteInfo");
                    
                    // Atualizar informações do cliente com os descontos
                    oClienteInfo.DescontoLigeiro = oTipoCliente.DescontoLigeiro;
                    oClienteInfo.DescontoMoto = oTipoCliente.DescontoMoto;
                    oClienteInfo.DescontoPesado = oTipoCliente.DescontoPesado;
                    oClienteInfo.TipoClienteDescricao = oTipoCliente.Descricao;
                    
                    oViewModel.setProperty("/clienteInfo", oClienteInfo);
                }
            }).catch(function(oError) {
                console.error("Erro ao carregar informações do tipo de cliente:", oError);
            });
        },
        
        /**
         * Carrega a descrição do tipo de veículo
         * @param {string} sIdTipoVeiculo ID do tipo de veículo
         * @private
         */
        _carregarDescricaoTipoVeiculo: function(sIdTipoVeiculo) {
            var oViewModel = this.getView().getModel("viewModel");
            var oODataModel = this.getOwnerComponent().getModel();
            var that = this;
            
            if (!oODataModel || !sIdTipoVeiculo) {
                return;
            }
            
            var oTipoVeiculoFilter = new Filter("IdTipo", FilterOperator.EQ, sIdTipoVeiculo);
            var oTipoVeiculoBinding = oODataModel.bindList("/TipoVeiculo", null, null, [oTipoVeiculoFilter], {
                $select: ["IdTipo", "Descricao", "PrecoHora", "Moeda"]
            });
            
            oTipoVeiculoBinding.requestContexts(0, 1).then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    var oTipoVeiculo = aContexts[0].getObject();
                    var oVeiculoInfo = oViewModel.getProperty("/veiculoInfo");
                    
                    // Atualizar informações do veículo com a descrição do tipo
                    oVeiculoInfo.TipoVeiculoDescricao = oTipoVeiculo.Descricao;
                    oVeiculoInfo.PrecoHora = oTipoVeiculo.PrecoHora;
                    oVeiculoInfo.Moeda = oTipoVeiculo.Moeda;
                    
                    oViewModel.setProperty("/veiculoInfo", oVeiculoInfo);
                }
            }).catch(function(oError) {
                console.error("Erro ao carregar descrição do tipo de veículo:", oError);
            });
        },
        
        /**
         * Carrega informações de disponibilidade do parque
         * @private
         */
        _carregarDisponibilidade: function() {
            this.atualizarDisponibilidade();
        },
        
        /**
         * Registra a saída do veículo calculando valores localmente e atualizando o registro
         */
        onRegistrarSaida: function() {
            var oViewModel = this.getView().getModel("viewModel");
            var sMatricula = this.getView().byId("matriculaInput").getValue();
            var bIsMatriculaValida = oViewModel.getProperty("/isMatriculaValida");
            var oMovimentoInfo = oViewModel.getProperty("/movimentoInfo");
            var that = this;
            
            // Validações básicas
            if (!bIsMatriculaValida || !oMovimentoInfo || !oMovimentoInfo.IdMovimento) {
                MessageBox.error(this.getI18nText("veiculoNaoEstacionamento", [sMatricula]));
                return;
            }
            
            // Mostrar mensagem de confirmação
            MessageBox.confirm(
                this.getI18nText("confirmarSaida", [sMatricula]),
                {
                    title: this.getI18nText("confirmacaoSaida"),
                    onClose: function(oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that._calcularERegistrarSaida(oMovimentoInfo);
                        }
                    }
                }
            );
        },
        
        /**
 * Calcula valores da saída e atualiza o registro diretamente
 * @param {object} oMovimentoInfo Dados do movimento
 * @private 
 */
_calcularERegistrarSaida: function(oMovimentoInfo) {
    var oViewModel = this.getView().getModel("viewModel");
    var oODataModel = this.getOwnerComponent().getModel();
    var oVeiculoInfo = oViewModel.getProperty("/veiculoInfo");
    var oClienteInfo = oViewModel.getProperty("/clienteInfo");
    var that = this;
    
    if (!oClienteInfo || !oClienteInfo.IdCliente) {
        // Ensure client info is cleared for non-registered clients
        oViewModel.setProperty("/clienteInfo", {});
    }
    
    
    var oSaidaData = {
       
        isClienteRegistrado: !!(oClienteInfo && oClienteInfo.IdCliente),
        cliente: (oClienteInfo && oClienteInfo.IdCliente) ? 
                 that.getI18nText("clienteRegistrado") : 
                 that.getI18nText("clienteNaoRegistrado"),
        nomeCliente: (oClienteInfo && oClienteInfo.IdCliente) ? oClienteInfo.Nome || "" : "",
       
    };

    // Mostrar indicador de ocupado
    BusyIndicator.show(0);
    
    try {
        // 1. Calcular valores
        // Data de entrada e saída
        var dDataEntrada = new Date(oMovimentoInfo.DataEntrada);
        var dDataSaida = new Date();
        
        // Calcular duração em horas
        var nDuracaoHoras = this._calcularDuracao(dDataEntrada, dDataSaida);
        
        // Obter preço por hora
        var nPrecoHora = oVeiculoInfo.PrecoHora || 2.5;
        var sMoeda = oVeiculoInfo.Moeda || "EUR";
        
        // Calcular valor bruto (preço × horas)
        var nValorBruto = nDuracaoHoras * nPrecoHora;
        
        // Determinar o desconto aplicável com base no tipo de cliente e tipo de veículo
        var nDesconto = 0;
        
        if (oClienteInfo && oClienteInfo.IdCliente) {
            // Cliente registrado, verificar descontos por tipo de veículo
            switch (parseInt(oVeiculoInfo.IdTipoVeiculo)) {
                case 1: // Ligeiro
                    nDesconto = parseFloat(oClienteInfo.DescontoLigeiro) || 10;
                    break;
                case 2: // Motociclo
                    nDesconto = parseFloat(oClienteInfo.DescontoMoto) || 15;
                    break;
                case 3: // Pesado
                    nDesconto = parseFloat(oClienteInfo.DescontoPesado) || 5;
                    break;
                default:
                    nDesconto = 10; // Desconto padrão
            }
            
            console.log("Desconto aplicado:", nDesconto + "% para cliente tipo:", 
                       oClienteInfo.TipoClienteDescricao, "e veículo tipo:", 
                       oVeiculoInfo.TipoVeiculoDescricao);
        }
        
        // Garantir que o desconto está no formato correto (número)
        nDesconto = parseFloat(nDesconto);
        if (nDesconto > 100) nDesconto = 100; // Limitando desconto a 100%
        
        // Calcular valor líquido após desconto
        var nValorLiquido = nValorBruto * (1 - (nDesconto / 100));
        
        // Garantir valores positivos
        nValorLiquido = Math.max(0, nValorLiquido);
        
        // 2. Preparar dados para atualização
        var oUpdateData = {
            Status: "S",
            DataSaida: dDataSaida,
            DuracaoHoras: nDuracaoHoras,
            ValorBruto: nValorBruto,
            Desconto: nDesconto,
            ValorLiquido: nValorLiquido,
            Moeda: sMoeda
        };
        
        console.log("Dados para atualização:", oUpdateData);
        
        // 3. Chamar a ação registrarSaida diretamente
        // Verificar se IdMovimento está disponível
        if (!oMovimentoInfo.IdMovimento) {
            BusyIndicator.hide();
            MessageBox.error(this.getI18nText("erroIdMovimentoInvalido"));
            return;
        }
        
        // Usando abordagem com a action registrarSaida
        var sPath = "/Saida('" + oMovimentoInfo.IdMovimento + "')/registrarSaida";
        console.log("Chamando action em:", sPath);
        
        try {
            // Usando OData V4 para chamar a ação
            var oActionContext = oODataModel.bindContext(sPath);
            
            oActionContext.execute().then(function(oResult) {
                console.log("Ação executada com sucesso:", oResult);
                BusyIndicator.hide();
                
                // Mostrar mensagem de sucesso
                MessageToast.show(that.getI18nText("saidaRegistradaSucesso"));
                
                // Atualizar disponibilidade
                that.atualizarDisponibilidade();
                
                // Preparar dados para a tela de detalhes
                var oSaidaData = {
                    idMovimento: oMovimentoInfo.IdMovimento,
                    matricula: oMovimentoInfo.Matricula,
                    dataEntrada: that._formatarData(dDataEntrada),
                    dataSaida: that._formatarData(dDataSaida),
                    duracaoHoras: nDuracaoHoras.toFixed(2),
                    valorBruto: nValorBruto.toFixed(2),
                    desconto: nDesconto,
                    valorLiquido: nValorLiquido.toFixed(2),
                    moeda: sMoeda,
                    tipoVeiculo: oVeiculoInfo.TipoVeiculoDescricao || that._obterDescricaoTipoVeiculo(oVeiculoInfo.IdTipoVeiculo),
                    isClienteRegistrado: !!oClienteInfo.IdCliente,
                    cliente: !!oClienteInfo.IdCliente ? that.getI18nText("clienteRegistrado") : that.getI18nText("clienteNaoRegistrado"),
                    nomeCliente: oClienteInfo.Nome || "",
                    nif: oClienteInfo.Nif || "",
                    veiculo: !!oClienteInfo.IdCliente && oVeiculoInfo ? (oVeiculoInfo.Marca + " " + oVeiculoInfo.Modelo) : "",
                    status: "S"
                };
                
                // Mostrar detalhes da saída
                that._mostrarDetalhesSaida(oSaidaData);
            }).catch(function(oError) {
                console.error("Erro ao executar ação registrarSaida:", oError);
                
                // Tentar o método de atualização direta
                that._atualizarRegistroManualmente(oMovimentoInfo, oUpdateData);
            });
        } catch (oError) {
            console.error("Erro ao chamar ação registrarSaida:", oError);
            
            // Tentar o método de atualização direta
            that._atualizarRegistroManualmente(oMovimentoInfo, oUpdateData);
        }
    } catch (oError) {
        // Erro inesperado
        BusyIndicator.hide();
        console.error("Erro ao calcular ou registrar saída:", oError);
        
        // Simular localmente como fallback
        that._simularSaidaLocal(oMovimentoInfo);
    }
},

/**
 * Tenta atualizar o registro manualmente sem usar a action
 * @param {object} oMovimentoInfo Informações do movimento
 * @param {object} oUpdateData Dados para atualização
 * @private
 */
_atualizarRegistroManualmente: function(oMovimentoInfo, oUpdateData) {
    var that = this;
    var oViewModel = this.getView().getModel("viewModel");
    var oODataModel = this.getOwnerComponent().getModel();
    var oVeiculoInfo = oViewModel.getProperty("/veiculoInfo");
    var oClienteInfo = oViewModel.getProperty("/clienteInfo");
    
    try {
        // Tentar usar apenas IdMovimento como chave
        var sPath = "/Saida('" + oMovimentoInfo.IdMovimento + "')";
        console.log("Tentando atualizar com chave simples:", sPath);
        
        // Para OData V4
        var oContext = oODataModel.bindContext(sPath);
        
        // Carregar primeiro o objeto para garantir que existe
        oContext.requestObject().then(function(oData) {
            if (!oData) {
                throw new Error("Registro não encontrado");
            }
            
            console.log("Registro encontrado:", oData);
            
            // Aplicar as alterações
            Object.keys(oUpdateData).forEach(function(sKey) {
                oContext.setProperty(sKey, oUpdateData[sKey]);
            });
            
            // Submeter as alterações
            return oODataModel.submitBatch();
        }).then(function() {
            console.log("Registro atualizado com sucesso via PATCH");
            BusyIndicator.hide();
            
            // Mostrar mensagem de sucesso
            MessageToast.show(that.getI18nText("saidaRegistradaSucesso"));
            
            // Atualizar disponibilidade
            that.atualizarDisponibilidade();
            
            // Preparar dados para a tela de detalhes
            var dDataEntrada = new Date(oMovimentoInfo.DataEntrada);
            var dDataSaida = new Date();
            
            var oSaidaData = {
                idMovimento: oMovimentoInfo.IdMovimento,
                matricula: oMovimentoInfo.Matricula,
                dataEntrada: that._formatarData(dDataEntrada),
                dataSaida: that._formatarData(dDataSaida),
                duracaoHoras: oUpdateData.DuracaoHoras.toFixed(2),
                valorBruto: oUpdateData.ValorBruto.toFixed(2),
                desconto: oUpdateData.Desconto,
                valorLiquido: oUpdateData.ValorLiquido.toFixed(2),
                moeda: oUpdateData.Moeda,
                tipoVeiculo: oVeiculoInfo.TipoVeiculoDescricao || that._obterDescricaoTipoVeiculo(oVeiculoInfo.IdTipoVeiculo),
                isClienteRegistrado: !!oClienteInfo.IdCliente,
                cliente: !!oClienteInfo.IdCliente ? that.getI18nText("clienteRegistrado") : that.getI18nText("clienteNaoRegistrado"),
                nomeCliente: oClienteInfo.Nome || "",
                nif: oClienteInfo.Nif || "",
                veiculo: !!oClienteInfo.IdCliente && oVeiculoInfo ? (oVeiculoInfo.Marca + " " + oVeiculoInfo.Modelo) : "",
                status: "S"
            };
            
            // Mostrar detalhes da saída
            that._mostrarDetalhesSaida(oSaidaData);
        }).catch(function(oError) {
            console.error("Erro ao atualizar manualmente:", oError);
            
            // Tentar com abordagem jQuery AJAX como último recurso antes da simulação
            that._tentarAtualizacaoComAjax(oMovimentoInfo, oUpdateData);
        });
    } catch (oError) {
        console.error("Erro ao tentar atualização manual:", oError);
        
        // Tentar com abordagem jQuery AJAX como último recurso
        that._tentarAtualizacaoComAjax(oMovimentoInfo, oUpdateData);
    }
},

/**
 * Tenta atualizar o registro usando jQuery AJAX
 * @param {object} oMovimentoInfo Informações do movimento
 * @param {object} oUpdateData Dados para atualização
 * @private
 */
_tentarAtualizacaoComAjax: function(oMovimentoInfo, oUpdateData) {
    var that = this;
    var oViewModel = this.getView().getModel("viewModel");
    var oVeiculoInfo = oViewModel.getProperty("/veiculoInfo");
    var oClienteInfo = oViewModel.getProperty("/clienteInfo");
    
    try {
        // Obter URL base do serviço
        var sServiceUrl = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri");
        if (!sServiceUrl) {
            throw new Error("URL de serviço não encontrada no manifesto");
        }
        
        // Remover barra final se existir
        if (sServiceUrl.endsWith("/")) {
            sServiceUrl = sServiceUrl.slice(0, -1);
        }
        
        // URL para o registro
        var sEntityUrl = sServiceUrl + "/Saida('" + oMovimentoInfo.IdMovimento + "')";
        console.log("Tentando atualizar via AJAX:", sEntityUrl);
        
        // Tentar obter token CSRF
        jQuery.ajax({
            url: sServiceUrl,
            type: "GET",
            headers: {
                "X-CSRF-Token": "Fetch"
            },
            success: function(data, textStatus, jqXHR) {
                var sCsrfToken = jqXHR.getResponseHeader("X-CSRF-Token");
                
                // Agora fazer a atualização com PATCH
                jQuery.ajax({
                    url: sEntityUrl,
                    type: "PATCH",
                    headers: {
                        "X-CSRF-Token": sCsrfToken,
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(oUpdateData),
                    success: function() {
                        console.log("Registro atualizado com sucesso via AJAX");
                        BusyIndicator.hide();
                        
                        // Mostrar mensagem de sucesso
                        MessageToast.show(that.getI18nText("saidaRegistradaSucesso"));
                        
                        // Atualizar disponibilidade
                        that.atualizarDisponibilidade();
                        
                        // Preparar dados para a tela de detalhes
                        var dDataEntrada = new Date(oMovimentoInfo.DataEntrada);
                        var dDataSaida = new Date();
                        
                        var oSaidaData = {
                            idMovimento: oMovimentoInfo.IdMovimento,
                            matricula: oMovimentoInfo.Matricula,
                            dataEntrada: that._formatarData(dDataEntrada),
                            dataSaida: that._formatarData(dDataSaida),
                            duracaoHoras: oUpdateData.DuracaoHoras.toFixed(2),
                            valorBruto: oUpdateData.ValorBruto.toFixed(2),
                            desconto: oUpdateData.Desconto,
                            valorLiquido: oUpdateData.ValorLiquido.toFixed(2),
                            moeda: oUpdateData.Moeda,
                            tipoVeiculo: oVeiculoInfo.TipoVeiculoDescricao || that._obterDescricaoTipoVeiculo(oVeiculoInfo.IdTipoVeiculo),
                            isClienteRegistrado: !!oClienteInfo.IdCliente,
                            cliente: !!oClienteInfo.IdCliente ? that.getI18nText("clienteRegistrado") : that.getI18nText("clienteNaoRegistrado"),
                            nomeCliente: oClienteInfo.Nome || "",
                            nif: oClienteInfo.Nif || "",
                            veiculo: !!oClienteInfo.IdCliente && oVeiculoInfo ? (oVeiculoInfo.Marca + " " + oVeiculoInfo.Modelo) : "",
                            status: "S"
                        };
                        
                        // Mostrar detalhes da saída
                        that._mostrarDetalhesSaida(oSaidaData);
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.error("Erro ao atualizar via AJAX:", textStatus, errorThrown);
                        BusyIndicator.hide();
                        
                        // Último recurso: simular localmente
                        that._simularSaidaLocal(oMovimentoInfo);
                    }
                });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("Erro ao obter token CSRF:", textStatus, errorThrown);
                BusyIndicator.hide();
                
                // Último recurso: simular localmente
                that._simularSaidaLocal(oMovimentoInfo);
            }
        });
    } catch (oError) {
        console.error("Erro na tentativa de atualização com AJAX:", oError);
        BusyIndicator.hide();
        
        // Último recurso: simular localmente
        that._simularSaidaLocal(oMovimentoInfo);
    }
},
        
        /**
         * Simula a saída localmente como último recurso quando todas as tentativas de atualização falharem
         * @param {object} oMovimentoInfo Informações do movimento
         * @private
         */
        _simularSaidaLocal: function(oMovimentoInfo) {
            console.log("Simulando saída localmente...");
            BusyIndicator.hide();
            
            var oViewModel = this.getView().getModel("viewModel");
            var oVeiculoInfo = oViewModel.getProperty("/veiculoInfo");
            var oClienteInfo = oViewModel.getProperty("/clienteInfo");
            
            // Calcular duração
            var dDataEntrada = new Date(oMovimentoInfo.DataEntrada);
            var dDataSaida = new Date();
            var nDuracaoHoras = this._calcularDuracao(dDataEntrada, dDataSaida);
            
            // Calcular valor
            var nPrecoHora = oVeiculoInfo.PrecoHora || 2.5;
            var nValorBruto = nDuracaoHoras * nPrecoHora;
            
            // Determinar o desconto aplicável
            var nDesconto = 0;
            if (oClienteInfo && oClienteInfo.IdCliente) {
                // Cliente registrado, verificar descontos por tipo de veículo
                switch (oVeiculoInfo.IdTipoVeiculo) {
                    case 1: // Ligeiro
                        nDesconto = oClienteInfo.DescontoLigeiro || 10;
                        break;
                    case 2: // Motociclo
                        nDesconto = oClienteInfo.DescontoMoto || 15;
                        break;
                    case 3: // Pesado
                        nDesconto = oClienteInfo.DescontoPesado || 5;
                        break;
                    default:
                        nDesconto = 10; // Desconto padrão
                }
            }
            
            var nValorLiquido = nValorBruto * (1 - (nDesconto / 100));
            
            // Preparar dados da saída
            var oSaidaData = {
                idMovimento: oMovimentoInfo.IdMovimento,
                matricula: oMovimentoInfo.Matricula,
                dataEntrada: this._formatarData(dDataEntrada),
                dataSaida: this._formatarData(dDataSaida),
                duracaoHoras: nDuracaoHoras.toFixed(2),
                valorBruto: nValorBruto.toFixed(2),
                desconto: nDesconto,
                valorLiquido: nValorLiquido.toFixed(2),
                moeda: oVeiculoInfo.Moeda || "EUR",
                status: "S",
                simulado: true,
                tipoVeiculo: oVeiculoInfo.TipoVeiculoDescricao || this._obterDescricaoTipoVeiculo(oVeiculoInfo.IdTipoVeiculo),
                isClienteRegistrado: !!oClienteInfo.IdCliente,
                cliente: !!oClienteInfo.IdCliente ? this.getI18nText("clienteRegistrado") : this.getI18nText("clienteNaoRegistrado"),
                nomeCliente: oClienteInfo.Nome || "",
                nif: oClienteInfo.Nif || "",
                veiculo: !!oClienteInfo.IdCliente && oVeiculoInfo ? (oVeiculoInfo.Marca + " " + oVeiculoInfo.Modelo) : ""
            };
            
            // Mostrar mensagem informativa
            MessageToast.show(this.getI18nText("saidaSimuladaLocalmente"));
            
            // Mostrar detalhes da saída simulada
            this._mostrarDetalhesSaida(oSaidaData);
        },
        
        /**
         * Calcula a duração do estacionamento em horas
         * @param {Date|string} dataEntrada Data de entrada
         * @param {Date|string} dataSaida Data de saída
         * @returns {number} Duração em horas
         * @private
         */
        _calcularDuracao: function(dataEntrada, dataSaida) {
            var dEntrada = new Date(dataEntrada);
            var dSaida = new Date(dataSaida);
            var nDiffMs = dSaida.getTime() - dEntrada.getTime();
            var nDiffHours = nDiffMs / (1000 * 60 * 60);
            
            // Arredondar para 2 casas decimais e garantir mínimo de 15 minutos (0.25h)
            return Math.max(0.25, Math.round(nDiffHours * 100) / 100);
        },
        
        /**
         * Calcula o valor bruto do estacionamento
         * @param {Date|string} dataEntrada Data de entrada
         * @param {Date|string} dataSaida Data de saída
         * @param {number} precoHora Preço por hora
         * @returns {number} Valor bruto
         * @private
         */
        _calcularValorBruto: function(dataEntrada, dataSaida, precoHora) {
            var nDuracao = this._calcularDuracao(dataEntrada, dataSaida);
            var nPrecoBase = precoHora || 2.5; // Preço padrão se não especificado
            return Math.round(nDuracao * nPrecoBase * 100) / 100;
        },
        
        /**
         * Obtém a descrição do tipo de veículo pelo ID
         * @param {string|number} idTipoVeiculo ID do tipo de veículo
         * @returns {string} Descrição do tipo de veículo
         * @private
         */
        _obterDescricaoTipoVeiculo: function(idTipoVeiculo) {
            switch (parseInt(idTipoVeiculo)) {
                case 1: return this.getI18nText("tipoVeiculoLigeiro");
                case 2: return this.getI18nText("tipoVeiculoMotociclo");
                case 3: return this.getI18nText("tipoVeiculoPesado");
                default: return this.getI18nText("tipoVeiculoDesconhecido");
            }
        },
        
        /**
         * Exibe os detalhes da saída registrada
         * @param {object} oData Dados da saída
         * @private
         */
        _mostrarDetalhesSaida: function(oData) {
            var oViewModel = this.getView().getModel("viewModel");
            
            // Atualizar o modelo com os dados da saída
            oViewModel.setProperty("/dadosSaida", oData);
            oViewModel.setProperty("/mostrarDadosSaida", true);
            
            // Mostrar mensagem de sucesso
            this.getView().byId("messageStrip").setText(this.getI18nText("saidaRegistradaSucesso"));
            this.getView().byId("messageStrip").setType("Success");
            this.getView().byId("messageStrip").setVisible(true);
            
            // Compartilhar dados entre telas via model
            var oComponent = this.getOwnerComponent();
            if (!oComponent.getModel("sharedData")) {
                oComponent.setModel(new JSONModel({}), "sharedData");
            }
            
            oComponent.getModel("sharedData").setData(oData);
            
            // Navegar para a tela de detalhes
            this.getRouter().navTo("RouteSaidaDetails", {
                idMovimento: oData.idMovimento,
                matricula: oData.matricula,
                registrado: oData.isClienteRegistrado ? "true" : "false"
            }, false);
        }
    }
)});