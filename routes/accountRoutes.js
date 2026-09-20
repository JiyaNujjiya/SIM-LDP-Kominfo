const express = require('express');

const router = express.Router();

const authMiddleware =
  require('../middleware/auth');

const adminOnly =
  require('../middleware/adminOnly');

const accountController =
  require(
    '../controllers/accountController'
  );

router.use(
  authMiddleware,
  adminOnly
);

router.get(
  '/',
  accountController.getAccounts
);

router.get(
  '/roles',
  accountController.getRoles
);

router.post(
  '/',
  accountController.createAccount
);

router.put(
  '/:id',
  accountController.updateAccount
);

router.patch(
  '/:id/reset-password',
  accountController.resetAccountPassword
);

module.exports = router;