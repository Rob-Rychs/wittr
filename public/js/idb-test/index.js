import idb from 'idb';

// this might be one of the only times you don't use a break statement in a switch... ignore your linter
var dbPromise = idb.open('test-db', 4, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0: 
      var keyValStore = upgradeDb.createObjectStore('keyval');
      keyValStore.put("world", "hello");
    case 1: 
      upgradeDb.createObjectStore('people', { keyPath: 'name' });
    case 2: 
      var peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('animal', 'favoriteAnimal');
    case 3:
      peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('age', 'age');
  }
});

// read "hello" in "keyval"
dbPromise.then(function(db) {
  var tx = db.transaction('keyval');
  var keyValStore = tx.objectStore('keyval');
  return keyValStore.get('hello');
}).then(function(val) {
  console.log('The value of "hello" is:', val);
});

// set "foo" to be "bar" in "keyval"
dbPromise.then(function(db) {
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  keyValStore.put('bar', 'foo');
  return tx.complete;
}).then(function() {
  console.log('Added foo:bar to keyval');
});

dbPromise.then(function(db) {
  // TODO: in the keyval store, set
  // "favoriteAnimal" to your favourite animal
  // eg "cat" or "dog"
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  keyValStore.put('cat', 'favoriteAnimal');
  return tx.complete;
}).then(function() {
  console.log('Added favoriteAnimal:cat to keyval');
});

// create a peopleStore and store some people objects in it
dbPromise.then(function(db) {
  var tx = db.transaction('people', 'readwrite');
  var peopleStore = tx.objectStore('people');

  peopleStore.put({
    name: 'Sam Munoz',
    age: 25,
    favoriteAnimal: 'cat'
  });

  peopleStore.put({
    name: 'Raza Malik',
    age: 27,
    favoriteAnimal: 'dog'
  });

  peopleStore.put({
    name: 'Jake Archibald',
    age: 33,
    favoriteAnimal: 'wombat'
  });

  return tx.complete;
}).then(function() {
  console.log('People added');
});

// lets read from indexedDB by calling .getALL on peopleStore and logging to console
dbPromise.then(function(db) {
  var tx = db.transaction('people');
  var peopleStore = tx.objectStore('people');
  var animalIndex = peopleStore.index('animal');
  // can even pass quesries into indexes with getAll(), here we query 'cat'
  return animalIndex.getAll('cat');
}).then(function(people) {
  console.log('People:', people);
});

// show iterating through idb by by key with a cursor and some control flow for pormises based code
dbPromise.then(function(db) {
  var tx = db.transaction('people');
  var peopleStore = tx.objectStore('people');
  var ageIndex = peopleStore.index('age');
 
  return ageIndex.openCursor();
}).then(function(cursor) {
  if (!cursor) return;
  return cursor.advance(2); // skips first two items
}).then(function logPerson(cursor) {
  if (!cursor) return;
  console.log('Cursored at: ', cursor.value.name);
  // cursor.update(newValue)
  // cursor.delete()
  return cursor.continue().then(logPerson);
}).then(function() {
  console.log('Done cursoring');
});