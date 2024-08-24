const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


router.get("/", userController.getHomePage);

router.get("/log-in", userController.getLoginPage);
router.post("/log-in", userController.postLogInPage)
router.get("/sign-up", userController.getSignUpPage);
router.post("/sign-up", userController.postSignUpPage);


module.exports = router;
