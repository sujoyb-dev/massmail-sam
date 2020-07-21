const passportStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt-nodejs");
const User = require("../models/user");

/**
 * @function passport
 * returns promisified done status for login/register
 */
module.exports = passport => {
  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    User.findById(id)
      .exec()
      .then(user => done(null, user))
      .catch(err => done(err));
  });

  passport.use(
    "login",
    new passportStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
      },
      (req, email, password, done) => {
        process.nextTick(() => {
          User.findOne({
            email: email
          })
            .exec()
            .then(user => {
              console.log(user);
              if (!user) {
                return done(null, false, {
                  message: "User not found."
                });
              }
              if (!bcrypt.compareSync(password, user.password)) {
                console.log("Wrong Password");
                return done(null, false, {
                  message: "Wrong password."
                });
              }
              if (user.status === "blocked") {
                return done(null, false, {
                  message: "User blocked from logging in."
                });
              }
              return done(null, user);
            })
            .catch(err => done(err));
        });
      }
    )
  );
};
