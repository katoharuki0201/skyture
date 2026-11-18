import { readFileSync, existsSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const { artworks } = read('../src/data/artworks.json');
const images = Object.values(read('../src/data/artwork-images.json'));
const failures = [];
for (const artwork of artworks) {
 const entry = images.find(image => image.source === artwork.image);
 if (!entry || !entry.path.startsWith('artworks/') || entry.path.includes('..')) { failures.push(artwork.id); continue; }
 const path = new URL(`../public/${entry.path}`, import.meta.url);
 if (!existsSync(path)) { failures.push(artwork.id); continue; }
 const bytes = readFileSync(path);
 const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
 const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const webp = bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
 if (!jpeg && !png && !webp) failures.push(artwork.id);
}
if (failures.length) { console.error(`作品画像が未同期、または画像形式が不正です: ${failures.join(', ')}\nbun run sync:artworks を実行してください。`); process.exitCode = 1; }
else console.log(`作品画像 ${artworks.length}件: ローカル配信を確認しました。`);
