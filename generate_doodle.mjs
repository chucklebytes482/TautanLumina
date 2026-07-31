import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const icons = [
  'alien', 'gamepad-2', 'coffee', 'rocket', 'heart', 'flame', 'star', 'moon', 'sun', 
  'camera', 'cloud', 'feather', 'leaf', 'snowflake', 'plane', 'umbrella', 'scissors', 
  'wrench', 'hammer', 'atom', 'microscope', 'telescope', 'thermometer', 'beaker', 
  'headphones', 'guitar', 'music', 'tv', 'ticket', 'shield', 'crown', 'flag', 
  'bell', 'anchor', 'bike', 'bus', 'car', 'clock', 'compass', 'key', 'lock', 
  'lightbulb', 'puzzle', 'zap', 'ghost', 'skull', 'bug', 'flower', 'palmtree', 'cherry',
  'cake', 'cookie', 'croissant', 'donut', 'pizza', 'sandwich', 'sword', 'trophy'
];

function extractPaths(iconName) {
  try {
    const filePath = path.join(__dirname, 'node_modules', 'lucide-react', 'dist', 'esm', 'icons', `${iconName}.js`);
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/const __iconNode = (\[.*?\]);/s);
    if (match) {
      const getArray = new Function(`return ${match[1]}`);
      return getArray();
    }
  } catch (e) { }
  return null;
}

const gridSize = 10;
const canvasSize = 600;
const cellSize = canvasSize / gridSize;

let svgElements = '';
let iconIndex = 0;
let seed = 12345;
function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

for (let y = 0; y < gridSize; y++) {
  for (let x = 0; x < gridSize; x++) {
    const iconName = icons[iconIndex % icons.length];
    iconIndex++;
    
    const nodeData = extractPaths(iconName);
    if (!nodeData) continue;
    
    const cx = (x + 0.5) * cellSize + (random() * 20 - 10);
    const cy = (y + 0.5) * cellSize + (random() * 20 - 10);
    const rot = random() * 360;
    
    let innerTags = '';
    for (const [tag, attrs] of nodeData) {
      if (tag === 'path') innerTags += `<path d="${attrs.d}" />`;
      else if (tag === 'circle') innerTags += `<circle cx="${attrs.cx}" cy="${attrs.cy}" r="${attrs.r}" />`;
      else if (tag === 'rect') innerTags += `<rect x="${attrs.x}" y="${attrs.y}" width="${attrs.width}" height="${attrs.height}" rx="${attrs.rx || 0}" />`;
    }
    svgElements += `<g transform="translate(${cx - 12}, ${cy - 12}) scale(1) rotate(${rot}, 12, 12)">${innerTags}</g>\n`;
  }
}

const createSvg = (stroke, opacity) => `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <g stroke="${stroke}" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">
    ${svgElements}
  </g>
</svg>`;

const lightSvg = createSvg('#737373', '0.12'); // Darker grey for light mode
const darkSvg = createSvg('#ffffff', '0.08'); // White for dark mode

const lightUri = `url("data:image/svg+xml;base64,${Buffer.from(lightSvg).toString('base64')}")`;
const darkUri = `url("data:image/svg+xml;base64,${Buffer.from(darkSvg).toString('base64')}")`;

fs.writeFileSync('doodle_light.txt', lightUri);
fs.writeFileSync('doodle_dark.txt', darkUri);
console.log('Doodles generated');
