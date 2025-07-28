const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');



const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');


app.use(session({
  secret: 'clothing_secret',
  resave: false,
  saveUninitialized: true
}));

// Routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

const cartRoutes = require('./routes/cart');
app.use('/', cartRoutes);

// Home
app.get('/', (req, res) => {
  res.render('home');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
