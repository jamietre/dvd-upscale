import { Context } from '../lib/context';

type Stats = {
  sourceFrameCount: number;
};

// const fs = require("fs")
// const dir = process.argv[2];

// const fps24=24000/1001
// const fps30=30000/1001

// try {
//   const files = fs.readdirSync(dir);
//   if (files && files.length) {
//     files.sort();
//     const totalFiles = files.length;
//     const lastFileName =files[files.length-1]
//     console.log(`Total files: ${totalFiles}`)
//     console.log(`Last file: ${lastFileName}`)
//     console.log(`Length @24fps: ${formatNumber(totalFiles/fps24/60)}`)
//     console.log(`Length @30fps: ${formatNumber(totalFiles/fps30/60)}`)
//   }
// } catch(e) {
//   /* noop */
// }

// function formatNumber(num) {
//     return Math.floor(number*100)/100
// }

function getStats(context: Context): Promise<Stats> {}
