const fs = require('fs');
const path = require('path');

const inputPath = "RNK doc/SÖZLER.md";
const outputPath = "src/content/risale/tr/sozler/";

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

const content = fs.readFileSync(inputPath, 'utf8');
// Split by headers like # **Birinci Söz**
const sections = content.split(/(?=# \*\*.* Söz\*\*)/);

let count = 0;
sections.forEach((section, index) => {
    const match = section.match(/# \*\*(.*) Söz\*\*/);
    if (match) {
        count++;
        const title = match[1] + " Söz";
        const filename = `${String(count).padStart(2, '0')}.mdx`;
        const frontmatter = `---
title: "${title}"
book: "sozler"
chapter: ${count}
---

`;
        fs.writeFileSync(path.join(outputPath, filename), frontmatter + section);
        console.log(`Saved: ${filename}`);
    } else if (index === 0) {
        // Handle Intro
        fs.writeFileSync(path.join(outputPath, '00-intro.mdx'), `---
title: "Giriş"
book: "sozler"
chapter: 0
---

` + section);
        console.log("Saved: 00-intro.mdx");
    }
});
