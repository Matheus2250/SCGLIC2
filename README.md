# Sistema de Contratações

Sistema web para gerenciamento do processo de contratações públicas, desenvolvido com FastAPI (backend) e React (frontend).

## Funcionalidades

- **Autenticação**: Login/registro de usuários com diferentes níveis de acesso
- **Dashboard**: Visão geral com estatísticas e indicadores
- **Planejamento (PCA)**: Gerenciamento do Plano de Contratações Anual
- **Qualificação**: Acompanhamento do processo de qualificação
- **Licitação**: Controle dos processos licitatórios
- **Relatórios**: Geração de relatórios e análises

## Níveis de Acesso

- **COORDENADOR**: Acesso completo a todas as funcionalidades
- **DIPLAN**: Acesso ao planejamento e dashboard
- **DIQUALI**: Acesso à qualificação e dashboard
- **DIPLI**: Acesso à licitação e dashboard
- **VISITANTE**: Acesso apenas ao dashboard

## Tecnologias

### Backend
- **FastAPI**: Framework web moderno para Python
- **SQLAlchemy**: ORM para banco de dados
- **PostgreSQL**: Banco de dados relacional
- **Alembic**: Migração de banco de dados
- **JWT**: Autenticação via tokens
- **Pydantic**: Validação de dados
- **ReportLab**: Geração de relatórios PDF

### Frontend
- **React 18**: Biblioteca para interfaces
- **TypeScript**: Tipagem estática
- **Material-UI (MUI)**: Componentes de interface
- **React Router**: Roteamento SPA
- **React Hook Form**: Gerenciamento de formulários
- **Axios**: Cliente HTTP
- **Recharts**: Gráficos e visualizações

## Estrutura do Projeto

```
sistema_contratacoes/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/            # Rotas da API
│   │   ├── core/           # Configurações e segurança
│   │   ├── db/             # Configuração do banco
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── schemas/        # Esquemas Pydantic
│   │   └── services/       # Lógica de negócio
│   ├── alembic/           # Migrações
│   └── requirements.txt   # Dependências Python
├── frontend/              # Aplicação React
│   ├── public/           # Arquivos estáticos
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── services/    # Serviços HTTP
│   │   ├── store/       # Estado global
│   │   └── types/       # Tipos TypeScript
│   └── package.json     # Dependências Node.js
└── docs/               # Documentação
```

## Configuração e Instalação

### Pré-requisitos
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Backend

1. Clone o repositório:
```bash
git clone <repository-url>
cd sistema_contratacoes/backend
```

2. Crie um ambiente virtual:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/Mac
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente criando um arquivo `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost/sistema_contratacoes
SECRET_KEY=seu-secret-key-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Execute as migrações:
```bash
alembic upgrade head
```

6. Inicie o servidor:
```bash
python main.py
```

O backend estará disponível em `http://localhost:8000`

### Frontend

1. Navegue até o diretório frontend:
```bash
cd sistema_contratacoes/frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env`:
```env
VITE_API_URL=http://localhost:8000
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3001`

## Scripts Disponíveis

### Backend
- `python main.py` - Inicia o servidor FastAPI
- `alembic revision --autogenerate -m "message"` - Cria nova migração
- `alembic upgrade head` - Aplica migrações
- `pytest` - Executa testes

### Frontend
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run lint` - Verificação de código
- `npm run preview` - Preview do build

## API Endpoints

### Autenticação
- `POST /api/v1/auth/login` - Login de usuário
- `POST /api/v1/auth/register` - Registro de usuário
- `GET /api/v1/auth/me` - Dados do usuário logado

### PCA (Planejamento)
- `GET /api/v1/pcas/` - Lista PCAs
- `POST /api/v1/pcas/` - Cria PCA
- `PUT /api/v1/pcas/{id}` - Atualiza PCA
- `DELETE /api/v1/pcas/{id}` - Remove PCA

### Qualificação
- `GET /api/v1/qualificacoes/` - Lista qualificações
- `POST /api/v1/qualificacoes/` - Cria qualificação
- `PUT /api/v1/qualificacoes/{id}` - Atualiza qualificação

### Licitação
- `GET /api/v1/licitacoes/` - Lista licitações
- `POST /api/v1/licitacoes/` - Cria licitação
- `PUT /api/v1/licitacoes/{id}` - Atualiza licitação

### Dashboard
- `GET /api/v1/dashboard/stats` - Estatísticas gerais
- `GET /api/v1/dashboard/licitacao-stats` - Estatísticas de licitações

## Licença

Este projeto está licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

## Contato

Para dúvidas ou sugestões, entre em contato através do GitHub Issues.