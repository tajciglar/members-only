const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('../db/pool'); // Replace with your actual database module

module.exports = function(passport) {
    // Serialize user to store user ID in session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser((id, done) => {
        db.query('SELECT * FROM users WHERE id = $1', [id])
            .then(result => {
                done(null, result.rows[0]);
            })
            .catch(err => done(err));
    });

    // Local strategy for username and password authentication
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const { rows } = await db.query(`SELECT * FROM users WHERE username = $1`, [username])
                const user = rows[0];

                if (!user) {
                    return done(null, false, { message: "Incorrect username" });
                  }
                  
                  if (user.password !== password) {
                    return done(null, false, { message: "Incorrect password" });
                  }
                  return done(null, user);
            }  catch (err) {

            }
            db.query('SELECT * FROM users WHERE username = $1', [username])
                .then(result => {
                    const user = result.rows[0];
                    if (!user) {
                        return done(null, false, { message: 'No user with that username' });
                    }
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;
                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: 'Password incorrect' });
                        }
                    });
                })
                .catch(err => done(err));
        }
    ));
};
