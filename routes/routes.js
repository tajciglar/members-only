const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passport = require('../config/passport');
const { isAuthenticated } = require('../middleware/auth'); 


router.get("/", userController.getIndexPage);

router.get("/log-in", userController.getLoginPage);
router.post(
    "/log-in",
    (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) {
                return next(err); 
            }
            if (!user) {
                return res.render("log-in", {
                    message: info.message, 
                    formData: req.body,    
                    successMessage: ""     
                });
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.redirect("/homePage");
            });
        })(req, res, next);
    }
);

router.get("/sign-up", userController.getSignUpPage);
router.post("/sign-up", userController.postSignUpPage);


router.get("/homePage", isAuthenticated, userController.getHomePage);
router.post("/add-message", isAuthenticated, userController.addMessage);

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

router.post('/delete/:message_id', isAuthenticated, userController.deleteMessage);

module.exports = router;
