/*
Test file for ItemDoc class
*/
//Internal libraries
var ItemDoc = require('../bot/lib/game-document.js').ItemDoc;
//Node core libraries
var assert = require("assert");

describe('ItemDoc', function() {
  var item_doc;
  var item;

  beforeEach(function() {
    //Create dummy item_doc
    item_doc = {
      location: [0, 0, 0],
      realm: 'start',
      commands: {
        'help': 'a',
        'look around': 'b'
      }
    };
    item = new ItemDoc(item_doc);
  });

  describe('#constructor', function() {
    it('should throw an error if parameter missing or undefined', function() {
      assert.throws(function() {
        new ItemDoc();
      }, Error);
      assert.throws(function() {
        new ItemDoc(undefined);
      }, Error);
    });
    it('should throw an error if parameter not a complete player document', function() {
      delete item_doc.realm;
      assert.throws(function() {
        new ItemDoc(item_doc);
      }, Error);
    });
    it('should throw an error if parameter values do not follow guidelines', function() {
      item_doc.realm = 1;
      assert.throws(function() {
        new ItemDoc(item_doc);
      }, Error);
    });
    it('should succeed if passed a valid player document', function() {
      assert.doesNotThrow(function() {
        new ItemDoc(item_doc);
      });
      assert((new ItemDoc(item_doc)) instanceof ItemDoc);
    });
  });

  describe('.location', function() {
    it('should be an array of three integer values', function() {
      assert(item.location instanceof Array);
      assert(item.location.length === 3);
      for (var i = 0; i < item.location.length; i++) {
        assert((typeof item.location[i] === 'number') && (parseFloat(item.location[i]) == parseInt(item.location[i])) && (!isNaN(item.location[i])));
      }
    });
  });

  describe('.realm', function() {
    it('should be a string', function() {
      assert((typeof item.realm === 'string') || (item.realm instanceof String));
    });
  });

  describe('.commands', function() {
    it('should be an object', function() {
      assert((item.commands !== null) && (typeof item.commands === 'object'));
    });
  });
});
