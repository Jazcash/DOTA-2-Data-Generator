"use strict"; // node.js strict mode

// node_module imports
var ArgumentParser 	= require('argparse').ArgumentParser;
var fs 				= require('fs'); // file system
var jsontufile 		= require('json-tu-file'); // import and export json files
var vdf 			= require('vdf'); // parse VDF (Valve Data Format) files to JSON
var vdfCleaner 		= require('vdfcleaner'); // my own functions for cleaning up the parsed VDF files by fixing data types and such
var Hero 			= require('./hero'); // my own Hero class
var Ability 		= require('./ability'); // my own Hero class

var parser = new ArgumentParser({version: '0.0.1', addHelp:true, description: 'Argparse example'});
parser.addArgument(["-i", "--indir"], {help: "Full path of your DotA2 folder", defaultValue:"C://Program Files (x86)/Steam/steamapps/common/dota 2 beta/"});
parser.addArgument(["-o", "--outdir"], {help: "Output you wish the data to be dumped to", defaultValue:""});
var args = parser.parseArgs();

main(args);

function main(args){
	var scriptsPath 		= args.indir+"res/flash3/images/heroes"
	var heroImagesPath  	= args.indir+"res/flash3/images/heroes";
	var abilityImagesPath 	= args.indir+"res/flash3/images/spellicons";
	var itemImagesPath  	= args.indir+"res/flash3/images/items";
	var heroWebmsPath   	= args.indir+"res/webms";
	var miniIconsPath 		= args.indir+"res/flash3/images/miniheroes";

	// VDF files parsed to JSON then data types fixed general cleaning done making them usable
	var preHeroesJson 		= removeVersion(vdfCleaner.clean(vdf.parse(fs.readFileSync("res/entitydata/npc_heroes.txt", 'utf8'))).DOTAHeroes);
	var defaultHero			= preHeroesJson.npc_dota_hero_base; delete preHeroesJson.npc_dota_hero_base; // contains all the default values for a hero, most values are then overridden by each specific hero's data
	var preAbilitiesJson 	= removeVersion(vdfCleaner.clean(vdf.parse(fs.readFileSync("res/entitydata/npc_abilities.txt", 'utf8'))).DOTAAbilities);
	delete preAbilitiesJson.ability_base;
	delete preAbilitiesJson.default_attack;
	delete preAbilitiesJson.attribute_bonus;
	// var itemsJson 		= vdfCleaner.clean(vdf.parse(fs.readFileSync("res/entitydata/items.txt", 'utf8')));
	// //var lang 			= getLanguagesJson("res/lang")
	// var language  		= {english:parseLanguageJson(vdf.parse(fs.readFileSync("res/lang/dota_english.txt", "utf-8")))}; // REPLACE THIS LINE WITH THE ABOVE LINE IN FINAL RELEASE
	// var heroes 			= getHeroes(heroesJson, abilitiesJson, language.english);
}

// Could take up to a minute to run this function
function getLanguagesJson(dir){
	var languageFiles = {};
	fs.readdirSync(dir).forEach(function(filename) {
		var language = filename.split("_")[1].split(".")[0];
		languageFiles[language] = parseLanguageJson(vdf.parse(fs.readFileSync(dir+"/"+filename, "utf-8")));
	});
	return languageFiles;
}

function parseLanguageJson(languageJson){
	return languageJson.lang.Tokens;
}

// remove version numbers to leave only pure data
function removeVersion(dict){
	if ("Version" in dict) delete dict.Version;
	return dict;
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

// get all fully usable heroes and all their specific language data
function getHeroes(heroesJson, abilitiesJson, locale){
	var heroes = [];

	for (var heroJson in heroesJson){ // for each hero
		heroes.push(jsonHeroToHero(heroJson, heroesJson[heroJson], locale));
	}

	return heroes;
}