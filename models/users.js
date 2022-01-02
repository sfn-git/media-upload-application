const MONGO_URI = process.env.MONGO_URI;
require("mongoose").connect(MONGO_URI,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false},(err)=>{
    if(err){console.log(err);}else{console.log("Connected to mongo");}
});
const mongoose = require("mongoose");

var users = new mongoose.Schema({

    "username": {type: String, unique: true, required: true},
    "password": {type: String, required: true},
    "name": {type: String},
    "photos": [{
        url: {type: String},
        name: {type: String},
        date: {type: Date},
        fileName: {type: String},
        unique: {type: String, sparse: true},
        height: {type: Number},
        width: {type: Number}
    }],
    "videos": [{
        url: {type: String},
        name: {type: String},
        date: {type: Date},
        fileName: {type: String},
        unique: {type: String, sparse: true},
        height: {type: Number},
        width: {type: Number},
        thumbNail: {type: String},
        thumbNailURL: {type: String}
    }],
    "files":[{
        url: {type: String},
        name: {type: String},
        date: {type: Date},
        fileName: {type: String},
        unique: {type: String, sparse: true}
    }],
    "rank": {type: String},
    "accountCreated": {type: Date, required: true}

});

module.exports = mongoose.model("Users", users);