const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\(\^\|\(\?<=\[\\r\\n\]\)\)/g, '(^|[\\r\\n])');
  content = content.replace(/\(\$\|\(\?=\[\\r\\n\]\)\)/g, '($|[\\r\\n])');
  fs.writeFileSync(filePath, content);
}

patchFile(
  'node_modules/.pnpm/@ai-sdk+provider-utils@4.0.23_patch_hash=90e367a1019a46d3ca3a4e231b48615de88fd56eb3212f4e0a5528154c523295_zod@4.3.6/node_modules/@ai-sdk/provider-utils/dist/index.js',
);
patchFile(
  'node_modules/.pnpm/@ai-sdk+provider-utils@4.0.23_patch_hash=90e367a1019a46d3ca3a4e231b48615de88fd56eb3212f4e0a5528154c523295_zod@4.3.6/node_modules/@ai-sdk/provider-utils/dist/index.mjs',
);
patchFile(
  'node_modules/.pnpm/@ai-sdk+provider-utils@4.0.23_zod@4.3.6/node_modules/@ai-sdk/provider-utils/dist/index.js',
);
patchFile(
  'node_modules/.pnpm/@ai-sdk+provider-utils@4.0.23_zod@4.3.6/node_modules/@ai-sdk/provider-utils/dist/index.mjs',
);
