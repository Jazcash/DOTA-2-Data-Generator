/* 	Author: Jazcash June 2014 
	Note: The DotA2 VDF files are really messy. They seem to have incosistent formatting, names, typos and other such messes so don't be surprised if some of the data comes out funky.
*/

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

var UNIQUE_VALUES 		= jsontufile.readFileSync("uniqueValues.json");

var INITIAL_Heroes 		= vdfToJson(fs.readFileSync(PATH.HEROES, 'utf8'));
var INITIAL_Defaulthero	= INITIAL_Heroes.npc_dota_hero_base; delete INITIAL_Heroes.npc_dota_hero_base;
var INITIAL_Abilities	= vdfToJson(fs.readFileSync(PATH.ABILITIES, 'utf8'));
var INITIAL_Items 		= vdfToJson(fs.readFileSync(PATH.ITEMS, 'utf8'));
var LOCALES 			= getLocales(PATH.LOCALES);

var heroes 				= getHeroes();

console.log(heroes);

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
			} else if (object[key].indexOf("|") != -1){ // Ability Types
				object[key] = object[key].replace(/\s/g, "").split("|");
				if (object[key].indexOf("") != -1) object[key].splice(object[key].indexOf(""), 1)
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
	var hero = {};

	console.log(INITIAL_Hero);

	var abilityurls = [];
	for (var key in INITIAL_Hero){
		if (/Ability\d/.test(key)){
			var abilityurl = INITIAL_Hero[key];
			if (abilityurl != "attribute_bonus") abilityurls.push(abilityurl);
		}
	}

	var title = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl];
	if (title === undefined || title == "" || title == " ") {
		title = toTitleCase(abilityurl.split(herourl+"_")[1].replace(/\_/g, " "));
	}
	hero["Title"] = LOCALES.LANGUAGES.english["npc_dota_hero_"+herourl];

	var lore = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl+"_Lore"];
	if (lore !== undefined && lore != "" && lore != " ") {
		hero["Lore"] = lore.replace(/(<[^>]*>)|(\\)*\\n/g, "").replace(/\s(\s)+/g, " ");
	}

	hero["Abilities"] = getHeroAbilities(abilityurls, herourl);

	return hero;
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

	function getSimpleNames(key, longpart){
		var things = [];
		if (key in data){
			var thing = (typeof(data[key]) == "object") ? data[key] : [data[key]];
			for (var i in thing){
				things.push(thing[i].split(longpart+"_")[1]);
			}
		}
		if (things.length != 0) return things; else return null;
	}

	var ability = {};

	var title = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl];
	if (title === undefined || title == "" || title == " ") {
		title = toTitleCase(abilityurl.split(herourl+"_")[1].replace(/\_/g, " "));
	}
	ability["Title"] = title;

	var shortAbilityUrl = abilityurl.split(herourl+"_")[1];

	var data = INITIAL_Abilities[abilityurl];

	ability["Url"] = shortAbilityUrl;

	ability["ID"] = data.ID; delete data.ID;
	
	var description = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl+"_Description"];
	if (description !== undefined && description != "" && description != " ") {
		ability["Description"] = description.replace(/(<[^>]*>)|(\\)*\\n/g, "").replace(/\s(\s)+/g, " ");
	}

	var lore = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl+"_Lore"];
	if (lore !== undefined && lore != "" && lore != " ") {
		ability["Lore"] = lore.replace(/(<[^>]*>)|(\\)*\\n/g, "").replace(/\s(\s)+/g, " ");
	}

	var notes = [];
	for (var i=0; i<5; i++){
		var note =  LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl+"_Note"+i];
		if (note == undefined) break;
		notes.push(note.replace(/(<[^>]*>)|(\\)*\\n/g, "").replace(/\s(\s)+/g, " "));
	}
	if (notes.length != 0) ability["Notes"] = notes;
	
	for (var key in data){
		if (typeof(data[key]) != "object") data[key] = [data[key]];
	}

	ability["Type"] = "BASIC";

	for (var abilityTag in data){
		var value = data[abilityTag]; // e.g. [ 'DOTA_UNIT_TARGET_HERO', 'DOTA_UNIT_TARGET_BASIC' ]
		switch (abilityTag){
			case "AbilityType":
				ability["Type"] = value[0].split("DOTA_ABILITY_TYPE_")[1];
				break;
			case "AbilityUnitDamageType":
				ability["DamageType"] = value[0].split("DAMAGE_TYPE_")[1];
				break;
			case "AbilityBehavior":
				ability["Behavior"] = [];
				for (var abilityFlag in value){
					ability["Behavior"].push(value[abilityFlag].split("DOTA_ABILITY_BEHAVIOR_")[1]);
				}
				break;
			case "AbilityUnitTargetType":
				ability["TargetType"] = [];
				for (var abilityFlag in value){
					ability["TargetType"].push(value[abilityFlag].split("DOTA_UNIT_TARGET_")[1]);
				}
				break;
			case "AbilityUnitTargetTeam":
				ability["TargetTeam"] = [];
				for (var abilityFlag in value){
					ability["TargetTeam"].push(value[abilityFlag].split("DOTA_UNIT_TARGET_TEAM_")[1]);
				}
				break;
			case "AbilityUnitTargetFlag":
			case "AbilityUnitTargetFlags":
				ability["TargetFlags"] = [];
				for (var abilityFlag in value){
					ability["TargetFlags"].push(value[abilityFlag].split("DOTA_UNIT_TARGET_FLAG_")[1]);
				}
				break;
			case "MaxLevel":
				ability["MaxLevel"] = value[0];
				break;
			case "DisplayAdditionalHeroes": // Meepo, Lone Druid
				ability["SpawnsAdditionalHero"] = true;
				break;
			default:
				if (["AbilityCastPoint", "AbilityCooldown", "AbilityDuration", "AbilityDamage", "AbilityManaCost", "AbilityModifierSupportValue", "AbilityCastRange", "AbilityChannelTime", "AbilityModifierSupportBonus", "AbilityCastRangeBuffer"].indexOf(abilityTag) == -1){
					//console.log(abilityTag);
				} else {
					ability[abilityTag] = value;
				}
				break;
		}
	}

	var special = [];
	if ("AbilitySpecial" in data){
		for (var specialurl in data.AbilitySpecial){
			var value = data.AbilitySpecial[specialurl];
			if (typeof(value) != "object") value = [value];
			var name = LOCALES.LANGUAGES.english["DOTA_Tooltip_ability_"+abilityurl+"_"+specialurl];
			if (name == undefined) continue;
			name = name.replace(":", "").replace("(\\)*\\n", "");
			var type = (name[0] == "%") ? "PERCENTAGE" : "FIXED";
			if (type == "PERCENTAGE"){
				name = name.replace("%", "");
				for (var i in value){
					value[i] = value[i]/100;
				}
			}
			special.push({
				Attribute: toTitleCase(name),
				Url: specialurl,
				ValueType: type,
				Value: value
			})
		}
	}
	ability["AbilitySpecial"] = special;
	delete data.AbilitySpecial;

	return ability;
}

function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}