# OPS GRIS — Torre de Controle | Lösung Express

Sistema interno de gerenciamento de risco e cadastro operacional da Lösung Express. Controla cadastros de motoristas/veículos, checklists operacionais, performance de operadores e metas de produtividade.

---

## Sumário

1. [Stack Tecnológica](#stack-tecnológica)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Variáveis de Ambiente](#variáveis-de-ambiente)
4. [Como Rodar Localmente](#como-rodar-localmente)
5. [Como Está Rodando na VPS](#como-está-rodando-na-vps)
6. [Estrutura SQL](#estrutura-sql)
7. [Fluxo de Autenticação e Permissões](#fluxo-de-autenticação-e-permissões)
8. [Fluxo de Troca Obrigatória de Senha](#fluxo-de-troca-obrigatória-de-senha)
9. [Edge Functions](#edge-functions)
10. [Telas do Sistema](#telas-do-sistema)
11. [Componentes Reutilizáveis](#componentes-reutilizáveis)
12. [Hooks](#hooks)
13. [Tipos TypeScript](#tipos-typescript)
14. [Migrations](#migrations)

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Estilos | Tailwind CSS 3 |
| Ícones | lucide-react |
| Gráficos | SVG puro (sem biblioteca externa) |
| Backend | Supabase (self-hosted na VPS) |
| Banco de dados | PostgreSQL (via Supabase) |
| Autenticação | Supabase Auth (email/senha) |
| Edge Functions | Deno (Supabase Edge Functions) |
| Roteamento | State-based (sem react-router) |
| Gerenciamento de estado | React hooks + localStorage |

---

## Estrutura de Pastas

```
project/
├── public/
│   └── losung.png, losung copy.png, losung copy copy.png   # Logos da marca
├── src/
│   ├── main.tsx                  # Entry point do React
│   ├── App.tsx                   # Componente raiz — auth gate, sidebar, routing
│   ├── index.css                 # Estilos globais (Tailwind directives)
│   ├── vite-env.d.ts             # Tipos do Vite
│   ├── lib/
│   │   ├── supabase.ts           # Cliente Supabase (createClient)
│   │   └── auth.ts               # Cache de perfil no localStorage + fetchProfile
│   ├── hooks/
│   │   ├── useAuth.ts            # Sessão, perfil, signIn/signUp/signOut
│   │   └── useKPIs.ts            # Cálculo de KPIs e agrupamentos
│   ├── types/
│   │   └── index.ts              # Todas as interfaces TypeScript
│   ├── utils/
│   │   └── filters.ts           # Filtragem client-side (turno, status, data, busca)
│   ├── components/
│   │   ├── Charts.tsx            # BarChart, DonutChart, LineChart, ProductivityBarChart
│   │   ├── FilterBar.tsx         # Barra de filtros reutilizável
│   │   ├── KpiCard.tsx           # Card de KPI com ícone e cor de destaque
│   │   └── Panel.tsx             # Container de painel com título e ação
│   ├── views/
│   │   ├── Login.tsx             # Tela de login
│   │   ├── Dashboard.tsx        # Dashboard principal com KPIs e gráficos
│   │   ├── CadastroRealizadoView.tsx   # CRUD de cadastros
│   │   ├── ChecklistView.tsx          # CRUD de checklists
│   │   ├── PerformanceView.tsx        # Ranking de performance
│   │   ├── OperadoresView.tsx         # Gestão de operadores
│   │   ├── MetasView.tsx              # Gestão de metas
│   │   └── ForcePasswordChange.tsx    # Tela de troca obrigatória de senha
│   └── assets/                        # Imagens de referência
├── supabase/
│   ├── migrations/                    # 22 migrations SQL
│   └── functions/
│       ├── admin-user-management/index.ts   # Função de administração de usuários
│       └── confirm-all-users/index.ts       # Confirmação em massa de emails
├── vps_schema.sql                     # Schema completo para VPS
├── vps_password_reset.sql             # Script de colunas must_change_password e is_master
├── .env                               # Variáveis de ambiente
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── eslint.config.js
```

---

## Variáveis de Ambiente

O arquivo `.env` na raiz do projeto contém:

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex: `https://gppwqtvndbisvqealgtc.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase (pública, usada no frontend) |

As Edge Functions usam variáveis injetadas automaticamente pelo Supabase em runtime:

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase (injetada) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role (injetada — nunca exposta no frontend) |

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- npm

### Passo a passo

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
#    O arquivo .env já vem preenchido com as credenciais do Supabase
#    Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão presentes

# 3. Rodar em modo desenvolvimento
npm run dev

# 4. Build de produção
npm run build

# 5. Preview do build
npm run preview

# 6. Verificação de tipos
npm run typecheck

# 7. Lint
npm run lint
```

O servidor de desenvolvimento roda por padrão em `http://localhost:5173`.

> **Nota**: O backend Supabase está hospedado na VPS. Não é necessário rodar Supabase localmente — o frontend se conecta diretamente ao Supabase remoto.

---

## Como Está Rodando na VPS

### Supabase (Self-hosted)

O Supabase está instalado via Docker em uma VPS no endereço:

```
supabase2.losungexpress.app
```

Componentes do Supabase na VPS:
- **PostgreSQL**: Banco de dados principal
- **GoTrue**: Serviço de autenticação (email/senha)
- **PostgREST**: API REST automática sobre o PostgreSQL
- **Deno Edge Functions**: Runtime para funções serverless
- **Storage**: Armazenamento de arquivos (não utilizado atualmente)

### Aplicação Frontend

O build de produção (`npm run build`) gera arquivos estáticos na pasta `dist/`. Esses arquivos podem ser servidos por qualquer servidor web (Nginx, Apache, ou o próprio Supabase).

O arquivo `dist/_redirects` garante que todas as rotas apontem para `index.html` (SPA fallback).

### Aplicação das Migrations na VPS

Para aplicar o schema completo na VPS, execute os scripts SQL diretamente no PostgreSQL:

```bash
# 1. Aplicar o schema completo
psql -h supabase2.losungexpress.app -U postgres -d postgres -f vps_schema.sql

# 2. Aplicar as colunas de senha e master
psql -h supabase2.losungexpress.app -U postgres -d postgres -f vps_password_reset.sql
```

> Alternativamente, as migrations em `supabase/migrations/` podem ser aplicadas individualmente na ordem cronológica.

---

## Estrutura SQL

O banco possui 4 tabelas principais, todas com RLS (Row Level Security) habilitado.

### Tabela: `atendentes`

Perfil dos usuários do sistema (1:1 com `auth.users` via trigger).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid (PK, FK → auth.users) | ID do usuário no Supabase Auth |
| `nome` | text | Nome do operador |
| `email` | text (unique) | Email de login |
| `is_admin` | boolean (default false) | Indica se é gerente/admin |
| `is_master` | boolean (default false) | Indica se é master (acesso total) |
| `can_add_checklist` | boolean (default true) | Permissão para criar checklists |
| `can_add_cadastro` | boolean (default true) | Permissão para criar cadastros |
| `can_view_dashboard` | boolean (default false) | Permissão para ver o dashboard |
| `can_manage_users` | boolean (default false) | Permissão para gerenciar usuários |
| `active` | boolean (default true) | Conta ativa |
| `turno` | text (default '') | Turno: T1 (Manhã), T2 (Tarde), T3 (Noite) |
| `must_change_password` | boolean (default false) | Força troca de senha no próximo login |
| `created_at` | timestamptz | Data de criação |

**RLS**: Operadores veem apenas o próprio perfil. Gerentes veem todos. Apenas masters podem excluir.

### Tabela: `cadastro_records`

Registros de cadastro de motoristas e veículos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid (PK) | Gerado automaticamente |
| `user_id` | uuid (FK → auth.users, nullable) | Operador que criou o registro |
| `mes` | text | Mês de referência |
| `turno` | text | T1, T2 ou T3 |
| `operacao` | text | Tipo de operação |
| `classificacao` | text | Classificação da operação |
| `data` | date | Data do cadastro |
| `horario_inicio` | text | Horário de início |
| `horario_fim` | text | Horário de fim (para cálculo de SLA) |
| `pis` | text | PIS do motorista |
| `motorista` | text | Nome do motorista |
| `telefone` | text | Telefone de contato |
| `eta_origem` | text | ETA / Origem |
| `placa_cavalo` | text | Placa do cavalo |
| `tipo` | text | Tipo do veículo |
| `ano_cavalo` | text | Ano do cavalo |
| `placa_carreta` | text | Placa da carreta |
| `ano_carreta` | text | Ano da carreta |
| `atendente` | text | Nome do atendente |
| `tentativa1` | timestamptz (nullable) | Timestamp da 1ª tentativa |
| `tentativa2` | timestamptz (nullable) | Timestamp da 2ª tentativa |
| `tentativa3` | timestamptz (nullable) | Timestamp da 3ª tentativa |
| `tipo_cadastro` | text | Tipo do cadastro |
| `status` | text | Pendente, Validado, Recusado |
| `pendencia_recusa` | text | Descrição da pendência/recusa |
| `obs` | text | Observações |
| `semana` | integer | Número da semana |
| `sla_minutes` | integer (nullable) | SLA em minutos (fim - início) |
| `edit_count` | integer (default 0) | Contador de edições (auto-incrementado via trigger) |
| `created_at` | timestamptz | Data de criação |

**Trigger**: `increment_edit_count()` — incrementa `edit_count` automaticamente a cada UPDATE.

**RLS**: Operadores veem/editam apenas os próprios registros. Gerentes veem/editam todos.

### Tabela: `checklist_records`

Registros de checklists operacionais.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid (PK) | Gerado automaticamente |
| `user_id` | uuid (FK → auth.users, nullable) | Operador que criou o registro |
| `mes` | text | Mês de referência |
| `turno` | text | T1, T2 ou T3 |
| `operacao` | text | Tipo de operação |
| `classificacao` | text | Classificação |
| `data` | date | Data |
| `horario_inicio` | text | Horário de início |
| `horario_fim` | text | Horário de fim |
| `protocolo` | text | Número de protocolo |
| `eta_origem` | text | ETA / Origem |
| `motorista` | text | Nome do motorista |
| `telefone` | text | Telefone |
| `segundo_motorista` | text | Segundo motorista |
| `placa_cavalo` | text | Placa do cavalo |
| `placa_carreta` | text | Placa da carreta |
| `atendente` | text | Nome do atendente |
| `obs` | text | Observações |
| `tentativa1/2/3` | timestamptz (nullable) | Timestamps das tentativas |
| `status` | text | Validado, Pendência, Reprovado, Pendente, Recusado |
| `pendencia` | text | Descrição da pendência |
| `vencimento_checklist` | date (nullable) | Data de vencimento do checklist |
| `semana` | integer | Número da semana |
| `sla_minutes` | integer (nullable) | SLA em minutos |
| `created_at` | timestamptz | Data de criação |

**RLS**: Mesma lógica de cadastro_records (próprio ou gerente).

### Tabela: `metas`

Metas de produtividade (semanais ou mensais).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid (PK) | Gerado automaticamente |
| `tipo_periodo` | text | `semana` ou `mes` |
| `periodo_referencia` | text | Referência do período (ex: "2026-W30") |
| `titulo` | text | Título da meta |
| `descricao` | text | Descrição detalhada |
| `valor_alvo` | integer | Valor alvo (ex: 85 para 85%) |
| `user_id` | uuid (FK → auth.users, nullable) | Operador alvo (null = todos) |
| `ativo` | boolean (default true) | Meta ativa |
| `created_by` | uuid (FK → auth.users) | Criador da meta |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização (auto via trigger) |

**Trigger**: `update_updated_at()` — atualiza `updated_at` automaticamente a cada UPDATE.

**RLS**: Metas ativas são visíveis para todos autenticados. Apenas gerentes podem criar/editar/excluir.

### Triggers do Banco

| Trigger | Tabela | Evento | Descrição |
|---------|--------|--------|-----------|
| `handle_new_atendente()` | auth.users | AFTER INSERT | Cria automaticamente uma linha em `atendentes` quando um novo usuário se cadastra no Auth |
| `increment_edit_count()` | cadastro_records | BEFORE UPDATE | Incrementa `edit_count` a cada edição |
| `update_updated_at()` | metas | BEFORE UPDATE | Atualiza `updated_at` a cada edição |

---

## Fluxo de Autenticação e Permissões

### Níveis de Acesso

| Nível | Condição | Acesso |
|-------|----------|--------|
| **Master** | `is_master = true` | Tudo: dashboard, cadastro, checklist, performance, metas, operadores |
| **Gerente/Admin** | `is_admin = true` OU `can_manage_users = true` | Tudo (igual ao master) |
| **Operador** | Sem flags de admin | Apenas abas liberadas individualmente |

### Permissões Granulares (Operadores)

| Permissão | Aba liberada |
|-----------|-------------|
| `can_view_dashboard` | Dashboard |
| `can_add_cadastro` | Cadastro Realizado |
| `can_add_checklist` | Checklist |

As abas Performance, Metas e Operadores são exclusivas de gerentes.

### Fluxo de Login

```
Usuário entra na URL
        │
        ▼
  [loading] ─── Carrega sessão do Supabase + perfil do localStorage
        │
        ▼
  Tem sessão? ──── Não ──→ [Tela de Login]
        │                         │
        │ Sim                     │ Faz login (email/senha)
        ▼                         ▼
  Tem perfil? ──── Não ──→ [Tela "Carregando perfil..."]
        │                         │ (conta pode não estar ativa)
        │ Sim                     │
        ▼                         │
  must_change_password? ── Sim ──→ [Tela de Troca Obrigatória]
        │                         │
        │ Não                     │ Troca a senha → refreshProfile
        ▼                         ▼
  [App principal] ←───────────────┘
```

### Como o Perfil é Carregado

1. **`useAuth` hook** chama `supabase.auth.getSession()` na inicialização
2. Se existe sessão, chama `fetchProfile(userId)` que consulta a tabela `atendentes`
3. O perfil é cacheado no `localStorage` (chave `gris_user_profile`) para carregamento instantâneo no próximo acesso
4. `onAuthStateChange` monitora mudanças (login/logout) e atualiza o estado

---

## Fluxo de Troca Obrigatória de Senha

A troca obrigatória de senha **não é automática** para novos usuários. O fluxo é:

```
Admin cria um operador (na tela de Operadores)
        │
        ├─ Define email + senha temporária
        ├─ O operador é criado com must_change_password = true
        │
        ▼
Operador tenta logar com a senha temporária
        │
        ▼
Sistema detecta must_change_password = true
        │
        ▼
[Tela de Troca Obrigatória de Senha]
        │
        ├─ Operador digita nova senha
        ├─ Sistema atualiza a senha no Supabase Auth
        ├─ Sistema limpa must_change_password = false
        │
        ▼
[App principal] — Operador acessa o sistema
```

### Liberação Manual pelo Admin

O admin também pode "liberar troca de senha" de um operador existente a qualquer momento:

1. Vai na aba **Operadores**
2. Clica no ícone de escudo (azul) ao lado do operador
3. Confirma a liberação
4. O operador é marcado com `must_change_password = true`
5. No próximo login, o operador será redirecionado para a tela de troca

> O operador continua com a senha atual funcionando — ele só é obrigado a trocar quando fizer login.

---

## Edge Functions

### `admin-user-management`

Função Deno que atua como proxy administrativo usando a service role key. Verifica se o chamador é `is_admin` ou `is_master`.

**Ações suportadas:**

| Ação | Parâmetros | Descrição |
|------|-----------|-----------|
| `create_user` | `new_email`, `new_password`, `new_name` | Cria usuário no Auth com email confirmado e perfil em `atendentes` |
| `reset_password` | `targetUserId`, `new_password` | Altera a senha e marca `must_change_password = true` |
| `force_password_change` | `targetUserId` | Apenas marca `must_change_password = true` (sem alterar senha) |
| `update_email` | `targetUserId`, `new_email` | Atualiza email no Auth e em `atendentes` |
| `confirm_email` | `targetUserId` | Confirma email do usuário no Auth |
| `update_name` | `targetUserId`, `new_name` | Atualiza nome em `atendentes` |

**Segurança**: Todas as ações verificam se o chamador está autenticado e é admin/master. CORS headers em todas as respostas.

### `confirm-all-users`

Função Deno que confirma em massa todos os emails não confirmados. Verifica se o chamador é admin/master. Percorre todos os usuários via Admin API e confirma cada um.

---

## Telas do Sistema

### Login (`Login.tsx`)
Tela de acesso com email e senha. Tem toggle de visibilidade de senha e logo da Lösung. Fundo escuro (`#0f1923`) com a cor de marca laranja (`#F47920`).

### Dashboard (`Dashboard.tsx`)
Painel principal com KPIs (total de cadastros, validados, pendentes, recusados, tempo médio), gráficos (barra por turno, donut de status, linha de tendência), produtividade por atendente e registros recentes. Visível para gerentes e operadores com `can_view_dashboard`.

### Cadastro Realizado (`CadastroRealizadoView.tsx`)
CRUD completo de cadastros. Tabela com edição inline, modal de novo registro, badges de status (Validado/Pendente/Recusado), timestamps de tentativas, cálculo de SLA, rastreamento de edições (edit_count). Visível para gerentes e operadores com `can_add_cadastro`.

### Checklist (`ChecklistView.tsx`)
CRUD de checklists operacionais. Similar ao cadastro mas com campos adicionais: protocolo, segundo motorista, vencimento de checklist (com destaque vermelho para vencidos). Visível para gerentes e operadores com `can_add_checklist`.

### Performance (`PerformanceView.tsx`)
Ranking de performance dos operadores. Mostra eficiência (validados/total), tempo médio por operador, conquista de meta (85%), e tabela completa de ranking. Exclusiva para gerentes.

### Operadores (`OperadoresView.tsx`)
Gestão de usuários. Permite:
- Cadastrar novos operadores (com senha temporária)
- Editar nome e email
- Redefinir senha
- Liberar troca obrigatória de senha
- Confirmar email
- Alternar permissões granulares (dashboard, cadastro, checklist, manage_users)
- Promover/demover admin

Exclusiva para gerentes.

### Metas (`MetasView.tsx`)
Gestão de metas de produtividade. Criar/editar/excluir metas (semanais ou mensais), atribuir a operador específico ou a todos, ativar/desativar. Exclusiva para gerentes.

### Troca Obrigatória de Senha (`ForcePasswordChange.tsx`)
Tela exibida quando `must_change_password = true`. Operador digita a nova senha, que é atualizada no Supabase Auth, e o flag é limpo.

---

## Componentes Reutilizáveis

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `BarChart` | `Charts.tsx` | Gráfico de barras empilhadas por turno |
| `ProductivityBarChart` | `Charts.tsx` | Gráfico de barras agrupadas por atendente |
| `DonutChart` | `Charts.tsx` | Gráfico de rosca para distribuição de status |
| `LineChart` | `Charts.tsx` | Gráfico de linha para tendências |
| `FilterBar` | `FilterBar.tsx` | Barra de filtros (busca, status, turno, atendente) |
| `KpiCard` | `KpiCard.tsx` | Card de KPI com título, valor, ícone e cor |
| `Panel` | `Panel.tsx` | Container de painel com título, subtítulo e ação |

---

## Hooks

### `useAuth`
Gerencia estado de autenticação. Retorna `{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile }`.

- `signIn(email, password)` — Login via Supabase Auth
- `signUp(email, password, nome)` — Cadastro com nome em user_metadata
- `signOut()` — Logout + limpeza de cache
- `refreshProfile(userId)` — Recarrega perfil do banco

### `useKPIs`
Hooks de cálculo de KPIs:
- `useCadastroKPIs(records)` — KPIs de cadastro
- `useChecklistKPIs(records)` — KPIs de checklist
- `byTurno(records)` — Agrupamento por turno
- `byAtendente(records)` — Agrupamento por atendente
- `byWeek(records)` / `byMonth(records)` / `byDay(records)` — Agrupamentos temporais
- `tempoMedioPorAtendente(records)` — Tempo médio por operador
- `mediaPorTurno(records)` — Média por turno
- `mediaPorAtendente(records)` — Média por operador

---

## Tipos TypeScript

### `CadastroRealizado`
Registro de cadastro de motorista/veículo.

### `ChecklistOperacional`
Registro de checklist operacional.

### `UserProfile`
Perfil do usuário com permissões.

### `Meta`
Meta de produtividade.

### `ActiveTab`
```typescript
type ActiveTab = 'dashboard' | 'cadastro' | 'checklist' | 'performance' | 'operadores' | 'metas';
```

### `Role`
```typescript
type Role = 'gerente' | 'operador';
```

### `Filters`
```typescript
interface Filters {
  turno: string;
  atendente: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  search: string;
}
```

### `Period`
```typescript
type Period = 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'custom';
```

---

## Migrations

As migrations em `supabase/migrations/` devem ser aplicadas em ordem cronológica. O arquivo `vps_schema.sql` é uma versão consolidada e idempotente de todo o schema.

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `20260724020202_create_gris_cadastro_system.sql` | Schema inicial — tabelas de cadastro e checklist com RLS aberta |
| 2 | `20260724030833_enable_rls_and_auto_profile.sql` | Habilita RLS em todas as tabelas + trigger de perfil automático |
| 3 | `20260724125250_restrict_operator_visibility.sql` | Restringe operadores a ver apenas próprios registros |
| 4 | `20260724130027_standardize_checklist_status.sql` | Padroniza status do checklist |
| 5 | `20260727133634_add_telefone_eta_origem_to_cadastro.sql` | Adiciona telefone e ETA/origem ao cadastro |
| 6 | `20260728120657_update_checklist_status_replace_andamento_with_reprovado.sql` | Substitui "Andamento" por "Reprovado" no checklist |
| 7 | `20260728173514_enable_rls_and_policies.sql` | Reset completo de RLS e políticas |
| 8 | `20260728175106_fix_atendentes_dropdown_and_roster.sql` | Remove FK de atendentes → auth.users; insere 16 operadores do roster oficial |
| 9 | `20260729024302_add_turno_to_atendentes.sql` | Adiciona coluna turno em atendentes |
| 10 | `20260729024513_standardize_turno_names_to_t1_t2_t3.sql` | Padroniza turnos: Manhã→T1, Tarde→T2, Noite→T3 |
| 11 | `20260729043509_fix_insert_policies_remove_restrictive.sql` | Remove políticas restritivas de INSERT/UPDATE |
| 12 | `20260729043836_make_user_id_nullable_and_add_default.sql` | user_id nullable com default auth.uid() |
| 13 | `20260729043910_fix_checklist_status_constraint_align_with_frontend.sql` | Realinha constraint de status com o frontend |
| 14 | `20260729045413_fix_atendentes_columns_and_cleanup_rls.sql` | Adiciona must_change_password e is_master; limpa políticas duplicadas |
| 15 | `20260729050134_add_edit_count_to_cadastro.sql` | Adiciona edit_count em cadastro_records |
| 16 | `20260729051014_reload_schema_cache_edit_count.sql` | Reload do cache do PostgREST |
| 17 | `20260729051249_auto_increment_edit_count_trigger.sql` | Trigger de auto-incremento do edit_count |
| 18 | `20260729053339_fix_cadastro_definitive.sql` | Remove tabelas órfãs; recria constraint e trigger |
| 19 | `20260729054935_drop_chk_cadastro_status_constraint.sql` | Remove constraint de status (validação no frontend) |
| 20 | `20260729055541_promote_first_admin_to_master.sql` | Promove primeiro admin a master |
| 21 | `20260729063434_fix_trigger_must_change_password_on_create.sql` | Trigger define must_change_password=true na criação |
| 22 | `20260729064340_revert_auto_must_change_password.sql` | **Reverte** — trigger não define must_change_password automaticamente |

---

## Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `vite` | Servidor de desenvolvimento |
| `build` | `vite build` | Build de produção |
| `preview` | `vite preview` | Preview do build |
| `typecheck` | `tsc --noEmit -p tsconfig.app.json` | Verificação de tipos |
| `lint` | `eslint .` | Linting |
