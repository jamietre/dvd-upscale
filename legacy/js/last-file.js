const fs = require("fs");
const path = require("path");
const dir = process.argv[2];
if (!dir) {
  console.error("must provide an input directory");
  process.exit(1);
}

const files = fs.readdirSync(dir);
if (!files) {
  console.error("must provide an input directory");
  process.exit(1);
}

files.sort();
let lastNumber = 0;
const gaps = [];
files.forEach(file => {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  const fileNum = Number(base);
  if (Number.isNaN(fileNum)) {
    console.error(`Invalid file name ${file}`);
    process.exit(1);
  }
  if (lastNumber) {
    if (fileNum !== lastNumber + 1) {
      gaps.push(`Gap detected between ${lastNumber} and ${fileNum}`);
    }
  }
  lastNumber = fileNum;
});

if (gaps.length) {
  gaps.forEach(gap => console.log(gap));
  console.error("Gaps were found in file sequence.");
  process.exit(1);
}

console.log(lastNumber);
