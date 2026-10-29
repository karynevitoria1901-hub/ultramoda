const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("modaverso.db");
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "troque-esta-chave-em-producao",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000*60*60*24 }
}));
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  style TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT NOT NULL,
  description TEXT DEFAULT '',
  stock INTEGER DEFAULT 10,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pago',
  payment_method TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`);

const count = db.prepare("SELECT COUNT(*) c FROM products").get().c;
if (!count) {
  const seed = db.prepare(`INSERT INTO products (name,category,style,price,image,description,stock) VALUES (?,?,?,?,?,?,?)`);
  const products = [
    ["Blazer Urban", "Casual", "Streetwear", 229.90, "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=900&q=80", "Blazer estruturado para composições urbanas.", 15],
    ["Vestido Aurora", "Vestidos", "Elegante", 189.90, "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80", "Vestido leve com silhueta sofisticada.", 12],
    ["Camiseta Essential", "Camisetas", "Minimalista", 69.90, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", "Algodão premium, corte confortável.", 30],
    ["Jaqueta Denim", "Casacos", "Vintage", 159.90, "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80", "Jeans clássico para looks atemporais.", 18],
    ["Conjunto Power", "Conjuntos", "Social", 279.90, "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80", "Conjunto de alfaiataria moderno.", 8],
    ["Moletom Cloud", "Moletom", "Streetwear", 129.90, "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80", "Moletom macio para dias frios.", 25],
    ["Saia Plissada", "Saias", "Romântico", 119.90, "https://images.unsplash.com/photo-1583496661160-fb5886a13d27?auto=format&fit=crop&w=900&q=80", "Plissado delicado e movimento fluido.", 14],
    ["Calça Wide Leg", "Calças", "Minimalista", 149.90, "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80", "Modelagem ampla e versátil.", 20]
  ];
  products.forEach(p=>seed.run(...p));
}
const admin = db.prepare("SELECT id FROM users WHERE email=?").get("admin@modaverso.com");
if (!admin) {
  const hash = bcrypt.hashSync("Admin@123", 10);
  db.prepare("INSERT INTO users (name,email,password,role) VALUES (?,?,?,'admin')").run("Administrador","admin@modaverso.com",hash);
}

function auth(req,res,next){ if(!req.session.user) return res.status(401).json({error:"Faça login para continuar."}); next(); }
function adminOnly(req,res,next){ if(!req.session.user || req.session.user.role!=="admin") return res.status(403).json({error:"Acesso restrito ao administrador."}); next(); }

app.get("/api/products",(req,res)=>{
  const {category,style,q} = req.query;
  let sql="SELECT * FROM products WHERE 1=1", params=[];
  if(category && category!=="Todos"){sql+=" AND category=?";params.push(category)}
  if(style && style!=="Todos"){sql+=" AND style=?";params.push(style)}
  if(q){sql+=" AND (name LIKE ? OR description LIKE ?)";params.push("%"+q+"%","%"+q+"%")}
  sql+=" ORDER BY id DESC";
  res.json(db.prepare(sql).all(...params));
});

app.post("/api/register", async (req,res)=>{
  const {name,email,password}=req.body;
  if(!name || !email || !password || password.length<6) return res.status(400).json({error:"Preencha nome, e-mail e senha (mínimo 6 caracteres)."});
  try{
    const hash=await bcrypt.hash(password,10);
    const info=db.prepare("INSERT INTO users(name,email,password) VALUES(?,?,?)").run(name,email.toLowerCase(),hash);
    req.session.user={id:info.lastInsertRowid,name,email:email.toLowerCase(),role:"customer"};
    res.json(req.session.user);
  }catch(e){res.status(409).json({error:"Este e-mail já está cadastrado."})}
});
app.post("/api/login", async (req,res)=>{
  const {email,password}=req.body;
  const user=db.prepare("SELECT * FROM users WHERE email=?").get((email||"").toLowerCase());
  if(!user || !(await bcrypt.compare(password||"",user.password))) return res.status(401).json({error:"E-mail ou senha inválidos."});
  req.session.user={id:user.id,name:user.name,email:user.email,role:user.role};
  res.json(req.session.user);
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/me",(req,res)=>res.json(req.session.user||null));

app.get("/api/orders",auth,(req,res)=>{
  const orders=db.prepare("SELECT * FROM orders WHERE user_id=? ORDER BY id DESC").all(req.session.user.id);
  for(const o of orders) o.items=db.prepare(`SELECT oi.*,p.name,p.image FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`).all(o.id);
  res.json(orders);
});
app.post("/api/orders",auth,(req,res)=>{
  const {items,paymentMethod,address}=req.body;
  if(!Array.isArray(items)||!items.length||!address) return res.status(400).json({error:"Carrinho ou endereço inválido."});
  const get=db.prepare("SELECT * FROM products WHERE id=?");
  let total=0, normalized=[];
  for(const item of items){
    const p=get.get(item.productId);
    const qty=Math.max(1,Math.min(99,Number(item.quantity)||1));
    if(!p || p.stock<qty) return res.status(400).json({error:`Estoque insuficiente para ${p?.name||"produto"}.`});
    total += p.price*qty; normalized.push({p,qty});
  }
  const create=db.transaction(()=>{
    const order=db.prepare("INSERT INTO orders(user_id,total,status,payment_method,address) VALUES(?,?,?,?,?)").run(req.session.user.id,total,"Pago",paymentMethod,address);
    const oi=db.prepare("INSERT INTO order_items(order_id,product_id,quantity,price) VALUES(?,?,?,?)");
    const up=db.prepare("UPDATE products SET stock=stock-? WHERE id=?");
    normalized.forEach(x=>{oi.run(order.lastInsertRowid,x.p.id,x.qty,x.p.price);up.run(x.qty,x.p.id)});
    return order.lastInsertRowid;
  });
  res.json({ok:true,orderId:create()});
});

app.get("/api/admin/stats",adminOnly,(req,res)=>{
  const users=db.prepare("SELECT COUNT(*) c FROM users WHERE role='customer'").get().c;
  const products=db.prepare("SELECT COUNT(*) c FROM products").get().c;
  const orders=db.prepare("SELECT COUNT(*) c FROM orders").get().c;
  const revenue=db.prepare("SELECT COALESCE(SUM(total),0) v FROM orders").get().v;
  res.json({users,products,orders,revenue});
});
app.get("/api/admin/orders",adminOnly,(req,res)=>{
  res.json(db.prepare(`SELECT o.*,u.name,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC`).all());
});
app.post("/api/admin/products",adminOnly,(req,res)=>{
  const {name,category,style,price,image,description,stock}=req.body;
  if(!name||!category||!style||!price||!image) return res.status(400).json({error:"Campos obrigatórios ausentes."});
  const r=db.prepare("INSERT INTO products(name,category,style,price,image,description,stock) VALUES(?,?,?,?,?,?,?)").run(name,category,style,Number(price),image,description||"",Number(stock)||0);
  res.json({id:r.lastInsertRowid});
});
app.delete("/api/admin/products/:id",adminOnly,(req,res)=>{
  db.prepare("DELETE FROM products WHERE id=?").run(req.params.id); res.json({ok:true});
});

app.listen(PORT,()=>console.log(`Moda Verso em http://localhost:${PORT}`));