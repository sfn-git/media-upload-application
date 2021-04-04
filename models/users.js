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
    "rank": {type: String},
    "accountCreated": {type: Date, required: true}

});

module.exports = mongoose.model("Users", users);