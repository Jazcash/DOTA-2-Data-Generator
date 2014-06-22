"use strict"; // node.js strict mode

// node_module imports
//var ArgumentParser 	= require('argparse').ArgumentParser;
var fs 				= require('fs'); // file system
var jsontufile 		= require('json-tu-file'); // import and export json files
var vdf 			= require('vdf'); // parse VDF (Valve Data Format) files to JSON

// global variables
var PATH = {
	LOCALES: "resources/localesTesting/",
	HEROES: "resources/scripts/npc_heroes.txt",
	ABILITIES: "resources/scripts/npc_abilities.txt",
	ITEMS: "resources/scripts/items.txt",
	HEROIMAGES: "resources/images/heroes/",
	MINIHEROIMAGES: "resources/images/miniheroes/",
	ABILITYIMAGES:  "resources/images/spellicons/",
	ITEMIMAGES: "resources/images/items/",
	WEBMS: "resources/webms/"
}

var INITIAL_Heroes 		= vdfToJson(fs.readFileSync(PATH.HEROES, 'utf8'));
var INITIAL_Defaulthero	= INITIAL_Heroes.npc_dota_hero_base; delete INITIAL_Heroes.npc_dota_hero_base;
var INITIAL_Abilities	= vdfToJson(fs.readFileSync(PATH.ABILITIES, 'utf8'));
var INITIAL_Items 		= vdfToJson(fs.readFileSync(PATH.ITEMS, 'utf8'));
var LOCALES 			= getLocales(PATH.LOCALES);

var heroes 				= getHeroes();

function vdfToJson(inJson){
	function traverse(object){
		for (var key in object){
			if (typeof(object[key]) == "object" && key != "AbilitySpecial" && key != "ItemRequirements"){
				traverse(object[key]);
			} else if(key == "AbilitySpecial"){
				var AbilitySpecial = object[key];
				var properties = {};
				for (var index in AbilitySpecial){
					var property = AbilitySpecial[index];
					for (var name in property){
						if (name != "var_type"){
							properties[name] = property[name];
						}
					}
				}
				object[key] = properties;
				traverse(object[key]);
			} else if (key == "ItemRequirements"){
				var ItemRequirements = object[key];
				var requirements = [];
				for (var index in ItemRequirements){
					var thisRequirements = ItemRequirements[index].split(";");
					for (var requirement in thisRequirements){
						requirements.push(thisRequirements[requirement]);
					}
				}
				object[key] = requirements;
				traverse(object[key]);
			} else if (object[key].indexOf(",") != -1){ // Roles
				object[key] = object[key].split(","); 
				traverse(object[key]);
			} else if (object[key].indexOf("; ") != -1){ // Timbersaw NameAliases exception (silly VDF files)
				object[key] = object[key].split("; ");
			} else if (object[key].indexOf(";") != -1){ // NameAliases
				object[key] = object[key].split(";");
			} else if (object[key].indexOf(" | ") != -1){ // Ability Types
				object[key] = object[key].split(" | ");
			} else if (object[key].indexOf(" ") != -1 && key != "ItemAliases"){
				object[key] = object[key].split(" ");
				traverse(object[key]);
			} else if (object[key] == "0" || object[key] == "0.0"){
				object[key] = 0;
			} else if (object[key] == ""){
				delete object[key];
			} else {
				object[key] = parseFloat(object[key]) || object[key].trim();
			}
		}
	}

	var json = vdf.parse(inJson);
	if ("DOTAHeroes" in json) json = json.DOTAHeroes;
	if ("DOTAAbilities" in json) json = json.DOTAAbilities;
	if ("Version" in json) delete json.Version;
	if ("default_attack" in json) delete json.default_attack;
	if ("ability_base" in json) delete json.ability_base;
	if ("attribute_bonus" in json) delete json.attribute_bonus;

	traverse(json);

	return json;
}

function getLocales(dir){
	// returns an array of matches of a string for given regex
	function getMatches(string, regex, index) {
	    index || (index = 1); // default to the first capturing group
	    var matches = [];
	    var match;
	    while (match = regex.exec(string)) {
	        matches.push(match[index]);
	    }
	    return matches;
	}

	var locale = {"LANGUAGES":{}, "SUBTITLES":{}};
	var heroPart = /\_(\w*)_english/g;
	fs.readdirSync(dir).forEach(function(filename) {
		if (filename[0] == "." || /announcer|koreana|tut1|tutorial/.test(filename)) return;
		var filepath = dir+filename;
		var encoding = (fs.readFileSync(filepath)[0] == 255) ? "ucs2" : "utf-8";
		if (/dota_/g.test(filename)){
			var output = vdf.parse(fs.readFileSync(filepath, encoding));
			var language = filename.split("_")[1].split(".")[0];
			for (var key in output){
				locale.LANGUAGES[language] = output[key].Tokens;
			}
		} else if (/subtitles\_/g.test(filename)){
			var output = vdf.parse(fs.readFileSync(filepath, encoding)); 
			var heroname = getMatches(filename, heroPart, 1)[0];
			for (var key in output){
				locale.SUBTITLES[heroname] = output[key].Tokens;
			}
		}
	});
	return locale;
}

function getHeroes(){
	var heroes = [];

	for (var fullherourl in INITIAL_Heroes){
		var INITIAL_Hero = INITIAL_Heroes[fullherourl];
		var herourl = fullherourl.split("npc_dota_hero_")[1];
		var hero = getHero(INITIAL_Hero, herourl);
		heroes.push(hero);
	}

	return heroes;
}

function getHero(INITIAL_Hero, herourl){
	var abilityurls = [];
	for (var key in INITIAL_Hero){
		if (/Ability\d/.test(key)){
			var abilityurl = INITIAL_Hero[key];
			if (abilityurl != "attribute_bonus") abilityurls.push(abilityurl);
		}
	}
	
	var abilities = getHeroAbilities(abilityurls, herourl);
}

function getHeroAbilities(abilityurls, herourl){
	var heroAbilities = [];

	for (var i in abilityurls){
		var abilityurl = abilityurls[i];
		var ability = getHeroAbility(abilityurl, herourl);
		heroAbilities.push(ability);
	}

	return heroAbilities;
}

function getHeroAbility(abilityurl, herourl){
	function toTitleCase(str){
	    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	}

	var name = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl];
	if (name === undefined || name == "" || name == " ") {
		name = toTitleCase(abilityurl.split(herourl+"_")[1].replace(/\_/g, " "));
	}

	var description = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl+"_Description"];
	if (description === undefined || description == "" || description == " ") {
		description = "";
	}
	
	var lore = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl+"_Lore"];
	if (lore === undefined || lore == "" || lore == " ") {
		lore = "";
	}

	var notes = [];
	for (var i=0; i<5; i++){
		var note =  LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl+"_Note"+i];
		if (note == undefined) break;
		notes.push(note);
	}

	var data = INITIAL_Abilities[abilityurl];
	data["Name"] = name;
	data["Description"] = description;
	data["Lore"] = lore;
	data["Notes"] = notes;

	console.log(data);
}