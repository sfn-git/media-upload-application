var Datastore = require('nedb');
var db = new Datastore({filename: '../db/db.json', autoload: true});
db.ensureIndex({fieldName: "username", unique: true});

module.exports = db;