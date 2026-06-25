const express = require("express");
const router = express.Router();
const gbpController = require("./googleBusiness.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

// Public OAuth routes (will handle redirection to frontend)
router.get("/auth/google-business", gbpController.auth);
router.get("/auth/google-business/callback", gbpController.callback);

// Discovery routes (authenticated)
router.get(
  "/auth/google-business/discovery",
  authMiddleware,
  gbpController.getDiscovery,
);
router.post(
  "/auth/google-business/connect-selected",
  authMiddleware,
  gbpController.connectSelected,
);

// Reviews routes (authenticated)
router.get("/reviews", authMiddleware, gbpController.getReviews);
router.post("/reviews/reply", authMiddleware, gbpController.postReply);

module.exports = router;
