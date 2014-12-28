//NPM modules
var bunyan = require('bunyan');
var MongoClient = require('mongodb').MongoClient;
//Local modules
var Config = require('./data/config');
if (process.argv.indexOf('load') == -1) {
  var bot = require('./lib/bot');
} else {
  var loadWorld = require('./lib/loadworld');
}
//Module variables
var CONFIG = new Config(__dirname);
var log = bunyan.createLogger({
  name: 'stateful-twitter-bot',
  streams: [{
    path: CONFIG.LOG_FILE
  }],
  serializers: {
    err: bunyan.stdSerializers.err
  }
});

//Initialise DB connection
MongoClient.connect(CONFIG.MONGODB_LINK, function(err, database) {
  if (err) {
    //Terminate script on failure to connect
    log.fatal({ err: err, module: __filename }, 'DB connection failed, application terminating');
    process.exit(1);
  }
  if (process.argv.indexOf('load') > -1) {
    //If 'load' argument is passed to script, load world and terminate
    loadWorld(CONFIG.WORLD_DIR, database, log);
  } else {
    //Otherwise, initialise bot
    bot(CONFIG, database, log);
  }
});