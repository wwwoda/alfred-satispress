import alfy, { CacheConf, ScriptFilterItem } from 'alfy';
import got from 'got';
import sortOn from 'sort-on';

const KEY = process.env.key?.trim() || '';
const URL = process.env.url?.trim() || '';
const VENDOR = process.env.vendor?.trim() || 'satispress';
const CMD = process.env.require ? 'composer require ' : '';

export interface SatispressResponse {
  packages: Record<string, Record<string, { description : string }>>;
}

type Cache = CacheConf<{
  packages: SatispressResponse | null;
  progress: string;
  fetching: boolean;
}>;

export const cache = alfy.cache as Cache;

const CACHE_KEY_RESPONSE = 'packages';
const CACHE_KEY_FETCHING = 'fetching';
const CACHE_OPTIONS = { maxAge: 60 * 60000 }; // minutes to milliseconds

const updatePackagesCache = async () => {
  got.get(URL, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY}:satispress`).toString('base64')}`,
    },
  })
    .json()
    .then((response) => {
      cache.set(CACHE_KEY_RESPONSE, response, CACHE_OPTIONS);
      cache.set(CACHE_KEY_FETCHING, false);
    })
    .catch((reason) => {
      console.log(reason);
    });
};

const getPackages = (): ScriptFilterItem[] => {
  const cachedResponse = cache.get(CACHE_KEY_RESPONSE, null);

  if (!cachedResponse) {
    return [];
  }

  return sortOn(Object.keys(cachedResponse.packages).map((key) => {
    const versions = Object.keys(cachedResponse.packages[key]);
    const latestVersion = versions[versions.length - 1];
    const title = key.replace(`${VENDOR}/`, '');
    return {
      title,
      subtitle: `${cachedResponse.packages[key][latestVersion].description} (${title})`,
      arg: `${CMD}${key}`,
    };
  }), 'title');
};

const main = (): void => {
  if (KEY === '') {
    alfy.error('Add missing API key to environment variables!');
    return;
  }

  if (URL === '') {
    alfy.error('Add missing URL to environment variables! (e.g. https://example.com/satispress/packages.json)');
    return;
  }

  const packages = getPackages();

  if (packages.length > 0) {
    alfy.output(alfy.inputMatches(packages, 'subtitle'));
    return;
  }

  alfy.output([{
    title: 'Loading packages',
  }], { rerunInterval: 1 });

  if (cache.get(CACHE_KEY_FETCHING, false) !== true) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
    cache.set(CACHE_KEY_FETCHING, true);
    updatePackagesCache();
  }
};

main();
