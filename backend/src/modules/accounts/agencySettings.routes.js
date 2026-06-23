const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Agency Settings endpoint' });
});

module.exports = router;
