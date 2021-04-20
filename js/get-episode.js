// given a file prefix like "Stargate SG1" and an episode like "S1E01", find the matching file
// todo: stand up a typescript project
// use minimatch

const minimatch = require("minimatch")
const fs = require("fs")
const path = require("path")

const minimatchOpts = { nocase: true }
const dir = process.argv[2];
const pat = process.argv[3];

const files = fs.readdirSync(dir) || []
const matches = files.filter(file => minimatch(file,pat, minimatchOpts));
if (matches.length === 0) {
    console.log(`No files in "${dir}" matched "${pat}"!`)
    process.exit(1);
}
if (matches.length > 1) {
    console.log(`Multiple files in "${dir}" matched "${pat}"!`)
    process.exit(1)
}

const filename= matches[0]
const ext = path.extname(filename)
console.log(path.basename(filename,ext))
