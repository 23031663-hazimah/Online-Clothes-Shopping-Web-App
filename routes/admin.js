const express = require('express');
const db = require('../models/db');
const { requireAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Admin Panel
router.get('/admin', requireAdmin, (req, res) => {
  res.render('admin', { user: req.session.user });
});

// Admin Dashboard
router.get('/dashboard_admin', requireAdmin, (req, res) => {
  res.render('dashboard_admin', { user: req.session.user });
});

// Manage Users (List + Filter)
router.get('/admin/users', requireAdmin, (req, res) => {
  const filter = req.query.role;
  let sql = 'SELECT * FROM users';
  const params = [];

  if (filter) {
    sql += ' WHERE role = ?';
    params.push(filter);
  }

  db.query(sql, params, (err, users) => {
    if (err) return res.send('Error loading users.');
    res.render('admin_users', { users, filter, user: req.session.user });
  });
});

// Update User Role
router.post('/admin/users/role/:id', requireAdmin, (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;
  const sql = 'UPDATE users SET role = ? WHERE id = ?';

  db.query(sql, [role, userId], (err) => {
    if (err) return res.send('Error updating role.');
    res.redirect('/admin/users');
  });
});

// Delete User
router.post('/admin/users/delete/:id', requireAdmin, (req, res) => {
  const userId = req.params.id;

  if (req.session.user.id == userId) {
    return res.send("❌ Can't delete yourself.");
  }

  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [userId], (err) => {
    if (err) return res.send('Error deleting user.');
    res.redirect('/admin/users');
  });
});

module.exports = router;
