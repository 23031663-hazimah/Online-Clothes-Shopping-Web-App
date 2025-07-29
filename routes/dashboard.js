const express = require('express');
const router = express.Router();
const { requireLogin, requireAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard_user', requireLogin, (req, res) => {
  res.render('dashboard_user', { user: req.session.user });
});

router.get('/dashboard_admin', requireLogin, requireAdmin, (req, res) => {
  res.render('dashboard_admin', { user: req.session.user });
});

module.exports = router;
