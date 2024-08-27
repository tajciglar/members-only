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
            formData: req.body     
        });
    }

    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [req.body.username]);
        if (result.rows.length > 0) {
            return res.render('sign-up', {
                errors: [{ msg: 'Username already exists' }],
                formData: req.body     
            });
        }

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
            formData: req.body     
        });
    }
}

function getLoginPage(req, res) {
    const successMessage = req.query.signup === 'success' ? 'Account created successfully! Please log in.' : '';
    res.render("log-in", { message: [], formData: [], successMessage });
}

async function getHomePage(req, res) {
    try {
        const result = await db.query(`
            SELECT 
                messages.message_id,
                messages.user_id,
                messages.title,
                messages.text,
                messages.created_at,
                users.first_name,
                users.last_name
            FROM 
                messages 
            JOIN 
                users 
            ON 
                messages.user_id = users.user_id
        `);        
        const messages = result.rows;
        res.render("homePage", { user: req.user, messages });
    } catch (err) {
        console.error("ERROR:", err);
        res.render("homePage", { user: req.user, messages: [] });
    }
}

async function addMessage(req, res) {
    const { title, text} = req.body;
    const user = req.user.username;
    const date = new Date();
    try {
        const user_id = await db.query("SELECT user_id FROM users WHERE username = $1", [user]);
        await db.query("INSERT INTO messages (user_id, title, text, created_at) VALUES ($1, $2, $3, $4)", [user_id.rows[0].user_id, title, text, date]);
        res.redirect("/homePage");
    } catch (err) {
        console.error(err);
        res.redirect("/homePage");
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


async function deleteMessage(req, res) {
    const message_id = req.params.message_id;
    try {
        await db.query("DELETE FROM messages WHERE message_id = $1", [message_id]);
        res.redirect("/homePage");
    } catch (err) {
        console.error(err);
        res.redirect("/homePage");
    }
}

module.exports = {
    getIndexPage,
    getLoginPage,
    getSignUpPage,
    postSignUpPage,
    addMessage,
    getHomePage,
    memberSignInGet, 
    memberSignInPost,
    deleteMessage
}