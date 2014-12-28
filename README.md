# Stateful Twitter Bot

A Twitter bot that uniquely forms responses based on tweets directed at it by users and it's previous interactions with those users. This is effectively an independent derivative of the bot capabilities in the [140charADV](https://github.com/judges119/140charADV) project.

This current version is mostly intended for people who want to an "interactive fiction" game similar to the aforementioned 140charADV project, but without the web interface.

Interaction occurs when users tweet commands at the bot running the script which in turn reads and processes their input, updates it's internal model of that particular player/Twitter user (including game location, status, etc) and responds with a Tweet in reply that yields lore, the change in character state or the virtual view surrounding the player.

Most of the commands in the worlds so far devised end up often following the form of "use [x]", "examine [x]", "go to [x]" and "look around", however in building worlds you will likely find opportunities to introduce other commands or perhaps even follow a different command structure altogether.

## Pitfalls For Story/Design Authors

Try and ensure that your users don't have to regularly tweet the same thing as Twitter will not allow duplicate tweets from a user within a short period. This can be circumvented by appending junk characters to the end of the tweet but that won't be immediately obvious to users.

## Usage

You will need to export the environment variables specified in "data/config.js" for the app to run successfully. This will also load any prepared world files into the database (read the next section for more info).

```
$ npm install
$ npm start
```

## Loading Worlds

You can load up any (properly formatted) .JSON world files that you've put into a "data/world" sub-directory at the root of the project by running `npm run load` in the root folder; loading will also be performed when `npm install` is run. The world building script will recursively enter and traverse the "world" directory and any inside it, loading any .json files it finds. It will update any documents that match the same identifiers (location and realm for room objects and name, location and realm for objects) and if no matching documents are found it will insert it as a new document.

There is an example world file ("data/world/example-location.json") which should give an idea of how the data model works and how they need to be laid out. If you want to test out this world, run `npm install` to load it up.

Please note, the loader relies on JSON.parse() so your .json files must be clean and correct to load otherwise it will error out.

## Testing

Tests must be run in a development (not production) environment.

````
$ npm install
$ npm test
````

This will execute the Mocha/Mockery/Assert testing suite.

## Roadmap

* Update test suite (will probably borrow from 140charADV)
* Investigate how else an interactive, stateful Twitter bot could be used
  * Build more example world files demonstrating alternative uses or game modes
* Attempt to make bot more generic to allow more use cases
  * Include "specialisation" modules that tailor it to certain purposes

## History

### Version 0.1.0

* Initial commit!
* Mostly just copied files file 140charADV, minimal alterations
* Created server.js for standalone usage
* Added `main` property to package.json for using bot as a module in other projects

## MIT License

Copyright (c) 2014 Adam O'Grady

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.