# IMMB Vendas: Sistema de Gestão de Marketplace

Este é o repositório do sistema de gestão de marketplace **IMMB Vendas**, uma solução robusta para controle de produtos, vendas, fiados e relatórios. Desenvolvido com uma arquitetura moderna, o sistema garante a integridade dos dados e uma experiência de usuário eficiente.

## ✨ Funcionalidades Principais

-   **Gestão Completa de Produtos:**
    -   Criação, edição e exclusão de produtos com controle de estoque.
    -   Exclusão em cascata: ao deletar um produto, todas as suas referências em vendas e fiados são automaticamente removidas, garantindo a integridade do banco de dados.
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

-   **SQL Server:** Sistema de gerenciamento de banco de dados relacional, escolhido pela sua robustez e capacidade de lidar com grandes volumes de dados. Configurado com `ON DELETE CASCADE` para garantir a integridade referencial e simplificar a exclusão de registros relacionados.

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
3.  **Configuração de Chaves Estrangeiras com `ON DELETE CASCADE`:**
    Para garantir a exclusão em cascata e evitar erros de integridade, execute os seguintes comandos SQL:

    ```sql
    -- Para ResumoProdutosRelatorio
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__ResumoPro__produ__4F7CD00D')
    BEGIN
        ALTER TABLE dbo.ResumoProdutosRelatorio DROP CONSTRAINT FK__ResumoPro__produ__4F7CD00D;
    END
    ALTER TABLE dbo.ResumoProdutosRelatorio WITH CHECK ADD CONSTRAINT FK_ResumoProdutos_Produtos 
    FOREIGN KEY (produtoId) REFERENCES dbo.Produtos (id) ON DELETE CASCADE;

    -- Para ItensVenda
    DECLARE @fkNameVenda NVARCHAR(200);
    SELECT @fkNameVenda = name FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('ItensVenda') AND referenced_object_id = OBJECT_ID('Produtos');
    IF @fkNameVenda IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE ItensVenda DROP CONSTRAINT ' + @fkNameVenda);
    END
    ALTER TABLE dbo.ItensVenda WITH CHECK ADD CONSTRAINT FK_ItensVenda_Produtos 
    FOREIGN KEY (produtoId) REFERENCES dbo.Produtos (id) ON DELETE CASCADE;

    -- Para ItensFiado
    DECLARE @fkNameFiado NVARCHAR(200);
    SELECT @fkNameFiado = name FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('ItensFiado') AND referenced_object_id = OBJECT_ID('Produtos');
    IF @fkNameFiado IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE ItensFiado DROP CONSTRAINT ' + @fkNameFiado);
    END
    ALTER TABLE dbo.ItensFiado WITH CHECK ADD CONSTRAINT FK_ItensFiado_Produtos 
    FOREIGN KEY (produtoId) REFERENCES dbo.Produtos (id) ON DELETE CASCADE;
    ```

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
