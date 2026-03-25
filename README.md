# CAE - Central de Atendimento ao Empreendedor

Sistema completo para gestão de atendimentos, formalização e acompanhamento de micro e pequenos empreendedores. A plataforma é projetada com uma interface limpa e moderna (Glassmorphism), oferecendo aos gestores e consultores ferramentas robustas para conduzir treinamentos, mentorias e prestar serviços gerais aos cidadãos.

## 🚀 Principais Funcionalidades

- **Dashboard Integrado:** Visão geral da fila de atendimentos online, métricas e últimos serviços prestados.
- **Fila de Atendimento:** Funcionalidade em tempo real para chamar, atender e finalizar solicitações.
- **Gestão de Empreendedores:** Cadastro detalhado de autônomos e empresários (MEI, ME, LTDA) com histórico de acessos.
- **Gestão de Consultores:** Criação e moderação de novos acessos de administradores e consultores gerando senhas dinamicamente.
- **Encaminhamentos & Cursos:** Agenda de programas e mentorias ativas com vagas controladas para capacitação.
- **Relatórios & KPIs:** Gráficos interativos apresentando crescimento temporal, distribuição de serviços e notas de satisfação.

---

## 🛠️ Tecnologias Utilizadas

**Front-end (Client):**
- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animações:** [Framer Motion](https://www.framer.com/motion/)
- **Iconografia:** [Lucide React](https://lucide.dev/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Feedback:** [React-Hot-Toast](https://react-hot-toast.com/)

**Back-end (API / Servidor):**
- [Node.js](https://nodejs.org/pt-br/) + [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- **Autenticação e Segurança:** [JWT (JSON Web Token)](https://jwt.io/) & [Bcrypt.js](https://www.npmjs.com/package/bcryptjs)
- **Validação de Dados:** [Zod](https://zod.dev/)

**Banco de Dados:**
- [PostgreSQL](https://www.postgresql.org/) (com queries diretas utilizando o módulo `pg`)

---

## ⚙️ Como Instalar e Rodar o Projeto

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL (Instalado nativamente ou via Docker)
- Git (Opcional, para clone manual)

### 1. Clonando ou descompactando o repositório
\`\`\`bash
# Entre na pasta do projeto
cd cae-gestao-de-atendimentos
\`\`\`

### 2. Configurando as Variáveis de Ambiente (.env)
Dentro da pasta `backend`, existe (ou você deve criar) um arquivo `.env` para estipular a conexão com o banco e segredos.
Exemplo:
\`\`\`ini
# /backend/.env
DATABASE_URL=postgres://postgres:SuaSenha@localhost:5432/cae_db
JWT_SECRET=sua_chave_super_secreta
PORT=3333
FRONTEND_URL=http://localhost:3000
\`\`\`

*(Se você preferir rodar o banco de dados via Docker, você pode conferir o arquivo `docker-compose.yml` que sobe um PostgreSQL automaticamente e fornece as credenciais).*

### 3. Instalando as Dependências
Na raiz do repositório, rode as instalações de dependências:
\`\`\`bash
# Instala os pacotes do frontend
npm install

# Instala os pacotes do backend
cd backend
npm install
cd ..
\`\`\`

### 4. Inicializando o Banco de Dados
A aplicação conta com scripts prontos para rodar ` migrations` e `seeds` para gerar dados falsos pra teste inicial!
Na raiz do projeto:
\`\`\`bash
npm run setup:db
\`\`\`
*Isto irá criar as tabelas e popular dados padrão iniciais incluindo o usuário admin padrão:*
> **Email:** admin@cae.gov.br
> **Senha:** admin123

### 5. Rodando o Projeto Localmente
A aplicação usa `concurrently` para o processo Local Dev se tornar único e elegante. Para rodar Frontend e Backend juntos e automáticos:
\`\`\`bash
npm run dev:full
\`\`\`

Pronto!
- A página principal abre em [http://localhost:3000](http://localhost:3000) (ou porta subseqüente livre, informada no terminal).
- A API responde em [http://localhost:3333/api](http://localhost:3333/api).

---

## 📂 Estrutura de Diretórios Básica

\`\`\`
/
├── backend/               # Motor da aplicação (Node/Express API)
│   ├── src/
│   │   ├── controllers/   # Regras de fluxo HTTP e retorno (Res/Req)
│   │   ├── db/            # Conexões ao PG, Migrations e Seeds
│   │   ├── middlewares/   # Validações de Tokens (JWT) e Body (Zod)
│   │   ├── repositories/  # Comunicação com o Banco de dados relacional
│   │   ├── routes/        # Roteador mapeando as URLs da API
│   │   └── server.ts      # Ponto de inicialização do express
│   └── package.json
├── src/                   # Single Page Application Frontend (React/Vite)
│   ├── features/          # Módulos por domínio (Contextos de uso do software)
│   │   ├── auth/          # Telas de login e tokens
│   │   ├── consultores/   # Páginas para criação e leitura de Gestores/Consultores
│   │   ├── dashboard/     # Centro principal de indicadores de filas e contadores rápidos
│   │   ├── empreendedores/# Componente de CRUD de Empreendedores (Micro-empresário / Cidadão)
│   │   ├── encaminhamentos# Controle de cursos palestras com progressão Vias/Vagas
│   │   ├── historico/     # Visualizar toda rastreabilidade e histórico de chamados (filtro complexos)
│   │   └── relatorios/    # Abas com relatórios em Recharts UI
│   ├── lib/               # Clientes e utilitários globais (`api.ts`, `auth.ts`, `utils.ts`)
│   ├── App.tsx            # Ponto de colisão principal de Interface UI
│   └── index.css          # Injeção de Tailwind CSS + tokens de padronização
├── index.html
├── package.json
└── vite.config.ts
\`\`\`

---

## 🎨 Contribuições
Sinta-se livre para customizar os componentes e alterar integrações dentro do \`lib/api.ts\` e refatorar as controllers de backend.  
Desenvolvido focado em reusabilidade, a UI possui o conceito "Glass" aplicado diretamente no `index.css` global com as classes (`.glass-card`, `.glass-input`, `.glass-button`).
