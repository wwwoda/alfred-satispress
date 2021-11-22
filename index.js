import alfy from 'alfy';
import got from 'got';
import sortOn from 'sort-on';

const KEY = process.env.key || '';
const URL = process.env.url || '';
const VENDOR = process.env.vendor || 'satispress';
export const {cache} = alfy;
const CACHE_KEY_RESPONSE = 'satispressResponse';
const CACHE_KEY_ITEMS = 'satispressItems';
const CACHE_OPTIONS = {maxAge: 60 * 60_000}; // Minutes to milliseconds
const fetch = async () => {
	const cachedResponse = cache.get(CACHE_KEY_RESPONSE, {packages: {}});
	if (cachedResponse) {
		cache.set(CACHE_KEY_RESPONSE, cachedResponse, CACHE_OPTIONS);
		return Promise.resolve(cachedResponse);
	}

	const response = await got.get(URL, {
		headers: {
			Authorization: `Basic ${Buffer.from(`${KEY}:satispress`).toString('base64')}`,
		},
	}).json();
	if (!response) {
		return Promise.resolve(false);
	}

	cache.set(CACHE_KEY_RESPONSE, response, CACHE_OPTIONS);
	return Promise.resolve(response);
};

const getItems = async () => {
	const cachedItems = cache.get(CACHE_KEY_ITEMS, []);
	if (cachedItems && cachedItems.length > 0) {
		return cachedItems;
	}

	const data = await fetch();
	if (data === false) {
		return Promise.resolve(null);
	}

	const scriptFilterItems = sortOn(Object.keys(data.packages).map(key => {
		const versions = Object.keys(data.packages[key]);
		const latestVersion = versions[versions.length - 1];
		return {
			title: key.replace(`${VENDOR}/`, ''),
			subtitle: data.packages[key][latestVersion].description,
			arg: key,
		};
	}), 'title');
	cache.set(CACHE_KEY_ITEMS, scriptFilterItems, CACHE_OPTIONS);
	return Promise.resolve(scriptFilterItems);
};

if (KEY === '' || URL === '') {
	alfy.error('Missing environment variables.');
} else {
	const items = await getItems();
	if (items === null) {
		alfy.error('Something went wrong.');
	} else {
		alfy.output(alfy.inputMatches(items, 'title'));
	}
}
