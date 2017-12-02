self.addEventListener('fetch', (event) => { 
  if (event.request.url.endsWith('.jpg')) {
    event.respondWith(
      fetch('/imgs/dr-evil.gif')
    );
  }
  // new Response('<b class="a-winner-is-me">Hello World</b>', {
  //   headers: {"Content-Type": "text/html"}
  //   })
  // );
});