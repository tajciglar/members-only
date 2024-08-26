require('dotenv').config();
const express = require("express");
const routes = require('./routes/routes');
const session = require("express-session");
const passport = require("./config/passport");

const app = express();
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
console.log(__dirname)

const PORT = process.env.PORT || 3000;

app.use("/", routes)

app.listen(PORT, () => {
    console.log(`App listening on port${PORT} `, PORT);
})