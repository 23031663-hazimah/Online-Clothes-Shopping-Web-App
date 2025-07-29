const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', (req, res) => {
  const { name, category, minPrice, maxPrice } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (name) {
    sql += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }
  if (category && category !== '') {
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
    res.render('searchResults', { products: results, user: req.session.user });
  });
});
