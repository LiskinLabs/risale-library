import { getFilename } from '@/utils/path';
import { md5Fingerprint } from '@/utils/md5';

export interface BackgroundTexture {
  id: string;
  name: string;
  path?: string;
  url?: string;
  animated?: boolean;

  /**
   * Cross-device content hash. Set on imports new enough to participate
   * in replica sync (`partialMD5 + byteSize + filename`). Legacy textures
   * (created before replica sync) leave this undefined and never publish
   * — re-import to enable cloud sync.
   */
  contentId?: string;
  /**
   * Per-texture directory name relative to the `Images` base. New imports
   * land at `<bundleDir>/<filename>`; legacy imports keep their flat
   * `<filename>` path with bundleDir undefined.
   */
  bundleDir?: string;
  /** File size in bytes — used by the replica manifest, optional for legacy. */
  byteSize?: number;
  /**
   * On a remote-pulled placeholder, set to true until the binary download
   * lands. The transfer-complete handler clears it via the texture store's
   * markAvailable hook.
   */
  unavailable?: boolean;
  /**
   * Reincarnation token — opaque value that revives a tombstoned remote
   * row. Mirrors the font / dictionary mechanism.
   */
  reincarnation?: string;

  downloadedAt?: number;
  deletedAt?: number;

  blobUrl?: string;
  loaded?: boolean;
  error?: string;
}

export type CustomTexture = BackgroundTexture & { path: string };

export type CustomTextureInfo = Partial<BackgroundTexture> &
  Required<Pick<BackgroundTexture, 'path' | 'name'>>;

export const PREDEFINED_TEXTURES: BackgroundTexture[] = [
  { id: 'none', name: 'None', url: '', loaded: true },
  {
    id: 'premium-grain',
    name: 'Premium Grain',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==',
    loaded: true,
  },
  {
    id: 'concrete',
    name: 'Concrete',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJjb25jcmV0ZS1ub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuMDgiIG51bU9jdGF2ZXM9IjMiIHJlc3VsdD0ibm9pc2UiIC8+PGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAuMyAwIDAgMCAwLjUgIDAgMC4zIDAgMCAwLjUgIDAgMCAwLjMgMCAwLjUgIDAgMCAwIDAuMSAwIiAvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNjb25jcmV0ZS1ub2lzZSkiIC8+PC9zdmc+',
    loaded: true,
  },
  {
    id: 'paper',
    name: 'Paper',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJwYXBlci1ub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuMDEyIiBudW1PY3RhdmVzPSI0IiByZXN1bHQ9Im5vaXNlIiAvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIxIDAgMCAwIDAuOSAgMCAxIDAgMCAwLjg1ICAwIDAgMSAwIDAuOCAgMCAwIDAgMC4xNSAwIiAvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNwYXBlci1ub2lzZSkiIC8+PC9zdmc+',
    loaded: true,
  },
  {
    id: 'sand',
    name: 'Sand',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJzYW5kLW5vaXNlIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIyIiByZXN1bHQ9Im5vaXNlIiAvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwLjggMCAwIDAgMC4yICAwIDAuNyAwIDAgMC4xICAwIDAgMC40IDAgMC4xICAwIDAgMCAwLjE1IDAiIC8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI3NhbmQtbm9pc2UpIiAvPjwvc3ZnPg==',
    loaded: true,
  },
  {
    id: 'parchment',
    name: 'Parchment',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJwYXJjaG1lbnQtbm9pc2UiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjAwOCIgbnVtT2N0YXZlcz0iNSIgcmVzdWx0PSJub2lzZSIgLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMC45NSAwIDAgMCAwLjE1ICAwIDAuOSAwIDAgMC4xNSAgMCAwIDAuNzUgMCAwLjEgIDAgMCAwIDAuMjUgMCIgLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjcGFyY2htZW50LW5vaXNlKSIgLz48L3N2Zz4=',
    loaded: true,
  },
  {
    id: 'scrapbook',
    name: 'Scrapbook',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJzY3JhcGJvb2stbm9pc2UiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjAyIiBudW1PY3RhdmVzPSIzIiByZXN1bHQ9Im5vaXNlIiAvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwLjkgMCAwIDAgMC4xICAwIDAuODUgMCAwIDAuMSAgMCAwIDAuOCAwIDAuMSAgMCAwIDAgMC4zIDAiIC8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI3NjcmFwYm9vay1ub2lzZSkiIC8+PC9zdmc+',
    loaded: true,
  },
  { id: 'leaves', name: 'Leaves', url: '/images/leaves-pattern.jpg', loaded: true },
  { id: 'moon', name: 'Moon Sky', url: '/images/moon-sky.jpg', loaded: true },
  { id: 'night-sky', name: 'Night Sky', url: '/images/night-sky.jpg', loaded: true },
];

export function getTextureName(path: string): string {
  const fileName = getFilename(path);
  return fileName.replace(/\.(jpg|jpeg|png|gif|bmp|webp|mp4)$/i, '');
}

export function getTextureId(name: string): string {
  return md5Fingerprint(name);
}

export function createCustomTexture(
  path: string,
  options?: Partial<Omit<CustomTexture, 'id' | 'path'>>,
): CustomTexture {
  const name = options?.name || getTextureName(path);
  // Spread options first so replica-sync fields (contentId, bundleDir,
  // byteSize) flow through from the import path. Mirrors the
  // createCustomFont fix — without the spread, addTexture silently
  // drops those fields and publishFontUpsert / replica binary upload
  // both no-op on missing contentId.
  return {
    ...options,
    id: getTextureId(name),
    name,
    path,
  };
}

const createTextureCSS = (texture: BackgroundTexture) => {
  const css = `
    .sidebar-container, .notebook-container, .foliate-viewer {
      position: relative;
    }

    body::before, .sidebar-container::before, .notebook-container::before,
    .foliate-viewer::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
      background-image: url("${texture.blobUrl || texture.url}");
      background-repeat: repeat;
      background-size: var(--bg-texture-size, cover);
      mix-blend-mode: var(--bg-texture-blend-mode, multiply);
      opacity: var(--bg-texture-opacity, 0.6);
    }
    body::before {
      height: 100vh;
    }
    `;

  return css;
};

const textureStyleId = 'background-texture';
export const mountBackgroundTexture = (document: Document, texture: BackgroundTexture) => {
  const styleElement = document.getElementById(textureStyleId) || document.createElement('style');
  styleElement.id = textureStyleId;
  styleElement.textContent = createTextureCSS(texture);

  if (!styleElement.parentNode) {
    document.head.appendChild(styleElement);
  }
};

export const unmountBackgroundTexture = (document: Document) => {
  const styleElement = document.getElementById(textureStyleId);
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
};
