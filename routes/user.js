const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/users");
const authenticate = require("../middlewares/authenticate");

router.get("/login", (req, res)=>{
    res.render("login");
});

router.get("/signup", (req, res)=>{
    res.render("signup");
});

router.get("/logout", (req, res)=>{
    req.logout((err)=>{
        if (err){
            console.log(err);
        }
        else {
            res.redirect("/");
        }
    });
});

router.get("/profile", authenticate, (req, res)=>{
    res.render("profile");
});

router.post("/login", passport.authenticate("local", { failureRedirect: "/user/login" }), (req, res)=> {
    res.redirect("/");
});

router.post("/signup", (req, res)=>{
    User.register(new User({username: req.body.username, email: req.body.email, isAdmin: false}), req.body.password, (err, user)=>{
        if (err){
            console.log(err);
            res.redirect("/");
        }
        else {
            req.login(user, (err)=>{
                if (err){
                    console.log(err);
                    res.redirect("/");
                }
                else {
                    res.redirect("/");
                }
            });
        }
    });
});

module.exports = router;