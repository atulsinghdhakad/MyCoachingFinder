const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const SRC_DIR = path.join(__dirname, 'src');
const ENTRY_FILE = path.join(SRC_DIR, 'App.jsx');

// Get all .jsx and .js files recursively
function getAllJSFiles(dirPath, files = []) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      getAllJSFiles(fullPath, files);
    } else if (/\.(jsx?|tsx?)$/.test(item.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseFileExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ast = babelParser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'classProperties'],
  });

  let hasDefaultExport = false;

  traverse(ast, {
    ExportDefaultDeclaration() {
      hasDefaultExport = true;
    },
  });

  return { hasDefaultExport };
}

function runChecks() {
  console.log('🔍 Checking default exports in JSX files...\n');

  const files = getAllJSFiles(SRC_DIR);
  let missingExports = [];

  for (const file of files) {
    const { hasDefaultExport } = parseFileExports(file);
    if (!hasDefaultExport) {
      console.log(`❌ No default export in: ${path.relative(SRC_DIR, file)}`);
      missingExports.push(file);
    }
  }

  if (missingExports.length === 0) {
    console.log('✅ All files have default exports.\n');
  }

  // Ensure entry point has default export
  if (!fs.existsSync(ENTRY_FILE)) {
    console.error(`❌ Entry file not found: ${ENTRY_FILE}`);
    return;
  }

  const entryCheck = parseFileExports(ENTRY_FILE);
  if (!entryCheck.hasDefaultExport) {
    console.error(`❌ Entry file is missing default export: ${ENTRY_FILE}`);
  } else {
    console.log(`✅ Entry file ${path.basename(ENTRY_FILE)} has a default export.`);
  }
}

runChecks();
