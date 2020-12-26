require('dotenv').config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bcrypt = require("bcrypt");
const formidable = require('formidable');
const SITE_URL = process.env.SITE_URL;
const {body} = require('express-validator');

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

// Database
const User = require("./models/users");
const MONGO_URI = process.env.MONGO_URI;
require("mongoose").connect(MONGO_URI,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false},(err)=>{
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

    if(req.isAuthenticated()){
        res.redirect("/me");
    }else{
        res.render("login");
    }

});

app.post("/login", 
    body('username').not().isEmpty().trim().escape().toLowerCase(),
    body('password').not().isEmpty().trim().escape(), 
    passport.authenticate('local', {failureRedirect: "/"}),(req,res)=>{
    res.redirect("/me");
});

app.get("/create", (req,res)=>{
    res.render("create");
});

app.post("/create", 
    body('username').not().isEmpty().trim().escape().toLowerCase(),
    body('password').not().isEmpty().trim().escape(),
    body('name').trim().escape(),
(req,res)=>{

    var username = req.body.username;
    var name = req.body.name;

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
            res.status(200).send({status: true, message: "Success"});
        }
        
    });
});

app.get("/home", ensuredAuthenticated, (req,res)=>{
    res.render("home", {user: req.user});
});

app.get("/upload", ensuredAuthenticated, (req,res)=>{

    res.render("upload", {user: req.user});

});

/* 
Thank you for the help
https://medium.com/@sophiesophie/node-js-tutorials-building-a-file-uploader-with-node-js-2808cac30a31
File Upload Endpoint and Logic
 */
var fs = require('fs');
var path = require('path');
const staticFfprobe = require("ffprobe-static").path;
const staticFfmpeg = require("ffmpeg-static");
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfprobePath(staticFfprobe);
ffmpeg.setFfmpegPath(staticFfmpeg);
var exec = require('child_process').exec;

app.post("/upload", ensuredAuthenticated, (req,res)=>{
    const form = new formidable.IncomingForm();

    form.parse(req);
    form.maxFileSize = 2000*1024*1024;
    form.multiples = false;
    form.uploadDir = path.join(__dirname, '/content');

    var URL;
    var unique;
    var isCorrect = true;

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
        var height;
        var width;

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
            fs.unlinkSync(filePath);
            isCorrect = false;
        }
    });

    form.on('error', (err)=>{
        console.log(err);
        res.status(500);
    });

    form.on('end', ()=>{
        if(isCorrect){
            res.send({success: true, URL: `${SITE_URL}/view/${unique}`, unique});
        }else{
            res.send({success: false, message: "Failed to upload file. Please upload .mp4, .jpg, or .png only."});
        }
        
    });

});

app.get("/me", ensuredAuthenticated, async (req,res)=>{

    var user = await User.findById(req.user.id);

    var photos = user.photos;
    var videos = user.videos;

    videos.sort((a, b)=>{
        return new Date(b.date) - new Date(a.date);
    });
    photos.sort((a, b)=>{
        return new Date(b.date) - new Date(a.date);
    });
    res.render("me", {user, videos: user.videos, photos});

});

app.get("/logout", (req,res)=>{
    req.logOut();
    res.redirect("/");
});

// Delete operations

function getFileName(id, contentArray){
    for(var i in contentArray){
        if(contentArray[i]._id == id){
            return {fileName: contentArray[i].fileName || dnf, thumbNail: contentArray[i].thumbNail || "dnf"};
        }
    }
    return "dne";
}

app.delete("/video", ensuredAuthenticatedAPI, async (req, res)=>{

    var id = req.body.id;
    var user = await User.findById(req.user.id);
    var dbRemove = true;

    var fileName = path.join(path.join(__dirname,"/content"),getFileName(id, user.videos).fileName);
    var thumbFileName = path.join(path.join(__dirname,"/content/thumbnails"),getFileName(id, user.videos).thumbNail);
    if(fs.existsSync(fileName)){
        try{
            fs.unlinkSync(fileName);
        }catch(e){
            dbRemove = false;
        }
    }

    if(fs.existsSync(thumbFileName)){
        fs.unlinkSync(thumbFileName);
    }

    if(dbRemove){
        User.updateOne({_id: req.user.id}, {$pull: {videos: {_id: id}}}, (err, document)=>{
            if(err){res.status(500).send("Error");}
            res.status(200).send("Deleted");
        });
    }else{
        res.status(200).send("Unable to delete");
    }

});

app.delete("/photo", ensuredAuthenticatedAPI, async (req, res)=>{

    var id = req.body.id;
    var user = await User.findById(req.user.id);
    var dbRemove = true;

    var fileName = path.join(path.join(__dirname,"/content"),getFileName(id, user.photos));
    if(fs.existsSync(fileName)){
        try{
            fs.unlinkSync(fileName);
        }catch(e){
            dbRemove = false;
        }
    }

    if(dbRemove){
        User.updateOne({_id: req.user.id}, {$pull: {photos: {_id: id}}}, (err, document)=>{
            if(err){res.status(500).send("Error");}
            res.status(200).send("Deleted");
        });
    }else{
        res.status(200).send("Unable to delete");
    }

});

// Viewing video on webpage
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

// Editing Name
app.patch("/edit", 
    body('name').trim().escape(),
    body('unique').trim().escape(),
    ensuredAuthenticatedAPI, async (req,res)=>{

        try {
            var name = req.body.name;
            var unique = req.body.unique;
            var user = await User.findById(req.user.id);

            var videos = user.videos;
            var photos = user.photos;

            var contentIndex;
            var contentType;

            for(var i in videos){
                if(videos[i].unique == unique){
                    contentIndex = i;
                    contentType = "video";
                }
            }

            for(var i in photos){
                if(photos[i].unique == unique){
                    contentIndex = i;
                    contentType = "photo";
                }
            }

            if(contentType){
                if(contentType == "video"){
                    user.videos[contentIndex].name = name;
                    await user.save();
                }else{
                    user.photos[contentIndex].name = name;
                    await user.save();
                }
                res.send({status: true, message: "Name updated"});
            }else{
                res.send({status: false, message: "Could not find content."});
            }

        } catch (error) {
            console.log(err);
            res.status(501);
        }
});

app.listen(port, ()=>{console.log(`http://localhost:${port}`);});