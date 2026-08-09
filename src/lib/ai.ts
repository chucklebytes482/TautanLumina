
const AI_KEY_STORAGE = 'tautanlumina:ai-key';
const AI_MODEL_STORAGE = 'tautanlumina:ai-model';
const AI_ENDPOINT_STORAGE = 'tautanlumina:ai-endpoint';

export const DEFAULT_MODEL = '';
export const PRO_DEFAULT_MODEL = '';
export const DEFAULT_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const PRO_DEFAULT_KEY = '';

export const applyProAiPreset = (key: string = PRO_DEFAULT_KEY, model: string = PRO_DEFAULT_MODEL, endpoint: string = DEFAULT_ENDPOINT) => {
  saveModel(model);
  saveEndpoint(endpoint);
  saveKey(key);
};

const getStoredKeyName = (suffix: string) => {
  const email = localStorage.getItem('tautanlumina:current_user_email') || 'guest';
  return `tautanlumina:${suffix}:${email}`;
};

export const loadEndpoint = () => {
  const userKey = getStoredKeyName('ai-endpoint');
  const e = localStorage.getItem(userKey) ?? localStorage.getItem(AI_ENDPOINT_STORAGE);
  return e !== null && e !== '' ? e : DEFAULT_ENDPOINT;
};
export const saveEndpoint = (e: string) => {
  localStorage.setItem(getStoredKeyName('ai-endpoint'), e);
  localStorage.setItem(AI_ENDPOINT_STORAGE, e);
};

export const loadKey = () => {
  const userKey = getStoredKeyName('ai-key');
  const k = localStorage.getItem(userKey) ?? localStorage.getItem(AI_KEY_STORAGE);
  if (!k) {
    return PRO_DEFAULT_KEY;
  }
  return k;
};
export const saveKey = (k: string) => {
  localStorage.setItem(getStoredKeyName('ai-key'), k);
  localStorage.setItem(AI_KEY_STORAGE, k);
};

export const loadModel = () => {
  const userKey = getStoredKeyName('ai-model');
  const m = localStorage.getItem(userKey) ?? localStorage.getItem(AI_MODEL_STORAGE);
  return m ? m.trim() : '';
};
export const saveModel = (m: string) => {
  localStorage.setItem(getStoredKeyName('ai-model'), m);
  localStorage.setItem(AI_MODEL_STORAGE, m);
};

export const loadModelHistory = (): string[] => {
  const m = loadModel();
  return m ? [m] : [];
};

export const formatAiErrorMessage = (status: number | null, rawMessage: string): string => {
  const lower = (rawMessage || '').toLowerCase();

  if (lower.includes('api key kosong') || lower.includes('no api key')) {
    return 'API Key belum diisi di Pengaturan.';
  }
  if (lower.includes('model ai belum dipilih') || lower.includes('no model')) {
    return 'Model AI belum dipilih di Pengaturan.';
  }
  if (lower.includes('api endpoint kosong')) {
    return 'Endpoint AI belum diisi di Pengaturan.';
  }

  if (status === 401 || lower.includes('invalid api key') || lower.includes('unauthorized') || lower.includes('invalid_api_key')) {
    return 'API Key tidak valid atau telah dicabut (HTTP 401).';
  }

  if (
    status === 402 ||
    lower.includes('insufficient_quota') ||
    lower.includes('insufficient quota') ||
    lower.includes('out of credits') ||
    lower.includes('balance') ||
    lower.includes('saldo') ||
    lower.includes('credit limit') ||
    lower.includes('billing')
  ) {
    return 'Saldo / Kuota API Key AI Anda telah habis (Insufficient Balance / Quota).';
  }

  if (status === 429 || lower.includes('rate limit') || lower.includes('rate_limit') || lower.includes('too many requests')) {
    return 'Batas penggunaan AI (Rate Limit) tercapai (HTTP 429). Silakan coba beberapa saat lagi.';
  }

  if (status === 404 || lower.includes('model_not_found') || lower.includes('does not exist')) {
    return 'Model AI yang dipilih tidak ditemukan pada provider ini (HTTP 404).';
  }

  if (status && status >= 500) {
    return `Server Provider AI sedang mengalami kendala (HTTP ${status}).`;
  }

  if (rawMessage) {
    const clean = rawMessage.replace(/^Error:\s*/i, '').slice(0, 150);
    return `Provider AI Error: ${clean}`;
  }

  return 'Gagal terhubung ke layanan AI.';
};

export const fetchAvailableModels = async (endpoint: string, apiKey: string): Promise<string[]> => {
  const finalEndpoint = endpoint || DEFAULT_ENDPOINT;
  let modelsUrl = finalEndpoint.trim();
  
  if (modelsUrl.endsWith('/chat/completions')) {
    modelsUrl = modelsUrl.replace(/\/chat\/completions$/, '/models');
  } else if (modelsUrl.endsWith('/completions')) {
    modelsUrl = modelsUrl.replace(/\/completions$/, '/models');
  } else if (!modelsUrl.endsWith('/models')) {
    modelsUrl = modelsUrl.replace(/\/+$/, '') + '/models';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'tautanlumina';
  }

  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  let res: Response;
  try {
    res = await fetch(modelsUrl, {
      method: 'GET',
      headers,
    });
  } catch {
    throw new Error('Gagal terhubung ke server endpoint AI. Periksa koneksi internet Anda.');
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(formatAiErrorMessage(res.status, errText));
  }

  const data = await res.json();
  let rawList: any[] = [];
  if (Array.isArray(data?.data)) {
    rawList = data.data;
  } else if (Array.isArray(data)) {
    rawList = data;
  } else if (Array.isArray(data?.models)) {
    rawList = data.models;
  }

  const models: string[] = rawList
    .map((item: any) => {
      if (typeof item === 'string') return item;
      return item?.id || item?.name || '';
    })
    .filter((id: string) => Boolean(id) && typeof id === 'string');

  return Array.from(new Set(models));
};

const stripCodeFence = (t: string): string => {
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : t.trim();
};

export interface BookmarkData {
  title: string;
  error?: string;
}

export const generateBookmarkData = async (
  apiKey: string,
  model: string,
  endpoint: string,
  url: string,
  promptTemplate: string,
  fallbackTitle: string
): Promise<BookmarkData> => {
  let fallbackDomain = fallbackTitle;
  try {
    fallbackDomain = new URL(url).hostname;
  } catch {}

  if (!apiKey || !apiKey.trim()) {
    return { title: fallbackDomain, error: 'API Key AI belum diisi di Pengaturan.' };
  }

  if (!model || !model.trim()) {
    return { title: fallbackDomain, error: 'Model AI belum dipilih di Pengaturan.' };
  }
  
  const prompt = promptTemplate.replace('{url}', url) + '\n\nIMPORTANT: Respond ONLY with a valid JSON object in this exact format, with no other text, markdown, or explanation:\n{"title": "title here (max 15 chars)"}';
  
  const parseResponse = (res: string) => {
    try {
      const cleanJson = stripCodeFence(res);
      let parsed: any = null;
      try {
        parsed = JSON.parse(cleanJson);
      } catch {
        const match = cleanJson.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }
      if (parsed && typeof parsed === 'object') {
        let title = (parsed.title || parsed.name || fallbackDomain).trim();
        if (title.length > 15) title = title.substring(0, 15).trim();
        return { title };
      }
      throw new Error('Invalid JSON');
    } catch {
      let title = stripCodeFence(res).trim().replace(/^["']|["']$/g, '');
      if (title.length > 15) title = title.substring(0, 15).trim();
      return { title };
    }
  };

  try {
    const res = await callAI({ apiKey, model, endpoint, prompt, maxTokens: 60 });
    const parsed = parseResponse(res);
    return parsed;
  } catch (e: any) {
    const errMsg = e?.message || 'Gagal generate judul dengan AI.';
    console.warn('AI title generation failed for selected model:', model, e);
    return { title: fallbackDomain, error: errMsg };
  }
};


interface CallOpts {
  apiKey: string;
  model: string;
  endpoint: string;
  prompt: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

// WARNING: This application uses a client-side API key for API.
// This is acceptable for "bring-your-own-key" utilities, but not recommended for production apps where you want to hide your own key.
// As requested, keeping this client-side.
export const callAI = async ({ apiKey, model, endpoint, prompt, maxTokens = 150, signal }: CallOpts): Promise<string> => {
  if (!apiKey || !apiKey.trim()) throw new Error('API Key belum diisi.');
  const finalEndpoint = endpoint || DEFAULT_ENDPOINT;
  if (!finalEndpoint) throw new Error('Endpoint AI belum diisi.');
  const targetModel = model ? model.trim() : '';
  if (!targetModel) throw new Error('Model AI belum dipilih. Silakan pilih model di Pengaturan.');

  let res: Response;
  try {
    res = await fetch(finalEndpoint, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://tautanlumina.app',
        'X-Title': 'tautanlumina',
      },
      body: JSON.stringify({
        ...(targetModel ? { model: targetModel } : {}),
        messages: [
          {
            role: 'system',
            content: 'Anda adalah asisten AI yang memberikan jawaban teks langsung sesuai instruksi tanpa penjelasan tambahan atau markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: maxTokens,
      }),
    });
  } catch {
    throw new Error('Gagal terhubung ke server AI. Periksa koneksi internet Anda.');
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(formatAiErrorMessage(res.status, errText));
  }

  const data = await res.json();
  const text: string | undefined = 
    data?.choices?.[0]?.message?.content || 
    data?.choices?.[0]?.text || 
    data?.response || 
    data?.output || 
    data?.text || 
    data?.content ||
    (typeof data === 'string' ? data : undefined);
  if (!text) throw new Error('Respons AI kosong dari provider.');
  return text;
};
