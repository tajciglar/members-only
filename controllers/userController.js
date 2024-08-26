const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const db = require("../db/pool");
const { render } = require("ejs");

function getIndexPage(req, res){
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

async function getHomePage(req, res) {
    const membership_status = req.user?.membership_status || false; // Default to false if not available
    try {
        const result = await db.query("SELECT * FROM messages");
        const messages = result.rows;
        res.render("homePage", { membership_status, messages });
    } catch (err) {
        console.error("ERROR:", err);
        res.render("homePage", { membership_status, messages: [] });
    }
}

async function memberSignInGet(req, res) {
    try {
        const result = await db.query("SELECT * FROM messages");
        const messages = result.rows;
        res.render("memberSignIn", { messages });
    } catch (err) {
        console.error("ERROR:", err);
        res.render("memberSignIn", { messages: [], errors: [{ msg: 'An error occurred while fetching messages.' }] });
    }
}

async function memberSignInPost(req, res) {
    const { password } = req.body; // Assuming password is sent in the body
    const user = req.user;
    console.log(user);
    try {
        const result = await db.query("SELECT password FROM member_password"); 
        const memberPassword = result.rows[0]?.password;

        if (memberPassword === password) {
            // Update membership status if password matches
            await db.query("UPDATE users SET membership_status = true WHERE user_id = $1", [user.user_id]);
            res.redirect("/homePage");
        } else {
            // Handle incorrect password or missing user
            res.render("memberSignIn", { errors: [{ msg: 'Incorrect password or user not found.' }] });
        }
    } catch (err) {
        console.error(err);
        res.render("memberSignIn", { errors: [{ msg: 'An error occurred. Please try again.' }] });
    }
}


module.exports = {
    getIndexPage,
    getLoginPage,
    getSignUpPage,
    postSignUpPage,
    getHomePage,
    memberSignInGet, 
    memberSignInPost
}