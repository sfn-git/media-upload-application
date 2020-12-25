require('dotenv').config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bcrypt = require("bcrypt");
const formidable = require('formidable');
const SITE_URL = process.env.SITE_URL;

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
const ensuredAuthenticatedAPI = require("./config/ensuredAuthenticatedAPI");
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
    res.redirect("/me");
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
        "rank": "user",
        "photos": [],
        "videos": []
    });
    user.save((err, document)=>{
        if(err){
            console.log(err);
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

    console.log("test");

    form.parse(req);
    form.maxFileSize = 2000*1024*1024;
    form.multiples = false;
    form.uploadDir = path.join(__dirname, '/content');

    var URL;
    var unique;

    var randomString = require("randomstring");

    form.on('file', async (field, file)=>{
        form.uploadDir = path.join(__dirname, '/content');
        var fileExt = path.extname(file.name);
        unique = randomString.generate(8);
        var fileName = `${unique}_${Date.now()}${fileExt}`;
        var filePath = path.join(form.uploadDir, fileName);
        fs.renameSync(file.path, filePath);

        URL = `${SITE_URL}/content/${fileName}`;
        var date = Date.now();

        if(fileExt == ".mp4"){
            try {
                await User.findByIdAndUpdate(req.user.id, {$push: {videos: {url: URL, fileName, unique, date}}});
            } catch (error) {
                console.log(error);
            }
        }else if(fileExt == ".jpg" || fileExt == ".png"){
            try {
                await User.findByIdAndUpdate(req.user.id, {$push: {photos: {url: URL, fileName, unique, date}}});
            } catch (error) {
                console.log(error);
            }
        }else{
            console.log("Not the correct file type");
        }
    });

    form.on('error', (err)=>{
        console.log(err);
        res.status(500);
    });

    form.on('end', ()=>{
        res.send({success: true, URL: `${SITE_URL}/view/${unique}`});
    });

});

app.get("/me", ensuredAuthenticated, async (req,res)=>{

    var user = await User.findById(req.user.id);
    res.render("me", {user, videos: user.videos, photos: user.photos});

});

app.get("/logout", (req,res)=>{
    req.logOut();
    res.redirect("/");
});

app.delete("/video", ensuredAuthenticatedAPI, async (req, res)=>{

    var id = req.body.id;
    var user = await User.findById(req.user.id);
    var dbRemove = true;

    var fileName = path.join(path.join(__dirname,"/content"),getFileName(id, user.videos));
    if(fs.existsSync(fileName)){
        try{
            fs.unlinkSync(fileName);
        }catch(e){
            dbRemove = false;
        }
    }

    if(dbRemove){
        User.updateOne({_id: req.user.id}, {$pull: {videos: {_id: id}}}, (err, document)=>{
            if(err){res.status(500).send("Error");}
            
            res.status(200).send("Deleted");
        });
    }

});

app.delete("/photo", ensuredAuthenticatedAPI, async (req, res)=>{

    var id = req.body.id;
    var user = await User.findById(req.user.id);
    var dbRemove = true;

    var fileName = path.join(path.join(__dirname,"/content"),getFileName(id, user.videos));
    if(fs.existsSync(fileName)){
        try{
            fs.unlinkSync(fileName);
        }catch(e){
            dbRemove = false;
        }
    }

    User.updateOne({_id: req.user.id}, {$pull: {photos: {_id: id}}}, (err, document)=>{
        if(err){res.status(500).send("Error");}
        res.status(200).send("Deleted");
    });

});

app.get("/view/:unique", async (req,res)=>{

    var unique = req.params.unique;

    try {
        var user = await User.find({videos: {$elemMatch: {unique}}});

        if(user.length > 0){
            var videos = user[0].videos;
            var content;

            for(var i in videos){
                if(videos[i].unique == unique){
                    content = videos[i];
                    content.type = "video";
                    break;
                }
            }

            if(content.type === "video"){
                res.render("view", {video: content, user: user.name, site: SITE_URL});
            }else{
                res.render("404");
            }

        }else{
            res.render("404");
        }
    } catch (error) {
        console.log(error);
        res.render("404");
    }

});

app.listen(port, ()=>{console.log(`http://localhost:${port}`);});

function getFileName(id, contentArray){
    for(var i in contentArray){
        if(contentArray[i]._id == id){
            return contentArray[i].fileName;
        }
    }
    return "dne";
}