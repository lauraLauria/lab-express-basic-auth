// routes/auth.routes.js

const router = require("express").Router();
const User = require("./../models/User.model");
const bcrypt = require("bcryptjs");


const isLoggedIn = require("./../middleware/isLoggedIn");

const saltRounds = 10;



// GET  /signup
router.get("/signup", (req, res) => {
  res.render("auth/signup-form");
});

// POST /signup
router.post("/signup", (req, res) => {
  // Get the username and password from the req.body
  const { username, password } = req.body;

  // Check if the username and the password are provided
  const usernameNotProvided = !username;
  const passwordNotProvided = !password;

  if (usernameNotProvided || passwordNotProvided) {
    res.render("auth/signup-form", {
      errorMessage: "Provide username and password.",
    });

    return;
  }

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;

  if (!regex.test(password)) {
    res.status(400).render("auth/signup-form", {
      errorMessage:
        "Password needs to have at least 8 chars and must contain at least one number, one lowercase and one uppercase letter.",
    });

    return;
  }

  // Check that the username is not taken
  User.findOne({ username: username })
    .then((foundUser) => {
      if (foundUser) {
        throw new Error("The username is taken");
      }

      // Generating the salt string pass to the next then block
      return bcrypt.genSalt(saltRounds);
    })
    .then((salt) => {
      // Encrypt the password
      return bcrypt.hash(password, salt);
    })
    .then((hashedPassword) => {
      // Create the new user
      return User.create({ username: username, password: hashedPassword });
      // return User.create({ username, password: hashedPassword });
    })
    .then((createdUser) => {
      console.log("User created successfully! => ", createdUser);
      // Redirect to the home `/` page after the successful signup
      createdUser.password = null;

      req.session.user = createdUser;
      console.log(req.session.user);
      res.redirect("/");
    })
    .catch((err) => {
      res.render("auth/signup-form", {
        errorMessage: err.message || "Error while trying to sign up",
      });
    });
});

// GET /login
router.get("/login", (req, res) => {
  res.render("auth/login-form");
});

// POST /login
router.post("/login", (req, res) => {
  // Get the username and password from the req.body
  const { username, password } = req.body;

  // Check if the username and the password are provided
  // const usernameNotProvided = !username;
  // const passwordNotProvided = !password;
  console.log(username, password);
  if (!username || !password) {
    res.render("auth/login-form", {
      errorMessage: "first => Provide username and password.",
    });

    return;
  }

  let user;
  // Check if the user exists
  User.findOne({ username: username })
    .then((foundUser) => {
      user = foundUser;

      if (!foundUser) {
        // throw new Error("User not found");
        res.render("auth/login-form", {
          errorMessage: "User not found",
        });
      }

      // Compare the passwords
      return bcrypt.compare(password, foundUser.password);
    })
    .then((isCorrectPassword) => {
      if (!isCorrectPassword) {
        // throw new Error("Password is wrong!");
        res.render("auth/login-form", {
          errorMessage: "Password is wrong",
        });
      } else if (isCorrectPassword) {
        // Create the session + cookie and redirect the user
        // This line triggers the creation of the session in the DB,
        // and setting of the cookie with session id that will be sent with the response
        req.session.user = user;
        res.redirect("/");
      }
    })
    .catch((err) => {
      console.log("134 error => ", err);
      res.status(500).render("auth/login-form", {
        errorMessage: "Internal server error",
      });
    });
});

// GET /logout
router.get("/logout", isLoggedIn, (req, res) => {
  // Delete the session from the sessions collection
  // This automatically invalidates the future request with the same cookie
  req.session.destroy((err) => {
    if (err) {
      return res.render("error");
    }
    res.clearCookie("connect.sid");
    // If session was deleted successfully redirect to the home page.
    res.redirect("/");
  });
});

module.exports = router;
