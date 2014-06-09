var fs = require('fs');
var isJSON = require('is-json');


function JSONValid (obj) {
  return isJSON(obj, true) ? JSON.parse(obj) : null;
}


var jsonTuFile = exports;

jsonTuFile._spaces = 2;

jsonTuFile.readFile = function (file, cb) {
  fs.readFile(file, 'utf8', function cb_readFile (err, data) {
    if (err) return cb(err);

    var obj = JSONValid(data);
    return cb(obj ? null : new TypeError('Type Error: cannot parse data.'), obj);
  });
};

jsonTuFile.readFileSync = function (file) {
  return JSONValid(fs.readFileSync(file, 'utf8'));
};

jsonTuFile.writeFile = function(obj, file, options, cb) {
  if (!cb) {
    cb = options;
    options = null;
  }

  var str = JSON.stringify(obj, null, this._spaces);
  fs.writeFile(file, str, options, cb);
};

jsonTuFile.writeFileSync = function(obj, file, options) {
  var str = JSON.stringify(obj, null, this._spaces);
  fs.writeFileSync(file, str, options);
};
