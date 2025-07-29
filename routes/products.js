const express = require('express');
const db = require('../models/db');
const router = express.Router();

// All Products
router.get('/products', (req, res) => {
  const sql = 'SELECT * FROM products';
  db.query(sql, (err, results) => {
    if (err) return res.send('Error loading products.');
    res.render('productList', { products: results, user: req.session.user });
  });
});

// Search Products
router.get('/search', (req, res) => {
  const search = req.query.q || '';
  const sql = 'SELECT * FROM products WHERE name LIKE ?';
  db.query(sql, [`%${search}%`], (err, results) => {
    if (err) return res.send('Search error.');
    res.render('searchResults', { products: results, query: search, user: req.session.user });
  });
});

module.exports = router;
