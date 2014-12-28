# World Building With JSON

## Loading Worlds

You can load up any (properly formatted) .JSON world files that you've put into a "world" sub-directory at the root of the project by running `npm install` in the root folder. The world building script will recursively enter and traverse the "world" directory and any inside it, loading any .json files it finds. It will update any documents (in the MongoDB instance) that match the same identifiers (location and realm for room objects and name, location and realm for objects) and if no matching documents are found it will insert it as a new document.

There is an example world file (example-location.json) which should give an idea of how the data model works and how they need to be laid out. If you want to test out this world, move/copy it to the world directory then run `npm install` to load it up.

Please note, the loader relies on JSON.parse() so your .json files must be clean and correct to load otherwise it will error out.

## World JSON Files

Parantheses indicate options, angled brackets indicate optional content, everything after (on the same line) double forward slash is a comment.

### JSON Object

This is the format for storing a single world item (room or object) in a .json file.

```
{
  "collection": ("room"|"object"),
  <"comment": "information/description/attribution",>
  "document": {
    <see Document section below>
  }
}
```

### JSON Array

This is the format if you want to group multiple world items (rooms or objects, generally a room and it's constituent objects) in a single .json file.

```
[
  {
    "collection": ("room"|"object"),
    <"comment": "<information/description/attribution>",>
    "document": {
      //See Document section below
    }
  },
  {
    "collection": ("room"|"object"),
    <"comment": "information/description/attribution",>
    "document": {
      //See Document section below
    }
  }
]
```

### Document

Initialised flags should only be on room documents and if it is present there must be a string "visited_flag" present as well. A flag is a string generally of the format "REALM_X_Y_Z_NAME" wher:

* REALM is the value of the "realm" property
* X, Y, Z are the coordinates in the "location" array
* NAME is the identifier for the flag

If an initialise_flags sub-array has "first_visit" at the [1] position, it will only be activated the first time the player enters the room (unless they've reset), which is checked by applying the "visited_flag" on first visit.

```
"document": {
  <"name": "string"> //Not needed if it's a room documents, required for object documents
  "location": [INTEGER, INTEGER, INTEGER],
  "realm": "string",
  <"initialise_flags": [ //Not needed for object documents, can be used on room documents
    ["start_0_0_0_asleep", "first_visit"],
    ["start_0_0_0_no_pants"]
  ],
  "visited_flag": "start_0_0_0_visited",>
  "commands": {
      //See Commands section below
  }
}
```

### Commands

A command can have a response which is used (only if conditions are matched in required_flags and not met in precluding_flags), or they can be an alias for another command. Commands (and precluding/required flag blocks) can also have executable properties, which currently facilitate moving to new locations. They can also have "result_flags" arrays, the sub-arrays of which contain a flag and the number of times it should be added to the player (if zero, all are removed from player).

As you can see, not all properties are necessary on a command and some (alias in particular) will override other properties of commands.

```
"commands": {
  "help": {
    "response": "String used in response to player's tweet.",
    "precluding_flags": {
      "start_0_0_0_asleep": {
        "number": 1,
        "response": "Response used if player has 1 (or more) instances of the precluding flag on them"
      },
      "start_0_0_0_nopants": {
        "number": 1,
        "response": "Response used if player has 1 (or more) instances of the precluding flag on them"
        "result_flags" : [
          ["start_0_0_0_asleep", 0]
        ]
      }
    },
    "required_flags": {
      "start_0_0_0_asleep": {
        "number": 1,
        "response": "Alas, if only you could wake from this surreal place. But this is no dream!"
      }
    },
    "result_flags" : [
      ["start_0_0_0_no_pants", 0]
    ]
  },
  "look around": {
    "response": "String used in response to player's tweet."
  },
  "look up": {
    "alias": "look around"
  },
  "use door": {
    "executable": {
      "location": [0, 0, 1],
      "realm": "start",
    },
  }
}
```