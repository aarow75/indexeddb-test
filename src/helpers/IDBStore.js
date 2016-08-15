function ICDB(dbName, storeName) {
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  var open = indexedDB.open(dbName, 1);

  // Create the schema
  open.onupgradeneeded = function() {
      var db = open.result;
      var store = db.createObjectStore(storeName, {keyPath: "id"});
      var index = store.createIndex("NameIndex", "lastName");
  }.bind(this);

  open.onsuccess = function() {
      // Start a new transaction
      var db = open.result;
      var tx = db.transaction(storeName, "readwrite");
      var store = tx.objectStore(storeName);
      var index = store.index("NameIndex");

      // Add some data
      for(let x = 0; x < 4000; x++){
        store.put({
          id: x,
          avatar: faker.image.avatar(),
          city: faker.address.city(),
          email: faker.internet.email(),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          street: faker.address.streetName(),
          zipCode: faker.address.zipCode(),
          date: faker.date.past(),
          bs: faker.company.bs(),
          catchPhrase: faker.company.catchPhrase(),
          companyName: faker.company.companyName(),
          words: faker.lorem.words(),
          sentence: faker.lorem.sentence(),
        });
      }


      // Close the db when the transaction is done
      tx.oncomplete = function() {
          db.close();
      };
  }.bind(this)
}

function ICDBFetch(dbName, storeName, getThis) {
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  var open = indexedDB.open(dbName, 1);

  // Create the schema
  open.onupgradeneeded = function() {
      var db = open.result;
      var store = db.createObjectStore(storeName, {keyPath: "id"});
      var index = store.createIndex("NameIndex", "lastName");
  }.bind(this);

  open.onsuccess = function() {
      // Start a new transaction
      var db = open.result;
      var tx = db.transaction(storeName, "readwrite");
      var store = tx.objectStore(storeName);
      var index = store.index("NameIndex");

      var getResult = index.getAll(getThis);

      getResult.onsuccess = function() {
          console.log(getResult.result);   // => "Bob"
      };

      // Close the db when the transaction is done
      tx.oncomplete = function() {
          db.close();
      };
  }.bind(this)
}

// window.ICDB = ICDB;
// window.ICDBFetch = ICDBFetch;
