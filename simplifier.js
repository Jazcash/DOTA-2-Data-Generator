var jsontufile = require('json-tu-file');

var uglyjHeroes = jsontufile.readFileSync("heroes.json");
var uglyjAbilities = jsontufile.readFileSync("abilities.json");

function convertDictValsToNums(dict){
	for (key in dict){
		if (typeof(dict[key]) == "object"){
			convertDictValsToNums(dict[key]);
		} else {
			if (dict[key].indexOf(",") == -1 && dict[key].indexOf(" ") == -1)
				dict[key] = parseFloat(dict[key]) || dict[key];
			if (dict[key] == "0" || dict[key] == "0.0"){
				dict[key] = 0;
			}
		}
	}
}

function splitSpaces(dict){
	for (key in dict){
		if (typeof(dict[key]) == "object"){
			splitSpaces(dict[key]);
		} else {
			if (dict[key].indexOf(" ") != -1 && dict[key].indexOf("|") == -1){
				dict[key] = dict[key].split(" ");
			} else if(dict[key].indexOf("|") != -1){
				dict[key] = dict[key].split(" | ");
			}
		}
	}
}

function abilitySpecialToArray(abilitiesJson){
	for (ability in abilitiesJson){
		if (ability == "ability_base" || ability == "default_attack" || ability == "attribute_bonus") continue;
		var abilitySpecial = abilitiesJson[ability].AbilitySpecial;
		var abilitySpecialFixed = {};
		for (index in abilitySpecial){
			for (property in abilitySpecial[index]){
				if (property != "var_type"){
					abilitySpecialFixed[property] = abilitySpecial[index][property];
				}
			}
		}
		abilitiesJson[ability].AbilitySpecial = abilitySpecialFixed;
	}
}

convertDictValsToNums(uglyjHeroes);
splitSpaces(uglyjAbilities);
convertDictValsToNums(uglyjAbilities);
abilitySpecialToArray(uglyjAbilities.DOTAAbilities);
jAbilities = uglyjAbilities.DOTAAbilities;

var heroes = {};
var jHeroes = {};
var baseHero = uglyjHeroes.DOTAHeroes.npc_dota_hero_base;

for (heroid in uglyjHeroes.DOTAHeroes){
	if (heroid == "Version" || heroid == "npc_dota_hero_base") continue;
	var hero = uglyjHeroes.DOTAHeroes[heroid];
	if (hero.Enabled == 0) continue;
	name = heroid.split("npc_dota_hero_")[1];
	jHeroes[name] = hero;

	roleTypes = hero.Role.split(",");
	roleLevels = hero.Rolelevels.toString().split(",");
	var roles = {}
	for (var i=0; i<roleTypes.length; i++){
		roles[roleTypes[i]] = parseInt(roleLevels[i]);
	}

	var fullname 				= hero.url.replace("_", " ");
	var side 					= (hero.Team.toUpperCase() == "GOOD") ? "Radiant" : "Dire";
	var isRanged 				= ("AttackCapabilities" in hero) ? (hero.AttackCapabilities != "DOTA_UNIT_CAP_MELEE_ATTACK") : baseHero.AttackCapabilities;
	var primaryAttribute 		= hero.AttributePrimary.split("DOTA_ATTRIBUTE_")[1].toLowerCase();
	var armorPhysical 			= ("ArmorPhysical" in hero) ? hero.ArmorPhysical : baseHero.ArmorPhysical;
	var magicalResistance 		= ("MagicalResistance" in hero) ? hero.MagicalResistance : baseHero.MagicalResistance;
	var attackDamageMin 		= ("AttackDamageMin" in hero) ? hero.AttackDamageMin : baseHero.AttackDamageMin;
	var attackDamageMax 		= ("AttackDamageMax" in hero) ? hero.AttackDamageMax : baseHero.AttackDamageMax;
	var attackDamageAverage 	= ("attackDamageAverage" in hero) ? hero.StatusHealthRegen : baseHero.StatusHealthRegen; (hero.AttackDamageMin+hero.AttackDamageMax)/2;
	var BAT 					= ("AttackRate" in hero) ? hero.AttackRate : baseHero.AttackRate;
	var attackAnimationPoint 	= ("AttackAnimationPoint" in hero) ? hero.AttackAnimationPoint : baseHero.AttackAnimationPoint;
	var attackAcquisitionRange 	= ("AttackAcquisitionRange" in hero) ? hero.AttackAcquisitionRange : baseHero.AttackAcquisitionRange;
	var attackRange 			= ("AttackRange" in hero) ? hero.AttackRange : baseHero.AttackRange;
	var strength 				= ("AttributeBaseStrength" in hero) ? hero.AttributeBaseStrength : baseHero.AttributeBaseStrength;
	var strengthhGain 			= ("AttributeStrengthGain" in hero) ? hero.AttributeStrengthGain : baseHero.AttributeStrengthGain;
	var intellect 				= ("AttributeBaseIntelligence" in hero) ? hero.AttributeBaseIntelligence : baseHero.AttributeBaseIntelligence;
	var intellectGain 			= ("AttributeIntelligenceGain" in hero) ? hero.AttributeIntelligenceGain : baseHero.AttributeIntelligenceGain;
	var agility 				= ("AttributeBaseAgility" in hero) ? hero.AttributeBaseAgility : baseHero.AttributeBaseAgility;
	var agilityGain 			= ("AttributeAgilityGain" in hero) ? hero.AttributeAgilityGain : baseHero.AttributeAgilityGain; 
	var baseHealth 				= ("StatusHealth" in hero) ? hero.StatusHealth : baseHero.StatusHealth;
	var baseHealthRegen 		= ("StatusHealthRegen" in hero) ? hero.StatusHealthRegen : baseHero.StatusHealthRegen;
	var statusMana 				= ("StatusMana" in hero) ? hero.StatusMana : baseHero.StatusMana;
	var statusManaRegen 		= ("StatusManaRegen" in hero) ? hero.StatusManaRegen : baseHero.StatusManaRegen;
	var movementSpeed 			= ("MovementSpeed" in hero) ? hero.MovementSpeed : baseHero.MovementSpeed;
	var movementTurnRate 		= ("MovementTurnRate" in hero) ? hero.MovementTurnRate : baseHero.MovementTurnRate;
	var dayVisionRange 			= ("VisionDaytimeRange" in hero) ? hero.VisionDaytimeRange : baseHero.VisionDaytimeRange;
	var nightVisionRange 		= ("VisionNighttimeRange" in hero) ? hero.VisionNighttimeRange : baseHero.VisionNighttimeRange;
	var ringRadius 				= ("RingRadius" in hero) ? hero.RingRadius : baseHero.RingRadius
	var primaryStat;
	if (primaryAttribute == "strength") 	primaryStat = strength;
	else if(primaryAttribute == "agility") 	primaryStat = agility;
	else  									primaryStat = intellect;
	var IAS 					= primaryStat/100;  // Increased Attack Speed (percentage)

	var abilities = {};
	for (key in hero){
		if (/Ability\d/.test(key)){
			var abilityName = hero[key];
			var ability = {}
			abilities[abilityName] = jAbilities[abilityName];
		}
	}

	heroes[name] = {
		name : fullname,
		url : name,
		side : side,
		roles : roles, 
		isRanged : isRanged,
		primaryAttribute : primaryAttribute,

		health : baseHero.StatusHealth + (19*strength),
		healthRegen : baseHero.StatusHealthRegen + (0.03*strength),
		armour: parseFloat(parseFloat(armorPhysical + 0.14*agility).toFixed(2)),
		magicResistance : magicalResistance,

		mana : baseHero.StatusMana + (13*intellect),
		manaRegen : parseFloat((baseHero.StatusManaRegen + (0.04*intellect)).toFixed(2)),

		minDamage : attackDamageMin + primaryStat,
		maxDamage : attackDamageMax + primaryStat,
		averageDamage : (attackDamageMin + primaryStat + attackDamageMax + primaryStat)/2,
		
		attackTime : parseFloat((BAT / (1 + IAS)).toFixed(2)),
		attacksPerSecond : parseFloat(((1 + IAS) / BAT).toFixed(2)),

		movementSpeed : movementSpeed,
		turnRate : movementTurnRate,

		dayVisionRange : dayVisionRange,
		nightVisionRange : nightVisionRange,

		abilities : abilities
	}
}

console.log(heroes);
jsontufile.writeFileSync(heroes, "fullheroes.json")