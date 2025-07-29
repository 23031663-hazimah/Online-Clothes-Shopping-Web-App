const express = require('express');
const db = require('../models/db');
const { requireLogin } = require('../middleware/authMiddleware');
const router = express.Router();

// GET Checkout Page
router.get('/', requireLogin, (req, res) => {
  res.render('checkout', { user: req.session.user });
});

// POST Place Order
router.post('/', requireLogin, (req, res) => {
  const { shipping_address, city, postal_code, phone, payment_method } = req.body;
  const userId = req.session.user.id;

  const orderSql = `INSERT INTO orders (user_id, total_amount, status) VALUES (?, 0, 'Pending')`;

  db.query(orderSql, [userId], (err, orderResult) => {
    if (err) return res.send('Failed to place order.');

    const orderId = orderResult.insertId;
    const cartSql = `SELECT * FROM cart WHERE user_id = ?`;

    db.query(cartSql, [userId], (err, cartItems) => {
      if (err || cartItems.length === 0) return res.send('Cart is empty.');

      let total = 0;
      const itemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
      const itemsData = cartItems.map(item => {
        total += item.quantity * item.price;
        return [orderId, item.product_id, item.quantity, item.price];
      });

      db.query(itemsSql, [itemsData], (err) => {
        if (err) return res.send('Failed to save order items.');

        const updateOrderSql = `UPDATE orders SET total_amount = ? WHERE id = ?`;
        db.query(updateOrderSql, [total, orderId], (err) => {
          if (err) return res.send('Failed to update order.');

          db.query(`DELETE FROM cart WHERE user_id = ?`, [userId], () => {
            res.redirect('/order');
          });
        });
      });
    });
  });
});

module.exports = router;
