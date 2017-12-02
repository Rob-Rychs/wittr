import idb from 'idb';

// this might be one of the only times you don't use a break statement in a switch... ignore your linter
var dbPromise = idb.open('test-db', 2, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0: 
      var keyValStore = upgradeDb.createObjectStore('keyval');
      keyValStore.put("world", "hello");
    case 1: 
      upgradeDb.createObjectStore('people', { keyPath: 'name' });
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

  return peopleStore.getAll();
}).then(function(people) {
  console.log('People:', people);
});