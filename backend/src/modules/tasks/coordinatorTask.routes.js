const express = require("express");
const coordinatorTaskController = require("./coordinatorTask.controller");
const authMiddleware = require('../../middlewares/authMiddleware');
const tenantMiddleware = (req, res, next) => next();
const _permMiddleware = (action) => (req, res, next) => next();

const router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

// Routes for Coordinator Tasks
router.get("/today-stats", coordinatorTaskController.getTodayCoordinatorTaskStats);
router.get(

  "/",
  _permMiddleware("view-task"),
  coordinatorTaskController.getAllCoordinatorTasks,
);
router.post(
  "/",
  _permMiddleware("create-task"),
  coordinatorTaskController.createCoordinatorTask,
);
router.get(
  "/:id",
  _permMiddleware("view-task"),
  coordinatorTaskController.getCoordinatorTaskById,
);
router.put(
  "/:id",
  _permMiddleware("edit-task"),
  coordinatorTaskController.updateCoordinatorTask,
);
router.delete(
  "/:id",
  _permMiddleware("delete-task"),
  coordinatorTaskController.deleteCoordinatorTask,
);

module.exports = router;
