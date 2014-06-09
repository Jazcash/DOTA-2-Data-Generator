# json-tu-file

<a href="https://nodei.co/npm/json-tu-file/"><img src="https://nodei.co/npm/json-tu-file.png"></a>

[![Build Status](https://travis-ci.org/joaquimserafim/json-tu-file.png?branch=master)](https://travis-ci.org/joaquimserafim/json-tu-file)


An simplest way to read/write JSON and to avoid to always use try/catch blocks when use JSON.parse/JSON.stringify with fs.readFile and fs.writeFile.


**V1.2**

##Usage


    var JSONFile = require('json-tu-file');
    
    var obj = {
        "n":8,
        "msg":"Hello World 7bc59b8e-8a3f-2d04-62eb-8c9f5c39606f",
        "tmx":1388775322979
    };
    

    // writeFile(obj, 'file, [options], callback(err))
    
    JSONFile.writeFile(obj, 'write.json', {encoding: 'ascii'}, function (err) {
        if (err) throw err;
        
        console.log('ok');
    });
    
    // options: Object
    //    encoding String | Null default = 'utf8'
    //    mode Number default = 438 (aka 0666 in Octal)
    //    flag String default = 'w'
    
    
    // writeFileSync(obj, file, [options])
    
    JSONFile.writeFileSync(obj, 'write_sync.json', {encoding: 'ascii'});   
          
    
    // readFile(file, callback(err, data))
    
    JSONFile.readFile('write.json', function (err, data) {
        if (err) throw err;
        
        console.log(data);
    });
    
    
    //readFileSync(file)
    
    var data = JSONFile.readFileSync('write.json');
