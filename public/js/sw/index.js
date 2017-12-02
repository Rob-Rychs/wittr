self.addEventListener('fetch', (event) => { event.respondWith(
  new Response('<b class="a-winner-is-me">Hello World</b>', {
    headers: {"Content-Type": "text/html"}
    })
  );
});