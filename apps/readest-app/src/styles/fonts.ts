import { isCJKEnv } from '@/utils/misc';
import { getFilename } from '@/utils/path';
import { md5Fingerprint } from '@/utils/md5';

export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2';

const basicGoogleFonts = [
  { family: 'Bitter', weights: 'ital,wght@0,100..900;1,100..900' },
  { family: 'Fira Code', weights: 'wght@300..700' },
  { family: 'Literata', weights: 'ital,opsz,wght@0,7..72,200..900;1,7..72,200..900' },
  { family: 'Merriweather', weights: 'ital,opsz,wght@0,18..144,300..900;1,18..144,300..900' },
  { family: 'Noto Sans', weights: 'ital,wght@0,100..900;1,100..900' },
  { family: 'Open Sans', weights: 'ital,wght@0,300..800;1,300..800' },
  { family: 'Roboto', weights: 'ital,wght@0,100..900;1,100..900' },
  { family: 'Roboto Slab', weights: 'ital,wght@0,100..900;1,100..900' },
  { family: 'Vollkorn', weights: 'ital,wght@0,400..900;1,400..900' },
  { family: 'PT Sans', weights: 'ital,wght@0,400;0,700;1,400;1,700' },
  { family: 'PT Serif', weights: 'ital,wght@0,400;0,700;1,400;1,700' },
  { family: 'PT Mono', weights: '' },
  { family: 'Scheherazade New', weights: 'wght@400;700' },
];

const cjkGoogleFonts = [
  { family: 'LXGW WenKai TC', weights: '' },
  { family: 'Noto Sans SC', weights: '' },
  { family: 'Noto Sans TC', weights: '' },
  { family: 'Noto Serif JP', weights: '' },
];

const getAdditionalBasicFontLinks = () => `
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${basicGoogleFonts
    .map(
      ({ family, weights }) =>
        `family=${encodeURIComponent(family)}${weights ? `:${weights}` : ''}`,
    )
    .join('&')}&display=swap" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/opendyslexic@2.11.3/opendyslexic.min.css" crossorigin="anonymous">
`;

const getAdditionalCJKFontLinks = () => `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/misans-webfont@1.0.4/misans-l3/misans-l3/result.min.css" crossorigin="anonymous" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lxgw-wenkai-screen-web/1.520.0/lxgwwenkaigbscreen/result.css" crossorigin="anonymous" />
  <link rel='stylesheet' href='https://storage.risale-ai-studio.com/public/font/dist/Huiwen-MinchoGBK/result.css' crossorigin="anonymous" />
  <link rel='stylesheet' href='https://storage.risale-ai-studio.com/public/font/dist/KingHwa_OldSong/result.css' crossorigin="anonymous" />
  <link rel='stylesheet' href='https://storage.risale-ai-studio.com/public/font/dist/Source%20Han%20Serif%20CN/result.css' crossorigin="anonymous" />
  <link rel='stylesheet' href='https://storage.risale-ai-studio.com/public/font/dist/GuanKiapTsingKhai-T/result.css' crossorigin="anonymous" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${cjkGoogleFonts
    .map(
      ({ family, weights }) =>
        `family=${encodeURIComponent(family)}${weights ? `:${weights}` : ''}`,
    )
    .join('&')}&display=swap" crossorigin="anonymous" />
`;

const getAdditionalCJKFontFaces = () => `
  @font-face {
    font-family: "FangSong";
    font-display: swap;
    src: local("Fang Song"), local("FangSong"), local("Noto Serif CJK"), local("Source Han Serif SC VF"), url("https://db.onlinewebfonts.com/t/2ecbfe1d9bfc191c6f15c0ccc23cbd43.eot");
    src: url("https://db.onlinewebfonts.com/t/2ecbfe1d9bfc191c6f15c0ccc23cbd43.eot?#iefix") format("embedded-opentype"),
    url("https://db.onlinewebfonts.com/t/2ecbfe1d9bfc191c6f15c0ccc23cbd43.woff2") format("woff2"),
    url("https://db.onlinewebfonts.com/t/2ecbfe1d9bfc191c6f15c0ccc23cbd43.woff") format("woff"),
    url("https://db.onlinewebfonts.com/t/2ecbfe1d9bfc191c6f15c0ccc23cbd43.ttf") format("truetype"),
    url("https://db.onlinewebfonts.com/t/2ecbfe1d9bfc191c6f15c0ccc23cbd43.svg#FangSong") format("svg");
  }
  @font-face {
    font-family: "Kaiti";
    font-display: swap;
    src: local("Kai"), local("KaiTi"), local("AR PL UKai"), local("LXGW WenKai GB Screen"), url("https://db.onlinewebfonts.com/t/1ee9941f1b8c128110ca4307dda59917.eot");
    src: url("https://db.onlinewebfonts.com/t/1ee9941f1b8c128110ca4307dda59917.eot?#iefix")format("embedded-opentype"),
    url("https://db.onlinewebfonts.com/t/1ee9941f1b8c128110ca4307dda59917.woff2")format("woff2"),
    url("https://db.onlinewebfonts.com/t/1ee9941f1b8c128110ca4307dda59917.woff")format("woff"),
    url("https://db.onlinewebfonts.com/t/1ee9941f1b8c128110ca4307dda59917.ttf")format("truetype"),
    url("https://db.onlinewebfonts.com/t/1ee9941f1b8c128110ca4307dda59917.svg#STKaiti")format("svg");
  }
  @font-face {
    font-family: "Heiti";
    font-display: swap;
    src: local("Hei"), local("SimHei"), local("WenQuanYi Zen Hei"), local("Source Han Sans SC VF"), url("https://db.onlinewebfonts.com/t/a4948b9d43a91468825a5251df1ec58d.eot");
    src: url("https://db.onlinewebfonts.com/t/a4948b9d43a91468825a5251df1ec58d.eot?#iefix")format("embedded-opentype"),
    url("https://db.onlinewebfonts.com/t/a4948b9d43a91468825a5251df1ec58d.woff2")format("woff2"),
    url("https://db.onlinewebfonts.com/t/a4948b9d43a91468825a5251df1ec58d.woff")format("woff"),
    url("https://db.onlinewebfonts.com/t/a4948b9d43a91468825a5251df1ec58d.ttf")format("truetype"),
    url("https://db.onlinewebfonts.com/t/a4948b9d43a91468825a5251df1ec58d.svg#WenQuanYi Micro Hei")format("svg");
  }
  @font-face {
    font-family: "XiHeiti";
    font-display: swap;
    src: local("PingFang SC"), local("Microsoft YaHei"), local("WenQuanYi Micro Hei"), local("FZHei-B01"), url("https://db.onlinewebfonts.com/t/4f0b783ba4a1b381fc7e7af81ecab481.eot");
    src: url("https://db.onlinewebfonts.com/t/4f0b783ba4a1b381fc7e7af81ecab481.eot?#iefix")format("embedded-opentype"),
    url("https://db.onlinewebfonts.com/t/4f0b783ba4a1b381fc7e7af81ecab481.woff2")format("woff2"),
    url("https://db.onlinewebfonts.com/t/4f0b783ba4a1b381fc7e7af81ecab481.woff")format("woff"),
    url("https://db.onlinewebfonts.com/t/4f0b783ba4a1b381fc7e7af81ecab481.ttf")format("truetype"),
    url("https://db.onlinewebfonts.com/t/4f0b783ba4a1b381fc7e7af81ecab481.svg#STHeiti J Light")format("svg");
}
`;

/** Built-in font @font-face declarations — only injected for selected fonts. */
const BUILTIN_FACES: Record<string, string> = {
  'ITC Souvenir': `
    @font-face{font-family:"ITC Souvenir";src:url("/fonts/latin/ITCSouvenir/ITC Souvenir Light.ttf") format("truetype");font-weight:300;font-style:normal;font-display:swap}
    @font-face{font-family:"ITC Souvenir";src:url("/fonts/latin/ITCSouvenir/ITC Souvenir Light Italic.ttf") format("truetype");font-weight:300;font-style:italic;font-display:swap}
    @font-face{font-family:"ITC Souvenir";src:url("/fonts/latin/ITCSouvenir/ITC Souvenir Bold.ttf") format("truetype");font-weight:700;font-style:normal;font-display:swap}
    @font-face{font-family:"ITC Souvenir";src:url("/fonts/latin/ITCSouvenir/ITC Souvenir Bold Italic.ttf") format("truetype");font-weight:700;font-style:italic;font-display:swap}`,
  'Minion Pro': `
    @font-face{font-family:"Minion Pro";src:url("/fonts/latin/MinionPro/MinionPro-Regular.ttf") format("truetype");font-weight:400;font-style:normal;font-display:swap}
    @font-face{font-family:"Minion Pro";src:url("/fonts/latin/MinionPro/MinionPro-It.ttf") format("truetype");font-weight:400;font-style:italic;font-display:swap}
    @font-face{font-family:"Minion Pro";src:url("/fonts/latin/MinionPro/MinionPro-Bold.ttf") format("truetype");font-weight:700;font-style:normal;font-display:swap}
    @font-face{font-family:"Minion Pro";src:url("/fonts/latin/MinionPro/MinionPro-BoldIt.ttf") format("truetype");font-weight:700;font-style:italic;font-display:swap}`,
  'Nassim Arabic Pro': `
    @font-face{font-family:"Nassim Arabic Pro";src:url("/fonts/arabic/NassimPro/fonnts.com-Nassim-Arabic-Pro-.otf") format("opentype");font-weight:400;font-style:normal;font-display:swap}
    @font-face{font-family:"Nassim Arabic Pro";src:url("/fonts/arabic/NassimPro/fonnts.com-Nassim-Arabic-Pro-Medium.otf") format("opentype");font-weight:500;font-style:normal;font-display:swap}
    @font-face{font-family:"Nassim Arabic Pro";src:url("/fonts/arabic/NassimPro/fonnts.com-Nassim-Arabic-Pro-Semibold-.otf") format("opentype");font-weight:600;font-style:normal;font-display:swap}
    @font-face{font-family:"Nassim Arabic Pro";src:url("/fonts/arabic/NassimPro/fonnts.com-Nassim-Arabic-Pro-Extrabold-.otf") format("opentype");font-weight:700;font-style:normal;font-display:swap}`,
  'Kazimir Text': `
    @font-face{font-family:"Kazimir Text";src:url("/fonts/cyrillic/KazimirText/kazimirtext-regular.woff2") format("woff2"),url("/fonts/cyrillic/KazimirText/kazimirtext-regular.ttf") format("truetype");font-weight:400;font-style:normal;font-display:swap}`,
};

export const injectBuiltinFontFaces = (
  doc: Document,
  fonts: { latin?: string; cyrillic?: string; arabic?: string },
) => {
  const styleId = 'builtin-font-faces';
  let el = doc.getElementById(styleId);
  if (!el) {
    el = doc.createElement('style');
    el.id = styleId;
    doc.head.appendChild(el);
  }
  const selected = new Set([fonts.latin, fonts.cyrillic, fonts.arabic].filter(Boolean));
  el.textContent = Array.from(selected)
    .map((name) => BUILTIN_FACES[name!] || '')
    .filter(Boolean)
    .join('\n');
};

export const mountAdditionalFonts = async (document: Document, isCJK = false) => {
  const mountCJKFonts = isCJK || isCJKEnv();

  // Mount font stylesheets and @font-face rules
  let links = getAdditionalBasicFontLinks();
  let fontFaces = '';

  if (mountCJKFonts) {
    fontFaces = getAdditionalCJKFontFaces();
    links = `${links}\n${getAdditionalCJKFontLinks()}`;
  }

  if (fontFaces) {
    const style = document.createElement('style');
    style.textContent = fontFaces;
    document.head.appendChild(style);
  }

  const parser = new DOMParser();
  const linksDocument = parser.parseFromString(links, 'text/html');

  Array.from(linksDocument.head.children).forEach((child) => {
    if (child.tagName === 'LINK') {
      const link = document.createElement('link');
      link.rel = child.getAttribute('rel') || '';
      link.href = child.getAttribute('href') || '';
      link.crossOrigin = child.getAttribute('crossorigin') || '';

      document.head.appendChild(link);
    }
  });
};

export type FontStyle = 'normal' | 'italic' | 'oblique';

export interface CustomFont {
  id: string;
  name: string;
  path: string;
  family?: string;
  style?: string;
  weight?: number;
  variable?: boolean;

  /**
   * Cross-device content hash. Set on imports new enough to participate
   * in replica sync (`partialMD5 + byteSize + filename`). Legacy fonts
   * (created before replica sync) leave this undefined and never publish
   * — re-import to enable cloud sync.
   */
  contentId?: string;
  /**
   * Per-font directory name relative to the `Fonts` base. New imports
   * land at `<bundleDir>/<filename>`; legacy imports keep their flat
   * `<filename>` path with bundleDir undefined.
   */
  bundleDir?: string;
  /** File size in bytes — used by the replica manifest, optional for legacy. */
  byteSize?: number;
  /**
   * On a remote-pulled placeholder, set to true until the binary download
   * lands. The transfer-complete handler clears it via the font store's
   * markAvailable hook.
   */
  unavailable?: boolean;
  /**
   * Reincarnation token — opaque value that revives a tombstoned remote
   * row. Mirrors the dictionary mechanism.
   */
  reincarnation?: string;

  downloadedAt?: number;
  deletedAt?: number;

  blobUrl?: string;
  loaded?: boolean;
  error?: string;
}

export type CustomFontInfo = Partial<CustomFont> &
  Required<Pick<CustomFont, 'path' | 'name' | 'family' | 'style' | 'weight' | 'variable'>>;

export function getFontName(path: string): string {
  const fileName = getFilename(path);
  return fileName.replace(/\.(ttf|otf|woff|woff2)$/i, '');
}

export function getFontId(name: string): string {
  return md5Fingerprint(name);
}

export function getFontFormat(path: string): FontFormat {
  const extension = path.toLowerCase().split('.').pop();
  switch (extension) {
    case 'ttf':
      return 'ttf';
    case 'otf':
      return 'otf';
    case 'woff':
      return 'woff';
    case 'woff2':
      return 'woff2';
    default:
      return 'ttf';
  }
}

export function getMimeType(format: FontFormat): string {
  const types = { ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };
  return types[format] || 'font/ttf';
}

export function getCSSFormatString(format: FontFormat): string {
  const formats = { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' };
  return formats[format] || 'truetype';
}

export function createFontFamily(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

export function createFontCSS(font: CustomFont): string {
  const format = getFontFormat(font.path);
  const cssFormat = getCSSFormatString(format);
  const fontFamily = createFontFamily(font.family || font.name);
  const fontStyle = font.style || 'normal';
  const fontWeight = font.weight || 400;
  const variable = font.variable || false;
  if (!font.blobUrl) {
    throw new Error(`Blob URL not available for font: ${font.name}`);
  }

  const css = `
    @font-face {
      font-family: "${fontFamily}";
      ${variable ? '' : `font-style: ${fontStyle};`}
      ${variable ? '' : `font-weight: ${fontWeight};`}
      src: url("${font.blobUrl}") format("${cssFormat}");
      font-display: swap;
    }
  `;

  return css;
}

export function createCustomFont(
  path: string,
  options?: Partial<Omit<CustomFont, 'id' | 'path'>>,
): CustomFont {
  const name = options?.name || getFontName(path);
  // Spread options first so replica-sync fields (contentId, bundleDir,
  // byteSize) flow through from the import path. The earlier hand-
  // picked field list silently dropped them, leaving font.contentId
  // undefined → publishFontUpsert short-circuited on `!contentId` →
  // newly imported fonts never published their replica row.
  return {
    ...options,
    id: getFontId(name),
    name,
    path,
  };
}

export const mountCustomFont = (document: Document, font: CustomFont) => {
  const fontStyleId = `custom-font-${font.id}`;
  const styleElement = document.getElementById(fontStyleId) || document.createElement('style');
  styleElement.id = fontStyleId;
  styleElement.textContent = createFontCSS(font);

  if (!styleElement.parentNode) {
    document.head.appendChild(styleElement);
  }
};
