const fs = require('fs');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\(\^\|\(\?<=\[\\\\r\\\\n\]\)\)/g, '(^|[\\\\r\\\\n])');
  content = content.replace(/\(\$\|\(\?=\[\\\\r\\\\n\]\)\)/g, '($|[\\\\r\\\\n])');
  content = content.replace(/\(\^\|\(\?<=\[\\r\\n\]\)\)/g, '(^|[\\r\\n])');
  content = content.replace(/\(\$\|\(\?=\[\\r\\n\]\)\)/g, '($|[\\r\\n])');
  fs.writeFileSync(filePath, content);
}

patchFile('/app/node_modules/.pnpm_patches/zod@4.3.6/lib/index.mjs');
patchFile('/app/node_modules/.pnpm_patches/zod@4.3.6/lib/index.js');
