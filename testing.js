"use strict"; // node.js strict mode

// node_module imports
var ArgumentParser 	= require('argparse').ArgumentParser;
var fs 				= require('fs'); // file system
var jsontufile 		= require('json-tu-file'); // import and export json files
var vdf 			= require('vdf'); // parse VDF (Valve Data Format) files to JSON

var parser = new ArgumentParser({version: '0.0.1', addHelp:true, description: 'Argparse example'});
parser.addArgument(["-o", "--outdir"], {help: "Output directory you wish the data to be dumped to", defaultValue:""});
var args = parser.parseArgs();

main(args);

function main(args){
	var npcPath 			= "resources/scripts/npc/";
	var localesPath 		= "resources/locales/";
	var heroImagesPath  	= "resources/images/heroes/";
	var miniIconsPath 		= "resources/images/miniheroes/";
	var abilityImagesPath 	= "resources/images/spellicons/";
	var itemImagesPath  	= "resources/images/items/";
	var heroWebmsPath   	= "resources/webms/";

	// VDF files parsed to JSON then data types fixed general cleaning done making them usable
	var preHeroesJson 		= vdfToJson(fs.readFileSync(npcPath+"npc_heroes.txt", 'utf8'));
	var defaultHero			= preHeroesJson.npc_dota_hero_base; delete preHeroesJson.npc_dota_hero_base; // base hero data
	var preAbilitiesJson 	= vdfToJson(fs.readFileSync(npcPath+"npc_abilities.txt", 'utf8'));
	var preItemsJson 		= vdfToJson(fs.readFileSync(npcPath+"items.txt", 'utf8'));
	var locale 				= getLanguagesJson(localesPath)

	var engHeroes 			= getHeroes(preHeroesJson, preAbilitiesJson, locale.subtitles, locale.info.english);
	console.log(engHeroes)
}

// vdf module does generic VDF to JSON conversion, this function is DotA2 specific and formats numbers and other values appropriately
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

// Could take up to a minute to run this function
function getLanguagesJson(dir){
	var locale = {"info":{}, "subtitles":{}};
	var heroPart = /\_(\w*)_english/g;
	fs.readdirSync(dir).forEach(function(filename) {
		if (filename[0] == "." || /announcer|koreana|tut1|tutorial/.test(filename)) return;
		var filepath = dir+filename;
		var encoding = (fs.readFileSync(filepath)[0] == 255) ? "ucs2" : "utf-8";
		if (/dota_english/g.test(filename)){              // REPLACE THIS LINE WITH THIS LATER: if (/dota_/g.test(filename)){
			var output = vdf.parse(fs.readFileSync(filepath, encoding));
			var language = filename.split("_")[1].split(".")[0];
			for (var key in output){
				locale.info[language] = output[key].Tokens;
			}
		} else if (/subtitles_antimage\_/g.test(filename)){				// REPLACE THIS LINE WITH THIS LATER: } else if (/subtitles\_/g.test(filename)){
			var output = vdf.parse(fs.readFileSync(filepath, encoding)); 
			var heroname = getMatches(filename, heroPart, 1)[0];
			for (var key in output){
				locale.subtitles[heroname] = output[key].Tokens;
			}
		}
	});
	return locale;
}

// get all fully usable heroes and all their specific language data
function getHeroes(heroesJson, abilitiesJson, heroSubs, languageJson){
	var heroes = [];
	for (var fullherourl in heroesJson){ // for each hero
		var preHero = heroesJson[fullherourl];
		var herourl = fullherourl.split("npc_dota_hero_")[1];
		var subtitles = heroSubs[herourl];
		
		var abilities = [];
		for (var key in preHero){
			if (/Ability\d/.test(key)){
				var abilityName = preHero[key];
				if (abilityName == "attribute_bonus") continue;
				var ability = abilitiesJson[abilityName]
				ability["Name"] = abilityName
				abilities.push(ability)
			}
		}

		var fullname = languageJson[fullherourl];

		getHero(herourl, preHero, abilities, subtitles, languageJson)

	}
	return heroes;
}

function getHero(herourl, hero, abilities, subtitles, locale){
	if (herourl == "antimage"){
		//console.log(locale)
	}
}

function jsonHeroToHero(jsonHeroName, jsonHero, language){
	var hero = {
		heroName 				: language.english[jsonHeroName],
		url						: jsonHero.url || defaultjsonHero.url,
		side 					: jsonHero.Team.toUpperCase(),
		attackCapabilities 		: jsonHero.AttackCapabilities || defaultjsonHero.AttackCapabilities,
		primaryAttribute 		: jsonHero.AttributePrimary.split("DOTA_ATTRIBUTE_")[1].toLowerCase(),
		armorPhysical 			: jsonHero.ArmorPhysical || defaultjsonHero.ArmorPhysical,
		magicalResistance 		: jsonHero.MagicalResistance || defaultjsonHero.MagicalResistance,
		attackDamageMin 		: jsonHero.AttackDamageMin || defaultjsonHero.AttackDamageMin,
		attackDamageMax 		: jsonHero.AttackDamageMax || defaultjsonHero.AttackDamageMax,
		BAT 					: jsonHero.AttackRate || defaultjsonHero.AttackRate, // Base attack time
		attackAnimationPoint 	: jsonHero.AttackAnimationPoint || defaultjsonHero.AttackAnimationPoint,
		attackAcquisitionRange 	: jsonHero.AttackAcquisitionRange || defaultjsonHero.AttackAcquisitionRange,
		attackRange 			: jsonHero.AttackRange || defaultjsonHero.AttackRange,
		strength 				: jsonHero.AttributeBaseStrength || defaultjsonHero.AttributeBaseStrength,
		strengthhGain 			: jsonHero.AttributeStrengthGain || defaultjsonHero.AttributeStrengthGain,
		intellect 				: jsonHero.AttributeBaseIntelligence || defaultjsonHero.AttributeBaseIntelligence,
		intellectGain 			: jsonHero.AttributeIntelligenceGain || defaultjsonHero.AttributeIntelligenceGain,
		agility 				: jsonHero.AttributeBaseAgility || defaultjsonHero.AttributeBaseAgility,
		agilityGain 			: jsonHero.AttributeAgilityGain || defaultjsonHero.AttributeAgilityGain, 
		baseHealth 				: jsonHero.StatusHealth || defaultjsonHero.StatusHealth,
		baseHealthRegen 		: jsonHero.StatusHealthRegen || defaultjsonHero.StatusHealthRegen,
		statusMana 				: jsonHero.StatusMana || defaultjsonHero.StatusMana,
		statusManaRegen 		: jsonHero.StatusManaRegen || defaultjsonHero.StatusManaRegen,
		movementSpeed 			: jsonHero.MovementSpeed || defaultjsonHero.MovementSpeed,
		movementTurnRate 		: jsonHero.MovementTurnRate || defaultjsonHero.MovementTurnRate,
		dayVisionRange 			: jsonHero.VisionDaytimeRange || defaultjsonHero.VisionDaytimeRange,
		nightVisionRange 		: jsonHero.VisionNighttimeRange || defaultjsonHero.VisionNighttimeRange,
		ringRadius 				: jsonHero.RingRadius || defaultjsonHero.RingRadius,
		abilities 				: getHeroAbilities(jsonHero.url, jsonHero)
	}

	return hero;
}
function getHeroAbilities(url, jsonHero, abilityNames){
	var abilityNames = getHeroAbilityNames(url, jsonHero);
	var abilities = [];

	for (var i=0; i<abilityNames.length; i++){
		var ability = jsonAblityToAbility(abilityNames[i], abilitiesJson[abilityNames[i]]);
		if (ability != null) abilities.push(ability);
	}

	return abilities;
}

function jsonAblityToAbility(abilityUrl, preJsonAbility, locale){
	var name 				= language.english["DOTA_Tooltip_ability_"+abilityUrl] || language.english["DOTA_Tooltip_modifier_"+abilityUrl];
	if (name === undefined || name == "" || name == " ") return null;
	var description 		= language.english["DOTA_Tooltip_ability_"+abilityUrl+"_Description"] || null;
	if (description != null && description !== undefined) description = description.replace(/(<[^>]*>)/g, "").split("\\n\\n");
	var lore 				= language.english["DOTA_Tooltip_ability_"+abilityUrl+"_Lore"] || null; // || null;
	if (lore != null && lore !== undefined) lore = lore.replace(/(<[^>]*>)/g, "").split("\\n\\n");

	var jsonAbility = {
		id 						: preJsonAbility.ID || null,
		name 					: name,
		url 					: abilityUrl,
		description 			: description,
		lore 					: lore,
		imagePath				: abilityImagesPath+"/"+abilityUrl+".png",
		type 					: preJsonAbility.AbilityType || null,
		behavior 				: preJsonAbility.AbilityBehavior || null,
		targetTeam 				: preJsonAbility.AbilityUnitTargetTeam || null,
		targetType 				: preJsonAbility.AbilityUnitTargetType || null,
		targetFlags				: preJsonAbility.AbilityUnitTargetFlags || null,
		castRange 				: preJsonAbility.AbilityCastRange || null,
		castPoint 				: preJsonAbility.AbilityCastPoint || null,
		cooldown 				: preJsonAbility.AbilityCooldown || null,
		manaCost 				: preJsonAbility.AbilityManaCost || null,
		damageType 				: preJsonAbility.AbilityUnitDamageType || null,
		modifierSupportValue 	: preJsonAbility.AbilityModifierSupportValue || null,
		duration 				: preJsonAbility.AbilityDuration || null,
		damage  				: preJsonAbility.AbilityDamage || null,
		channelTime 			: preJsonAbility.AbilityChannelTime || null,
		maxLevel 				: preJsonAbility.MaxLevel || null,
		specials 				: getAbilitySpecial(preJsonAbility.AbilitySpecial || null),
		notes 					: getAbilityNotes(abilityUrl),
		aghanimDescription		: language.english["DOTA_Tooltip_ability_"+abilityUrl+"_aghanim_description"] || null
	}

	return jsonAbility;
}

function getAbilityNotes(abilityUrl){
	var notes = [];
	for (var i=0; i<10; i++){
		var note = language.english["DOTA_Tooltip_ability_"+abilityUrl+"_Note"+i];
		if (note != null && note !== undefined) notes.push(note);
		else break;
	}
	if (notes.length > 0) return notes;
	else return null;
}

function getAbilitySpecial(preAbilitySpecial){
	if (preAbilitySpecial == null || preAbilitySpecial === undefined) return null;
	var abilitySpecial = {};
	for (var index in preAbilitySpecial){
		for (var property in preAbilitySpecial[index]){
			if (property == "var_type") continue;
			abilitySpecial[property] = preAbilitySpecial[index][property];
		}
	}
	return abilitySpecial;
}

function getHeroAbilityNames(heroUrl, jsonHero){
	var abilityNames = [];
	for (key in jsonHero){
		if (/Ability\d/.test(key)){
			var abilityName = jsonHero[key];
			if (abilityName != "attribute_bonus") abilityNames.push(abilityName);
		}
	}
	return abilityNames;
}

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