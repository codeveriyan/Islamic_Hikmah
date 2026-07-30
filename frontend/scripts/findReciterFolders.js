const fs = require('fs');

async function listEveryAyah() {
  console.log('=== EveryAyah Catalog ===');
  const res = await fetch('https://everyayah.com/data/');
  const html = await res.text();
  const matches = [...html.matchAll(/href="([^"]+\/)"/g)].map(m => m[1]);
  for (const m of matches) {
    console.log(`EA: ${m.replace('/', '')}`);
  }
}

async function listAlQuranCloud() {
  console.log('\n=== AlQuran Cloud Audio Editions ===');
  const res = await fetch('https://api.alquran.cloud/v1/edition?format=audio');
  const json = await res.json();
  for (const item of json.data || []) {
    console.log(`AlQuranCloud: ${item.identifier} -> ${item.englishName}`);
  }
}

async function main() {
  await listEveryAyah();
  await listAlQuranCloud();
}

main();
