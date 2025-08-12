// analyze-components.js
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const ENTRY_FILE = path.join(SRC_DIR, 'App.jsx');

let componentFiles = [];
let appImports = [];
let allImports = new Set();

const isComponentFile = (file) =>
  file.endsWith('.js') || file.endsWith('.jsx');

const walk = (dir) => {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) walk(fullPath);
    else if (isComponentFile(entry)) componentFiles.push(fullPath);
  }
};

const extractImports = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const regex = /import\s+.*?['"](.+?)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let impPath = match[1];
    if (impPath.startsWith('.') || impPath.startsWith('/')) {
      allImports.add(impPath);
    }
  }
};

const checkExports = () => {
  console.log('\n📦 Checking default exports...');
  let errors = 0;
  componentFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    const hasDefaultExport = content.includes('export default');
    if (!hasDefaultExport) {
      console.log(`❌ Missing default export in: ${path.relative(SRC_DIR, file)}`);
      errors++;
    }
  });
  if (errors === 0) console.log('✅ All files have default exports.');
};

const checkNameMatches = () => {
  console.log('\n🧩 Checking filename vs. exported component name...');
  let mismatches = 0;
  componentFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    const exportMatch = content.match(/export default (\w+)/);
    if (exportMatch) {
      const exported = exportMatch[1];
      const expected = path.basename(file, path.extname(file));
      if (exported.toLowerCase() !== expected.toLowerCase()) {
        console.log(`⚠️ Exported name "${exported}" doesn't match filename "${expected}" in: ${file}`);
        mismatches++;
      }
    }
  });
  if (mismatches === 0) console.log('✅ All filenames match their exported components.');
};

const checkBrokenImports = () => {
  console.log('\n🚫 Checking broken imports in App.jsx...');
  const content = fs.readFileSync(ENTRY_FILE, 'utf-8');
  const regex = /import .*? from ['"](.+?)['"]/g;
  let broken = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      const resolved = path.join(SRC_DIR, importPath);
      const candidates = [
        resolved,
        `${resolved}.js`,
        `${resolved}.jsx`,
        path.join(resolved, 'index.js'),
        path.join(resolved, 'index.jsx'),
      ];
      const found = candidates.some((p) => fs.existsSync(p));
      if (!found) {
        console.log(`❌ Unresolved import: ${importPath}`);
        broken++;
      }
    }
  }
  if (broken === 0) console.log('✅ All imports in App.jsx are valid.');
};

const findUnused = () => {
  console.log('\n🕵️‍♂️ Detecting unused files...');
  let usedFiles = new Set();
  componentFiles.forEach((file) => {
    extractImports(file);
  });
  componentFiles.forEach((file) => {
    const relPath = './' + path.relative(SRC_DIR, file).replace(/\\/g, '/').replace(/\.(js|jsx)$/, '');
    if (allImports.has(relPath)) usedFiles.add(file);
  });

  const unused = componentFiles.filter((f) => !usedFiles.has(f));
  if (unused.length) {
    console.log('⚠️ Possibly unused files:');
    unused.forEach((f) => {
      console.log(`   • ${path.relative(SRC_DIR, f)}`);
    });
  } else {
    console.log('✅ No unused files found.');
  }
};

const run = () => {
  walk(SRC_DIR);
  extractImports(ENTRY_FILE);
  checkExports();
  checkNameMatches();
  checkBrokenImports();
  findUnused();
};

run();
