const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pandocPath = path.resolve('pandoc-3.9/pandoc.exe');
const inputDir = path.resolve('RNK doc');
const outputBaseDir = path.resolve('src/content/risale/tr');

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.docx'));

files.forEach(file => {
    const bookName = file.replace('.docx', '').toLowerCase()
        .replace(/ /g, '-')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
        .replace(/[’']/g, '-')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9-]/g, '');
    
    // We will save as one file: src/content/risale/tr/book-name.md
    if (!fs.existsSync(outputBaseDir)) {
        fs.mkdirSync(outputBaseDir, { recursive: true });
    }

    const mdPath = path.join(inputDir, file.replace('.docx', '.md'));
    const finalOutputPath = path.join(outputBaseDir, `${bookName}.md`);
    
    console.log(`Converting ${file} to GFM...`);
    try {
        const mediaDirName = bookName;
        // Generate with footnotes enabled and gfm
        execSync(`"${pandocPath}" "${path.join(inputDir, file)}" -t gfm --extract-media=public/images/${mediaDirName} -o "${mdPath}"`);
    } catch (e) {
        console.error(`Failed to convert ${file}: ${e.message}`);
        return;
    }

    console.log(`Processing ${bookName} as a single file...`);
    let content = fs.readFileSync(mdPath, 'utf8');
    
    // Fix image paths
    content = content.replace(/public\/images\//g, '/risale-library/images/');
    content = content.replace(/\\/g, '/');

    // Add frontmatter
    const bookTitle = file.replace('.docx', '');
    const frontmatter = `---
title: '${bookTitle.replace(/'/g, "''")}'
book: '${bookName}'
---

`;
    fs.writeFileSync(finalOutputPath, frontmatter + content, 'utf8');
    
    console.log(`Finished ${bookName}.`);
});
