
const execSync = require('child_process').execSync;

const a = 'public/SoundVolumeView.exe';
const b = 'public/sound-items.json';

try {
  execSync(`"${a}" /SaveFileEncoding 3 /sjson "${b}"`);
} catch (error) {
  console.error(error.toString());
}


const fs = require('fs');
const SOUND_ITEMS_PATH = 'public/sound-items.json';
// const SOUND_ITEMS_PATH = 'public/test.json';
let fileContent = fs.readFileSync(SOUND_ITEMS_PATH, 'utf8');
fileContent = fileContent.replace(/^\uFEFF/, '');

console.log('fileContent:', fileContent);

const soundItems = JSON.parse(fileContent) || [];

console.log(soundItems);
