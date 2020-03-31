const authUtils = require("../utils/auth");
const db = require("../models");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectID;

module.exports = function(app) {
  app.get("/", checkAuthenticated, getUsername, getExamples, renderIndex);

  app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login");
  });

  app.post(
    "/login",
    checkNotAuthenticated,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: "wrong username or password"
    }),
    (req, res, next) => {
      res.redirect("/");
    }
  );

  app.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("register");
  });

  app.post("/register", checkNotAuthenticated, (req, res, next) => {
    //const hashedPassword = bcrypt.hash(req.body.password, 10);
    const registrationParams = req.body;
    const users = req.app.locals.users;
    const payload = {
      name: registrationParams.name,
      username: registrationParams.username,
      email: registrationParams.email,
      password: authUtils.hashPassword(registrationParams.password)
    };

    users.insertOne(payload, err => {
      if (err) {
        req.flash(
          "error",
          "User account already exists with that email address or username"
        );
        res.redirect("/register");
      } else {
        req.flash("success", "User account registered successfully");
        res.redirect("/login");
      }
    });
  });

  app.delete("/logout", (req, res) => {
    req.logOut();
    res.redirect("/login");
  });

  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    res.redirect("/register");
  }

  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    next();
  }

  function getUsername(req, res, next) {
    const users = req.app.locals.users;
    const _id = ObjectID(req.session.passport.user);
    console.log(_id);
    users.findOne({ _id }, (err, results) => {
      req.name = results.name;
      next();
    });
  }

  function getExamples(req, res, next) {
    db.Example.findAll({}).then(function(data) {
      //console.log(dbExamples);
      req.example = data;
      next();
    });
  }

  function renderIndex(req, res) {
    //console.log(req.examples[0].text);
    res.render("index", { name: req.name, examples: req.example });
  }
};
