const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\(\^\|\(\?<=\[\\r\\n\]\)\)/g, '(^|[\\r\\n])');
  content = content.replace(/\(\$\|\(\?=\[\\r\\n\]\)\)/g, '($|[\\r\\n])');
  fs.writeFileSync(filePath, content);
}

patchFile('/app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.mjs');
patchFile('/app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.js');
patchFile(
  '/app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/src/to-json-schema/zod3-to-json-schema/parsers/string.ts',
);
