var vdf = require('vdf')
var fs = require('fs')
var jsontufile = require('json-tu-file')

var vdfstr = fs.readFileSync("dota_english.txt", "utf-8")

var json = vdf.parse(vdfstr)

var abilityTooltips = {}

splitValuesToArrays(json.lang.Tokens)

function splitValuesToArrays(dict){
	for (key in dict){
		var val = dict[key];
		if (/DOTA_Tooltip_ability_/.test(key)){
			var newkey = key.split("DOTA_Tooltip_ability_")[1]
				console.log(newkey)
			abilityTooltips[newkey] = val
		}
	}
}

//console.log(abilityTooltips)