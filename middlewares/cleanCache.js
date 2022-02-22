const { clearCache } = require('../services/cache');

module.exports =  (req,res,next) => {
    next();
    clearCache(req.user.id)
}