const { clearCache } = require('../services/cache');

module.exports =  (req,res,next) => {
    console.log("before next")
    next();
    console.log("after next")
    console.log("before clear")
    clearCache(req.user.id)
    console.log("after clear")
}