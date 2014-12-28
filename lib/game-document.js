//Core libraries
var assert = require("assert");

/*
Constructor for PlayerDoc
*/
function PlayerDoc(player_doc) {
  //Check parameter present and defined
  if (typeof player_doc === 'undefined') {
    throw new Error('requires a defined and present document parameter');
  }
  //Check for missing properties
  var missing = ['id_str', 'screen_name', 'location', 'realm', 'flags', 'achievements'].reduce(function(previous, current, index, array) {
    return (!player_doc.hasOwnProperty(element)) ? previous.concat(current) : previous;
  }, []);
  if (missing.length > 0) {
    throw new Error('document missing the following fields: ' + missing.join(', '));
  }
  //Check properties correct types/formats, error if not
  assert((typeof player_doc.id_str === 'string') || (player_doc.id_str instanceof String), 'id_str must be a string');
  assert((typeof player_doc.screen_name === 'string') || (player_doc.screen_name instanceof String), 'screen_name must be a string');
  assert(player_doc.location instanceof Array, 'location must be an array');
  assert(player_doc.location.length === 3, 'location array must have three elements');
  for (var i = 0; i < player_doc.location.length; i++) {
    assert((typeof player_doc.location[i] === 'number') && (parseFloat(player_doc.location[i]) == parseInt(player_doc.location[i])) && (!isNaN(player_doc.location[i])), 'location array (element ' + i + ') must be an integer');
  }
  assert((typeof player_doc.realm === 'string') || (player_doc.realm instanceof String), 'realm must be a string');
  assert(player_doc.flags instanceof Array, 'flags must be an array');
  assert(player_doc.achievements instanceof Array, 'achievements must be a array');

  this.id_str = player_doc.id_str;
  this.screen_name = player_doc.screen_name;
  this.location = player_doc.location;
  this.realm = player_doc.realm;
  this.flags = player_doc.flags;
  this.achievements = player_doc.achievements;
}

/*
Constructor for ItemDoc
*/
function ItemDoc(doc) {
  //Check parameter present and defined
  assert(typeof doc !== 'undefined');
  //Check for missing properties
  var missing = ['location', 'realm', 'commands'].reduce(function(previous, current, index, array) {
    return (!player_doc.hasOwnProperty(element)) ? previous.concat(current) : previous;
  }, []);
  if (missing.length > 0) {
    throw new Error('document missing the following fields: ' + missing.join(', '));
  }
  //Check properties correct types/formats, error if not
  assert(doc.location instanceof Array, 'location must be an array');
  assert(doc.location.length === 3, 'location array must have three elements');
  for (var i = 0; i < doc.location.length; i++) {
    assert((typeof doc.location[i] === 'number') && (parseFloat(doc.location[i]) == parseInt(doc.location[i])) && (!isNaN(doc.location[i])), 'location array (element ' + i + ') must be an integer');
  }
  assert((typeof doc.realm === 'string') || (doc.realm instanceof String), 'realm must be a string');
  assert((doc.commands !== null) && (typeof doc.commands === 'object'), 'commands must be an object literal of values representing command/action pairs');

  //If it doesn't have a name, it's a room
  this.name = doc.name || 'room';
  if (doc.initialise_flags) {
    this.initialise_flags = doc.initialise_flags;
    this.visited_flag = doc.visited_flag;
  }
  this.location = doc.location;
  this.realm = doc.realm;
  this.commands = doc.commands;
}

exports.PlayerDoc = PlayerDoc;
exports.ItemDoc = ItemDoc;