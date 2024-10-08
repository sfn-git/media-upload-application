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
    if(req.user){
        if(req.user.rank === "Admin"){
            res.render('create');
        }else{
            res.render("404");
        }
    }else{
        res.render("404");
    }
    
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
        "videos": [],
        "files": [],
        "accountCreated": Date.now()
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

app.get("/settings", ensuredAuthenticated, (req,res)=>{

    res.render("settings", {user: req.user});

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
const users = require('./models/users');
// const uploadFile = require('./api/upload-google');
// const deleteFile = require('./api/delete-google');
const uploadFile = require('./api/upload-s3');
const deleteFile = require('./api/delete-s3');

app.post("/upload", ensuredAuthenticated, (req,res)=>{
    const form = new formidable.IncomingForm();

    form.parse(req);
    form.maxFileSize = parseInt(process.env.MAX_FILE_SIZE);
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

        if(fileExt == ".mp4"){
            try {
                URL = await uploadFile(filePath, fileName, fileExt);
                var date = Date.now();
                await User.findByIdAndUpdate(req.user.id, {$push: {videos: {url: URL, fileName, unique, date}}});
                res.send({success: true, URL: `${URL}`, unique});
            } catch (error) {
                console.log(error);
            }
        }else if(fileExt == ".jpg" || fileExt == ".png"){
            try {
                URL = await uploadFile(filePath, fileName, fileExt);
                var date = Date.now();
                await User.findByIdAndUpdate(req.user.id, {$push: {photos: {url: URL, fileName, unique, date}}});
                res.send({success: true, URL: `${URL}`, unique});
            } catch (error) {
                console.log(error);
                res.status(500);
            }
        }else{
            URL = await uploadFile(filePath, fileName, fileExt);
            var date = Date.now();
            await User.findByIdAndUpdate(req.user.id, {$push: {files: {url: URL, fileName, unique, date}}});
            res.send({success: true, URL: `${URL}`, unique});
            // console.log("Not the correct file type");
            // fs.unlinkSync(filePath);
            // res.send({success: false, message: "Failed to upload file. Please upload .mp4, .jpg, or .png only."});
        }
    });

    form.on('error', (err)=>{
        console.log(err);
        res.status(500);
    });

});

app.get("/me", ensuredAuthenticated, async (req,res)=>{

    var user = await User.findById(req.user.id);

    var photos = user.photos;
    var videos = user.videos;
    var files = user.files

    videos.sort((a, b)=>{
        return new Date(b.date) - new Date(a.date);
    });
    photos.sort((a, b)=>{
        return new Date(b.date) - new Date(a.date);
    });

    files.sort((a,b)=>{
        return new Date(b.date) - new Date(a.date);
    })
    res.render("me", {user, videos: user.videos, photos, files});

});

app.get("/profile/:id", ensuredAuthenticated, async (req,res)=>{

    if(req.user.rank === "Admin"){
        var id = req.params.id;
        var user = await User.findById(id);

        var photos = user.photos;
        var videos = user.videos;
        var files = user.files;

        videos.sort((a, b)=>{
            return new Date(b.date) - new Date(a.date);
        });
        photos.sort((a, b)=>{
            return new Date(b.date) - new Date(a.date);
        });
        files.sort((a, b)=>{
            return new Date(b.date) - new Date(a.date);
        });
        res.render("me", {user, videos: user.videos, photos, admin: true, files});
    }else{
        res.render("404");
    }

});

app.get("/admin", ensuredAuthenticated, async (req, res)=>{

    if(req.user.rank === "Admin"){
        res.render("admin", {user: req.user});
    }else{
        res.render("404");
    }

});

app.get("/lookup", ensuredAuthenticated, async (req, res)=>{

    if(req.user.rank === "Admin"){
        var users = await User.find().sort({ _id: -1 }).limit(10);
        res.render("lookup", {user: req.user, users});
    }else{
        res.render("404");
    }
});

app.get("/logout", (req,res)=>{
    req.logOut();
    res.redirect("/");
});

// Delete operations
// ----------------------------------Helper Functions---------------------------------------------------------
function getFileName(id, contentArray){
    for(var i in contentArray){
        if(contentArray[i]._id == id){
            return {fileName: contentArray[i].fileName || "dnf", thumbNail: contentArray[i].thumbNail || "dnf"};
        }
    }
    return "dne";
}

// function deleteFile(fileName){
//     var filePath = path.join(path.join(__dirname,"/content"),fileName);
//     if(fs.existsSync(filePath)){
//         try{
//             // File was removed
//             fs.unlinkSync(filePath);
//             return true;
//         }catch(e){
//             // Error while deleting file
//             return false;
//         }
//     }else{
//         // File is already deleted
//         return true;
//     }
// }
// ----------------------------------------------------------------------------------------------------

// -----------------------------------End-Points-------------------------------------------------------
app.delete("/video", ensuredAuthenticatedAPI, async (req, res)=>{

    var id = req.body.id;
    var userID;
    if(req.body.isAdmin === "true"){
        if(req.user.rank === "Admin"){
            userID = req.body.userID;
        }
    }else{
        userID = req.user.id;
    }
    var user = await User.findById(userID);

    var fileName = getFileName(id, user.videos).fileName;
    await deleteFile(fileName);

    User.updateOne({_id: userID}, {$pull: {videos: {_id: id}}}, (err, document)=>{
        if(err){res.status(500).send("Error");}
        res.status(200).send("Deleted");
    });
});


app.delete("/photo", ensuredAuthenticatedAPI, async (req, res)=>{
    var id = req.body.id;
    var userID;
    if(req.body.isAdmin === "true"){
        if(req.user.rank === "Admin"){
            userID = req.body.userID;
        }
    }else{
        userID = req.user.id;
    }
    var user = await User.findById(userID);
    
    var fileName = getFileName(id, user.photos).fileName;
    var dbRemove = deleteFile(fileName);

    if(dbRemove){
        User.updateOne({_id: userID}, {$pull: {photos: {_id: id}}}, (err, document)=>{
            if(err){res.status(500).send("Error");}
            res.status(200).send("Deleted");
        });
    }else{
        res.status(200).send("Unable to delete");
    }

});

app.delete("/file", ensuredAuthenticatedAPI, async (req, res)=>{
    var id = req.body.id;
    var userID;
    if(req.body.isAdmin === "true"){
        if(req.user.rank === "Admin"){
            userID = req.body.userID;
        }
    }else{
        userID = req.user.id;
    }
    var user = await User.findById(userID);
    
    var fileName = getFileName(id, user.files).fileName;
    var dbRemove = deleteFile(fileName);

    if(dbRemove){
        User.updateOne({_id: userID}, {$pull: {files: {_id: id}}}, (err, document)=>{
            if(err){res.status(500).send("Error");}
            res.status(200).send("Deleted");
        });
    }else{
        res.status(200).send("Unable to delete");
    }

});

// Deletes user from db and removes all of their videos
app.delete("/user/:id", ensuredAuthenticatedAPI, async (req,res)=>{

    var id = req.params.id;

    if(req.user.rank == "Admin"){
        try{
            var user = await User.findById(id);
            var videos = user.videos;
            var photos = user.photos;

            for(var i in videos){
                deleteFile(videos[i].fileName);
            }

            for(var j in photos){
                deleteFile(photos[i].fileName);
            }

            await User.findByIdAndDelete(id);

            res.send("Deleted");
        }catch(e){
            console.log(e);
            res.status(500);
        }
    }else{
        res.status(401).send("Unauthorized");
    }

});

// ----------------------------------------------------------------------------------------------------
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
                res.render("view", {video: content, user: user[0].name, site: SITE_URL});
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
            console.log(error);
            res.status(501);
        }
});

// Changing password
app.patch("/changepassword",
body('currentPassword').isEmpty().trim().escape(),
body('newPassword').not().isEmpty().trim().escape(),
body('confirmNewPassword').not().isEmpty().trim().escape(),
ensuredAuthenticatedAPI,
async (req, res)=>{
    
    const passwords = req.body;
    if(passwords.currentPassword == "" || passwords.newPassword == "" || passwords.confirmNewPassword == ""){
        res.send({status: false, message: "Please fill all boxes."});
    }else if(passwords.newPassword != passwords.confirmNewPassword){
        res.send({status: false, message: "Passwords do not match."});
    }else if(!bcrypt.compareSync(passwords.currentPassword, req.user.password)){
        res.send({status: false, message: "Current password incorrect"});
    }else if(passwords.currentPassword == passwords.newPassword){
        res.send({status: false, message: "New password cannot be the same as your old password."});
    }else{
        const thisUser = await users.findById(req.user._id);
        thisUser.password = bcrypt.hashSync(passwords.newPassword, 8);
        thisUser.save((err)=>{
            if(err){
                console.log(err);
                res.send({status: false, message: "Something went wrong changing your password. Please try again later."});
            }else{
                req.logout();
                res.send({status: true, message: "Password successfully changed!"});
            }
        });
    }

});

app.listen(port, ()=>{console.log(`http://localhost:${port}`);});