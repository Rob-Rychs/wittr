import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

function openDatabase() {
  // If the browser doesn't support service worker we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  // TODO: return a promise for a database called 'wittr' that contains one objectStore: 'witters' that uses 'id' as it's key and has an index called 'by-date', which is sorted by the 'time' property
  return idb.open('wittr', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('wittrs', {
      keyPath: 'id'
    });
    store.createIndex('by-date', 'time');
  });
}

export default function IndexController(container) {
  this._container = container;
  this._postsView = new PostsView(this._container);
  this._toastsView = new ToastsView(this._container);
  this._lostConnectionToast = null;
  this._dbPromise = openDatabase();
  this._registerServiceWorker();

  var indexController = this;

  this._showCachedMessages().then(function() {
    indexController._openSocket();
  });
}

IndexController.prototype._showCachedMessages = function() {
  var indexController = this;

  return this._dbPromise.then(function(db) {
    // if we're already showing posts, eg shift-refresh or the very first load, there's no point fetching posts from IDB
    if (!db || indexController._postsView.showingPosts()) return;
    
    // TODO: get all of the wittr message objects from the indexdb, then pass them to: indexController._postsView.addPosts(messages) in order of date, starting with the latest. Remember to return a promise that does all this, so the websocket isn't opened until you're done!
    var index = db.transaction('wittrs').objectStore('wittrs').index('by-date');

    return index.getAll().then(function(messages) {
      indexController._postsView.addPosts(messages.reverse());
    });
  });
};

IndexController.prototype._registerServiceWorker = function() {
  if (!navigator.serviceWorker) return;

  var indexController = this;

  navigator.serviceWorker.register('/sw.js').then(function(reg) {
    // TODO: if there's no controller, this page wasn't loaded
    // via a service worker, so they're looking at the latest version.
    // In that case, exit early
    if (!navigator.serviceWorker.controller) {
      return;
    }
    // TODO: if there's an updated worker already waiting, call
    // indexController._updateReady()
    if (reg.waiting) {
      indexController._updateReady(reg.waiting);
      return;
    }
    // TODO: if there's an updated worker installing, track its
    // progress. If it becomes "installed", call
    // indexController._updateReady()
    if (reg.installing) {
      indexController._trackInstalling(reg.installing);
      return;
    }
    // TODO: otherwise, listen for new installing workers arriving.
    // If one arrives, track its progress.
    // If it becomes "installed", call
    // indexController._updateReady()
    reg.addEventListener('updatefound', function() {
      indexController._trackInstalling(reg.installing);
    });
  });

  // TODO: listen for the controlling service worker changing and reload the page
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    console.log('bug');
    window.location.reload();
  });
};

IndexController.prototype._trackInstalling = function(worker) {
  var indexController = this;

  worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
      indexController._updateReady(worker);
    }
  });
};

IndexController.prototype._updateReady = function(worker) {
  var toast = this._toastsView.show("New version available", {
    buttons: ['refresh', 'dismiss']
  });

  toast.answer.then((answer) => {
    if (answer != 'refresh') return;
    // tell the service worker to skipWaiting
    worker.postMessage({action: 'skipWaiting'});
  });
};

// open a connection to the server for live updates
IndexController.prototype._openSocket = function() {
  var indexController = this;
  var latestPostDate = this._postsView.getLatestPostDate();

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location);
  socketUrl.protocol = 'ws';

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf();
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1);

  var ws = new WebSocket(socketUrl.href);

  // add listeners
  ws.addEventListener('open', function() {
    if (indexController._lostConnectionToast) {
      indexController._lostConnectionToast.hide();
    }
  });

  ws.addEventListener('message', function(event) {
    requestAnimationFrame(function() {
      indexController._onSocketMessage(event.data);
    });
  });

  ws.addEventListener('close', function() {
    // tell the user
    if (!indexController._lostConnectionToast) {
      indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…");
    }

    // try and reconnect in 5 seconds
    setTimeout(function() {
      indexController._openSocket();
    }, 5000);
  });
};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function(data) {
  var messages = JSON.parse(data);

  this._dbPromise.then(function(db) {
    if (!db) return;

    // TODO: put each message into the 'witters' object store
    var tx = db.transaction('wittrs', 'readwrite');
    var store = tx.objectStore('wittrs');
    messages.forEach(function(message) {
      store.put(message);
    });

    // TODO: keep the newest 30 entries in 'wittrs', but delete the rest. Hint: you can use .openCursor(null, 'prev') to open a cursor that goes through an index/store backwards.
    store.index('by-date').openCursor(null, 'prev').then(function(cursor) {
      return cursor.advance(30);
    }).then( function deleteRest(cursor) {
      if (!cursor) return;
      cursor.delete();
      return cursor.continue().then(deleteRest);
    });
  });

  this._postsView.addPosts(messages);
};