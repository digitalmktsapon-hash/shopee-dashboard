const fs = require('fs');

['src/app/products/page.tsx', 'src/app/fees/page.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Remove "font-mono"
    content = content.replace(/font-mono /g, '');
    content = content.replace(/ font-mono/g, '');
    content = content.replace(/'font-mono'/g, "''");
    content = content.replace(/"font-mono"/g, '""');

    fs.writeFileSync(file, content, 'utf8');
    console.log("Cleaned font-mono from " + file);
});
