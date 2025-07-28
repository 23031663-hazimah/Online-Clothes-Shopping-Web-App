const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const { requireLogin, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Show Register Page
router.get('/register', (req, res) => {
  res.render('register', { user: req.session.user || null });
});

// Handle Register Form
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, hashedPassword], (err) => {
    if (err) {
      console.log('Registration error:', err); 
      return res.send('❌ Registration failed.');
    }
    res.redirect('/login');
  });
});

// Show Login Page
router.get('/login', (req, res) => {
  res.render('login', { user: req.session.user || null });
});


// Handle Login Form
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.send('❌ User not found.');
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = user;
      req.session.userId = user.id;

      if (user.role === 'admin') {
        return res.redirect('/dashboard_admin');
      } else {
        return res.redirect('/dashboard_user');
      }
    } else {
      res.send('❌ Incorrect password.');
    }
  });
});

// Dashboard redirect based on role
router.get('/dashboard', requireLogin, (req, res) => {
  const role = req.session.user.role;

  if (role === 'admin') {
    res.render('dashboard_admin', { user: req.session.user });
  } else {
    res.render('dashboard_user', { user: req.session.user });
  }
});

// Admin dashboard 
router.get('/dashboard_admin', requireLogin, requireAdmin, (req, res) => {
  res.render('dashboard_admin', { user: req.session.user });
});

router.get('/admin', requireLogin, requireAdmin, (req, res) => {
  res.render('admin', { user: req.session.user });
}); 
// User dashboard 
router.get('/dashboard_user', requireLogin, (req, res) => {
  res.render('dashboard_user', { user: req.session.user });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Admin: view all users
router.get('/admin/users', requireLogin, requireAdmin, (req, res) => {
  const roleFilter = req.query.role;
  let sql = 'SELECT id, username, email, role FROM users';
  const params = [];

  if (roleFilter) {
    sql += ' WHERE role = ?';
    params.push(roleFilter);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.send('Error fetching users');
    res.render('admin_users', {
      user: req.session.user,
      users: results,
      filter: roleFilter
    });
  });
});

// Admin: delete user
router.post('/admin/users/delete/:id', requireLogin, requireAdmin, (req, res) => {
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.send('Delete failed');
    res.redirect('/admin/users');
  });
});

// Admin: update user role
router.post('/admin/users/role/:id', requireLogin, requireAdmin, (req, res) => {
  const newRole = req.body.role;
  const userId = req.params.id;

  const sql = 'UPDATE users SET role = ? WHERE id = ?';
  db.query(sql, [newRole, userId], (err) => {
    if (err) return res.send('Role update failed');
    res.redirect('/admin/users');
  });
});

// Profile page
router.get('/profile', requireLogin, (req, res) => {
  res.render('profile', {
    user: req.session.user,
    message: null
  });
});

// Profile update (username + email)
router.post('/profile', requireLogin, (req, res) => {
  const { username, email } = req.body;
  const userId = req.session.user.id;

  const sql = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
  db.query(sql, [username, email, userId], (err) => {
    if (err) {
      return res.render('profile', {
        user: req.session.user,
        message: '❌ Update failed.'
      });
    }

    // Update session data
    req.session.user.username = username;
    req.session.user.email = email;

    res.render('profile', {
      user: req.session.user,
      message: '✅ Profile updated successfully!'
    });
  });
});

// Show password change form
router.get('/profile/password', requireLogin, (req, res) => {
  res.render('change_password', {
    user: req.session.user,
    message: null
  });
});

// Handle password change
router.post('/profile/password', requireLogin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.user.id;

  const sql = 'SELECT password FROM users WHERE id = ?';
  db.query(sql, [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.render('change_password', {
        user: req.session.user,
        message: '❌ User not found'
      });
    }

    const valid = await bcrypt.compare(currentPassword, results[0].password);
    if (!valid) {
      return res.render('change_password', {
        user: req.session.user,
        message: '❌ Current password incorrect'
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId], (err) => {
      if (err) {
        return res.render('change_password', {
          user: req.session.user,
          message: '❌ Failed to update password'
        });
      }

      res.render('change_password', {
        user: req.session.user,
        message: '✅ Password updated successfully!'
      });
    });
  });
});

module.exports = router;
