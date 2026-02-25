# Monex Mobile — React Native (Expo)

## Estrutura do Monorepo

```
monex/
├── apps/
│   ├── mobile/          ← App React Native (Expo)
│   │   ├── app/         ← Expo Router (file-based routing)
│   │   │   ├── (auth)/  ← Telas de autenticação
│   │   │   ├── (tabs)/  ← Telas principais com tab navigation
│   │   │   └── _layout.jsx
│   │   ├── src/
│   │   │   ├── components/  ← Componentes mobile
│   │   │   └── contexts/    ← Contexts adaptados pro mobile
│   │   └── assets/
│   └── web/             ← (futuro) mover app web atual aqui
│
├── packages/
│   └── shared/          ← Código compartilhado web + mobile
│       └── src/
│           ├── theme.js           ← Design tokens (cores, espaçamentos, tipografia)
│           ├── constants.js       ← Menu items, categorias, metas padrão
│           ├── services/          ← Supabase client, subscription, client service
│           └── utils/             ← Formatters, security, logger
│
├── package.json         ← Web app original (inalterado)
└── package.monorepo.json ← Config do monorepo (quando ativado)
```

## Como iniciar o desenvolvimento mobile

### Pré-requisitos

- Node.js >= 18
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- Para iOS: macOS + Xcode
- Para Android: Android Studio + emulador ou dispositivo

### Setup

```bash
# 1. Entre na pasta do app mobile
cd apps/mobile

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Inicie o servidor de desenvolvimento
npx expo start
```

### Executando

- **iOS Simulator**: Pressione `i` no terminal
- **Android Emulator**: Pressione `a` no terminal
- **Dispositivo físico**: Escaneie o QR code com o app Expo Go

## Identidade Visual

O tema da Monex está centralizado em `packages/shared/src/theme.js` e é usado em ambas as plataformas:

| Token | Valor | Uso |
|-------|-------|-----|
| Primary | `#14B8A6` | Botões, links, logo, teal brand |
| Background | `#0F172A` | Fundo principal dark |
| Card | `#1E293B` | Cards, header, elevated surfaces |
| Border | `#334155` | Bordas, divisores |
| Text Primary | `#F8FAFC` | Texto principal |
| Text Secondary | `#94A3B8` | Texto secundário |
| Success | `#22C55E` | Receitas, confirmações |
| Error | `#EF4444` | Despesas, erros |
| Warning | `#F59E0B` | Alertas |

## O que é compartilhado (packages/shared)

- **Theme**: Todas as cores, espaçamentos, tipografia e sombras
- **Services**: Supabase client (com AsyncStorage no mobile), client service, subscription service
- **Utils**: Formatters (moeda BRL, datas), validação de segurança, logger
- **Constants**: Menu items, categorias de despesas, metas fixas

## Telas implementadas

### Auth
- Login (`/(auth)/login`)
- Cadastro (`/(auth)/register`)
- Recuperar Senha (`/(auth)/forgot-password`)

### Tabs (Dashboard principal)
- Dashboard (`/(tabs)/`) — saldo, receitas/despesas, ações rápidas, transações recentes
- Rastreamento (`/(tabs)/tracking`) — adicionar e listar transações
- Metas (`/(tabs)/goals`) — progresso das metas financeiras
- ClawdBot (`/(tabs)/chat`) — chat com assistente IA
- Perfil (`/(tabs)/profile`) — dados do usuário, configurações, logout

## Próximos passos

- [ ] Gerar assets PNG (icon.png, splash.png, adaptive-icon.png) a partir dos SVGs
- [ ] Configurar deep linking para o scheme `monex://`
- [ ] Integrar ClawdBot com API real (OpenAI / LLM)
- [ ] Implementar push notifications (expo-notifications)
- [ ] Adicionar telas: Cartão de Crédito, Limites, Desafios
- [ ] Transição para monorepo completo (mover web para apps/web)
- [ ] CI/CD com EAS Build (Expo Application Services)
- [ ] Publicação nas stores (App Store + Google Play)

## Assets para gerar

Para publicação, será necessário gerar os seguintes assets PNG:

- `assets/icon.png` — 1024x1024px (ícone do app)
- `assets/splash.png` — 1284x2778px (splash screen)
- `assets/adaptive-icon.png` — 1024x1024px (ícone adaptativo Android)
- `assets/favicon.png` — 48x48px (favicon web)

Use os SVGs em `assets/` como base e exporte em PNG.
