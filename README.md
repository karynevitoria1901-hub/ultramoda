# Moda Verso

Loja virtual demonstrativa de roupas com:
- HTML/CSS/JavaScript no frontend
- Node.js + Express no backend
- SQLite com better-sqlite3
- Cadastro e login com bcrypt
- Sessão/logout
- Catálogo com busca e filtros
- Carrinho persistido no navegador
- Checkout/pagamento demonstrativo
- Histórico de pedidos
- Perfil
- Painel administrativo
- Cadastro de produtos

## Como executar

1. Instale Node.js 18+.
2. Abra um terminal nesta pasta.
3. Execute:
   `npm install`
4. Execute:
   `npm start`
5. Abra:
   `http://localhost:3000`

## Acesso administrativo de demonstração

E-mail: `admin@modaverso.com`
Senha: `Admin@123`

Troque a senha, o segredo da sessão e as configurações de segurança antes de colocar em produção.

## Observações

O pagamento é apenas demonstrativo: não há integração com uma adquirente/gateway e nenhuma cobrança real é realizada.

As fotos do catálogo usam URLs externas do Unsplash. Em produção, substitua por imagens próprias/CDN e configure HTTPS, cookies seguros, proteção CSRF, rate limiting, validação mais rígida, recuperação de senha e um gateway de pagamento real.
