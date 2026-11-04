export const cleanText = (str?: string | null): string => {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const COMMON_CC_SLD_PREFIXES = new Set([
  'co', 'com', 'org', 'net', 'edu', 'gov', 'go', 'ac', 'sch',
  'mil', 'web', 'or', 'my', 'biz', 'gen', 'res', 'ne', 'ltd', 'plc', 'me'
]);

export const getMainDomain = (raw?: string | null): string => {
  if (!raw) return '';
  let str = cleanText(raw);
  if (!str) return '';

  // Remove protocol
  str = str.replace(/^https?:\/*\/*/i, '').replace(/^ftp:\/*\/*/i, '');

  // Strip path, query params, hash
  str = str.split('/')[0].split('?')[0].split('#')[0];

  // Strip port
  str = str.split(':')[0];

  // Clean and lowercase
  str = str.trim().toLowerCase();

  if (!str || !str.includes('.')) {
    return str;
  }

  // Handle IP addresses (e.g. 127.0.0.1)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str)) {
    return str;
  }

  const parts = str.split('.').filter(Boolean);
  if (parts.length <= 2) {
    return parts.join('.');
  }

  // Check for common second-level domains (ccSLD like .co.id, .co.uk, .com.au)
  const secondLast = parts[parts.length - 2];
  const last = parts[parts.length - 1];
  const isCcTLD = last.length === 2 && COMMON_CC_SLD_PREFIXES.has(secondLast);

  if (isCcTLD) {
    if (parts.length >= 3) {
      return parts.slice(-3).join('.');
    }
    return parts.join('.');
  }

  return parts.slice(-2).join('.');
};

export const extractTitleFromUrl = (url: string, excludeMainDomain: boolean = true): string => {
  const cleanedUrl = cleanText(url);
  if (!cleanedUrl) return '';
  let clean = cleanedUrl;

  // Decode URI components if URL encoded (e.g. %20 -> space)
  try {
    clean = decodeURIComponent(clean);
  } catch {}

  clean = cleanText(clean);

  // Remove protocol prefix (http://, https://, http/, https/)
  clean = clean.replace(/^https?:\/*\/*/i, '').replace(/^ftp:\/*\/*/i, '');

  const mainDomain = getMainDomain(url).trim().toLowerCase();

  // Separate host and path/query/hash
  const slashIdx = clean.indexOf('/');
  const questionIdx = clean.indexOf('?');
  const hashIdx = clean.indexOf('#');

  let firstSep = clean.length;
  if (slashIdx !== -1) firstSep = Math.min(firstSep, slashIdx);
  if (questionIdx !== -1) firstSep = Math.min(firstSep, questionIdx);
  if (hashIdx !== -1) firstSep = Math.min(firstSep, hashIdx);

  const hostPart = clean.slice(0, firstSep).trim();
  const restPart = clean.slice(firstSep).trim();

  let candidate = '';

  if (!excludeMainDomain) {
    // =========================================================================
    // DI ROOT: Pengecualian karakter domain utama TIDAK BERLAKU
    // =========================================================================
    let cleanRest = restPart.replace(/^[/\\?#&]+/, '');
    cleanRest = cleanRest.replace(/[?&#=]+/g, ' ');
    cleanRest = cleanRest.replace(/\.(html|htm|php|aspx|jsp|json|xml|pdf|png|jpg|jpeg)\b/gi, ' ');
    cleanRest = cleanRest.replace(/([a-z])([A-Z])/g, '$1 $2');
    cleanRest = cleanRest
      .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
      .replace(/(\d+)([a-zA-Z])/g, '$1 $2');
    cleanRest = cleanRest.replace(/[/._+:\-]+/g, ' ');
    cleanRest = cleanText(cleanRest);

    const cleanHost = formatCleanUrl(hostPart) || hostPart || mainDomain;
    if (cleanRest) {
      candidate = `${cleanHost} ${cleanRest}`;
    } else {
      candidate = cleanHost;
    }
    return cleanText(candidate);
  }

  // =========================================================================
  // DALAM FOLDER: Pengecualian karakter domain utama LANGSUNG BERLAKU
  // =========================================================================
  // Jika tidak ada path (hanya domain utama atau subdomain):
  if (!restPart || restPart === '/' || restPart === '/#' || restPart === '/?') {
    if (mainDomain && hostPart.toLowerCase() !== mainDomain) {
      // Subdomain (e.g. web3 in web3.bitget.com)
      const lowerHost = hostPart.toLowerCase();
      const escapedDomain = mainDomain.replace(/\./g, '\\.');
      const sub = lowerHost
        .replace(new RegExp(`\\.?${escapedDomain}$`, 'i'), '')
        .replace(/^www\d*\.?/i, '');
      return sub && sub !== 'www' ? sub : formatCleanUrl(hostPart);
    } else {
      // Tautan domain utama: jangan disembunyikan tapi pakai tautan domain untuk judulnya
      return formatCleanUrl(hostPart) || mainDomain;
    }
  }

  candidate = restPart;

  if (!candidate) {
    return formatCleanUrl(hostPart) || mainDomain;
  }

  // Clean candidate: remove leading slashes, hashes, query marks
  candidate = candidate.replace(/^[/\\?#&]+/, '');

  // Strip common query string tokens or key-values like ?id= or &ref=
  candidate = candidate.replace(/[?&#=]+/g, ' ');

  // Strip common file extensions (.html, .htm, .php, etc.)
  candidate = candidate.replace(/\.(html|htm|php|aspx|jsp|json|xml|pdf|png|jpg|jpeg)\b/gi, ' ');

  // Exclude all occurrences of the main domain or its base name
  if (mainDomain) {
    const domainBase = mainDomain.split('.')[0];
    if (domainBase && domainBase.length >= 3) {
      const regBase = new RegExp(`\\b${domainBase}\\b`, 'gi');
      candidate = candidate.replace(regBase, ' ');
    }
    const escapedDomain = mainDomain.replace(/\./g, '\\.');
    candidate = candidate.replace(new RegExp(escapedDomain, 'gi'), ' ');
  }

  // Insert space before camelCase transitions
  candidate = candidate.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Insert space between letter and number transitions
  candidate = candidate
    .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
    .replace(/(\d+)([a-zA-Z])/g, '$1 $2');

  // Replace URL delimiters (slashes, dots, hyphens, underscores, colons) with spaces
  candidate = candidate.replace(/[/._+:\-]+/g, ' ');

  // Collapse multiple spaces into a single space and trim
  candidate = cleanText(candidate);

  // Jika setelah dibersihkan hasilnya kosong, pakai tautan domain sebagai judul
  return candidate || formatCleanUrl(hostPart) || mainDomain;
};

export const formatCleanUrl = (url?: string | null): string => {
  if (!url) return '';
  return url
    .trim()
    .replace(/^https?:\/\/(?:www\.)?/i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
};

export const getBookmarkDisplayTitle = (
  name?: string,
  content?: string,
  isInsideFolder: boolean = false
): string => {
  const cleanName = cleanText(name);
  const cleanUrl = cleanText(content);

  // If user explicitly provided a title (and it's not generic 'Bookmark')
  if (cleanName && cleanName.toLowerCase() !== 'bookmark') {
    if (/^https?:\/\//i.test(cleanName) || /^www\./i.test(cleanName)) {
      const ext = extractTitleFromUrl(cleanName, isInsideFolder);
      return ext || formatCleanUrl(cleanName);
    }

    if (isInsideFolder && cleanUrl) {
      const domain = getMainDomain(cleanUrl).toLowerCase();
      const domainBase = domain.split('.')[0];
      const cleanFormatted = formatCleanUrl(cleanUrl);

      // Tautan domain utama: jangan disembunyikan tapi pakai tautan domain untuk judulnya
      const isMainDomainLink =
        cleanFormatted === domain ||
        cleanFormatted === `www.${domain}` ||
        !cleanUrl.replace(/^https?:\/\//i, '').replace(/^ftp:\/\//i, '').includes('/');

      if (isMainDomainLink) {
        return cleanFormatted || domain;
      }

      if (domainBase && domainBase.length >= 3) {
        const lowerName = cleanName.toLowerCase();
        if (lowerName === domainBase || lowerName === domain) {
          return cleanFormatted || domain;
        }
        if (lowerName.includes(domainBase)) {
          const folderExt = extractTitleFromUrl(cleanUrl, true);
          if (folderExt) {
            return folderExt;
          }
        }
      }
    } else if (!isInsideFolder && cleanUrl) {
      // DI ROOT: pengecualian karakter domain TIDAK BERLAKU
      const domain = getMainDomain(cleanUrl).toLowerCase();
      const domainBase = domain.split('.')[0];
      if (domainBase && domainBase.length >= 3) {
        const lowerName = cleanName.toLowerCase();
        if (!lowerName.includes(domainBase)) {
          const rootExt = extractTitleFromUrl(cleanUrl, false);
          if (rootExt) {
            return rootExt;
          }
        }
      }
    }

    return cleanName;
  }

  // If name is empty, extract title dynamically based on location
  if (cleanUrl) {
    const extracted = extractTitleFromUrl(cleanUrl, isInsideFolder);
    if (extracted) {
      return extracted;
    }
    return formatCleanUrl(cleanUrl);
  }

  return cleanName || 'Bookmark';
};

export const normalizeBookmarkUrl = (url?: string | null): string => {
  if (!url) return '';
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
};

export const compareAlphabetical = (a?: string | null, b?: string | null): number => {
  const strA = cleanText(a);
  const strB = cleanText(b);
  return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
};
