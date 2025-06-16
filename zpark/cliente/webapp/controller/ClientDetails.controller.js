sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "cliente/model/formatter",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, BusyIndicator, MessageBox, Filter, FilterOperator, formatter, History, MessageToast) {
    "use strict";
    
    return BaseController.extend("cliente.controller.ClientDetails", {
        formatter: formatter,
        
        onInit: function () {
            // Initialize models
            var oClienteModel = new JSONModel();
            this.setModel(oClienteModel, "clienteModel");
            
            var oMovimentosModel = new JSONModel();
            this.setModel(oMovimentosModel, "movimentosModel");
            
            // Model for vehicle types
            var oTiposVeiculoModel = new JSONModel({
                tipos: []
            });
            this.setModel(oTiposVeiculoModel, "tiposVeiculoModel");
            
            // Modelo para filtros
            var oFilterModel = new JSONModel({
                vehicleSearchTerm: "",
                movementSearchTerm: "",
                movementFilterKey: "all"
            });
            this.setModel(oFilterModel, "filterModel");
            
            // Modelo para armazenar dados originais para filtros
            var oOriginalDataModel = new JSONModel({
                movimentos: []
            });
            this.setModel(oOriginalDataModel, "originalDataModel");
            
            // Load vehicle types immediately
            this.carregarTiposVeiculo();
            
            // Configure router
            this.getRouter().getRoute("RouteClientDetails").attachPatternMatched(this.onRouteMatched, this);
        },
        
        onRouteMatched: function (oEvent) {
            var oView = this.getView();
            var sNif = oEvent.getParameter("arguments").nif;
            
            // Reiniciar visualização se o NIF for diferente
            if (this.sNif !== sNif) {
                oView.setBusy(true);
                this.sNif = sNif;
                
                // Limpar filtros ao carregar novo cliente
                var oFilterModel = this.getModel("filterModel");
                oFilterModel.setProperty("/vehicleSearchTerm", "");
                oFilterModel.setProperty("/movementSearchTerm", "");
                oFilterModel.setProperty("/movementFilterKey", "all");
                
                // Carregar dados do cliente
                this.carregarDadosCliente(sNif);
            }
        },
        
        carregarTiposVeiculo: function() {
            var that = this;
            var oModel = this.getOwnerComponent().getModel();
            
            // Verificar se o modelo está disponível
            if (!oModel) {
                console.error("Modelo principal não está disponível");
                return;
            }
            
            // Preparar URL para buscar tipos de veículos
            var sServiceUrl = oModel.sServiceUrl || "";
            if (sServiceUrl.endsWith("/")) {
                sServiceUrl = sServiceUrl.slice(0, -1); // Remove a barra final se existir
            }
            var sUrl = sServiceUrl + "/TipoVeiculo";
            
            // Buscar tipos de veículos via AJAX
            jQuery.ajax({
                url: sUrl,
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function(oData) {
                    if (oData && oData.value) {
                        // Atualizar modelo com tipos de veículos
                        that.getModel("tiposVeiculoModel").setProperty("/tipos", oData.value);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("Erro ao carregar tipos de veículos:", jqXHR.status, errorThrown);
                }
            });
        },
        
        obterDescricaoTipoVeiculo: function(idTipoVeiculo) {
            if (!idTipoVeiculo) {
                return "-";
            }
            
            var oTiposModel = this.getModel("tiposVeiculoModel");
            if (!oTiposModel) {
                console.error("Tipos Veiculo Model não encontrado");
                return "-";
            }
            
            var aTipos = oTiposModel.getProperty("/tipos");
            
            var oTipo = aTipos.find(function(item) {
                return item.IdTipo == idTipoVeiculo;
            });
            
            return oTipo ? oTipo.Descricao : "-";
        },
        
        carregarDadosCliente: function(sNif) {
            var that = this;
            var oModel = this.getOwnerComponent().getModel();
            
            // Verificar se o modelo está disponível
            if (!oModel) {
                that.getView().setBusy(false);
                MessageBox.error(that.getI18nText("modelNotAvailable"), {
                    onClose: that.onPressBack.bind(that)
                });
                return;
            }
            
            // Prepare URL to fetch client by NIF
            var sServiceUrl = oModel.sServiceUrl || "";
            if (sServiceUrl.endsWith("/")) {
                sServiceUrl = sServiceUrl.slice(0, -1); // Remove a barra final se existir
            }
            var sFilter = "Nif eq '" + sNif + "'";
            var sUrl = sServiceUrl + "/ClientePortal?$filter=" + encodeURIComponent(sFilter) + "&$expand=_Veiculos";
            
            console.log("Client Details URL:", sUrl);
            
            // Fetch client via AJAX
            jQuery.ajax({
                url: sUrl,
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function(oData) {
                    console.log("Client Data Response:", oData);
                    
                    if (oData && oData.value && oData.value.length > 0) {
                        // Client found
                        var oCliente = oData.value[0];
                        
                        // Processar dados de veículos para exibição
                        if (oCliente._Veiculos && Array.isArray(oCliente._Veiculos)) {
                            oCliente._Veiculos.forEach(function(oVeiculo) {
                                // Adicionar descrição do tipo de veículo se não existir
                                if (!oVeiculo.TipoVeiculoDesc && oVeiculo.IdTipoVeiculo) {
                                    var oTiposModel = that.getModel("tiposVeiculoModel");
                                    var aTipos = oTiposModel.getProperty("/tipos");
                                    var oTipo = aTipos.find(function(item) {
                                        return item.IdTipo == oVeiculo.IdTipoVeiculo;
                                    });
                                    oVeiculo.TipoVeiculoDesc = oTipo ? oTipo.Descricao : "-";
                                }
                            });
                        }
                        
                        // Update model with client data
                        that.getModel("clienteModel").setData(oCliente);
                        
                        // Load client movements
                        that.carregarMovimentos(oCliente.IdCliente);
                    } else {
                        // Client not found
                        that.getView().setBusy(false);
                        MessageBox.error(that.getI18nText("clientNotFound", [sNif]), {
                            onClose: that.onPressBack.bind(that)
                        });
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    that.getView().setBusy(false);
                    console.error("Error loading client:", jqXHR.status, errorThrown);
                    console.error("Response text:", jqXHR.responseText);
                    
                    MessageBox.error(that.getI18nText("errorLoadingClient", [errorThrown || textStatus]), {
                        onClose: that.onPressBack.bind(that)
                    });
                }
            });
        },
        
        carregarMovimentos: function(sClienteId) {
            var that = this;
            var oModel = this.getOwnerComponent().getModel();
            
            // Check if there's a valid client ID
            if (!sClienteId) {
                that.getView().setBusy(false);
                that.getModel("movimentosModel").setData([]);
                return;
            }
            
            // Verificar se o modelo está disponível
            if (!oModel) {
                that.getView().setBusy(false);
                that.getModel("movimentosModel").setData([]);
                console.error("Modelo principal não está disponível para carregamento de movimentos");
                return;
            }
            
            // Preparar URL para buscar movimentos do cliente
            var sServiceUrl = oModel.sServiceUrl || "";
            if (sServiceUrl.endsWith("/")) {
                sServiceUrl = sServiceUrl.slice(0, -1); // Remove a barra final se existir
            }
            
            // Usando a entidade correta com base na definição do seu serviço
            var sPath = "MovimentoCliente";
            
            // Buscar por matrículas dos veículos do cliente em vez de IdCliente
            var aVeiculos = that.getModel("clienteModel").getProperty("/_Veiculos") || [];
            var aMatriculas = [];
            
            if (aVeiculos.length > 0) {
                // Coletar matrículas dos veículos do cliente
                aMatriculas = aVeiculos.map(function(oVeiculo) {
                    return oVeiculo.Matricula;
                }).filter(function(sMatricula) {
                    return !!sMatricula; // Filtrar valores vazios
                });
            }
            
            var sFilter;
            
            if (aMatriculas.length > 0) {
                // Construir filtro baseado nas matrículas dos veículos
                if (aMatriculas.length === 1) {
                    sFilter = "Matricula eq '" + aMatriculas[0] + "'";
                } else {
                    // Para múltiplas matrículas, usar múltiplos filtros com 'or'
                    sFilter = aMatriculas.map(function(sMatricula) {
                        return "Matricula eq '" + sMatricula + "'";
                    }).join(" or ");
                }
            } else {
                // Fallback para filtro por IdCliente se não houver matrículas
                // Tentar os dois formatos possíveis (com e sem aspas)
                sFilter = "(IdCliente eq " + sClienteId + " or IdCliente eq '" + sClienteId + "')";
            }
            
            var sUrl = sServiceUrl + "/" + sPath + "?$filter=" + encodeURIComponent(sFilter);
            
            console.log("Movement URL:", sUrl);
            
            // Fetch movements via AJAX
            jQuery.ajax({
                url: sUrl,
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function(oData) {
                    that.getView().setBusy(false);
                    
                    if (oData && oData.value) {
                        // Update model with movements
                        console.log("Movimentos carregados com sucesso:", oData.value.length);
                        that.getModel("movimentosModel").setData(oData.value);
                        
                        // Armazenar dados originais para uso com filtros
                        that.getModel("originalDataModel").setProperty("/movimentos", oData.value);
                    } else {
                        // No movements
                        console.log("Nenhum movimento encontrado.");
                        that.getModel("movimentosModel").setData([]);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("Erro ao carregar movimentos:", jqXHR.status, errorThrown);
                    console.error("Resposta:", jqXHR.responseText);
                    
                    // Tentar abordagem alternativa para todos os tipos de erro
                    that.carregarMovimentosAlternativo(sClienteId);
                }
            });
        },
        
        carregarMovimentosAlternativo: function(sClienteId) {
            var that = this;
            var oModel = this.getOwnerComponent().getModel();
            
            if (!oModel) {
                that.getView().setBusy(false);
                that.getModel("movimentosModel").setData([]);
                return;
            }
            
            var sServiceUrl = oModel.sServiceUrl || "";
            if (sServiceUrl.endsWith("/")) {
                sServiceUrl = sServiceUrl.slice(0, -1); // Remove a barra final se existir
            }
            
            // Tentar uma abordagem diferente - buscar por matrículas específicas
            var aVeiculos = that.getModel("clienteModel").getProperty("/_Veiculos") || [];
            
            if (aVeiculos.length > 0) {
                // Abordagem 1: Buscar movimentos para cada matrícula individualmente e combinar resultados
                var aPromises = [];
                var aAllMovimentos = [];
                
                console.log("Tentando abordagem alternativa por matrículas individuais...");
                
                // Para cada veículo, buscar os movimentos associados
                aVeiculos.forEach(function(oVeiculo) {
                    if (oVeiculo.Matricula) {
                        var sMatricula = oVeiculo.Matricula;
                        var sUrl = sServiceUrl + "/MovimentoCliente?$filter=Matricula eq '" + encodeURIComponent(sMatricula) + "'";
                        
                        var oPromise = new Promise(function(resolve) {
                            jQuery.ajax({
                                url: sUrl,
                                method: "GET",
                                headers: {
                                    "Accept": "application/json"
                                },
                                success: function(oData) {
                                    if (oData && oData.value) {
                                        resolve(oData.value);
                                    } else {
                                        resolve([]);
                                    }
                                },
                                error: function() {
                                    resolve([]);
                                }
                            });
                        });
                        
                        aPromises.push(oPromise);
                    }
                });
                
                // Processar todas as promessas
                Promise.all(aPromises).then(function(aResults) {
                    that.getView().setBusy(false);
                    
                    // Combinar todos os resultados
                    aResults.forEach(function(aMovimentos) {
                        aAllMovimentos = aAllMovimentos.concat(aMovimentos);
                    });
                    
                    console.log("Movimentos encontrados (método alternativo por matrículas):", aAllMovimentos.length);
                    
                    // Atualizar modelo
                    that.getModel("movimentosModel").setData(aAllMovimentos);
                    
                    // Armazenar dados originais para uso com filtros
                    that.getModel("originalDataModel").setProperty("/movimentos", aAllMovimentos);
                });
                
                return;
            }
            
            // Abordagem 2: Se não houver veículos, tente buscar todos os movimentos e filtrar localmente
            console.log("Tentando abordagem alternativa: buscar todos os movimentos...");
            var sUrl = sServiceUrl + "/MovimentoCliente";
            
            jQuery.ajax({
                url: sUrl,
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function(oData) {
                    that.getView().setBusy(false);
                    
                    if (oData && oData.value) {
                        // Filtrar os movimentos do cliente localmente - procurar por IdCliente ou qualquer propriedade relacionada
                        var aMovimentosCliente = oData.value.filter(function(oMovimento) {
                            // Tentar diferentes propriedades que possam identificar o cliente
                            if (String(oMovimento.IdCliente) === String(sClienteId)) {
                                return true;
                            }
                            
                            // Verificar se a matrícula corresponde a algum dos veículos do cliente
                            var aVeiculos = that.getModel("clienteModel").getProperty("/_Veiculos") || [];
                            return aVeiculos.some(function(oVeiculo) {
                                return oVeiculo.Matricula === oMovimento.Matricula;
                            });
                        });
                        
                        console.log("Movimentos filtrados localmente:", aMovimentosCliente.length);
                        
                        // Atualizar modelo
                        that.getModel("movimentosModel").setData(aMovimentosCliente);
                        
                        // Armazenar dados originais para uso com filtros
                        that.getModel("originalDataModel").setProperty("/movimentos", aMovimentosCliente);
                    } else {
                        console.log("Nenhum movimento encontrado (método alternativo).");
                        that.getModel("movimentosModel").setData([]);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    that.getView().setBusy(false);
                    console.error("Erro na abordagem alternativa:", jqXHR.status, errorThrown);
                    console.error("Resposta:", jqXHR.responseText);
                    that.getModel("movimentosModel").setData([]);
                    
                    // Exibir mensagem informativa sobre o problema
                    MessageToast.show(that.getI18nText("movementsLoadError"));
                }
            });
        },
        
        /**
         * Manipula o evento de pesquisa na tabela de veículos
         * @param {sap.ui.base.Event} oEvent Evento de pesquisa
         */
        onFilterVehicles: function(oEvent) {
            var sQuery = oEvent.getParameter("query") || "";
            this.getModel("filterModel").setProperty("/vehicleSearchTerm", sQuery);
            
            var oTable = this.getView().byId("vehiclesTable");
            var oBinding = oTable.getBinding("items");
            
            if (!oBinding) {
                return;
            }
            
            var aFilters = [];
            
            if (sQuery) {
                // Combinar vários filtros com OR
                aFilters.push(new Filter({
                    filters: [
                        new Filter("Matricula", FilterOperator.Contains, sQuery),
                        new Filter("Marca", FilterOperator.Contains, sQuery),
                        new Filter("Modelo", FilterOperator.Contains, sQuery),
                        new Filter("TipoVeiculoDesc", FilterOperator.Contains, sQuery)
                    ],
                    and: false // OR operation
                }));
            }
            
            oBinding.filter(aFilters);
        },
        
        /**
         * Manipula o evento de pesquisa na tabela de movimentos
         * @param {sap.ui.base.Event} oEvent Evento de pesquisa
         */
        onSearchMovements: function(oEvent) {
            var sQuery = oEvent.getParameter("query") || "";
            this.getModel("filterModel").setProperty("/movementSearchTerm", sQuery);
            
            this._applyMovementsFilter();
        },
        
        /**
         * Manipula o evento de mudança de seleção no controle SegmentedButton
         * @param {sap.ui.base.Event} oEvent Evento de mudança de seleção
         */
        onFilterMovements: function(oEvent) {
            var sKey = oEvent.getParameter("item").getKey() || "all";
            this.getModel("filterModel").setProperty("/movementFilterKey", sKey);
            
            this._applyMovementsFilter();
        },
        
        /**
         * Aplica os filtros aos movimentos com base nos critérios selecionados
         * @private
         */
        _applyMovementsFilter: function() {
            var oFilterModel = this.getModel("filterModel");
            var sSearchTerm = oFilterModel.getProperty("/movementSearchTerm") || "";
            var sFilterKey = oFilterModel.getProperty("/movementFilterKey") || "all";
            
            var aOriginalMovimentos = this.getModel("originalDataModel").getProperty("/movimentos") || [];
            var aFilteredMovimentos = [];
            
            // Primeiro aplicar filtro de status
            if (sFilterKey === "all") {
                aFilteredMovimentos = aOriginalMovimentos.slice();
            } else if (sFilterKey === "active") {
                aFilteredMovimentos = aOriginalMovimentos.filter(function(oMovimento) {
                    // Considerar ativos os que têm status A, 1, ou não tem data de saída
                    return oMovimento.Status === "A" || 
                           oMovimento.Status === "1" || 
                           !oMovimento.DataSaida;
                });
            } else if (sFilterKey === "completed") {
                aFilteredMovimentos = aOriginalMovimentos.filter(function(oMovimento) {
                    // Considerar concluídos os que têm status C, F, 2, 3 ou tem data de saída
                    return oMovimento.Status === "C" || 
                           oMovimento.Status === "F" || 
                           oMovimento.Status === "2" || 
                           oMovimento.Status === "3" || 
                           !!oMovimento.DataSaida;
                });
            }
            
            // Depois aplicar filtro de busca textual
            if (sSearchTerm) {
                var sSearchTermLower = sSearchTerm.toLowerCase();
                aFilteredMovimentos = aFilteredMovimentos.filter(function(oMovimento) {
                    // Buscar em diversos campos
                    return (oMovimento.Matricula && oMovimento.Matricula.toLowerCase().indexOf(sSearchTermLower) !== -1) ||
                           (oMovimento.ValorLiquido && oMovimento.ValorLiquido.toString().indexOf(sSearchTermLower) !== -1);
                });
            }
            
            // Atualizar modelo
            this.getModel("movimentosModel").setData(aFilteredMovimentos);
        },
        
        onPressBack: function() {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("RouteView1");
            }
        },
        
        onPressRefresh: function() {
            this.getView().setBusy(true);
            this.carregarDadosCliente(this.sNif);
        }
    });
});