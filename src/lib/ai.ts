
const AI_KEY_STORAGE = 'tautanlumina:ai-key';
const AI_MODEL_STORAGE = 'tautanlumina:ai-model';
const AI_ENDPOINT_STORAGE = 'tautanlumina:ai-endpoint';

export const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
export const PRO_DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
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
  if (!m || m === 'google/gemma-4-31b-it:free' || m === 'google/gemini-2.5-flash') {
    return DEFAULT_MODEL;
  }
  return m;
};
export const saveModel = (m: string) => {
  localStorage.setItem(getStoredKeyName('ai-model'), m);
  localStorage.setItem(AI_MODEL_STORAGE, m);
};

export const loadModelHistory = (): string[] => {
  return [DEFAULT_MODEL];
};

const stripCodeFence = (t: string): string => {
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : t.trim();
};

export interface BookmarkData {
  title: string;
  category?: string;
}

export const generateBookmarkData = async (apiKey: string, model: string, endpoint: string, url: string, promptTemplate: string, fallbackTitle: string): Promise<BookmarkData> => {
  let fallbackDomain = fallbackTitle;
  try {
    fallbackDomain = new URL(url).hostname;
  } catch {}

  if (!apiKey) {
    return { title: fallbackDomain };
  }
  
  const prompt = promptTemplate.replace('{url}', url) + '\n\nIMPORTANT: Respond ONLY with a valid JSON object in this exact format, with no other text, markdown, or explanation:\n{"title": "title here (max 12 chars)", "category": "short category or tag here"}';
  
  const parseResponse = (res: string) => {
    try {
      const cleanJson = stripCodeFence(res);
      const parsed = JSON.parse(cleanJson);
      let title = parsed.title || fallbackDomain;
      if (title.length > 12) title = title.substring(0, 12);
      return { title, category: parsed.category };
    } catch {
      let title = stripCodeFence(res).trim().replace(/^["']|["']$/g, '');
      if (title.length > 12) title = title.substring(0, 12);
      return { title };
    }
  };

  try {
    const res = await callAI({ apiKey, model, endpoint, prompt });
    return parseResponse(res);
  } catch (e) {
    const fallbackModels = [DEFAULT_MODEL];
    
    for (const fbModel of fallbackModels) {
      if (model !== fbModel) {
        try {
          const res = await callAI({ apiKey, model: fbModel, endpoint, prompt });
          return parseResponse(res);
        } catch (fallbackErr) {
          // silently continue to next fallback
        }
      }
    }

    return { title: fallbackDomain };
  }
};


interface CallOpts {
  apiKey: string;
  model: string;
  endpoint: string;
  prompt: string;
  signal?: AbortSignal;
}

// WARNING: This application uses a client-side API key for API.
// This is acceptable for "bring-your-own-key" utilities, but not recommended for production apps where you want to hide your own key.
// As requested, keeping this client-side.
export const callAI = async ({ apiKey, model, endpoint, prompt, signal }: CallOpts): Promise<string> => {
  if (!apiKey) throw new Error('API Key kosong.');
  const finalEndpoint = endpoint || DEFAULT_ENDPOINT;
  if (!finalEndpoint) throw new Error('API Endpoint kosong.');
  const targetModel = model ? model.trim() : DEFAULT_MODEL;

  const res = await fetch(finalEndpoint, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
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
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Respons AI kosong.');
  return text;
};
