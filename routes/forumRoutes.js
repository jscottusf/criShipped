const db = require("../models");
const ObjectID = require("mongodb").ObjectID;
const startCase = require("lodash.startcase");

module.exports = function(app) {
  app.get("/forum", getUserinfo, getPosts, getCities, renderForum);

  app.get("/api/posts", function(req, res) {
    db.Post.findAll({}).then(function(data) {
      res.json(data);
    });
  });

  app.get("/forum/edit/:id", getUserinfo, getPost, checkMatch);
  //   db.Post.findOne({
  //     where: {
  //       id: req.params.id,
  //     },
  //   }).then(function(dbPost) {
  //     res.render("editpost", { post: dbPost });
  //     console.log(post);
  //   });
  // });

  app.get("/forum/:city", getUserinfo, getCityPosts, getCities, renderForum);

  // Create a new Home
  app.post("/api/posts", function(req, res) {
    db.Post.create(req.body).then(function(data) {
      res.json(data);
    });
  });

  app.put("/api/posts", function(req, res) {
    console.log(req.body);
    db.Post.update(req.body, {
      where: {
        id: req.body.id,
      },
    }).then(function(data) {
      res.json(data);
    });
  });

  function getUserinfo(req, res, next) {
    if (!req.isAuthenticated()) {
      req.flash("error", "You must be logged in to view forum");
      res.redirect("/login");
    } else {
      const users = req.app.locals.users;
      const _id = ObjectID(req.session.passport.user);

      users.findOne({ _id }, (err, results) => {
        req.userdata = results;
        next();
      });
    }
  }

  function getCityPosts(req, res, next) {
    var city = req.params.city;
    db.Post.findAll({
      where: { city: city },
      order: [["id", "DESC"]],
    }).then(function(data) {
      req.post = data;
      next();
    });
  }

  function getPosts(req, res, next) {
    db.Post.findAll({
      order: [["id", "DESC"]],
    }).then(function(data) {
      req.post = data;
      next();
    });
  }

  function getCities(req, res, next) {
    var allCities = req.post;
    var cities = [];
    for (var i = 0; i < allCities.length; i++) {
      var city = startCase(allCities[i].city);
      if (cities.indexOf(city) === -1) {
        cities.push(city);
      }
    }
    req.cityList = cities;
    next();
  }

  function getPost(req, res, next) {
    db.Post.findOne({
      where: {
        id: req.params.id,
      },
    }).then(function(dbPost) {
      //res.render("editpost", { post: dbPost });
      req.post = dbPost;
      next();
    });
  }

  function checkMatch(req, res, next) {
    console.log(req.userdata.username + " " + req.post.user);
    if (req.userdata.username === req.post.user) {
      res.render("editpost", { ...req });
    } else {
      req.flash("error", "You can't edit other people's posts");
      res.redirect("/forum");
    }
  }

  function renderForum(req, res) {
    res.render("forum", { ...req });
  }
};
