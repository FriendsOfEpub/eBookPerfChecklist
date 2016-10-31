/* https://github.com/lyzadanger/serviceworker-example/blob/master/03-versioning/serviceWorker.js */

'use strict';

var config = {
  version: 'blitzOptim_v0_26',
  staticCacheItems: [
    '/eBookPerfChecklist/assets/blitz-64.svg',
    '/eBookPerfChecklist/assets/blitzOptim-decorations.svg',
    '/eBookPerfChecklist/css/styles.css',
    '/eBookPerfChecklist/js/script.js',
    '/eBookPerfChecklist/offline/',
    '/eBookPerfChecklist/'
  ],
  cachePathPattern: /^\/(?:(20[0-9]{2}|css|assets|js)\/(.+)?)?$/,
  offlineImage: '<svg role="img" aria-labelledby="offline-title"'
    + ' viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">'
    + '<title id="offline-title">Offline</title>'
    + '<g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/>'
    + '<text fill="#9B9B9B" font-family="-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", "Roboto", sans-serif" font-size="72" font-weight="bold">'
    + '<tspan x="93" y="172">offline</tspan></text></g></svg>',
  offlinePage: '/offline/'
};

function cacheName (key, opts) {
  return `${opts.version}-${key}`;
}

function addToCache (cacheKey, request, response) {
  if (response.ok) {
    var copy = response.clone();
    caches.open(cacheKey).then( cache => {
      cache.put(request, copy);
    });
  }
  return response;
}

function fetchFromCache (event) {
  return caches.match(event.request).then(response => {
    if (!response) {
      throw Error(`${event.request.url} not found in cache`);
    }
    return response;
  });
}

function offlineResponse (resourceType, opts) {
  if (resourceType === 'image') {
    return new Response(opts.offlineImage,
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  } else if (resourceType === 'content') {
    return caches.match(opts.offlinePage);
  }
  return undefined;
}

self.addEventListener('install', event => {
  function onInstall (event, opts) {
    var cacheKey = cacheName('static', opts);
    return caches.open(cacheKey)
      .then(cache => cache.addAll(opts.staticCacheItems));
  }

  event.waitUntil(
    onInstall(event, config).then( () => self.skipWaiting() )
  );
});

self.addEventListener('activate', event => {
  function onActivate (event, opts) {
    return caches.keys()
      .then(cacheKeys => {
        var oldCacheKeys = cacheKeys.filter(key => key.indexOf(opts.version) !== 0);
        var deletePromises = oldCacheKeys.map(oldKey => caches.delete(oldKey));
        return Promise.all(deletePromises);
      });
  }

  event.waitUntil(
    onActivate(event, config)
      .then( () => self.clients.claim() )
  );
});

self.addEventListener('fetch', event => {

  function shouldHandleFetch (event, opts) {
    var request            = event.request;
    var url                = new URL(request.url);
    var criteria           = {
      matchesPathPattern: opts.cachePathPattern.test(url.pathname),
      isGETRequest      : request.method === 'GET',
      isFromMyOrigin    : url.origin === self.location.origin
    };
    var failingCriteria    = Object.keys(criteria)
      .filter(criteriaKey => !criteria[criteriaKey]);
    return !failingCriteria.length;
  }

  function onFetch (event, opts) {
    var request = event.request;
    var acceptHeader = request.headers.get('Accept');
    var resourceType = 'static';
    var cacheKey;

    if (acceptHeader.indexOf('text/html') !== -1) {
      resourceType = 'content';
    } else if (acceptHeader.indexOf('image') !== -1) {
      resourceType = 'image';
    }

    cacheKey = cacheName(resourceType, opts);

    if (resourceType === 'content') {
      event.respondWith(
        fetch(request)
          .then(response => addToCache(cacheKey, request, response))
          .catch(() => fetchFromCache(event))
          .catch(() => offlineResponse(resourceType, opts))
      );
    } else {
      event.respondWith(
        fetchFromCache(event)
          .catch(() => fetch(request))
            .then(response => addToCache(cacheKey, request, response))
          .catch(() => offlineResponse(resourceType, opts))
      );
    }
  }
  if (shouldHandleFetch(event, config)) {
    onFetch(event, config);
  }

});