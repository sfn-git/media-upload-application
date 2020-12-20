require('dotenv').config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bcrypt = require("bcrypt");
const formidable = require('formidable');

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

// Database
const User = require("./models/users");
const MONGO_URI = process.env.MONGO_URI;
require("mongoose").connect(MONGO_URI,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true},(err)=>{
    if(err){console.log(err);}else{console.log("Connected to mongo");}
});

// Session
var session = require('express-session');
app.use(session({
    secret: "Change this later",
    resave: false,
    saveUninitialized: true
}));

// Passport
const passport = require("passport");
const ensuredAuthenticated = require("./config/ensuredAuthenticated");
var LocalStrategy = require("passport-local").Strategy;
passport.use(new LocalStrategy(
    (username, password, done) =>{
        User.findOne({username: username}, (err, user)=>{
            if(err){return done(err);}
            if(!user){
                console.log(`Incorrect username: ${username}`);
                return done(null, false, {message: "Incorrect username and password combination."});
            }
            if(!bcrypt.compareSync(password, user.password)){
                console.log(`Incorrect password for: ${username}`);
                return done(null, false, {message: "Incorrect username and password combination."});
            }
            return done(null, user);
        });
    }
));

passport.serializeUser((user, done)=>{
    done(null, user);
});

passport.deserializeUser((id, done)=>{
    User.findById(id, (err, user)=>{
        done(err, user);
    });
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req,res)=>{

    res.render("login");

});

app.post("/login", passport.authenticate('local', {failureRedirect: "/"}),(req,res)=>{
    res.redirect("/home");
});

app.get("/create", (req,res)=>{
    res.render("create");
});

app.post("/create", (req,res)=>{

    var username = req.body.username.trim().toLowerCase();
    var name = req.body.name.trim();

    var user = new User({
        "username": username,
        "password": bcrypt.hashSync(req.body.password, 8),
        "name": name,
        "rank": "user"
    });
    user.save((err, document)=>{
        if(err){
            res.status(500).send("Fail");
        }else{
            res.status(200).send("Success");
        }
        
    });
});

app.get("/home", ensuredAuthenticated, (req,res)=>{
    res.render("home", {user: req.user});
});

app.get("/upload", ensuredAuthenticated, (req,res)=>{

    res.render("upload", {user: req.user});

});

var fs = require('fs');
var path = require('path');

// Thank you for the help
// https://medium.com/@sophiesophie/node-js-tutorials-building-a-file-uploader-with-node-js-2808cac30a31

app.post("/upload", ensuredAuthenticated, (req,res)=>{
    const form = new formidable.IncomingForm();

    form.maxFileSize = 2000*1024*1024;
    form.multiples = false;
    form.uploadDir = path.join(__dirname, '/public/content');

    var URL;

    form.on('file', async (field, file)=>{
        form.uploadDir = path.join(__dirname, '/public/content');
        var fileExt = path.extname(file.name);
        var fileName = `${Date.now()}${fileExt}`;
        var filePath = path.join(form.uploadDir, fileName);
        fs.renameSync(file.path, filePath);

        const SITE_URL = process.env.SITE_URL;
        URL = `${SITE_URL}/content/${fileName}`;

        if(fileExt == ".mp4"){
            try {
                await User.findByIdAndUpdate(req.user.id, {$push: {videos: URL}});
            } catch (error) {
                throw error;
            }
        }
    });

    form.on('error', (err)=>{
        console.log(err);
        res.status(500);
    });

    form.on('end', ()=>{
        res.send({success: true, URL});
    });

    form.parse(req);

});

app.listen(port, ()=>{console.log(`http://localhost:${port}`);});