const fs = require('fs');

const files = [
    'src/components/OrderRiskControlCenter.tsx',
    'src/components/Layout/Sidebar.tsx',
    'src/app/risk/page.tsx',
    'src/app/overview/page.tsx',
    'src/app/operations/page.tsx',
    'src/app/data-sources/page.tsx',
    'src/app/customers/page.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/ font-mono/g, '');
        content = content.replace(/font-mono /g, '');
        content = content.replace(/'font-mono'/g, "''");
        content = content.replace(/"font-mono"/g, '""');
        fs.writeFileSync(file, content, 'utf8');
        console.log("Removed font-mono from", file);
    }
});
