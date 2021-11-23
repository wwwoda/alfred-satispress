import alfy, { CacheConf, ScriptFilterItem } from 'alfy';
import got from 'got';
import sortOn from 'sort-on';

const KEY = process.env.key?.trim() || '';
const URL = process.env.url?.trim() || '';
const VENDOR = process.env.vendor?.trim() || 'satispress';
const CMD = process.env.cmd?.trim() ? 'composer require ' : '';

export interface SatispressResponse {
  packages: Record<string, Record<string, { description : string }>>;
}

type Cache = CacheConf<{
  satispressResponse: SatispressResponse;
  satispressItems: ScriptFilterItem[];
}>;

export const cache = alfy.cache as Cache;

const CACHE_KEY_RESPONSE = 'satispressResponse';
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
      arg: `${CMD}${key}`,
    };
  }), 'title');

  return Promise.resolve(scriptFilterItems);
};

if (KEY === '') {
  alfy.error('Add missing API key to environment variables!');
} else if (URL === '') {
  alfy.error('Add missing URL to environment variables! (e.g. https://example.com/satispress/packages.json)');
} else {
  const items = await getItems();

  if (items === null) {
    alfy.error('Something went wrong.');
  } else {
    alfy.output(alfy.inputMatches(items, 'title'));
  }
}
