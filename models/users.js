const mongoose = require("mongoose");

var users = new mongoose.Schema({

    "username": {type: String, unique: true, required: true},
    "password": {type: String, required: true},
    "name": {type: String},
    "photos": [{
        url: {type: String},
        name: {type: String},
        date: {type: Date, default: Date.now()},
        fileName: {type: String}
    }],
    "videos": [{
        url: {type: String},
        name: {type: String},
        date: {type: Date, default: Date.now()},
        fileName: {type: String}
    }],
    "rank": {type: String}

});

module.exports = mongoose.model("Users", users);