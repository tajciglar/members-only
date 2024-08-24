const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const db = require("../db/pool");
const { render } = require("ejs");

function getHomePage(req, res){
    res.render("index");
};

function getSignUpPage(req, res) {
    res.render("sign-up", { errors: [], formData: {} });
}


async function postSignUpPage(req, res) {
    await body('username').isEmail().withMessage('Must be a valid email').run(req);
    await body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long').run(req);
    await body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }).run(req);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('sign-up', {
            errors: errors.array(),
            formData: req.body       // Pass the form data to keep input values
        });
    }

    try {
        // Check if username already exists
        const result = await db.query("SELECT * FROM users WHERE username = $1", [req.body.username]);
        if (result.rows.length > 0) {
            // Username exists
            return res.render('sign-up', {
                errors: [{ msg: 'Username already exists' }],
                formData: req.body       // Pass the form data to keep input values
            });
        }

        // Hash the password and insert new user
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await db.query("INSERT INTO users (first_name, last_name, username, password, membership_status) VALUES ($1, $2, $3, $4, $5)", [
            req.body.first_name,
            req.body.last_name,
            req.body.username,
            hashedPassword,
            false
        ]);

        res.redirect("/log-in?signup=success");
    } catch (err) {
        console.error("ERROR:", err);
        res.render('sign-up', {
            errors: [{ msg: 'An error occurred during sign up. Please try again.' }],
            formData: req.body       // Pass the form data to keep input values
        });
    }
}

function getLoginPage(req, res) {
    // Check for query parameters to display messages
    const successMessage = req.query.signup === 'success' ? 'Account created successfully! Please log in.' : '';
    res.render("log-in", { errors: [], formData: {}, successMessage });
}

async function postLogInPage(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    try {
        // Query to get the hashed password from the database
        const result = await db.query("SELECT password FROM users WHERE username = $1", [username]);

        if (result.rows.length === 0) {
            // No user found with the provided username
            return res.render("log-in", { errors: [{ msg: 'Invalid username or password' }], formData: req.body, successMessage: "" });
        }

        const hashedPassword = result.rows[0].password;

        // Compare provided password with the hashed password
        const isMatch = await bcrypt.compare(password, hashedPassword);

        if (!isMatch) {
            return res.render("log-in", { errors: [{ msg: 'Invalid username or password' }], formData: req.body, successMessage: "" });
        }
        res.redirect("/homePage");

    } catch (error) {
        console.error("ERROR:", error);
        res.render("log-in", { errors: [{ msg: 'An error occurred during login' }], formData: req.body, successMessage: "" });
    }
}


module.exports = {
    getHomePage,
    getLoginPage,
    getSignUpPage,
    postSignUpPage,
    postLogInPage
}