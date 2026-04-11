# BI Gerencial — Mercado Livre

Sistema web para gestão financeira e operacional com sincronização de dados.

## Instalação

### 1. Requisitos
- Python 3.8+
- pip

### 2. Instalar dependências
Abra o terminal na pasta do projeto e rode:

```bash
pip install -r requirements.txt
```

### 2.1 Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha os dados:

```bash
copy .env.example .env
```

Campos importantes:
- `FLASK_SECRET_KEY`: chave de sessão em produção
- `DB_PATH`: banco local SQLite (ex.: `data/app.db`)
- `ML_ACCESS_TOKEN` e `ML_SELLER_ID`: para sincronização automática da API Mercado Livre
- `ML_AUTO_SYNC_MINUTES`: intervalo do sync automático

### 3. Popular dados iniciais (primeira vez)
```bash
python seed.py
```

### 4. Iniciar o sistema
```bash
python app.py
```

### 5. Acessar no navegador
Abra: **http://localhost:5000**

Para outros computadores na mesma rede, use o IP da máquina:
**http://192.168.x.x:5000**

---

## Usuários padrão

| Usuário | Senha     |
|---------|-----------|
| admin   | admin123  |
| user1   | user1123  |
| user2   | user2123  |
| user3   | user3123  |
| user4   | user4123  |

> Usuários padrão são semeados no banco SQLite na primeira execução.

---

## Funcionalidades

- **Visão geral** — painel com KPIs, top produtos e notas recentes
- **Produtos / SKU** — cadastrar, editar e excluir produtos com custo unitário
- **Notas fiscais** — lançar e gerenciar notas de compra e despesas
- **Importar Excel** — importar produtos via planilha .xlsx
- **Dados de vendas** — atualizar dados de vendas via JSON

---

## Banco de Dados (BC)

O projeto já usa banco SQLite para autenticação e histórico de sincronização:

- Arquivo padrão: `data/app.db`
- Tabelas principais:
    - `users`
    - `sync_runs`

Os dados analíticos continuam em JSON em `data/`, com migração progressiva possível para Postgres no futuro.

---

## API Mercado Livre (atualização automática)

### Configuração mínima

Preencha no `.env`:

- `ML_ACCESS_TOKEN`
- `ML_SELLER_ID`
- `ML_CLIENT_ID`
- `ML_CLIENT_SECRET`
- `ML_REFRESH_TOKEN`
- `ML_AUTO_SYNC_MINUTES` (ex.: 30)

Quando o access token expirar, o sistema tenta renovar automaticamente usando refresh token
e salva o token atualizado em `data/ml_tokens.json`.

### Endpoints de sincronização

- `POST /api/sync/ml` (admin): dispara sincronização manual
- `GET /api/sync/ml/status` (admin): retorna histórico das últimas sincronizações

### Resultado do sync

O processo salva automaticamente:

- `data/vendas.json`
- `data/skus.json`

---

## Hospedagem

### Opção 1: Render Free + Supabase (recomendado sem custo)

1. Crie um projeto no Supabase e copie a `Connection string` PostgreSQL.
2. No Render, faça deploy via `Blueprint` usando o arquivo `render.yaml`.
3. No serviço criado, configure a variável `DATABASE_URL` com a string do Supabase.
4. Configure também no Render:
    - `FLASK_SECRET_KEY` (forte)
    - `SESSION_COOKIE_SECURE=true`
    - variáveis do Mercado Livre (se for usar sync)
5. Faça deploy; na primeira inicialização o app copia os dados JSON padrão para o Postgres.

Observação: com `DATABASE_URL` preenchida, o sistema deixa de depender de disco local para os dados principais.

### Opção 2: Docker

```bash
docker build -t bi-gerencial .
docker run --env-file .env -p 5000:5000 bi-gerencial
```

---

## Segurança básica aplicada

- Chave de sessão via ambiente (`FLASK_SECRET_KEY`)
- Cookies HTTPOnly/SameSite e Secure configuráveis
- Limite de tentativas de login por IP
- Validação básica de payload em endpoints críticos

---

## Estrutura de arquivos

```
bi_system/
├── app.py          # Servidor Flask
├── seed.py         # Popula dados iniciais
├── data/
│   ├── produtos.json
│   ├── notas.json
│   └── vendas.json
└── templates/
    ├── login.html
    └── index.html
```
"# bi_system" 
