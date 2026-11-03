import { getMainDomain } from './titleExtractor';

/**
 * Kamus 100 Situs Teratas (Top 100 Sites Dictionary)
 * Berisi 100 domain populer dunia dan regional (Indonesia & global),
 * digunakan sebagai acuan pengurutan prioritas: Top 100 terlebih dahulu,
 * kemudian diikuti pengurutan alfabetis (A-Z).
 */
export const TOP_SITES_LIST: string[] = [
  'google.com',
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'whatsapp.com',
  'wikipedia.org',
  'reddit.com',
  'yahoo.com',
  'amazon.com',
  'tiktok.com',
  'openai.com',
  'linkedin.com',
  'netflix.com',
  'microsoft.com',
  'bing.com',
  'live.com',
  'pinterest.com',
  'twitch.tv',
  'github.com',
  'apple.com',
  'zoom.us',
  'telegram.org',
  'spotify.com',
  'discord.com',
  'canva.com',
  'quora.com',
  'duckduckgo.com',
  'ebay.com',
  'stackoverflow.com',
  'imdb.com',
  'cnn.com',
  'bbc.com',
  'nytimes.com',
  'fandom.com',
  'dropbox.com',
  'notion.so',
  'medium.com',
  'cloudflare.com',
  'paypal.com',
  'adobe.com',
  'soundcloud.com',
  'twitch.com',
  'gitlab.com',
  'steamcommunity.com',
  'roblox.com',
  'aliexpress.com',
  'tumblr.com',
  'vimeo.com',
  'flickr.com',
  'archive.org',
  'craigslist.org',
  'booking.com',
  'tripadvisor.com',
  'airbnb.com',
  'dailymail.co.uk',
  'theguardian.com',
  'forbes.com',
  'bloomberg.com',
  'reuters.com',
  'yahoo.co.jp',
  'baidu.com',
  'yandex.ru',
  'bilibili.com',
  'taobao.com',
  'vk.com',
  'naver.com',
  'bitget.com',
  'binance.com',
  'coinbase.com',
  'bybit.com',
  'coinmarketcap.com',
  'tradingview.com',
  'shopee.co.id',
  'tokopedia.com',
  'bukalapak.com',
  'lazada.co.id',
  'blibli.com',
  'traveloka.com',
  'tiket.com',
  'detik.com',
  'kompas.com',
  'tribunnews.com',
  'liputan6.com',
  'merdeka.com',
  'cnnindonesia.com',
  'cnbcindonesia.com',
  'tempo.co',
  'kumparan.com',
  'idntimes.com',
  'kaskus.co.id',
  'brainly.co.id',
  'kemdikbud.go.id',
  'bca.co.id',
  'mandiri.co.id',
  'bri.co.id',
  'telkomsel.com',
  'indihome.co.id',
  'indomaret.co.id',
  'alfamart.co.id',
];

// Alias mapping agar domain alternatif mendapatkan peringkat yang sama
const DOMAIN_ALIASES: Record<string, string> = {
  'x.com': 'twitter.com',
  'chatgpt.com': 'openai.com',
  'google.co.id': 'google.com',
  'yahoo.co.id': 'yahoo.com',
  'shopee.com': 'shopee.co.id',
  'lazada.com': 'lazada.co.id',
  'amazon.co.jp': 'amazon.com',
  'amazon.co.uk': 'amazon.com',
  'wikipedia.com': 'wikipedia.org',
  't.me': 'telegram.org',
  'fb.com': 'facebook.com',
  'wa.me': 'whatsapp.com',
  'youtu.be': 'youtube.com',
};

// Map peringkat (1 sampai 100)
const RANK_MAP = new Map<string, number>();

TOP_SITES_LIST.forEach((domain, idx) => {
  RANK_MAP.set(domain.toLowerCase(), idx + 1);
});

// Daftarkan alias ke RANK_MAP
Object.entries(DOMAIN_ALIASES).forEach(([alias, target]) => {
  const targetRank = RANK_MAP.get(target.toLowerCase());
  if (typeof targetRank === 'number') {
    RANK_MAP.set(alias.toLowerCase(), targetRank);
  }
});

/**
 * Mendapatkan peringkat situs teratas (1 - 100).
 * Jika tidak termasuk dalam Top 100, mengembalikan 9999.
 */
export const getTopSiteRank = (urlOrDomain?: string | null): number => {
  if (!urlOrDomain) return 9999;
  const raw = urlOrDomain.trim().toLowerCase();
  if (!raw) return 9999;

  // Coba cek langsung di map
  const directClean = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('?')[0].split('#')[0];
  if (RANK_MAP.has(directClean)) {
    return RANK_MAP.get(directClean)!;
  }

  // Ekstrak domain utama
  const mainDomain = getMainDomain(raw).toLowerCase();
  if (mainDomain && RANK_MAP.has(mainDomain)) {
    return RANK_MAP.get(mainDomain)!;
  }

  // Coba periksa apakah nama domain mengandung salah satu top site
  for (const [topDomain, rank] of RANK_MAP.entries()) {
    if (mainDomain === topDomain || directClean === topDomain || directClean.endsWith(`.${topDomain}`)) {
      return rank;
    }
  }

  return 9999;
};

/**
 * Memeriksa apakah sebuah URL / domain termasuk dalam 100 situs teratas.
 */
export const isTopSite = (urlOrDomain?: string | null): boolean => {
  return getTopSiteRank(urlOrDomain) < 9999;
};
