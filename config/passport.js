const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db/pool'); 


    // Serialize user to store user ID in session
    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    // Deserialize user from session
    passport.deserializeUser((id, done) => {
        db.query('SELECT * FROM users WHERE user_id = $1', [id])
            .then(result => {
                done(null, result.rows[0]);
            })
            .catch(err => done(err));
    });

    // Local strategy for username and password authentication
    passport.use(
        new LocalStrategy(async (username, password, done) => {
          try {
            const { rows } = await db.query("SELECT * FROM users WHERE username = $1", [username]);
            const user = rows[0];
            console.log(user);
            if (!user) {
              return done(null, false, { message: "Incorrect username" });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: "Incorrect password" })
            }
       
            return done(null, user);
          } catch(err) {
            return done(err);
          }
        })
      );
    module.exports = passport;