// node_module imports
var fs 			= require('fs'); // file system
var jsontufile 	= require('json-tu-file'); // import and export json files
var vdf 		= require('vdf'); // parse VDF (Valve Data Format) files to JSON

// VDF files parsed to JSON
var englishJson 	= vdf.parse(fs.readFileSync("dota_english.txt", "utf-8"));
var heroesJson 		= vdf.parse(fs.readFileSync("npc_heroes.txt", 'utf8'));
var abilitiesJson 	= vdf.parse(fs.readFileSync("npc_abilities.txt", 'utf8'));
var itemsJson 		= vdf.parse(fs.readFileSync("items.txt", 'utf8'));

