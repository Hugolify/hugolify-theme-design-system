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

const componentDir = './assets/tokens/components';
const tokenFiles = getTokenFiles('./assets/tokens');
const rel = file => path.relative(componentDir, file).replace(/\.json$/, '');

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
      buildPath: 'assets/css/tokens/components/',
      files: tokenFiles.map(file => ({
        destination: `${rel(file)}.css`,
        format: 'css/layer-tokens',
        filter: t => t.filePath === file,
      })),
    },
  },
}).buildAllPlatforms();

// -------------------------------------------------------
// Barrel — assets/css/tokens/components.css imports every generated component
// token file. Token files are discovered from disk, so tokens/design-system.css
// imports this barrel once instead of listing each file by hand. Each file
// declares its own @layer tokens, so a plain @import is enough.
// -------------------------------------------------------

fs.writeFileSync(
  './assets/css/tokens/components.css',
  '/* components.css — barrel, do not edit */\n' +
    tokenFiles.map(file => `@import "./components/${rel(file)}.css";`).join('\n') + '\n',
);
