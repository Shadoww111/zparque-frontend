# zparque-frontend 🚘💻

Este repositório contém a parte **frontend** do projeto **ZParque**, desenvolvido com **SAP Fiori** para fornecer uma interface moderna e intuitiva de gestão de parque de estacionamento.

## 📌 Descrição do Projeto

O frontend oferece um conjunto de aplicações Fiori que interagem com o backend (ABAP), permitindo o controlo total do parque de estacionamento, desde a entrada e saída de viaturas até à gestão de clientes e faturação.

## 📱 Aplicações Desenvolvidas

### 🎫 Entrada de Viatura
- Registo de entrada
- Verificação de cliente/não cliente
- Alocação automática do lugar conforme tipo de viatura

### 🚪 Saída de Viatura
- Cálculo do custo de estadia
- Aplicação de descontos por tipo de cliente e veículo
- (Bónus) Geração de fatura em PDF

### 👤 Gestão de Clientes
- Adição, edição e remoção de clientes
- Gestão dos veículos associados a cada cliente

### 🚗 Gestão de Tipos de Veículo
- Ligeiro, Motociclo, Pesado

### 🅿️ Listagem da Ocupação do Parque
- Exibição da ocupação atual dos lugares
- (Bónus) Mapa visual do parque com lugares ocupados/livres

### 📊 Listagem de Faturação (Backoffice)
- Consulta de pagamentos e consumos
- Agrupamento por períodos

### 👥 Aplicação Cliente
- Consulta de consumos pessoais
- Gestão dos seus próprios veículos

### 🔌 (Bónus) Gestão de Lugares com Carregador Elétrico
- Custo diferenciado com base no consumo de energia

## ⚙️ Tecnologias Utilizadas

- **SAP Fiori** Launchpad
- **UI5 Framework**
- Comunicação via OData com backend ABAP
- Integração modular com múltiplas apps

## 🚀 Requisitos

- Acesso ao Launchpad Fiori configurado
- Backend ABAP disponível (ver [zparque-backend](https://github.com/Shadoww111/zparque-backend))

## 🔧 Instalação e Configuração

1. Importa as aplicações no SAP Web IDE ou BAS (Business Application Studio)
2. Configura os destinos OData para ligar ao backend
3. Regista as apps no Fiori Launchpad
4. Garante que as permissões estão atribuídas conforme o perfil de utilizador

## 📄 Licença

Este projeto foi desenvolvido no contexto de estágio e destina-se a fins educativos e demonstrativos.

---

