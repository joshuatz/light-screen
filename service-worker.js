// @ts-check
/// <reference no-default-lib="true"/>
/// <reference lib="es2015" />
/// <reference lib="webworker" />

/**
 * Config Constants
 */
/** Bump this version to invalidate the PWA / service-worker cache */
const VERSION = `v3`;
const CURRENT_CACHE_NAME = `light-screen-display-${VERSION}`;
const CACHE_PREFETCH_URLS = ['/', 'index.html'];
const CACHE_RULES = {
	firstParty: [/^\/$/, /\.css/, /\.js/, /\.html/, /\.svg/],
	thirdParty: [/^https:\/\/cdn\.jsdelivr\.net/],
};

/**
 * @param {Request} req
 */
const getShouldCache = (req) => {
	/** @type {RegExp[]} */
	const allCacheRules = Object.keys(CACHE_RULES).reduce((acc, curr) => {
		return acc.concat(CACHE_RULES[curr]);
	}, []);
	for (let r = 0; r < allCacheRules.length; r++) {
		if (allCacheRules[r].test(req.url)) {
			return true;
		}
	}

	return false;
};

// Using IIFE to provide closure to redefine `self`
(() => {
	// Workaround for TS issue
	// prettier-ignore
	const self = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (globalThis.self));

	// LIFECYCLE - Install
	self.addEventListener('install', (evt) => {
		evt.waitUntil(
			// Caching
			(async () => {
				const cache = await caches.open(CURRENT_CACHE_NAME);
				// prefetch specific URLs and cache
				await cache.addAll(CACHE_PREFETCH_URLS);
			})()
		);
	});

	const clearCache = async () => {
		// Cleanup - delete old cache versions
		const allCacheNames = await caches.keys();
		await Promise.all(
			allCacheNames.map((cacheName) => {
				if (cacheName !== CURRENT_CACHE_NAME) {
					console.log(`Deleting old cache`, cacheName);
					return caches.delete(cacheName);
				}
			})
		);
	};

	// LIFECYCLE - Activate
	self.addEventListener('activate', (evt) => {
		evt.waitUntil(clearCache());
	});

	// FETCH
	self.addEventListener('fetch', (evt) => {
		const req = evt.request;
		evt.respondWith(
			(async () => {
				// Check cache first
				const cacheResponse = await caches.match(req);
				if (cacheResponse) {
					return cacheResponse;
				}

				// Let network request flow through
				const fetchResponse = await fetch(req);

				// Cache if matches rule and status 200
				if (fetchResponse.status === 200 && getShouldCache(req)) {
					const cache = await caches.open(CURRENT_CACHE_NAME);
					await cache.put(req.url, fetchResponse.clone());
				}

				return fetchResponse;
			})()
		);
	});
})();
