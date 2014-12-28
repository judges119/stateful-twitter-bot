//Core modules
var path = require('path');

/*
Constructor
Ensure FILE/DIR paths are either absolute paths or are relative to the server.js file for the 140charADV project
*/
function Config(basedir) {
  //Bunyan
  this.LOG_FILE = 'log.log';
  //Twit
  this.CONSUMER_KEY = process.env.CONSUMER_KEY || 'TEST';
  this.CONSUMER_SECRET = process.env.CONSUMER_SECRET || 'TEST';
  this.ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'TEST';
  this.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'TEST';
  //Bot
  this.HANDLE = '@handle';
  this.START_LOCATION = [0, 0, 0];
  this.START_REALM = 'start';
  this.INTERACTION_LOG_FILE = 'interaction.log';
  //LoadWorld
  this.WORLD_DIR = 'data/world';
  //MongoDB
  var db_username = process.env.DB_USERNAME || false;
  var db_password = process.env.DB_PASSWORD || false;
  var db_host = process.env.DB_HOST || 'localhost';
  var db_port = process.env.DB_PORT || 27017;
  var db_database = process.env.DB_DATABASE || '140charADV';
  this.MONGODB_LINK = ((!db_username) && (!db_password)) ? 'mongodb://' + db_host + ':' + db_port + '/' + db_database : 'mongodb://' + db_username + ':' + db_password + '@' + db_host + ':' + db_port + '/' + db_database;

  //Clear and freeze the prototype
  this.prototype = {};
  Object.freeze(this.prototype);

  //Returns a frozen instance of itself, first ensuring/converting all FILE/DIR variables to absolute paths through an IIFE
  return Object.freeze((function(self) {
    (path.resolve(self.LOG_FILE) === self.LOG_FILE) || self.LOG_FILE = path.join(basedir, self.LOG_FILE);
    (path.resolve(self.INTERACTION_LOG_FILE) === self.INTERACTION_LOG_FILE) || self.INTERACTION_LOG_FILE = path.join(basedir, self.INTERACTION_LOG_FILE);
    (path.resolve(self.WORLD_DIR) === self.WORLD_DIR) || self.WORLD_DIR = path.join(basedir, self.WORLD_DIR);
    return self;
  })(this));
}

module.exports = Config;