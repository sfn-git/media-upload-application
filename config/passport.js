var LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

module.exports = (passport) =>{

    passport.use(new LocalStrategy(
        (username, password, done) =>{
            if(username == users.username){


            }else{
               
            }
        }
    ));

};