const express = require('express');
const db = require('../models/db');
const { requireLogin } = require('../middleware/authMiddleware');
const router = express.Router();

// View Cart
router.get('/', requireLogin, (req, res) => {
  const sql = `
    SELECT c.id, p.name, p.price, c.quantity, (p.price * c.quantity) AS total
    FROM cart c JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  db.query(sql, [req.session.user.id], (err, results) => {
    if (err) return res.send('Error loading cart.');
    const totalAmount = results.reduce((sum, item) => sum + item.total, 0);
    res.render('cart', { user: req.session.user, items: results, totalAmount });
  });
});

// Add to Cart
router.post('/add/:productId', requireLogin, (req, res) => {
  const { quantity } = req.body;
  const sql = `
    INSERT INTO cart (user_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + ?
  `;
  db.query(sql, [req.session.user.id, req.params.productId, quantity, quantity], (err) => {
    if (err) return res.send('Error adding to cart.');
    res.redirect('/cart');
  });
});

// Remove from Cart
router.post('/remove/:cartId', requireLogin, (req, res) => {
  const sql = `DELETE FROM cart WHERE id = ? AND user_id = ?`;
  db.query(sql, [req.params.cartId, req.session.user.id], (err) => {
    if (err) return res.send('Error removing item.');
    res.redirect('/cart');
  });
});

module.exports = router;
