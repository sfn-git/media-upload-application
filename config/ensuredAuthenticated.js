module.exports = (req,res,next)=>{
    if(req.isAuthenticated()){
        req.rank = req.user.rank;
        return next();
    }
    res.redirect("/");
};