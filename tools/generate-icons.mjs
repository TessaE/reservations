/**
 * Generates PNG icons for the PWA from the SVG source.
 * Run with: node scripts/generate-icons.mjs
 *
 * Requires: npm install sharp -D
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const iconSvgPath = resolve(rootDir, 'public/icons/icon.svg');
const outputDir = resolve(rootDir, 'public/icons');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512 },
];

async function generateIcons() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('❌  sharp is not installed. Run: npm install sharp -D');
    process.exit(1);
  }

  if (!existsSync(iconSvgPath)) {
    console.error(`❌  SVG source not found at ${iconSvgPath}`);
    process.exit(1);
  }

  const svgBuffer = readFileSync(iconSvgPath);

  for (const { name, size } of sizes) {
    const outputPath = resolve(outputDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅  Generated ${name} (${size}x${size})`);
  }

  console.log('\n🎉  All icons generated!');
}

generateIcons();

