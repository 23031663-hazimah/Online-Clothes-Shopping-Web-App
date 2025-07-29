const express = require('express');
const db = require('../models/db');
const { requireLogin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/orders', requireLogin, (req, res) => {
  const sql = 'SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC';
  db.query(sql, [req.session.user.id], (err, orders) => {
    res.render('order', { user: req.session.user, orders });
  });
});

module.exports = router;
