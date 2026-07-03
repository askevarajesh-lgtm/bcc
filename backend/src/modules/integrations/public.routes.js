const express = require("express");
const cors = require("cors");
const router = express.Router();
const integrationController = require("./integration.controller");

// Public CORS policy for external website form submissions.
// This endpoint is intentionally open to all origins — it's a public webhook
// that client websites embed in their own HTML forms. The API key in the
// request body is the security mechanism (not the Origin header).
const publicCors = cors({
  origin: "*",
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Handle preflight OPTIONS request for browsers
router.options("/website/submit", publicCors);

// Public route for website form submissions
// This route does not require authentication but uses an API key for security
router.post(
  "/website/submit",
  publicCors,
  integrationController.submitWebsiteLead,
);

module.exports = router;
