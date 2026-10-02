import { extractTitleFromUrl } from './titleExtractor';

export { extractTitleFromUrl };

export interface BookmarkData {
  title: string;
  error?: string;
}

export const generateBookmarkData = async (
  _apiKey: string,
  _model: string,
  _endpoint: string,
  url: string,
  _promptTemplate: string,
  _fallbackTitle: string
): Promise<BookmarkData> => {
  return { title: extractTitleFromUrl(url) };
};

export const loadKey = () => '';
export const saveKey = (_k: string) => {};
export const loadModel = () => '';
export const saveModel = (_m: string) => {};
export const loadEndpoint = () => '';
export const saveEndpoint = (_e: string) => {};
export const loadModelHistory = (): string[] => [];
export const fetchAvailableModels = async (_endpoint: string, _apiKey: string): Promise<string[]> => [];
export const callAI = async (_opts: any): Promise<string> => '';
export const formatAiErrorMessage = (_status: number | null, _rawMessage: string): string => '';
