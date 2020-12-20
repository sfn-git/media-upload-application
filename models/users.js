const mongoose = require("mongoose");

var users = new mongoose.Schema({

    "username": {type: String, unique: true, required: true},
    "password": {type: String, required: true},
    "name": {type: String},
    "photos": [{type: String}],
    "videos": [{type: String}],
    "rank": {type: String}

});

module.exports = mongoose.model("Users", users);