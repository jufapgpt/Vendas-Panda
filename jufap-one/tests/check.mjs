import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const required = [
  '<!doctype html>',
  'id="visao-geral"',
  'id="resultado"',
  'id="lojas"',
  'id="composicao"',
  'id="ritmo"',
  'id="up"',
  'id="qualidade"',
  'id="acoes"',
  'id="brief"',
  'id="periodSwitch"',
  'id="regionalFilter"',
  'id="storeFilter"',
  'id="profileSelect"',
  'id="storeDrawer"'
];

const missing = required.filter(token => !html.includes(token));
if (missing.length) {
  console.error('Elementos obrigatórios ausentes:', missing);
  process.exit(1);
}

const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) {
  console.error('Nenhum script inline encontrado.');
  process.exit(1);
}

for (const [index, match] of scripts.entries()) {
  try {
    // Verificação de sintaxe; o código não é executado.
    new Function(match[1]);
  } catch (error) {
    console.error(`Erro de sintaxe no script ${index + 1}:`, error);
    process.exit(1);
  }
}

const duplicateIds = [...html.matchAll(/\bid="([^"]+)"/g)]
  .map(match => match[1])
  .filter((id, index, all) => all.indexOf(id) !== index);

if (duplicateIds.length) {
  console.error('IDs HTML duplicados:', [...new Set(duplicateIds)]);
  process.exit(1);
}

console.log('JUFAP One: estrutura obrigatória, IDs e sintaxe JavaScript aprovados.');
