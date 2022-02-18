const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const keys = require("../config/keys") 

const client = redis.createClient(keys.redisUrl);
// update get to hget
client.hget = util.promisify(client.hget);

//original exec method

const exec = mongoose.Query.prototype.exec;

// setup a prop called cache in oder to turn on and off caching 
mongoose.Query.prototype.cache = function(options={}){
    this.useCache = true;
    //JSON sitringify options key in case key is not a num or string
    this.hashKey = JSON.stringify(options.key || '')
    return this
}

mongoose.Query.prototype.exec = async function () {

    if(!this.useCache){
        return await exec.apply(this, arguments)
    }
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  // See if we have a value for 'key' in redis
  const cachedValue = await client.hget(this.hashKey, key)

  if(cachedValue){
      //const doc = new this.model(JSON.parse(cachedValue))
      const doc = (JSON.parse(cachedValue))
      console.log("here")
      return Array.isArray(doc)
        ? doc.map(d => new this.model(d))
        : new this.model(doc)
    //   return doc._doc
  }
  //if we do, return that

  //otherwise, issue the query and store the redult in redis

  const result = await exec.apply(this, arguments);
  //console.log("here!!",JSON.stringify(result))
  client.hset(this.hashKey, key, JSON.stringify(result))
  return result
};

module.exports = {
    clearCache(hashKey){
        client.del(JSON.stringify(hashKey));
    }
}
