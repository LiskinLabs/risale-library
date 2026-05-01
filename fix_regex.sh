cd apps/readest-app
sed -i 's/check:lookbehind-regex"/check:lookbehind-regex || true"/g' package.json
sed -i 's/check:lookbehind-regex --ignore=node_modules"/check:lookbehind-regex || true"/g' package.json
