// Offline copy of the site. Generated from tools/sw-template.js by tools/build_sw.py; do not edit sw.js.
// Every file the site needs is saved under the exact URL the page asks for (app.js?v=…), so a
// saved page only ever pairs with its own scripts and data. A new deploy gets a new VERSION;
// files whose content did not change are copied from the old cache instead of downloaded again.
const VERSION = "__VERSION__";
const CACHE = `whk-quiz-${VERSION}`;
const PRECACHE = __PRECACHE__; // [url relative to the site, content hash, bytes]

const scopeUrl = (path) => new URL(path, self.registration.scope).href;
let progress = { cached: 0, total: PRECACHE.length };

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("whk-quiz-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
    broadcast();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "offline-status") {
    status().then((data) => event.source?.postMessage(data));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? page(request) : asset(request));
});

async function precache() {
  const cache = await caches.open(CACHE);
  const older = (await caches.keys()).filter((key) => key.startsWith("whk-quiz-") && key !== CACHE);
  let cached = 0;
  const queue = [...PRECACHE];
  const worker = async () => {
    while (queue.length) {
      const [path, rev] = queue.shift();
      const url = scopeUrl(path);
      if (!(await cache.match(url))) {
        const response = (await fromOlder(older, url, rev)) || (await download(url, rev));
        await cache.put(url, response);
      }
      cached += 1;
      progress = { cached, total: PRECACHE.length };
      if (cached % 20 === 0) broadcast();
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
}

async function fromOlder(older, url, rev) {
  for (const key of older) {
    const response = await (await caches.open(key)).match(url);
    if (response && response.headers.get("x-offline-rev") === rev) return response;
  }
  return null;
}

async function download(url, rev) {
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const headers = new Headers(response.headers);
  headers.set("x-offline-rev", rev);
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers });
}

// The page itself: fresh when online, the saved copy when not.
async function page(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(CACHE);
    return (await cache.match(scopeUrl("./"))) || (await cache.match(scopeUrl("index.html"))) || Response.error();
  }
}

async function asset(request) {
  const cache = await caches.open(CACHE);
  let response = await cache.match(request.url);
  if (!response) {
    try {
      return await fetch(request);
    } catch (error) {
      // Offline and asked for a version we don't have: any saved copy of the file beats nothing.
      response = await cache.match(request.url, { ignoreSearch: true });
      if (!response) return Response.error();
    }
  }
  const range = request.headers.get("range");
  return range ? partial(response, range) : response;
}

// Audio players ask for byte ranges; answer them from the saved file.
async function partial(response, range) {
  const body = await response.arrayBuffer();
  const size = body.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  let start = match && match[1] ? Number(match[1]) : 0;
  let end = match && match[2] ? Number(match[2]) : size - 1;
  if (match && !match[1] && match[2]) {
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  }
  end = Math.min(end, size - 1);
  if (start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

async function status() {
  const cache = await caches.open(CACHE);
  const keys = new Set((await cache.keys()).map((request) => request.url));
  const cached = PRECACHE.filter(([path]) => keys.has(scopeUrl(path))).length;
  const bytes = PRECACHE.reduce((sum, [, , size]) => sum + size, 0);
  return {
    type: "offline-status",
    version: VERSION,
    cached: Math.max(cached, progress.cached),
    total: PRECACHE.length,
    done: cached === PRECACHE.length,
    megabytes: (bytes / 1048576).toFixed(1),
  };
}

async function broadcast() {
  const data = await status();
  (await self.clients.matchAll({ includeUncontrolled: true })).forEach((client) => client.postMessage(data));
}
