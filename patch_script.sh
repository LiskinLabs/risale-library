cat /app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.mjs | perl -pe 's/\(\^\|\(\?\<\=\[\\r\n\]\)\)/(^|[\\r\\n])/g' > /app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.mjs.new
mv /app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.mjs.new /app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.mjs

cat /app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.js | perl -pe 's/\(\^\|\(\?\<\=\[\\r\n\]\)\)/(^|[\\r\\n])/g' > /app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.js.new
mv /app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.js.new /app/node_modules/.pnpm_patches/@ai-sdk/provider-utils@4.0.23/dist/index.js
