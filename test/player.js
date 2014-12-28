/*
Testing suite for Player class
*/
//External libraries (NPM)
var mockery = require('mockery');
// Using mocks to fake functionality of external dependencies
var mock_mongodb = require('./mocks/mock_mongodb.js');
var mock_twit = require('./mocks/mock_twit.js');

describe('Player', function() {
  var Player;
  var BotDatabase;
  var PlayerDoc;
  var ItemDoc;
  var assert;
  var MongoClient;
  var Twit;
  var T;
  var db;
  var player_doc;
  var player;

  before(function(done) {
    mockery.enable({ useCleanCache: true });
    mockery.registerAllowable('../bot/lib/player.js');
    mockery.registerAllowable('../bot/lib/bot-database.js');
    mockery.registerAllowable('../bot/lib/game-document.js');
    mockery.registerAllowable('./bot-database.js'); //Modules that are required by modules that are required
    mockery.registerAllowable('./game-document.js'); //Modules that are required by modules that are required
    mockery.registerAllowable('assert');
    mockery.registerMock('mongodb', mock_mongodb);
    mockery.registerMock('twit', mock_twit);
    //Internal libraries
    Player = require('../bot/lib/player.js');
    BotDatabase = require('../bot/lib/bot-database.js');
    PlayerDoc = require('../bot/lib/game-document.js').PlayerDoc;
    ItemDoc = require('../bot/lib/game-document.js').ItemDoc;
    //Node core libraries
    assert = require("assert");
    //External libraries (NPM)
    MongoClient = require('mongodb').MongoClient;
    Twit = require('twit');

    //Set up Twitter app
    T = new Twit({
      consumer_key: 'TEST',
      consumer_secret: 'TEST',
      access_token: 'TEST',
      access_token_secret: 'TEST'
    });

    //Connect to the database
    MongoClient.connect('mongodb://' + 'TEST', function(err, database) {
      if (err) {
        console.log(err);
        process.exit();
      }
      db = new BotDatabase(database);
      //Move on to testing
      done();
    });
  });

  beforeEach(function() {
    //Create dummy player_doc
    player_doc = new PlayerDoc({
      id_str: '1',
      screen_name: 'adam',
      location: [0, 0, 0],
      realm: 'start',
      flags: [],
      achievements: []
    });
    tweet_object = {
      id_str: '1',
      text: 'initial tweet'
    };
    player = new Player(player_doc, db, T, tweet_object);
  });

  after(function() {
    mockery.deregisterMock('twit');
    mockery.deregisterMock('mongodb');
    mockery.deregisterAllowable('../lib/player.js');
    mockery.disable();
  });

  describe('#constructor', function() {
    it('should throw an error with missing/undefined parameters', function() {
      //Missing parameters
      assert.throws(function() {
        new Player();
      }, Error);
      assert.throws(function() {
        new Player(player_doc);
      }, Error);
      assert.throws(function() {
        new Player(player_doc, db);
      }, Error);
      assert.throws(function() {
        new Player(player_doc, db, T);
      }, Error);
      //Undefined parameters
      assert.throws(function() {
        new Player(undefined, undefined, undefined, undefined);
      }, Error);
    });
    it('should throw an error if player_doc is not an instance of PlayerDoc (or cannot be cast into one)', function() {
      //Not a PlayerDoc object
      assert.throws(function () {
        new Player(1, db, T, tweet_object);
      }, Error);
      //Pass an object missing the id_str parameter (cannot be cast into PlayerDoc)
      assert.throws(function () {
        new Player({
          screen_name: 'adam',
          location: [0, 0, 0],
          realm: 'start',
          flags: [],
          achievements: []
        }, db, T, tweet_object);
      }, Error);
    });
    it('should throw an error if db is not an instance of BotDatabase', function() {
      assert.throws(function () {
        new Player(player_doc, 1, T, tweet_object);
      }, Error);
    });
    it('should throw an error if T is not an instance of Twit', function() {
      assert.throws(function () {
        new Player(player_doc, db, 1, tweet_object);
      }, Error);
    });
    it('should throw an error if tweet parameter is not an object with two parameters (id_str and text, both strings)', function() {
      //Tweet parameter, id_str property, not a string
      assert.throws(function () {
        new Player(player_doc, db, T, {id_str: 1, text: 'initial tweet'});
      }, Error);
      //Tweet missing id_str property
      assert.throws(function () {
        new Player(player_doc, db, T, {text: 'initial tweet'});
      }, Error);
    });
    it('should succeed if passed valid parameters', function() {
      assert.doesNotThrow(function() {
        new Player(player_doc, db, T, tweet_object);
      });
      assert((new Player(player_doc, db, T, tweet_object)) instanceof Player);
    });
  });

  describe('#initialiseRoomFlags', function() {
    it('should take at least one parameter that is an object, if the object has property "initialise_flags" it must also have "visited_flag"', function() {
      //No parameters
      assert.throws(function () {
        player.initialiseRoomFlags();
      }, Error);
      //Parameter not an object
      assert.throws(function () {
        player.initialiseRoomFlags(1);
      }, Error);
      //Parameter is an object
      assert.doesNotThrow(function () {
        player.initialiseRoomFlags({a: 'a'});
      });
      //Parameter has initialise_flags but no visited_flag
      assert.throws(function () {
        player.initialiseRoomFlags({initialise_flags: 'a'});
      }, Error);
      //Parameter is an object with initialise_flags and a visited_flag
      assert.doesNotThrow(function () {
        player.initialiseRoomFlags({initialise_flags: 'a', visited_flag: 'b'});
      });
    });
    it('should return itself (the player object)', function() {
      assert(player.initialiseRoomFlags({a: 'a'}) instanceof Player);
      assert(player.initialiseRoomFlags({a: 'a'}) === player);
    });
  });

  describe('#processCommand', function() {
    var item_docs;

    beforeEach(function() {
      item_docs = [new ItemDoc({
        name: 'desk',
        location: [0, 0, 0],
        realm: 'start',
        commands: {
          'help': {
            'response' : 'help response'
          },
          'look around': {
            'response' : 'look around response'
          }
        }
      })];
    });

    it('should take an array of ItemDocs as parameters, first item must have commands for "help" and "look around"', function() {
      //No parameters
      assert.throws(function () {
        player.processCommand();
      }, Error);
      //Parameter with incorrect type
      assert.throws(function () {
        player.processCommand(1);
      }, Error);
      //Supply ItemDoc that is missing a help parameter
      assert.throws(function () {
        player.processCommand([new ItemDoc({
          location: [0, 0, 0],
          realm: 'start',
          commands: {
            'look around': 'b'
          }
        })]);
      }, Error);
      //Valid parameter
      assert.doesNotThrow(function () {
        player.processCommand(item_docs);
      });
    });
    it('should return itself (the player object)', function() {
      assert(player.processCommand(item_docs) instanceof Player);
      assert(player.processCommand(item_docs) === player);
    });
  });

  describe('#respondAndSave', function() {
    var response;

    beforeEach(function() {
      response = 'response';
    });

    it('should throw an error if provided no parameters', function() {
      assert.throws(function () {
        player.respondAndSave();
      }, Error);
    });
    it('should take a response string', function() {
      //Correct parameter
      assert.doesNotThrow(function() {
        player.respondAndSave(response);
      });
      //Parameter not a string
      assert.throws(function () {
        player.respondAndSave(1);
      }, Error);
    });
    it('should return itself (the player object)', function() {
      assert(player.respondAndSave(response) instanceof Player);
      assert(player.respondAndSave(response) === player);
    });
  });
});