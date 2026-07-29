/**
 * Email Security Policies for Lumina
 * Handles validation for:
 * 1. Aliased emails (e.g., user+folder@gmail.com)
 * 2. Disposable / temporary email providers (e.g., alex9734@mailinator.com)
 */

// Comprehensive list of common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'dispostable.com',
  '10minutemail.com',
  'trashmail.com',
  'getairmail.com',
  'maildrop.cc',
  'mailnull.com',
  'moakt.com',
  'generator.email',
  'emailondestruct.com',
  'tempmailaddress.com',
  'mail7.io',
  'crazymailing.com',
  'fakeinbox.com',
  'mintemail.com',
  'mailnesia.com',
  'mail7.app',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.to',
  'jetable.org',
  'trashmail.net',
  'trashmail.me',
  'discard.email',
  'disposto.com',
  'spambox.us',
  'tempmail.net',
  'temp-mail.ru',
  'temp-mail.com',
  'throwawaymail.com',
  'mailcatcher.me',
  'mailinator2.com',
  'sogetthis.com',
  'mailin8r.com',
  'streetwisemail.com',
  'veryrealemail.com',
  'zippymail.in',
  'sendspambox.com',
  'tempr.email',
  'discardmail.com',
  'discardmail.de',
  '0clickemail.com',
  'anonbox.net',
  'antispam.de',
  'boun.cr',
  'bspamfree.org',
  'bullshitmail.de',
  'bund.us',
  'cachedpost.com',
  'cannotsect.com',
  'coolandthegang.xyz',
  'courrieltemp.org',
  'cust.in',
  'dacoolest.com',
  'deadaddress.com',
  'ding.fr.nf',
  'disposeamail.com',
  'dispostable.com',
  'dodgeit.com',
  'drdrb.com',
  'due.la',
  'earm.in',
  'easy-temp-mail.com',
  'eml.lol',
  'eml.moe',
  'eml.monster',
  'emltmp.com',
  'fakemailgenerator.com',
  'guerillamail.com',
  'guerillamail.info',
  'hmamail.com',
  'inboxkitten.com',
  'incognitomail.org',
  'instantemail.org',
  'kasmail.com',
  'l0g.in',
  'letthemeatspam.com',
  'mail-temp.com',
  'mailhazard.com',
  'mailhazard.org',
  'mailhazard.net',
  'mailimate.com',
  'mailimate.net',
  'mailimate.org',
  'mailina.org',
  'mailinator.net',
  'mytrashmail.com',
  'no-spam.ws',
  'notsharingmy.info',
  'oneeye.us',
  'pizzamail.com',
  'pokerpost.org',
  'popeye.us',
  'safetymail.info',
  'sandmail.cc',
  'superstarmoney.com',
  'teleworm.us',
  'tempemail.co',
  'tempemail.net',
  'tempinbox.com',
  'temporaryforwarding.com',
  'titandisposable.com',
  'zippymail.info',
  // SimpleLogin domains
  'simplelogin.co',
  'simplelogin.io',
  'simplelogin.fr',
  '8shield.net',
  '8shield.co',
  'aleeas.com',
  'slmail.me',
  'slops.me',
  // Addy.io (formerly AnonAddy) domains
  'anonaddy.com',
  'anonaddy.me',
  'addy.io'
]);

// Daftar domain penyedia email sah/terkemuka yang biasa digunakan di 6 bahasa utama (ID, EN, ZH, JA, RU, KO)
// Ini adalah whitelist untuk memastikan penyedia email resmi ini tidak akan pernah diblokir.
const LEGITIMATE_DOMAINS = new Set([
  // Global / English / Indonesian
  'gmail.com',
  'yahoo.com',
  'yahoo.co.id',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'protonmail.com',
  'proton.me',
  'aol.com',
  'zoho.com',
  'gmx.com',
  'mail.com',

  // Chinese (ZH)
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'sina.cn',
  'aliyun.com',
  'sohu.com',
  'tom.com',

  // Japanese (JA)
  'yahoo.co.jp',
  'docomo.ne.jp',
  'softbank.ne.jp',
  'ezweb.ne.jp',
  'au.com',
  'mineo.jp',
  'nifty.com',

  // Russian (RU)
  'yandex.ru',
  'yandex.com',
  'ya.ru',
  'mail.ru',
  'list.ru',
  'bk.ru',
  'inbox.ru',
  'rambler.ru',

  // Korean (KO)
  'naver.com',
  'daum.net',
  'hanmail.net',
  'nate.com',
  'kakao.com'
]);

/**
 * Checks if an email is aliased (contains "+" or other provider variations)
 */
export function isAliasedEmail(email: string): boolean {
  const cleanEmail = email.trim();
  const atIndex = cleanEmail.indexOf('@');
  if (atIndex === -1) return false;
  
  const localPart = cleanEmail.substring(0, atIndex);
  // Check for '+' sign which is the universal standard for subaddressing/aliases
  return localPart.includes('+');
}

/**
 * Checks if an email is from a known temporary/disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const atIndex = cleanEmail.indexOf('@');
  if (atIndex === -1) return false;
  
  const domain = cleanEmail.substring(atIndex + 1);
  
  // Jika domain terdaftar sebagai penyedia resmi/sah terkemuka, pastikan tidak diblokir
  if (LEGITIMATE_DOMAINS.has(domain)) {
    return false;
  }
  
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Validates an email against both policies.
 * Returns an error message key/text if invalid, or null if valid.
 */
export function validateEmailPolicies(email: string): {
  isValid: boolean;
  reason: 'alias' | 'disposable' | null;
} {
  if (isAliasedEmail(email)) {
    return { isValid: false, reason: 'alias' };
  }
  if (isDisposableEmail(email)) {
    return { isValid: false, reason: 'disposable' };
  }
  return { isValid: true, reason: null };
}
