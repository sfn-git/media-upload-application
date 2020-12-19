const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bcrypt = require("bcrypt");
const db = require("./config/db");

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.get("/", (req,res)=>{

    res.render("login");

});

app.get("/create", (req,res)=>{

    res.render("create");

});

app.post("/create", async (req,res)=>{

    var username = req.body.username.trim().toLowerCase();
    var password = req.body.password;
    var name = req.body.name.trim();

    var data = {
        username,
        password: await bcrypt.hashSync(req.body.password, 8),
        name,
        content: {
            photos: [],
            videos: []
        },
        rank: "user"
    };

    db.insert(data,(err,document)=>{
        if(err){
            console.log(err);
            res.send({"status": false, "message": "Cannot create account :("});
        }else{
            console.log(document);
            res.send({"status": true, "message": "Account Created"});
        }
    });
});

app.listen(port, ()=>{console.log(`http://localhost:${port}`);});