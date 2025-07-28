const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Middleware to ensure user is logged in
function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// Add to cart
router.post('/cart/add', ensureAuth, (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userId;

  const checkSql = 'SELECT * FROM cart WHERE user_id = ? AND product_id = ?';
  db.query(checkSql, [userId, productId], (err, rows) => {
    if (rows.length > 0) {
      const updateSql = 'UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?';
      db.query(updateSql, [userId, productId], () => res.redirect('/cart'));
    } else {
      const insertSql = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)';
      db.query(insertSql, [userId, productId], () => res.redirect('/cart'));
    }
  });
});

// View cart
router.get('/cart', ensureAuth, (req, res) => {
  const userId = req.session.userId;

  const sql = `
    SELECT cart.id, products.name, products.price, cart.quantity, (products.price * cart.quantity) AS total
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?`;

  db.query(sql, [userId], (err, items) => {
    let totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    res.render('cart', { user: req.session.user, items, totalAmount });
  });
});

// Remove item
router.post('/cart/remove/:id', ensureAuth, (req, res) => {
  db.query('DELETE FROM cart WHERE id = ?', [req.params.id], () => res.redirect('/cart'));
});

// Show checkout page
router.get('/checkout', ensureAuth, (req, res) => {
  res.render('checkout', { user: req.session.user });
});

// Handle checkout form
router.post('/checkout', ensureAuth, (req, res) => {
  const userId = req.session.userId;
  const { shipping_address, city, postal_code, phone, payment_method } = req.body;

  const cartSql = `
    SELECT cart.product_id, cart.quantity, products.price
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?`;

  db.query(cartSql, [userId], (err, cartItems) => {
    if (cartItems.length === 0) return res.redirect('/cart');

    const total = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const orderSql = `
      INSERT INTO orders (user_id, total_amount, shipping_address, city, postal_code, phone, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(orderSql, [userId, total, shipping_address, city, postal_code, phone, payment_method], (err, result) => {
      const orderId = result.insertId;

      const orderItems = cartItems.map(item => [
        orderId, item.product_id, item.quantity, item.price
      ]);

      const itemsSql = `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ?`;

      db.query(itemsSql, [orderItems], () => {
        db.query('DELETE FROM cart WHERE user_id = ?', [userId], () => res.redirect('/orders'));
      });
    });
  });
});

// Show order history
router.get('/orders', ensureAuth, (req, res) => {
  const sql = `
    SELECT * FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC`;

  db.query(sql, [req.session.userId], (err, orders) => {
    res.render('orders', { user: req.session.user, orders });
  });
});

module.exports = router;
