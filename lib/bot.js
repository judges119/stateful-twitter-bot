//NPM modules
var MongoClient = require('mongodb').MongoClient;
var Twit = require('twit');
//Local modules
var Player = require('./player');
//Module variables
var CONF;
var db;
var log;
var stream;
var t;

/*
Constructor
*/
function bot(CONFIG, database, logger) {
	log.info({ module: __filename }, 'Initialising bot');
	//Update module variables
	CONF = CONFIG;
	db = database;
	log = logger;
	t = new Twit({
		consumer_key: CONF.CONSUMER_KEY,
		consumer_secret: CONF.CONSUMER_SECRET,
		access_token: CONF.ACCESS_TOKEN,
		access_token_secret: CONF.ACCESS_TOKEN_SECRET
	});
	stream = t.stream('user');
	//Set "static" module variables on Player class
	Player.setModuleVariables(CONF, db, log, t);

	//On receiving a tweet, pass it to the onTweet function
	stream.on('tweet', function(tweet) {
		onTweet(tweet);
	});

	//On disconnect from stream
	stream.on('disconnect', function(disconnect_message) {
		log.fatal({ err: new Error(disconnect_message) }, { module: __filename }, 'Disconnected from tweet stream');
		//Close db connection and exit process in error
		db.close();
		process.exit(1);
	});
};

/*
Handle incoming tweets
*/
function onTweet(tweet) {
	//If the received tweet was sent by the bot, exit function (avoid infinite looping)
	if (tweet.user.screen_name.toLowerCase() == CONF.HANDLE.slice(1).toLowerCase()) {
		return log.warn({ module: __filename }, 'Self-reference in tweet, ignoring to avoid infinite loop scenario');
	}
	//If the tweet contains the handle of the adventure game bot
	if (tweet.text.toLowerCase().indexOf(CONF.HANDLE.toLowerCase()) > -1) {
		log.info({ module: __filename }, 'Received from user: @' + tweet.user.screen_name + ', id_str: ' + tweet.user.id_str + ', tweet: ' + tweet.text);
		//Look for the player in the db
		var players = db.collection('players');
		players.findOne({ id_str: tweet.user.id_str }, function(err, player_doc) {
			if (err) {
				return log.error({ err: err, module: __filename }, 'Error attempting to find player by id_str: ' + tweet.user.id_str);
			}
			//Timer before reply (2 seconds)
			setTimeout(function() {
				//If the player is in the DB (already a player)
				if (player_doc) {
					//Update screen name in case it's changed
					player_doc.screen_name = tweet.user.screen_name;
					//Set up player model, error and return if it can't be instantiated
					(var player = new Player(player_doc, tweet)) || return log.error({ err: new Error('Unable to instantiate a player object') }, { module: __filename }, 'Unable to instantiate a player object');
					//Grab current player room (and the objects inside it) and process the command in the tweet
					var rooms = db.collection('rooms');
					rooms.findOne({ location: player._location, realm: player._realm }, function(err, room_doc) {
						if (err) {
							return log.error({ err: err, module: __filename }, 'Error attempting to find room at location: [' + player._location.toString() + '], realm: ' + player._realm);
						}
						var objects = db.collection('objects');
						objects.find({ location: player._location, realm: player._realm }).toArray(function(err, object_docs) {
							if (err) {
								return log.error({ err: err, module: __filename }, 'Error attempting to find objects (and convert them to an array) at location: [' + player._location.toString() + '], realm: ' + player._realm);
							}
							item_docs = [room_doc].concat(object_docs);
							player.processCommand(item_docs);
						});
					});
				} else {
					//If player doesn't exist in db, create one, insert them into the db and tweet a welcome at them
					player_doc = {
						id_str: tweet.user.id_str,
						screen_name: tweet.user.screen_name,
						location: CONF.START_LOCATION,
						realm: CONF.START_REALM,
						flags: [],
						achievements: []
					};
					players.insert(player_doc, { w: 0 }, function(err, new_player_doc) {
						if (err) {
							return log.error({ err: err, module: __filename }, 'Error attempting to insert a new player document');
						}
						//Set up player model, error and return if it can't be instantiated
						(var player = new Player(player_doc, tweet)) || return log.error({ err: new Error('Unable to instantiate a player object') }, { module: __filename }, 'Unable to instantiate a player object');
						var rooms = db.collection('rooms');
						rooms.findOne({ location: CONF.START_LOCATION, realm: CONF.START_REALM }, function(err, room_doc) {
							if (err) {
								return log.error({ err: err, module: __filename }, 'Error attempting to find room at location: [' + CONF.START_LOCATION.toString() + '], realm: ' + CONF.START_REALM);
							}
							player._interaction_name.push('start_playing');
							player.initialiseRoomFlags(room_doc).respondAndSave('welcome to Twitter Adventure Bot, check out the instructions/FAQ at http://letterfourteen.com/!');
						});
					});
				}
			}, 2000);
		});
	}
}

module.exports = bot;