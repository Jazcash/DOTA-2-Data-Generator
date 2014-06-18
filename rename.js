var fs = require("fs")

fs.readdirSync("resources/webms").forEach(function(filename) {
	if (filename == ".svn") return;
	var oldfilename = "resources/webms/"+filename
	var newfilename = oldfilename.substr(0, oldfilename.length-5)
	fs.renameSync(oldfilename, newfilename)
});