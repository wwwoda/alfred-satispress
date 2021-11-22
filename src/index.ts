import alfy, { CacheConf, ScriptFilterItem } from 'alfy';
import got from 'got';
import sortOn from 'sort-on';

const KEY = process.env.key || '';
const URL = process.env.url || '';
const VENDOR = process.env.vendor || 'satispress';

export interface SatispressResponse {
  packages: Record<string, Record<string, { description : string }>>;
}

type Cache = CacheConf<{
  satispressResponse: SatispressResponse;
  satispressItems: ScriptFilterItem[];
}>;

export const cache = alfy.cache as Cache;

const CACHE_KEY_RESPONSE = 'satispressResponse';
const CACHE_KEY_ITEMS = 'satispressItems';
const CACHE_OPTIONS = { maxAge: 60 * 60000 }; // minutes to milliseconds

const fetch = async (): Promise<SatispressResponse | false > => {
  const cachedResponse = cache.get(CACHE_KEY_RESPONSE, { packages: {} });

  if (cachedResponse) {
    cache.set(CACHE_KEY_RESPONSE, cachedResponse, CACHE_OPTIONS);
    return Promise.resolve(cachedResponse);
  }

  const response: SatispressResponse = await got.get(URL, {
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

const getItems = async (): Promise<ScriptFilterItem[] | null> => {
  const cachedItems = cache.get(CACHE_KEY_ITEMS, []);

  if (cachedItems && cachedItems.length) {
    return cachedItems;
  }

  const data = await fetch();

  if (data === false) {
    return Promise.resolve(null);
  }

  const scriptFilterItems = sortOn(Object.keys(data.packages).map((key) => {
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
