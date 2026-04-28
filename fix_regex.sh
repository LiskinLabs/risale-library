find apps/readest-app/node_modules -name "*.js" -type f -exec sed -i 's/(^|(?<=\[\\r\\n\]))/(^|\[\\r\\n\])/g' {} +
