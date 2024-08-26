const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passport = require('../config/passport');
const { isAuthenticated } = require('../middleware/auth'); 


router.get("/", userController.getIndexPage);

router.get("/log-in", userController.getLoginPage);
router.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/homePage",
        failureRedirect: "/log-in",
    })
);

router.get("/sign-up", userController.getSignUpPage);
router.post("/sign-up", userController.postSignUpPage);


router.get("/homePage", isAuthenticated, userController.getHomePage);

router.get("/memberSignIn", isAuthenticated, userController.memberSignInGet);
router.post("/memberSignIn", isAuthenticated, userController.memberSignInPost);


router.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

module.exports = router;
