# IMMB Vendas: Sistema de Gestão de Marketplace

Este é o repositório do sistema de gestão de marketplace **IMMB Vendas**, uma solução robusta para controle de produtos, vendas, fiados e relatórios. Desenvolvido com uma arquitetura moderna, o sistema garante a integridade dos dados e uma experiência de usuário eficiente.

## ✨ Funcionalidades Principais

-   **Gestão Completa de Produtos:**
    -   Criação, edição e exclusão de produtos com controle de estoque.
    -   Exclusão de produtos sem perder histórico: vendas e fiados já registrados continuam com o nome e o preço do produto excluído.
    -   Ativação e desativação de produtos.

-   **Controle de Vendas:**
    -   Registro detalhado de vendas.
    -   Gerenciamento de estoque em tempo real, com decremento automático na realização da venda.

-   **Gestão de Fiados:**
    -   Registro e acompanhamento de vendas a prazo (fiados).
    -   Decremento de estoque no momento da criação do fiado, garantindo a precisão do inventário.

-   **Relatórios Financeiros e de Vendas:**
    -   Geração de relatórios de vendas e lucro por período.
    -   Visualização dos produtos mais vendidos.
    -   Exportação de relatórios para formatos como Excel (funcionalidade a ser implementada/verificada no frontend).

## 🚀 Tecnologias Utilizadas

### Backend (Node.js/TypeScript)

-   **Node.js:** Ambiente de execução JavaScript.
-   **TypeScript:** Linguagem de programação que adiciona tipagem estática ao JavaScript, melhorando a manutenibilidade e escalabilidade do código.
-   **Express.js:** Framework web para Node.js, utilizado para construir a API RESTful.
-   **MSSQL (Node.js driver):** Conector para interação com o banco de dados SQL Server.
-   **uuid:** Geração de IDs únicos para os registros.
-   **dotenv:** Gerenciamento de variáveis de ambiente.

### Banco de Dados

-   **SQL Server:** Sistema de gerenciamento de banco de dados relacional, escolhido pela sua robustez e capacidade de lidar com grandes volumes de dados.

### Frontend (Angular)

-   **Angular:** Framework para construção de interfaces de usuário dinâmicas e responsivas.
-   **TypeScript:** Utilizado para o desenvolvimento do frontend.
-   **HTML/CSS:** Estruturação e estilização das páginas.

## ⚙️ Configuração e Instalação

Siga os passos abaixo para configurar e rodar o projeto em seu ambiente local.

### Pré-requisitos

-   Node.js (versão LTS recomendada)
-   npm (gerenciador de pacotes do Node.js)
-   SQL Server (ou acesso a uma instância de SQL Server)
-   Angular CLI (para o frontend)

### 1. Configuração do Banco de Dados (SQL Server)

1.  Crie um novo banco de dados no seu SQL Server (ex: `vendas_immb`).
2.  Execute os scripts SQL para criar as tabelas `Produtos`, `Vendas`, `ItensVenda`, `Fiados`, `ItensFiado`, `Relatorios` e `ResumoProdutosRelatorio`.
3.  **Exclusão de produtos e histórico:**
    Os itens de venda, de fiado e os resumos de relatório guardam uma cópia do nome e do preço do produto, por isso **não** têm chave estrangeira para `Produtos`. Assim, excluir um produto não é bloqueado e o histórico de vendas continua intacto. O backend remove essas chaves automaticamente ao iniciar (em `src/config/init-db.ts`). **Não** recrie essas chaves com `ON DELETE CASCADE`: isso apagaria as linhas do histórico de vendas e fiados junto com o produto.

4.  **Adicionar Colunas Necessárias à Tabela `Produtos`:**
    Certifique-se de que a tabela `Produtos` possui as seguintes colunas:

    ```sql
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Produtos' AND COLUMN_NAME = 'estoque')
    BEGIN
        ALTER TABLE Produtos ADD estoque INT DEFAULT 0;
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Produtos' AND COLUMN_NAME = 'categoria')
    BEGIN
        ALTER TABLE Produtos ADD categoria NVARCHAR(50) NULL;
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Produtos' AND COLUMN_NAME = 'ativo')
    BEGIN
        ALTER TABLE Produtos ADD ativo BIT DEFAULT 1;
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Produtos' AND COLUMN_NAME = 'valorCompra')
    BEGIN
        ALTER TABLE Produtos ADD valorCompra DECIMAL(10, 2) DEFAULT 0;
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Produtos' AND COLUMN_NAME = 'descricao')
    BEGIN
        ALTER TABLE Produtos ADD descricao NVARCHAR(MAX) NULL;
    END
    ```

5.  **Adicionar Colunas Necessárias à Tabela `Relatorios`:**
    Certifique-se de que a tabela `Relatorios` possui a coluna `produtosMaisVendidos`:

    ```sql
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Relatorios' AND COLUMN_NAME = 'produtosMaisVendidos')
    BEGIN
        ALTER TABLE Relatorios ADD produtosMaisVendidos NVARCHAR(MAX) NULL;
    END
    ```

### 2. Configuração do Backend

1.  Navegue até a pasta `backend-gestao-marketplace`.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie um arquivo `.env` na raiz do backend com as suas credenciais do banco de dados:
    ```
    DB_SERVER=seu_servidor_sql
    DB_DATABASE=vendas_immb
    DB_USER=seu_usuario
    DB_PASSWORD=sua_senha
    DB_PORT=1433
    ```
4.  Compile e inicie o servidor:
    ```bash
    npm run build
    npm start
    ```
    O backend estará rodando em `http://localhost:3000`.

### 3. Configuração do Frontend

1.  Navegue até a pasta `frontend-gestao-marketplace`.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Certifique-se de que a URL da API no seu ambiente Angular (geralmente em `environment.ts` ou em um serviço ) está apontando para o backend:
    ```typescript
    // Exemplo em environment.ts
    export const environment = {
      production: false,
      apiUrl: 'http://127.0.0.1:3000/api' // Use 127.0.0.1 para evitar problemas de localhost
    };
    ```
4.  Inicie o servidor de desenvolvimento do Angular:
    ```bash
    ng serve
    ```
    O frontend estará acessível em `http://localhost:4200`.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---
