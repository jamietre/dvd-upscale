const fs = require("fs")
const path = require("path")
const dir = process.argv[2];
if (!dir) {
    throw new Error("must provide an input directory")
}

const files = fs.readdirSync(dir);
if (!files ||  !files.length) {
    throw new Error("must provide an input directory")
}

files.sort();
let lastNumber = undefined;
const gaps = [];
files.forEach(file => {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const fileNum = Number(base);
    if (Number.isNaN(fileNum)) {
        throw new Error(`Invalid file name ${file}`)
    }
    if (lastNumber) {
        if (fileNum !== lastNumber+1) {
            gaps.push(`Gap detected between ${lastNumber} and ${fileNum}`)
        }
    }
    lastNumber = fileNum;
})

if (gaps.length) {
    gaps.forEach(gap => console.log(gap));
    console.error("Gaps were found in file sequence.");
    process.exit(1)
}

console.log(lastNumber)
  
