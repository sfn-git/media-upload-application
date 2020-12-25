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
        "unique": {type: String, sparse: true}
    }],
    "videos": [{
        url: {type: String},
        name: {type: String},
        date: {type: Date},
        fileName: {type: String},
        "unique": {type: String, sparse: true}
    }],
    "rank": {type: String}

});

module.exports = mongoose.model("Users", users);