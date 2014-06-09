var test = require('tape');
var JSONFile = require('../');


test('write', function (t) {
  t.plan(1);

  var obj = {"n":8,"msg":"Hello World 7bc59b8e-8a3f-2d04-62eb-8c9f5c39606f","tmx":1388775322979};

  JSONFile.writeFile(obj, 'test/write.json', function (err) {
    if (err) t.error(err, 'write json to file');

    t.pass('write json object to file.');
  });
});


test('write sync', function (t) {
  t.plan(1);

  var obj = {"n":8,"msg":"Hello World 7bc59b8e-8a3f-2d04-62eb-8c9f5c39606f","tmx":1388775322979};

  try {
    JSONFile.writeFileSync(obj, 'test/write_sync.json');
    t.pass('write sync json object to file.');
  } catch (err) {
    t.error(err);
  }
});

test('read', function (t) {
  t.plan(1);

  JSONFile.readFile('test/write.json', function (err, data) {
    if (err) t.error(err, 'write json to file');

    t.deepEqual(typeof data, 'object', JSON.stringify(data));
  });
});

test('read sync', function (t) {
  t.plan(1);

  try {
    var data = JSONFile.readFileSync('test/write_sync.json');
    t.deepEqual(typeof data, 'object', JSON.stringify(data));
  } catch (err) {
    t.error(err);
  }
});
