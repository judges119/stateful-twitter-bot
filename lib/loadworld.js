//Core libraries
var fs = require('fs');
//Module Variables
var file_count = -1;
var prepare_to_quit = false;
var db;
var log;

/*
Constructor
*/
function LoadWorld(database, logger) {
  db = database;
  log = logger;
  log.info({ module: __filename }, 'Preparing database');
  db.createCollection('players', function(err, players_coll) {
    if (err) {
      return log.error({ err: err, module: __filename }, 'Unable to create/connect to \'players\' collection in database');
    }
    db.createCollection('rooms', function(err, rooms_coll) {
      if (err) {
        return log.error({ err: err, module: __filename }, 'Unable to create/connect to \'rooms\' collection in database');
      }
      db.createCollection('objects', function(err, objects_coll) {
        if (err) {
          return log.error({ err: err, module: __filename }, 'Unable to create/connect to \'objects\' collection in database');
        }
        db.createCollection('interactions', function(err, interactions_coll) {
          if (err) {
            return log.error({ err: err, module: __filename }, 'Unable to create/connect to \'interactions\' collection in database');
          }
          log.info('Loading world');
          file_count = 0;
          recurseAndRead('./world');
          //If ~3 seconds has passed and the file_count (counter of open-but-not-uploaded files) is still zero, terminate process
          setInterval(function() {
            if (file_count == 0) {
              if (prepare_to_quit) {
                db.close(function(err, result) {
                  if (err) {
                    return log.error({ err: err, module: __filename }, 'Unable to close database connection');
                  } else {
                    log.info({ module: __filename }, 'Successfully loaded world, terminating script');
                    process.exit(0);
                  }
                });
              } else {
                prepare_to_quit = true;
              }
            } else {
              prepare_to_quit = false;
            }
          }, 1500);
        });
      });
    });
  });
}

/*
If path represents a .JSON file, parse it then processAndUpload() it.
If path is a directory, recurse on each object in the directory (except '.' and '..').
*/
function recurseAndRead(path) {
  fs.stat(path, function(err, stats) {
    if (err) {
      return log.error({ err: err, module: __filename }, 'Unable to stat path: ' + path);
    }
    if (stats.isFile()) {
      if (path.slice(-4) == 'json') {
        fs.readFile(path, 'utf8', function (err, data) {
          if (err) {
            return log.error({ err: err, module: __filename }, 'Unable to read JSON file: ' + path);
          }
          log.info({ module: __filename }, 'Reading JSON file: ' + path);
          var json;
          try {
            json = JSON.parse(data);
            log.info({ module: __filename }, 'Parsing JSON file: ' + path);
            file_count++;
            processAndUpload(json);
          } catch (err) {
            return log.error({ err: err, module: __filename }, 'Error parsing JSON file (or during processing/uploading)');
          }
        });
      }
    } else if (stats.isDirectory()) {
      fs.readdir(path, function(err, files) {
        if (err) {
          return log.error({ err: err, module: __filename }, 'Unable to read directory: ' + path);
        }
        log.info({ module: __filename }, 'Examining directory: ' + path);
        for (var i = 0; i < files.length; i++) {
          recurseAndRead(path + '/' + files[i]);
        }
      });
    }
  })
}

/*
Upserts a JSON object into the correct collection, if provided with an arracy, recurse on each element of the array.
*/
function processAndUpload(json) {
  //If it's an array, don't count this file, but count for each object in it
  if (json.hasOwnProperty('length')) {
    log.info({ module: __filename }, 'JSON Array, processing each JSON Object contained within');
    --file_count;
    for (var i = 0; i < json.length; i++) {
      ++file_count;
      processAndUpload(json[i]);
    }
  } else {
    //Check parameter has right world-script structure
    if ((!json.hasOwnProperty('collection')) || (!json.hasOwnProperty('document')) || (!json.document.hasOwnProperty('commands'))) {
      return log.warn({ module: __filename }, 'JSON missing collection, document and/or commands properties');
    }
    //Check parameter has at least location and realm properties
    if ((!json.document.hasOwnProperty('location')) || (!json.document.hasOwnProperty('realm'))) {
      return log.warn({ module: __filename }, 'JSON.document object is missing location and/or realm properties');
    }
    switch (json.collection) {
      case 'room' :
        //Check room has a "help" and "look around" command
        if ((!json.document.commands.hasOwnProperty('help')) || (!json.document.commands.hasOwnProperty('look around'))) {
          log.warn({ module: __filename }, 'JSON.document.commands (room type) missing "help" and/or "look around" commands');
          break;
        }
        log.info({ module: __filename }, 'JSON is a room file, location: [' + json.document.location.toString() + '], realm: ' + json.document.realm + ', updating DB');
        //Upsert room, decrement file_count
        var rooms = db.collection('rooms');
        rooms.update({location: json.document.location, realm: json.document.realm}, json.document, {upsert: true, w: 1}, function(err, result) {
          if (err) {
            return log.error({ err: err, module: __filename }, 'Unable to upsert room document for location: [' + json.document.location.toString() + '] and realm: ' + json.document.realm);
          }
          file_count--;
        });
        break;
      case 'object' :
        //Check object has a "name" property
        if (!json.document.hasOwnProperty('name')) {
          log.warn({ module: __filename }, 'JSON.document (object type) missing name property');
          break;
        }
        log.info({ module: __filename }, 'JSON is an object file, name: ' + json.document.name + 'location: [' + json.document.location.toString() + '], realm: ' + json.document.realm + ', updating DB');
        //Upsert object, decrement file_count
        var objects = db.collection('objects');
        objects.update({name: json.document.name, location: json.document.location, realm: json.document.realm}, json.document, {upsert: true, w: 1}, function(err, result) {
          if (err) {
            return log.error({ err: err, module: __filename }, 'Unable to upsert object document for name: ' + json.document.name + ' and location: [' + json.document.location.toString() + '] and realm: ' + json.document.realm);
          }
          file_count--;
        });
        break;
      default :
        log.warn({ module: __filename }, 'JSON.collection is not a valid (room or object) response');
        break;
    }
  }
}

module.exports = LoadWorld;