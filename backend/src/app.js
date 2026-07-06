const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { default: MongoStore } = require('connect-mongo');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const path = require('path');

const app = express();

// Middlewares
const allowedOrigins = [
  'https://bcc.askeva.io',
  'https://bcc.askeva.io/',
  'http://localhost:5173',
  'http://localhost:5173/'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for OAuth state persistence)
app.use(session({
  secret: process.env.SESSION_SECRET || 'bcc_oauth_session_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // lazy session update (seconds)
    ttl: 60 * 60, // 1 hour TTL for OAuth sessions
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 1000, // 1 hour
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

// Local uploads folder removed, using Cloudinary instead

// Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
