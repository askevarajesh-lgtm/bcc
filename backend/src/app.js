const express = require('express');
const cors = require('cors');
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

// Local uploads folder removed, using Cloudinary instead

// Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
