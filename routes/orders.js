const express = require('express');
const db = require('../models/db');
const { requireLogin } = require('../middleware/authMiddleware');
const router = express.Router();

// View Orders
router.get('/', requireLogin, (req, res) => {
  const sql = `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`;
  db.query(sql, [req.session.user.id], (err, results) => {
    if (err) return res.send('Error loading orders.');
    res.render('order', { user: req.session.user, orders: results });
  });
});

module.exports = router;
