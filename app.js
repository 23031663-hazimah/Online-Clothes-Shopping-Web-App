const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Session config
app.use(session({
  secret: 'secret_key_123',
  resave: false,
  saveUninitialized: true
}));


const db = require('./models/db');

// Display product list
app.get('/products', (req, res) => {
  const sql = 'SELECT * FROM products';
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.send('❌ Error loading products.');
    }


    res.render('productList', { products: results, user: req.session.user });
  });
});

// ------------------- ROUTES ------------------- //

// Home - Product Listing
app.get('/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).send('Error loading products');
    res.render('productList', { products, user: req.session.user });
  });
});

// Search
app.get('/search', (req, res) => {
  const { name, category, minPrice, maxPrice } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (name) {
    sql += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (minPrice) {
    sql += ' AND price >= ?';
    params.push(minPrice);
  }
  if (maxPrice) {
    sql += ' AND price <= ?';
    params.push(maxPrice);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).send('Search failed');
    res.render('searchResults', { products: results });
  });
});

// Sort
app.get('/sort', (req, res) => {
  const { sort } = req.query;
  let sql = 'SELECT * FROM products';

  if (sort === 'asc') sql += ' ORDER BY price ASC';
  if (sort === 'desc') sql += ' ORDER BY price DESC';

  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('Sort failed');
    res.render('productList', { products: results });
  });
});

// ------------------- AUTH ------------------- //
app.get('/', (req, res) => {
  res.render('home', { user: req.session.user });
});
// Login Page
app.get('/login', (req, res) => res.render('login', { error: null }));

// Login Logic
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) return res.render('login', { error: 'User not found' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = user;
      return res.redirect('/profile');
    } else {
      res.render('login', { error: 'Incorrect password' });
    }
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ------------------- PROFILE ------------------- //

app.get('/profile', (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');

  db.query('SELECT * FROM users WHERE id = ?', [user.id], (err, results) => {
    if (err || results.length === 0) return res.redirect('/login');
    res.render('profile', { profile: results[0], message: req.session.message });
    req.session.message = null;
  });
});

app.get('/profile/edit', (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');

  db.query('SELECT * FROM users WHERE id = ?', [user.id], (err, results) => {
    res.render('edit-profile', { profile: results[0], errors: [] });
  });
});

app.post('/profile/update', (req, res) => {
  const { full_name, phone, address, date_of_birth } = req.body;
  const userId = req.session.user.id;

  const sql = `UPDATE users SET full_name=?, phone=?, address=?, date_of_birth=? WHERE id=?`;
  db.query(sql, [full_name, phone, address, date_of_birth, userId], (err) => {
    if (err) return res.status(500).send('Update failed');
    req.session.message = 'Profile updated successfully';
    res.redirect('/profile');
  });
});

// ------------------- WISHLIST ------------------- //

app.get('/wishlist', (req, res) => {
  const userId = req.session.user.id;
  const sql = `SELECT w.*, p.name, p.description, p.price, p.image_url AS image
               FROM wishlist w
               JOIN products p ON w.product_id = p.id
               WHERE w.user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).send('Wishlist error');
    res.render('wishlist', { wishlistItems: results });
  });
});

// ------------------- CART ------------------- //

app.get('/cart', (req, res) => {
  const userId = req.session.user.id;
  const sql = `SELECT c.*, p.name, p.price, p.image_url 
               FROM cart c 
               JOIN products p ON c.product_id = p.id 
               WHERE c.user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).send('Cart error');
    res.render('cart', { cartItems: results });
  });
});

// ------------------- CHECKOUT ------------------- //

app.get('/checkout', (req, res) => {
  const userId = req.session.user.id;
  const sql = `SELECT c.*, p.name, p.price, p.image_url 
               FROM cart c 
               JOIN products p ON c.product_id = p.id 
               WHERE c.user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).send('Checkout error');
    res.render('checkout', { cartItems: results });
  });
});

// ------------------- PORT ------------------- //

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

const profileRoutes = require('./routes/profile');
const wishlistRoutes = require('./routes/wishlist');
const cartRoutes = require('./routes/cart');

app.use('/profile', profileRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);

const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');

app.use(productRoutes);
app.use(adminRoutes);
