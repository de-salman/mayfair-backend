const express = require('express');
const router = express.Router();
const {
  getAccountingRecords,
  getAccountingRecord,
  createAccountingRecord,
  updateAccountingRecord,
  deleteAccountingRecord
} = require('../controllers/accountingController');
const { requireAuth, requireModule } = require('../middleware/rbac');

// All routes require authentication and accounting module access
router.use(requireAuth);
router.use(requireModule('accounting'));

router.route('/')
  .get(getAccountingRecords)
  .post(createAccountingRecord);

router.route('/:id')
  .get(getAccountingRecord)
  .put(updateAccountingRecord)
  .delete(deleteAccountingRecord);

module.exports = router;

