import StyleDictionary from 'style-dictionary';
import fs from 'node:fs';
import path from 'node:path';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function getTokenFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return getTokenFiles(fullPath);
      if (entry.name.endsWith('.json')) return [fullPath];
      return [];
    });
}

function pathToKebab(parts) {
  return parts
    .filter(p => p !== 'default')
    .map(p => p.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase())
    .join('-');
}

function refToVar(ref) {
  return ref.replace(/\{([^}]+)\}/g, (_, p) => `var(--${pathToKebab(p.split('.'))})`);
}

function compositeLayerToCSS(obj) {
  const { inset, ...props } = obj;
  const values = Object.values(props).map(v => refToVar(String(v)));
  return `${inset ? 'inset ' : ''}${values.join(' ')}`;
}

// -------------------------------------------------------
// Transforms
// -------------------------------------------------------

StyleDictionary.registerTransform({
  name: 'name/kebab/strip-default',
  type: 'name',
  transform(token) {
    return pathToKebab(token.path);
  },
});

StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: ['name/kebab/strip-default'],
});

// -------------------------------------------------------
// Format — @layer tokens
// -------------------------------------------------------

StyleDictionary.registerFormat({
  name: 'css/layer-tokens',
  format({ dictionary, file }) {
    const allVars = dictionary.allTokens.map(t => {
      const name = pathToKebab(t.path);
      const orig = t.original?.$value ?? t.original?.value;
      let value;
      if (Array.isArray(orig))                              value = orig.map(compositeLayerToCSS).join(', ');
      else if (orig !== null && typeof orig === 'object')   value = compositeLayerToCSS(orig);
      else                                                  value = refToVar(String(orig ?? t.$value ?? t.value));
      return `    --${name}: ${value};`;
    }).join('\n');

    const header = '/* Do not edit directly, this file was auto-generated. */';

    return `${header}\n\n/* ${file.destination} */\n@layer tokens {\n  :root {\n${allVars}\n  }\n}\n`;
  },
});

// -------------------------------------------------------
// Config
// -------------------------------------------------------

const tokensRoot = './assets/tokens';
const tokenFiles = getTokenFiles(tokensRoot);
const rel = file => path.relative(tokensRoot, file).replace(/\.json$/, '');

for (const pkg of ['@uncinq/design-tokens', '@uncinq/component-tokens']) {
  if (!fs.existsSync(`./node_modules/${pkg}`)) {
    throw new Error(`Missing ${pkg} — run npm install first.`);
  }
}

await new StyleDictionary({
  usesDtcg: true,
  log: { warnings: 'disabled', errors: { brokenReferences: 'console' } },
  include: [
    ...getTokenFiles('./node_modules/@uncinq/design-tokens/tokens'),
    ...getTokenFiles('./node_modules/@uncinq/component-tokens/tokens'),
  ],
  source: tokenFiles,
  platforms: {
    css: {
      transformGroup: 'custom/css',
      buildPath: 'assets/css/tokens/',
      files: tokenFiles.map(file => ({
        destination: `${rel(file)}.css`,
        format: 'css/layer-tokens',
        filter: t => t.filePath === file,
      })),
    },
  },
}).buildAllPlatforms();

// -------------------------------------------------------
// Single barrel — assets/css/tokens/hugolify.css imports every generated token
// file, grouped by folder (components, semantic, …). Files are discovered from
// disk, so adding a JSON — or a whole new group — needs no manual edit;
// tokens/design-system.css imports this one barrel. Each file declares its own
// @layer tokens, so a plain @import is enough. A token file that produced no
// CSS (e.g. a name collision) is skipped rather than imported, so the CSS build
// never points at a missing file.
// -------------------------------------------------------

const groups = {};
const missing = [];
for (const file of tokenFiles) {
  const r = rel(file);
  if (fs.existsSync(`./assets/css/tokens/${r}.css`)) (groups[r.split('/')[0]] ??= []).push(r);
  else missing.push(r);
}

if (missing.length) {
  console.warn(`⚠ No CSS generated (excluded from hugolify.css): ${missing.join(', ')}`);
}

fs.writeFileSync(
  './assets/css/tokens/hugolify.css',
  '/* hugolify.css — barrel, do not edit */\n\n' +
    Object.keys(groups).sort().map(group =>
      `/* ${group} */\n` + groups[group].map(r => `@import "./${r}.css";`).join('\n'),
    ).join('\n\n') + '\n',
);
