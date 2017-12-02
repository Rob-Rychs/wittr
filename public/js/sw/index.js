self.addEventListener('fetch', (event) => { 
  // dr-evil image hijack
  // if (event.request.url.endsWith('.jpg')) {
  //   event.respondWith(
  //     fetch('/imgs/dr-evil.gif')
  //   );
  // }
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.status == 404) {
        return new Response("Whoops, not found");
      }
      return response;
    }).catch(() => {
      return new Response("Uh oh, that totally failed!");
    })
  );
  // new Response('<b class="a-winner-is-me">Hello World</b>', {
  //   headers: {"Content-Type": "text/html"}
  //   })
  // );
});