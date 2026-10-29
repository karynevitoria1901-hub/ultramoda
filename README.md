# Moda Verso

Loja virtual demonstrativa de roupas com diversos estilos.

## Funcionalidades

- Frontend com HTML, CSS e JavaScript
- Backend com Node.js e Express
- Banco de dados SQLite com better-sqlite3
- Cadastro e login com bcrypt
- Gerenciamento de sessão e logout
- Catálogo com busca e filtros
- Carrinho de compras persistente no navegador
- Checkout e pagamento demonstrativo
- Histórico de pedidos
- Perfil do usuário
- Painel administrativo
- Cadastro e gerenciamento de produtos

## Como executar

1. Instale o Node.js 18 ou superior.
2. Abra um terminal na pasta do projeto.
3. Instale as dependências:

   ```bash
   npm install
   ```

4. Inicie o servidor:

   ```bash
   npm start
   ```

5. Acesse no navegador:

   http://localhost:3000

## Acesso administrativo de demonstração

- E-mail: `admin@modaverso.com`
- Senha: `Admin@123`

Altere as credenciais padrão e configure as medidas de segurança antes de disponibilizar o sistema em produção.

## Observações de segurança

O pagamento é demonstrativo: não existe integração com um gateway de pagamento e nenhuma cobrança real é realizada.

As imagens do catálogo utilizam URLs externas do Unsplash.

Antes de colocar o sistema em produção, configure HTTPS, cookies seguros, proteção CSRF, limitação de tentativas de acesso, validação de dados, recuperação de senha e integração com um gateway de pagamento confiável.