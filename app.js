require('dotenv').config();
const express = require("express");
const routes = require('./routes/routes');
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy

const app = express();
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

console.log({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


app.use("/", routes)

app.listen(PORT, () => {
    console.log(`App listening on port${PORT} `, PORT);
})