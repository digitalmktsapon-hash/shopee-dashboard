const fs = require('fs');

const pathReplacements = {
    'src/app/overview/page.tsx': { from: /max-w-7xl/g, to: 'max-w-[1600px]' },
    'src/app/products/page.tsx': { from: /max-w-\[1700px\]/g, to: 'max-w-[1600px]' },
    'src/app/data-sources/page.tsx': { from: /max-w-5xl/g, to: 'max-w-[1600px]' },
};

for (const [file, rules] of Object.entries(pathReplacements)) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(rules.from, rules.to);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Standardized width in ${file}`);
    }
}
