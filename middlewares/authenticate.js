async function authenticate(req, res, next){
    // if (req.isAuthenticated()){
        next();
    // }
    // else {
    //     res.status(401).send({
    //         error: "User not Authenticated!"
    //     });
    // }
}

module.exports =  authenticate;