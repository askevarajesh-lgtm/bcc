const express = require("express");
const { body } = require("express-validator");
const expenseController = require("./expense.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const rbacMiddleware = require("../../middlewares/rbac.middleware");

const router = express.Router();

router.use(authMiddleware);

const createExpenseValidation = [
  body("expenseType")
    .isIn(["fixed", "variable"])
    .withMessage("Expense type must be fixed or variable"),
  body("category")
    .optional()
    .notEmpty()
    .withMessage("Category is required for fixed expenses"),
  body("staffId").optional(), // Removed notEmpty() requirement for variable expenses to allow 'others'
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be positive"),
  body("date").notEmpty().withMessage("Date is required"),
  body().custom((value) => {
    if (value.expenseType === "fixed" && !value.category) {
      throw new Error("Category is required for fixed expenses");
    }
    // Variable expenses no longer strictly require staffId since 'others' is a valid option on the frontend
    return true;
  }),
];

const updateExpenseValidation = [
  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount must be positive"),
  body("date").optional().notEmpty().withMessage("Date is required"),
];

// View routes - require view-expense permission
router.get(
  "/",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.getAllExpenses,
);
router.get(
  "/dropdown",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.getExpensesDropdown,
);
router.get(
  "/stats",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.getExpenseStats,
);
router.get(
  "/monthly-summary",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.getMonthlySummary,
);
router.get(
  "/profit-loss",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.getProfitLoss,
);
router.get(
  "/profit-loss/pdf",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.downloadProfitLossPDF,
);

// Salary history routes - require admin role (view-expense permission + admin check)
router.get(
  "/salary-history/:staffId",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.getSalaryHistory,
);
router.get(
  "/salary-history",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.getAllSalaryHistory,
);

// Create route - require create-expense permission (mapped to 'add' in tab-based format)
router.post(
  "/",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  createExpenseValidation,
  expenseController.createExpense,
);

// Duplicate fixed expenses from previous month
router.post(
  "/duplicate-fixed-expenses",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  [
    body("sourceMonth")
      .isInt({ min: 1, max: 12 })
      .withMessage("Source month must be between 1 and 12"),
    body("sourceYear")
      .isInt({ min: 2000, max: 2100 })
      .withMessage("Source year must be valid"),
    body("targetMonth")
      .isInt({ min: 1, max: 12 })
      .withMessage("Target month must be between 1 and 12"),
    body("targetYear")
      .isInt({ min: 2000, max: 2100 })
      .withMessage("Target year must be valid"),
  ],
  expenseController.duplicateFixedExpenses,
);

// Duplicate variable expenses from previous month
router.post(
  "/duplicate-variable-expenses",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  [
    body("sourceMonth")
      .isInt({ min: 1, max: 12 })
      .withMessage("Source month must be between 1 and 12"),
    body("sourceYear")
      .isInt({ min: 2000, max: 2100 })
      .withMessage("Source year must be valid"),
    body("targetMonth")
      .isInt({ min: 1, max: 12 })
      .withMessage("Target month must be between 1 and 12"),
    body("targetYear")
      .isInt({ min: 2000, max: 2100 })
      .withMessage("Target year must be valid"),
  ],
  expenseController.duplicateVariableExpenses,
);

// Update route - require edit-expense permission
router.put(
  "/:id",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  updateExpenseValidation,
  expenseController.updateExpense,
);

// Delete route - require delete-expense permission
router.delete(
  "/:id",
  rbacMiddleware.requireRole(["supreme_super_admin", "commander_admin", "agency_super_admin", "agency_manager"]),
  expenseController.deleteExpense,
);

module.exports = router;
