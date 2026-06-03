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
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMiIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwLjMzIDAuMzMgMC4zMyAwIDAgIDAuMzMgMC4zMyAwLjMzIDAgMCAgMC4zMyAwLjMzIDAuMzMgMCAwICAwIDAgMCAwLjEgMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKENmKSIvPjwvc3ZnPg==',
    loaded: true,
  },
  {
    id: 'concrete',
    name: 'Concrete',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4wMiIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwLjMzIDAuMzMgMC4zMyAwIDAgIDAuMzMgMC4zMyAwLjMzIDAgMCAgMC4zMyAwLjMzIDAuMzMgMCAwICAwIDAgMCAwLjIgMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNmKSIvPjwvc3ZnPg==',
    loaded: true,
  },
  {
    id: 'paper',
    name: 'Paper',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4xIiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAuMzMgMC4zMyAwLjMzIDAgMCAgMC4zMyAwLjMzIDAuMzMgMCAwICAwLjMzIDAuMzMgMC4zMyAwIDAgIDAgMCAwIDAuMTUgMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNmKSIvPjwvc3ZnPg==',
    loaded: true,
  },
  {
    id: 'sand',
    name: 'Sand',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC40IiBudW1PY3RhdmVzPSIyIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAuMzMgMC4zMyAwLjMzIDAgMCAgMC4zMyAwLjMzIDAuMzMgMCAwICAwLjMzIDAuMzMgMC4zMyAwIDAgIDAgMCAwIDAuMiAwIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2YpIi8+PC9zdmc+',
    loaded: true,
  },
  {
    id: 'parchment',
    name: 'Parchment',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4wMSIgbnVtT2N0YXZlcz0iNSIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwLjMzIDAuMzMgMC4zMyAwIDAgIDAuMzMgMC4zMyAwLjMzIDAgMCAgMC4zMyAwLjMzIDAuMzMgMCAwICAwIDAgMCAwLjI1IDAiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjZikiLz48L3N2Zz4=',
    loaded: true,
  },
  {
    id: 'scrapbook',
    name: 'Scrapbook',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJncmF5IiBzdHJva2Utd2lkdGg9IjAuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuMyIvPjwvcGF0dGVybj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4wNSIgbnVtT2N0YXZlcz0iMiIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwLjMzIDAuMzMgMC4zMyAwIDAgIDAuMzMgMC4zMyAwLjMzIDAgMCAgMC4zMyAwLjMzIDAuMzMgMCAwICAwIDAgMCAwLjEgMCIvPjwvZmlsdGVyPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjZikiLz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+',
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
