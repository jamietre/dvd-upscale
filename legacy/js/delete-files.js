const path = require('path');
const { promises } = require('fs');
const minimatch = require('minimatch');

const { rm, readdir, stat } = promises;
const rootPath = process.argv[2];
const imageDir = process.argv[3];

const minimatchOpts = { nocase: true };

async function deleteDir(dir) {
  try {
    const stats = await stat(dir);
  } catch (e) {
    if (/ENOENT/.test(e.message)) {
      console.log(`Directory "${dir}" doesn't exist.`);
      return;
    }
    throw e;
  }
  console.log(`Deleting directory ${dir}...`);
  await rm(`${dir}`, {
    recursive: true,
  });
}

async function deleteFilesForPattern(dir, pat) {
  const files = (await readdir(dir)) || [];
  const matches = files.filter((file) => minimatch(file, pat, minimatchOpts));
  if (!matches.length) {
    console.log(`No matches for "${dir}/${pat}"`);
    return;
  }

  console.log(`Deleting ${matches.length} files matching "${dir}}/${pat}"`);
  for (file of matches) {
    await rm(`${dir}/${file}`);
  }
}

async function deleteFile(file) {
  const dir = path.dirname(file);
  const pat = path.basename(file);
  await deleteFilesForPattern(dir, pat);
}

async function deleteProjectFiles() {
  await deleteFile(`${rootPath} T*.*`);
  await deleteFile(`${rootPath}.d2v`);
  await deleteFile(`${rootPath}*.log`);
  await deleteFile(`${rootPath}*.txt`);
  await deleteFile(`${rootPath}*.d2v`);
  await deleteFile(`${rootPath}*.m2v`);
  await deleteFile(`${rootPath}*.mkv`);
  await deleteDir(imageDir);
}

deleteProjectFiles().catch((e) => {
  console.error(e);
  process.exit(1);
});
