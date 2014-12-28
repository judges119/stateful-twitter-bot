//Core libraries
var assert = require("assert");
//NPM Modules
var bunyan = require('bunyan');
//Local modules
var PlayerDoc = require('./game-document').PlayerDoc;
var ItemDoc = require('./game-document').ItemDoc;
//Module variables
var CONF;
var db;
var t;
var log;
var interaction_log;

//
//Private functions
//

/*
Process achievements for command
*/
function achievements(item) {
  //If no achievements, return existing player_doc
  if (!item.hasOwnProperty('achievements')) {
    return this;
  }
  //Add any achievements (that aren't already on player) to the player
  var filtered_achievements = item.achievements.filter(function(element, index, array) {
    return (this._achievements.indexOf(element) == -1);
  })
  //Store new achievements
  this._new_achievements.push(filtered_achievements);
  //If achievements have been added, update model and return
  this._achievements = this._achievements.concat(filtered_achievements);
  //Return the updated player_doc
  return this;
}

/*
Create junk characters to append after end of tweet to prevent duplication errors
*/
function appendJunk() {
  //String to build up and then return
  var text = " ";
  //Character space
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 4; i++) {
    //Add for randomly selected cars to the string
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/*
Check if supplied command is an alias, recurse through aliases until real command is found
*/
function checkAlias(doc, command_name, depth) {
  //Handle error if command doesn't exist
  if (!doc.commands.hasOwnProperty(command_name)) {
    log.error({ doc: doc, module: __filename }, 'No command name: ' + command_name + ' on attached document.');
    throw new Error("No command name on document");
  }
  //If depth is undefined, define and initialise it
  if (typeof depth === 'undefined') {
    depth = 0;
  }
  //If it's an alias, recurse
  if (doc.commands[command_name].hasOwnProperty('alias')) {
    //At 10 levels deep (of aliases), abort and throw error
    if (depth >= 10) {
      var info = 'location: [' + doc.location.toString() + '], realm: ' + doc.realm + ', current alias: ' + command_name;
      log.error({ doc: doc, module: __filename }, 'Probable alias redirect loop at: ' + info);
      throw new Error("Probable alias redirect loop");
    }
    return checkAlias(doc, doc.commands[command_name].alias, ++depth);
  } else {
    //If not an alias, return the command object
    return doc.commands[command_name];
  }
}

/*
Check if command can run (meets precluding/required flag requirements)
*/
function checkCapability(command) {
  //If there are precluding flags for this command, iterate through each and if the player meets the conditions run the precluding item
  if (command.hasOwnProperty('precluding_flags')) {
    for (var flag_name in command.precluding_flags) {
      if (numberOf(this._flags, flag_name) >= command.precluding_flags[flag_name].number) {
        this._interaction_name.push('precluding_flag');
        return runItem.call(this, command.precluding_flags[flag_name]);
      }
    }
  }
  //If there are required flags for this command, iterate through each and if the player meets the conditions run the required item
  if (command.hasOwnProperty('required_flags')) {
    for (var flag_name in command.required_flags) {
      if (numberOf(this._flags, flag_name) < command.required_flags[flag_name].number) {
        this._interaction_name.push('required_flag');
        return runItem.call(this, command.required_flags[flag_name]);
      }
    }
  }
  //If no conditions have interfered, run the initial command
  return runItem.call(this, command);
}

/*
Check model integrity, used at the end of the process, after tweeting
*/
function checkPlayerIntegrity() {
  //Check all properties
  assert((typeof this._id_str === 'string') || (this._id_str instanceof String));
  assert((typeof this._screen_name === 'string') || (this._screen_name instanceof String));
  assert(this._location instanceof Array);
  assert(this._location.length === 3);
  for (var i = 0; i < this._location.length; i++) {
    assert((typeof this._location[i] === 'number') && (parseFloat(this._location[i]) == parseInt(this._location[i])) && (!isNaN(this._location[i])));
  }
  assert((typeof this._realm === 'string') || (this._realm instanceof String));
  assert(this._flags instanceof Array);
  assert(this._achievements instanceof Array);
  assert((this._tweet !== null) && (typeof this._tweet === 'object'));
  assert((this._tweet.hasOwnProperty('text')) && (this._tweet.hasOwnProperty('id_str')));
  assert((typeof this._tweet.text === 'string') || (this._tweet.text instanceof String));
  assert((typeof this._tweet.id_str === 'string') || (this._tweet.id_str instanceof String));
  assert(this._interaction_name instanceof Array);
  assert(this._changed_flags instanceof Array);
  assert(this._new_achievements instanceof Array);

  return this;
}

/*
Execute the work required with any command
*/
function executeCommand(command) {
  var self = this;
  //If the executable object has a location property (meaning changing location)
  if (command.executable.hasOwnProperty('location')) {
    //Update in-memory player doc with new location
    this._location = command.executable.location;
    this._realm = command.executable.realm;
    //Find the new room the player has entered
    var rooms = db.collection('rooms');
    rooms.findOne({location:this._location, realm:this._realm}, function(err, room_doc) {
      if (err) {
        return log.error({ err: err, module: __filename }, 'Error attempting to find room at location: [' + this._location.toString() + '], realm: ' + this._realm)
      }
      //Store new location interaction
      //Initalise new room's flags and run a lookaround command
      self._interaction_name.push('new room')
      checkCapability.call(self.initialiseRoomFlags(room_doc), checkAlias(room_doc, 'look around'));
    });
  }
  return this;
}

/*
Counts number of appearances of an element in an array through a recursive process
*/
function numberOf(array, item, count) {
  //If count undefined (usually on first calls), define it and set to zero
  if (typeof count === 'undefined') {
    var count = 0;
  }
  if (array.indexOf(item) > -1) {
    //Remove the first copy of the item from the array
    var array2 = array.slice(0);
    array2.splice(array.indexOf(item), 1);
    //Recurse this function with the array copy, incrementing the counter
    return numberOf(array2, item, ++count);
  } else {
    //If item doesn't exist, return count
    return count;
  }
}

/*
Return an object formatted for insertion in a MongoDB collection
*/
function self(current_time) {
  return {
    id_str: this._id_str,
    screen_name: this._screen_name,
    location: this._location,
    realm: this._realm,
    flags: this._flags,
    achievements: this._achievements,
    last_updated: current_time
  }
}

/*
Process result flags for command
*/
function resultFlags(item) {
  //If no result_flags, return existing player_doc
  if (!item.hasOwnProperty('result_flags')) {
    return this;
  }
  for (var flag_name in item.result_flags) {
    //If the flag modifier value is zero, pull occurrences of it from player_doc
    if (item.result_flags[flag_name][1] == 0) {
      var self = this;
      this._flags = this._flags.filter(function(element, index, array) {
        if (element != item.result_flags[flag_name][0]) {
          return true;
        } else {
          self._changed_flags.push(item.result_flags[flag_name]);
          return false;
        }
      });
    } else {
      //Else if the flag modifier is not 0, append it that number of times to the player_doc
      for (y = 0; y < item.result_flags[flag_name][1]; y++) {
        this._changed_flags.push(item.result_flags[flag_name]);
        this._flags.push(item.result_flags[flag_name][0]);
      }
    }
  }
  //Return updated player_doc
  return this;
}

/*
Build up player results, achievements and then execute command or respond to tweet
*/
function runItem(item) {
  resultFlags.call(this, item);
  achievements.call(this, item);
  //If the command has an executable property, execute it
  if (item.hasOwnProperty('executable')) {
    return executeCommand.call(this, item);
  } else if (item.hasOwnProperty('response')){
    //Else store interaction, tweet relevant text
    return this.respondAndSave(item.response);
  } else {
    log.error({ err: new Error('Item does not contain necessary "executable" or "response" key/value to proceed.') }, { module: __filename })
  }
}

//
//Public functions
//

/*
Constructor
*/
function Player(player_doc, tweet_object) {
  //Check parameters present and defined
  assert((typeof player_doc !== 'undefined') || (typeof tweet_object !== 'undefined'));
  //Check player_doc is an instance of PlayerDoc or can be made into one
  if (!(player_doc instanceof PlayerDoc)) {
    try {
      player_doc = new PlayerDoc(player_doc);
    } catch (e) {
      log.error({ err: e, module: __filename }, 'First parameter not a valid PlayerDoc object or cannot be implicitly cast to one.');
      return false;
    }
  }
  //Ensure tweet parameter is an object that contains required fields (which have the correct types)
  assert((tweet_object !== null) && (typeof tweet_object === 'object'));
  assert((tweet_object.hasOwnProperty('text')) && (tweet_object.hasOwnProperty('id_str')));
  assert((typeof tweet_object.text === 'string') || (tweet_object.text instanceof String));
  assert((typeof tweet_object.id_str === 'string') || (tweet_object.id_str instanceof String));

  //Set up object variables
  this._id_str = player_doc.id_str;
  this._screen_name = player_doc.screen_name;
  this._location = player_doc.location;
  this._realm = player_doc.realm;
  this._flags = player_doc.flags;
  this._achievements = player_doc.achievements;
  this._tweet = tweet_object;

  this._interaction_name = [];
  this._changed_flags = [];
  this._new_achievements = [];
}

/*
Set module variables
*/
Player.setModuleVariables = function(CONFIG, database, logger, twit) {
  var interaction_log_file_path;
  //Set module variables (shouldn't change during app runtime)
  CONF = CONFIG;
  db = database;
  t = twit;
  log = logger;
  interaction_log = bunyan.createLogger({
    name: 'stateful-twitter-bot-interactions',
    streams: [{
      path: CONFIG.INTERACTION_LOG_FILE;
    }]
  })
}

/*
Initialise player flags for the new room
*/
Player.prototype.initialiseRoomFlags = function(new_room_doc) {
  //Ensure parameter is present
  assert(typeof new_room_doc !== 'undefined');
  //Ensure parameter is an object
  assert((new_room_doc !== null) && (typeof new_room_doc === 'object'));
  //Ensure if parameter has 'initialise_flags' property, that it also has 'visited_flag' property
  assert(((new_room_doc.hasOwnProperty('initialise_flags')) && (new_room_doc.hasOwnProperty('visited_flag'))) || (!new_room_doc.hasOwnProperty('initialise_flags')));

  //Return self if the room does not have initialising flags
  if (!new_room_doc.hasOwnProperty('initialise_flags')) {
    return this;
  }
  //Create array with potential flags
  var initialising_flags = new_room_doc.initialise_flags;
  //If the player has the 'visited_flag' flag (has been to this room before)...
  if (this._flags.indexOf(new_room_doc.visited_flag) > -1) {
    //Remove flags that are only meant to be operated the first time someone enters a room
    for (x = 0; x < initialising_flags.length; x++) {
      if (initialising_flags[x][1] == 'first_visit') {
        initialising_flags.splice(x, 1);
        //Move the cursor back one if an item has been removed
        (x != initialising_flags.length - 1) && x--;
      }
    }
  } else {
    //If they haven't been to this room before, add that they now have been here
    this._flags.push(new_room_doc.visited_flag);
    this._changed_flags = this._changed_flags.concat(new_room_doc.visited_flag);
  }
  //Changed flags on model
  this._changed_flags = this._changed_flags.concat(initialising_flags);
  for (x = 0; x < initialising_flags.length; x++) {
    //Remove the trailing info on the initialising array
    initialising_flags[x] = initialising_flags[x][0];
  }
  //If flags have been changed, update model and return self
  this._flags = this._flags.concat(initialising_flags);
  return this;
}

/*
Process the command in tweet
*/
Player.prototype.processCommand = function(item_docs) {
  //Check parameter is present and defined
  assert(typeof item_docs !== 'undefined');
  //Check item_docs is an array of ItemDoc items (or items that can be cast to ItemDoc)
  assert(item_docs instanceof Array, 'item_docs parameter must be an array');
  for (var i = 0; i < item_docs.length; i++) {
    if (!(item_docs[i] instanceof ItemDoc)) {
      try {
        item_docs[i] = new ItemDoc(item_docs[i]);
      } catch (e) {
        log.error({ err: err, module: __filename });
      }
    }
  }
  //Ensure first ItemDoc has a "help" and "look around" command (the room document)
  assert((item_docs[0].commands.hasOwnProperty('help')) && (item_docs[0].commands.hasOwnProperty('look around')));

  //If command is to reset, reset player object, respond and save
  if (this._tweet.text.toLowerCase().indexOf('+reset+') > -1) {
    this._location = CONF.start_location;
    this._realm = CONF.start_realm;
    this._flags = [];
    this._interaction_name = ['reset'];
    this._changed_flags = [];
    this._new_achievements = [];
    return this.initialiseRoomFlags(item_docs[0]).respondAndSave('It has been done, your game progress has been reset. Only your achievements still remain.');
  }
  //Run through room and objects to find a matching command to run
  for (var i = 0; i < item_docs.length; i++) {
    for (var command_name in item_docs[i].commands) {
      //If the command is located within the tweet, action it
      if (this._tweet.text.toLowerCase().indexOf(command_name) > -1) {
        //Store the interaction
        this._interaction_name.push(command_name);
        return checkCapability.call(this, checkAlias(item_docs[i], command_name));
      }
    }
  }
  //If no commands so far, try a "look" command
  if (this._tweet.text.toLowerCase().indexOf('look') > -1) {
    this._interaction_name.push('look around');
    return checkCapability.call(this, checkAlias(item_docs[0], 'look around'));
  }
  //If still nothing, do a "help" command
  this._interaction_name.push('help');
  return checkCapability.call(this, checkAlias(item_docs[0], 'help'));
}

/*
Tweet and add an interaction
*/
Player.prototype.respondAndSave = function(response) {
  //Ensure there is a defined parameter
  assert(typeof response !== 'undefined');
  //Ensure response parameter is a string
  assert((typeof response === 'string') || (response instanceof String));

  //Build full response before submitting to DB
  response = '@' + this._screen_name + ' ' + response + appendJunk();
  //Grab current time
  current_time = new Date().getTime();
  //Submit interaction to DB
  var interactions = db.collection('interactions');
  interactions.insert({id_str:this._id_str, screen_name:this._screen_name, location:this._location, realm:this._realm, interaction:this._interaction_name, tweet:this._tweet.text, response:response, datetime:current_time, flags:this._changed_flags, achievements:this._new_achievements}, { w: 0 }, function(err, result) {
    //If it errors out, log the error
    if (err) {
      return log.error({ err: err, interaction: {id_str:this._id_str, screen_name:this._screen_name, location:this._location, realm:this._realm, interaction:this._interaction_name, tweet:this._tweet.text, response:response, datetime:current_time, flags:this._changed_flags, achievements:this._new_achievements} }, 'Error attempting to insert a new interaction');
    }
  });
  //Log the interaction to a log file
  interaction_log.info({ interaction: {id_str:this._id_str, screen_name:this._screen_name, location:this._location, realm:this._realm, interaction:this._interaction_name, tweet:this._tweet.text, response:response, datetime:current_time, flags:this._changed_flags, achievements:this._new_achievements}, module: __filename });
  //Submit updated player to DB
  var players = db.collection('players');
  players.update({id_str:this._id_str}, self.call(this, current_time), { w: 0 }, function(err, result) {
    if (err) {
      return log.error({ err: err, module: __filename }, 'Error attempting to update player: @' + this._screen_name + ', id_str: ' + this._id_str);
    }
  });
  //As long as a response was passed, send a tweet to player (in response to original tweet)
  t.post('statuses/update', {status:response, in_reply_to_status_id:this._tweet.id_str}, function(err, data, response) {
    if (err) {
      return log.error({ err: err, module: __filename }, 'Error attempting to send tweet: ' + response);
    }
  });
  return checkPlayerIntegrity.call(this);
}

module.exports = Player;