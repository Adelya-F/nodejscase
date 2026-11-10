require('dotenv').config();
const os = require('os');
const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected');

  db.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``, (err) => {
    if (err) throw err;

    db.changeUser({ database: process.env.DB_NAME }, (err) => {
      if (err) throw err;

      db.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200),
          price INT,
          stock INT
        )
      `, (err) => {
        if (err) throw err;
        console.log('Table ready');

        app.listen(port, () => {
          console.log(`Server running at port ${port}`);
          console.log(`Server IP: ${getIp()}`);
        });
      });
    });
  });
});

function getIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

function escape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

app.get('/', (req, res) => {
  db.query('SELECT * FROM products', (err, products) => {
    if (err) throw err;

    const rows = products.map((p) => `
      <tr>
        <td>${p.id}</td>
        <td>
          <form action="/update/${p.id}" method="post" class="inline">
            <input name="name" value="${escape(p.name)}" required>
            <input name="price" type="number" value="${p.price}" required>
            <input name="stock" type="number" value="${p.stock}" required>
            <button>Update</button>
          </form>
        </td>
        <td>
          <form action="/delete/${p.id}" method="post" onsubmit="return confirm('Hapus produk ini?')">
            <button class="delete">Delete</button>
          </form>
        </td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NodeJS Case</title>
        <style>
          body { font-family: sans-serif; max-width: 900px; margin: 40px auto; padding: 0 16px; }
          .server { background: #232f3e; color: #fff; padding: 12px 16px; border-left: 6px solid #ff9900; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
          input { padding: 6px; }
          button { padding: 6px 12px; background: #ff9900; color: #fff; border: none; cursor: pointer; }
          button.delete { background: #d64545; }
          .inline input { width: 140px; }
        </style>
      </head>
      <body>
        <div class="server">Server IP: <b>${getIp()}</b></div>

        <h2>Daftar Produk</h2>
        <form action="/save" method="post">
          <input name="name" placeholder="Nama produk" required>
          <input name="price" type="number" placeholder="Harga" required>
          <input name="stock" type="number" placeholder="Stok" required>
          <button>Tambah</button>
        </form>

        <table>
          <tr><th>ID</th><th>Nama / Harga / Stok</th><th>Aksi</th></tr>
          ${rows}
        </table>
      </body>
      </html>
    `);
  });
});

app.post('/save', (req, res) => {
  const { name, price, stock } = req.body;
  db.query('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', [name, price, stock], (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});

app.post('/update/:id', (req, res) => {
  const { name, price, stock } = req.body;
  db.query('UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?', [name, price, stock, req.params.id], (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});

app.post('/delete/:id', (req, res) => {
  db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});
