# Open Finance (Pluggy) — Guia de Integração

## Visão Geral

Integração do Open Finance Brasil via **Pluggy** no Monex Mobile.  
**Modo READ-ONLY**: apenas leitura de dados bancários (saldos, transações, cartões, dívidas).

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│  Mobile App (React Native / Expo)               │
│  ├── OpenFinanceContext (estado global)          │
│  ├── pluggyService.js → chama Edge Functions    │
│  └── Telas: Bancos, Contas, Cartões, Transações │
└────────────────────┬────────────────────────────┘
                     │ HTTPS (JWT auth)
┌────────────────────▼────────────────────────────┐
│  Supabase Edge Function: pluggy-proxy           │
│  ├── Autentica com Pluggy API (server-only)     │
│  ├── Busca dados: contas, transações, cartões   │
│  └── Salva no Supabase (PostgreSQL + RLS)       │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  Pluggy API (api.pluggy.ai)                     │
│  ├── Connect Widget (autenticação bancária)     │
│  ├── /accounts, /transactions, /loans           │
│  └── Dados de 400+ instituições financeiras     │
└─────────────────────────────────────────────────┘
```

## Segurança

- **Credenciais do Pluggy** (`CLIENT_ID`, `CLIENT_SECRET`) ficam APENAS no backend (Supabase Secrets)
- **RLS ativo** em todas as tabelas — cada usuário vê apenas seus dados
- **JWT validation** em todas as chamadas à Edge Function
- **WebView isolada** para o Pluggy Connect Widget
- **Modo leitura** — nenhuma operação de escrita no banco do usuário
- **Criptografia** TLS em todas as conexões

## Estrutura de Arquivos

```
packages/shared/src/
  services/pluggyService.js     # Client-side: chama Edge Functions
  utils/openFinanceHelpers.js   # Formatação, cores de bancos, categorias

apps/mobile/
  src/
    contexts/OpenFinanceContext.jsx  # Estado global + cache offline
    components/OpenFinanceUI.jsx     # Componentes reutilizáveis

  app/
    (tabs)/open-finance.jsx          # Tab "Bancos" (visão geral)
    open-finance/
      _layout.jsx                    # Stack navigator
      connect.jsx                    # WebView do Pluggy Connect
      accounts.jsx                   # Lista de contas por banco
      account-detail.jsx             # Detalhe + transações de conta
      credit-cards.jsx               # Lista de cartões de crédito
      card-detail.jsx                # Detalhe + faturas do cartão
      transactions.jsx               # Todas as transações com filtros

supabase/
  functions/pluggy-proxy/index.ts    # Edge Function (backend)
  migrations/20260301_*.sql          # Schema do banco de dados
```

## Configuração

### 1. Pluggy Dashboard
1. Acesse https://dashboard.pluggy.ai
2. Crie uma aplicação
3. Obtenha `CLIENT_ID` e `CLIENT_SECRET`
4. Configure o webhook URL (opcional)

### 2. Supabase Secrets
```bash
supabase secrets set PLUGGY_CLIENT_ID=seu_client_id
supabase secrets set PLUGGY_CLIENT_SECRET=seu_client_secret
```

### 3. Database Migration
```bash
supabase db push
# ou aplique manualmente: supabase/migrations/20260301_open_finance_schema.sql
```

### 4. Deploy Edge Function
```bash
supabase functions deploy pluggy-proxy
```

### 5. Instalar Dependência
```bash
cd apps/mobile
npx expo install react-native-webview
```

## Funcionalidades

### Ao Conectar um Banco
Automaticamente sincroniza:
- ✅ Todas as contas (corrente, poupança, investimento)
- ✅ Saldo atual de cada conta
- ✅ Transações dos últimos 2 meses
- ✅ Todos os cartões de crédito
- ✅ Faturas abertas e pagas
- ✅ Dívidas e empréstimos ativos

### Bancos Suportados
400+ instituições via Pluggy, incluindo:
Nubank, Inter, Itaú, Bradesco, Santander, C6 Bank, Banco do Brasil,
Caixa, BTG Pactual, Neon, Next, PicPay, Mercado Pago, Pan, Original,
Safra, Sicoob, Sicredi, Will Bank, e muitos outros. 

### Telas Implementadas

| Tela | Descrição |
|------|-----------|
| **Bancos** (tab) | Panorama geral: saldo consolidado, bancos, contas, cartões, transações recentes |
| **Conectar Banco** | WebView com Pluggy Connect Widget |
| **Contas** | Lista agrupada por instituição com saldo total |
| **Detalhe da Conta** | Saldo + transações filtradas |
| **Cartões de Crédito** | Todos os cartões com uso de limite |
| **Detalhe do Cartão** | Visual do cartão + faturas |
| **Transações** | Lista completa com filtro por banco e agrupamento por data |

## Dados do Contexto

```jsx
const {
  // Dados
  connections,    // Bancos conectados
  accounts,       // Contas bancárias
  transactions,   // Transações (2 meses)
  creditCards,    // Cartões de crédito
  loans,          // Dívidas/empréstimos
  summary,        // Resumo consolidado

  // Status
  loading,        // Objeto com loading por seção
  error,          // Mensagem de erro
  hasConnections, // Boolean
  isLoading,      // Loading geral

  // Ações
  getConnectToken,          // Gerar token para widget
  addConnection,            // Registrar nova conexão
  deleteConnection,         // Remover banco
  refreshAll,               // Sincronizar tudo
  refreshConnection,        // Sincronizar um banco
  fetchCardBills,           // Buscar faturas
  fetchFilteredTransactions,// Buscar com filtros
} = useOpenFinance();
```

## Cache Offline

- Dados são salvos no `AsyncStorage` após cada fetch
- Cache válido por 30 minutos (transações: 15 min)
- Pull-to-refresh força busca sem cache
- Ao deslogar, cache é limpo automaticamente
