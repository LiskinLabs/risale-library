const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pandocPath = path.resolve('pandoc-3.9/pandoc.exe');
const inputDir = path.resolve('RNK doc');
const outputBaseDir = path.resolve('src/content/risale/tr');

const targetBook = process.argv[2]; 
let files = fs.readdirSync(inputDir).filter(f => f.endsWith('.docx'));

if (targetBook) {
    files = files.filter(f => f.toLowerCase().includes(targetBook.toLowerCase()));
}

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
        .replace(/ç/g, 'c');
    
    const bookOutputDir = path.join(outputBaseDir, bookName);
    if (!fs.existsSync(bookOutputDir)) {
        fs.mkdirSync(bookOutputDir, { recursive: true });
    }

    const mdPath = path.join(inputDir, file.replace('.docx', '.md'));
    
    console.log(`Converting ${file} to GFM...`);
    try {
        const mediaDirName = bookName.replace(/[^a-z0-9-]/g, '');
        execSync(`"${pandocPath}" "${path.join(inputDir, file)}" -t gfm-raw_html --extract-media=public/images/${mediaDirName} -o "${mdPath}"`);
    } catch (e) {
        console.error(`Failed to convert ${file}: ${e.message}`);
        return;
    }

    console.log(`Splitting ${bookName}...`);
    let content = fs.readFileSync(mdPath, 'utf8');
    
    // IMPORTANT: Fix image paths for Astro build
    // Remove "public/" prefix because Astro serves content of public/ from root
    // Also use forward slashes
    const mediaDirName = bookName.replace(/[^a-z0-9-]/g, '');
    content = content.replace(/public\/images\//g, '/images/');
    content = content.replace(/\\/g, '/');

    const splitRegex = /\n(?=#+ \*\*)/;
    const sections = content.split(splitRegex);
    
    let count = 0;
    sections.forEach((section, index) => {
        const trimmed = section.trim();
        if (trimmed.length < 10) return;

        const headerMatch = trimmed.match(/^#+ \*\*(.*)\*\*/);
        let title = headerMatch ? headerMatch[1] : `Bölüm ${count + 1}`;
        
        title = title.replace(/\*\*/g, '').replace(/\//g, '').trim();
        if (title.includes(' – ')) {
            title = title.split(' – ').pop();
        }
        
        if (!title.match(/[a-zA-Z0-9İıĞğÜüŞşÖöÇç]/)) {
            title = `Bölüm ${count + 1}`;
        }

        count++;
        const filename = `${String(count).padStart(2, '0')}.md`;
        
        const safeTitle = title.replace(/'/g, "''");
        const frontmatter = `---
title: '${safeTitle}'
book: '${bookName}'
chapter: ${count}
---

`;
        fs.writeFileSync(path.join(bookOutputDir, filename), frontmatter + section, 'utf8');
    });
    
    console.log(`Finished ${bookName}: ${count} chapters.`);
});
