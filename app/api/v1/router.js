const express = require("express");
const router = express.Router();

const {
  signIn,
  getMyRequests,
  getAllAccounts,
  getExtendedAccounts,
} = require("./controller");

router.post("/sign-in", signIn);
router.get("/get-my-requests", getMyRequests);
router.get("/get-all-accounts", getAllAccounts);
router.get("/get-extended-accounts/:accountId", getExtendedAccounts);

module.exports = router;
