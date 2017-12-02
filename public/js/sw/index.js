self.addEventListener('install', (event) => {
  var urlsToCache = [
    '/',
    'js/main.js',
    'css/main.css',
    'imgs/icon.png',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
  ];
  event.waitUntil(
    caches.open('wittr-static-2').then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.delete('wittr-static-v1') // as sw cache v grows it becomes hard to delete all previous versions of sw so we need a solution that scales
  );
});

self.addEventListener('fetch', (event) => { 
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});

  // dr-evil image hijack
  // if (event.request.url.endsWith('.jpg')) {
  //   event.respondWith(
  //     fetch('/imgs/dr-evil.gif')
  //   );
  // }

// sw hijack for 404 and offline responses
//   event.respondWith(
//     fetch(event.request).then((response) => {
//       if (response.status == 404) {
//           return fetch('/imgs/dr-evil.gif');
//       }
//       return response;
//     }).catch(() => {
//       return new Response("Uh oh, that totally failed!");
//     })
//   );

// custom new html response code below:
// new Response('<b class="a-winner-is-me">Hello World</b>', {
  //   headers: {"Content-Type": "text/html"}
  //   })
  // );
  
// various cache example code below:  
// caches.open('my-stuff').then(funciton(cache) {
//   //...
// });
// caches.put(request, response);
// cache.addAll([
//   '/foo',
//   '/bar'
// ]); 
//cache.addAll is atomic, if any of these fail to cache, they will all fail... checkout https://www.talater.com/adderall/ cache.aderall
// cache.match(request);
// caches.match(request);