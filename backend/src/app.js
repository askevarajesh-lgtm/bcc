const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Local uploads folder removed, using Cloudinary instead

// Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
