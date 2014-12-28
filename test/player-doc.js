/*
Test file for PlayerDoc class
*/
//Internal libraries
var PlayerDoc = require('../bot/lib/game-document.js').PlayerDoc;
//Node core libraries
var assert = require("assert");

describe('PlayerDoc', function() {
  var player_doc;
  var player;

  beforeEach(function() {
    //Create dummy player_doc
    player_doc = {
      id_str: '1',
      screen_name: 'adam',
      location: [0, 0, 0],
      realm: 'start',
      flags: [],
      achievements: []
    };
    player = new PlayerDoc(player_doc);
  });

  describe('#constructor', function() {
    it('should throw an error if parameter missing or undefined', function() {
      assert.throws(function() {
        new PlayerDoc();
      }, Error);
      assert.throws(function() {
        new PlayerDoc(undefined);
      }, Error);
    });
    it('should throw an error if parameter not a complete player document', function() {
      delete player_doc.flags;
      assert.throws(function() {
        new PlayerDoc(player_doc);
      }, Error);
    });
    it('should throw an error if parameter values do not follow guidelines', function() {
      player_doc.id_str = 1;
      assert.throws(function() {
        new PlayerDoc(player_doc);
      }, Error);
    });
    it('should succeed if passed a valid player document', function() {
      assert.doesNotThrow(function() {
        new PlayerDoc(player_doc);
      });
      assert((new PlayerDoc(player_doc)) instanceof PlayerDoc);
    });
  });

  describe('.id_str', function() {
    it('should be a string', function() {
      assert((typeof player.id_str === 'string') || (player.id_str instanceof String));
    });
  });

  describe('.screen_name', function() {
    it('should be a string', function() {
      assert((typeof player.screen_name === 'string') || (player.screen_name instanceof String));
    });
  });

  describe('.location', function() {
    it('should be an array of three integer values', function() {
      assert(player.location instanceof Array);
      assert(player.location.length === 3);
      for (var i = 0; i < player.location.length; i++) {
        assert((typeof player.location[i] === 'number') && (parseFloat(player.location[i]) == parseInt(player.location[i])) && (!isNaN(player.location[i])));
      }
    });
  });

  describe('.realm', function() {
    it('should be a string', function() {
      assert((typeof player.realm === 'string') || (player.realm instanceof String));
    });
  });

  describe('.flags', function() {
    it('should be an array', function() {
      assert(player.flags instanceof Array);
    });
  });

  describe('.achievements', function() {
    it('should be an array', function() {
      assert(player.achievements instanceof Array);
    });
  });
});