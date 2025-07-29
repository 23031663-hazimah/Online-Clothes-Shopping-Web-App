const express = require('express');
const db = require('../models/db');
const bcrypt = require('bcrypt');
const { requireLogin } = require('../middleware/authMiddleware');
const router = express.Router();

// View profile
router.get('/profile', requireLogin, (req, res) => {
  const user = req.session.user;
  res.render('profile', { user, profile: user, message: null });
});

// Update profile info
router.post('/profile', requireLogin, (req, res) => {
  const { username, email, full_name, phone, address, date_of_birth } = req.body;
  const id = req.session.user.id;
  const sql = `UPDATE users SET username=?, email=?, full_name=?, phone=?, address=?, date_of_birth=? WHERE id=?`;
  db.query(sql, [username, email, full_name, phone, address, date_of_birth, id], (err) => {
    if (err) return res.render('profile', { user: req.session.user, profile: req.body, message: '❌ Update failed.' });
    Object.assign(req.session.user, req.body);
    res.render('profile', { user: req.session.user, profile: req.body, message: '✅ Profile updated!' });
  });
});

// Change password
router.get('/profile/password', requireLogin, (req, res) => {
  res.render('change_password', { user: req.session.user, message: null });
});

router.post('/profile/password', requireLogin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const id = req.session.user.id;
  db.query('SELECT password FROM users WHERE id=?', [id], async (err, results) => {
    if (err || results.length === 0) return res.render('change_password', { user: req.session.user, message: '❌ Error' });
    const match = await bcrypt.compare(currentPassword, results[0].password);
    if (!match) return res.render('change_password', { user: req.session.user, message: '❌ Wrong current password' });
    const hashed = await bcrypt.hash(newPassword, 10);
    db.query('UPDATE users SET password=? WHERE id=?', [hashed, id], () => {
      res.render('change_password', { user: req.session.user, message: '✅ Password updated!' });
    });
  });
});

module.exports = router;
