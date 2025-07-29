const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const router = express.Router();

// GET Register
router.get('/register', (req, res) => {
  res.render('register', { user: req.session.user || null });
});

// POST Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, hashed], (err) => {
    if (err) return res.send('❌ Registration failed.');
    res.redirect('/login');
  });
});

// GET Login

router.get('/login', (req, res) => {
  res.render('login', { user: req.session.user || null });
});


// POST Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) return res.send('❌ User not found.');
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('❌ Incorrect password.');
    req.session.user = user;
    res.redirect(user.role === 'admin' ? '/dashboard_admin' : '/dashboard_user');
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
