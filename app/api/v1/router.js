const express = require("express");
const router = express.Router();

const uploadMiddleware = require("../../middlewares/multer");

const {
  signIn,
  getMyRequests,
  getAllAccounts,
  getExtendedAccounts,
  deleteMyRequest,
  bulkRequests,
  bulkDeletes,
} = require("./controller");

router.post("/sign-in", signIn);
router.get("/get-my-requests", getMyRequests);
router.get("/get-all-accounts", getAllAccounts);
router.get("/get-extended-accounts/:accountId", getExtendedAccounts);
router.post("/bulk-requests", uploadMiddleware.single("file"), bulkRequests);
router.delete("/delete-my-request/:requestId", deleteMyRequest);
router.delete("/bulk-deletes", bulkDeletes);

module.exports = router;
