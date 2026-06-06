const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const TARGET_DIRS = [
  path.join(__dirname, '../.next/server'),
  path.join(__dirname, '../.next/static')
];

function walk(dir, callback) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      // If directory doesn't exist (e.g. static files not built yet), skip
      return;
    }
    files.forEach(file => {
      const filepath = path.join(dir, file);
      fs.stat(filepath, (err, stats) => {
        if (stats.isDirectory()) {
          walk(filepath, callback);
        } else if (stats.isFile() && filepath.endsWith('.js')) {
          callback(filepath);
        }
      });
    });
  });
}

console.log("Starting code obfuscation process...");

let fileCount = 0;

TARGET_DIRS.forEach(dir => {
  walk(dir, (filepath) => {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      
      // Do not obfuscate already obfuscated files or maps
      if (content.includes('/* obfuscated */') || filepath.endsWith('.map.js')) {
        return;
      }

      console.log(`Obfuscating: ${path.relative(path.join(__dirname, '..'), filepath)}`);
      
      const obfuscationResult = JavaScriptObfuscator.obfuscate(content, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        numbersToExpressions: true,
        simplify: true,
        stringArrayThreshold: 0.75
      });

      fs.writeFileSync(filepath, '/* obfuscated */\n' + obfuscationResult.getObfuscatedCode(), 'utf8');
      fileCount++;
    } catch (err) {
      console.error(`Failed to obfuscate ${filepath}:`, err.message);
    }
  });
});

process.on('exit', () => {
  console.log(`Obfuscation complete! Obfuscated ${fileCount} files.`);
});
