/*
A mock of the (used) functionality of the Node.js MongoDB driver for the Mockery module.
Have built some testing into the mockup.
*/
//Node core libraries
var assert = require("assert");

function MongoClient() {
  this.connect = MongoClient.connect;
}

MongoClient.connect = function(url, callback) {
  //Parameters present and defined
  assert((typeof url !== 'undefined') || (typeof callback !== 'undefined'));
  //First parameter is a string
  assert((typeof url === 'string') || (url instanceof String));
  //Callback must be a function that takes two arguments
  assert((typeof callback === 'function') && (callback.length >= 2));

  callback(null, new Db());
  return null;
}

function Db() {
  this.collection = Db.collection;
}

Db.collection = function(coll) {
  //Parameter present, defined and is a string
  assert((typeof coll !== 'undefined') && ((typeof coll === 'string') || (coll instanceof String)));

  return new Collection();
}

var Collection = function() {
  this.insert = Collection.insert;
  this.update = Collection.update;
  this.findOne = Collection.findOne;
}

Collection.insert = function(item, options, callback) {
  //Parameters present and defined
  assert((typeof item !== 'undefined') || (typeof options !== 'undefined') || (typeof callback !== 'undefined'));
  //Ensure first parameter is an object
  assert((item !== null) && (typeof item === 'object'));
  //Ensure options is an object with write concern disabled (w: 0)
  assert((options !== null) && (typeof options === 'object'));
  assert((options.hasOwnProperty('w')) && (options.w === 0));
  //Callback must be a function that takes two arguments
  assert((typeof callback === 'function') && (callback.length >= 2));

  callback(null, {});
}

Collection.update = function(old_item, new_item_properties, options, callback) {
  //Parameters present and defined
  assert((typeof old_item !== 'undefined') || (typeof new_item_properties !== 'undefined') || (typeof options !== 'undefined') || (typeof callback !== 'undefined'));
  //Ensure first parameter is an object
  assert((old_item !== null) && (typeof old_item === 'object'));
  //Ensure second parameter is an object
  assert((new_item_properties !== null) && (typeof new_item_properties === 'object'));
  //Ensure options is an object with write concern disabled (w: 0)
  assert((options !== null) && (typeof options === 'object'));
  assert((options.hasOwnProperty('w')) && (options.w === 0));
  //Callback must be a function that takes two arguments
  assert((typeof callback === 'function') && (callback.length >= 2));

  callback(null, {});
}

Collection.findOne = function(item, callback) {
  //Parameters present and defined
  assert((typeof link !== 'undefined') || (typeof callback !== 'undefined'));
  //Ensure first parameter is an object
  assert((item !== null) && (typeof item === 'object'));
  //Callback must be a function that takes two arguments
  assert((typeof callback === 'function') && (callback.length >= 2));

  callback(null, item);
}

module.exports = {
  MongoClient: MongoClient,
  Db: Db,
  Collection: Collection
}