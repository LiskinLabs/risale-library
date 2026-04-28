const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\(\^\|\(\?<=\[\\r\\n\]\)\)/g, '(^|[\\r\\n])');
  content = content.replace(/\(\$\|\(\?=\[\\r\\n\]\)\)/g, '($|[\\r\\n])');
  fs.writeFileSync(filePath, content);
}

patchFile('/app/node_modules/.pnpm_patches/zod@3.24.2/lib/index.js');
patchFile('/app/node_modules/.pnpm_patches/zod@3.24.2/lib/index.mjs');
