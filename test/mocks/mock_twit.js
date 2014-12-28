/*
A mock of the (used) functionality of the Node.js Twit module, for the Mockery module.
Have built some testing into the mockup.
*/
//Node core libraries
var assert = require("assert");

module.exports = function(api_object) {
  //Ensure api_object is present, is an object and has all necessary keys
  assert(api_object !== 'undefined');
  //Ensure parameter is an object
  assert((api_object !== null) && (typeof api_object === 'object'));
  //Ensure all keys are present and have string values
  assert((api_object.hasOwnProperty('consumer_key')) && ((typeof api_object.consumer_key === 'string') || (api_object.consumer_key instanceof String)));
  assert((api_object.hasOwnProperty('consumer_secret')) && ((typeof api_object.consumer_secret === 'string') || (api_object.consumer_secret instanceof String)));
  assert((api_object.hasOwnProperty('access_token')) && ((typeof api_object.access_token === 'string') || (api_object.access_token instanceof String)));
  assert((api_object.hasOwnProperty('access_token_secret')) && ((typeof api_object.access_token_secret === 'string') || (api_object.access_token_secret instanceof String)));

  this.post = function(endpoint, tweet, callback) {
    //All parameters present and defined
    assert((typeof endpoint !== 'undefined') || (typeof tweet !== 'undefined') || (typeof callback !== 'undefined'));
    //Endpoint must be a valid string (we only use one API endpoint in this project, so we specify it)
    assert(endpoint === 'statuses/update');
    //Tweet is an object with 'status' and 'in_reply_to_status_id' properties, both with string values
    assert((tweet !== null) && (typeof tweet === 'object'));
    assert(tweet.hasOwnProperty('status') && tweet.hasOwnProperty('in_reply_to_status_id'));
    assert((typeof tweet.status === 'string') || (tweet.status instanceof String));
    assert((typeof tweet.in_reply_to_status_id === 'string') || (tweet.in_reply_to_status_id instanceof String));
    //Callback must be a function that takes three arguments
    assert((typeof callback === 'function') && (callback.length === 3));

    callback(null, {}, {});
    return null;
  };
};