import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { isTauriAppPlatform } from '@/services/environment';

export const getAIFetch = (): typeof fetch => {
  if (isTauriAppPlatform()) return tauriFetch as unknown as typeof fetch;
  return window.fetch.bind(window);
};
