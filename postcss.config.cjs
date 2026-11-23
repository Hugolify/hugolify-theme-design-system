/**
 * PostCSS config — hugolify-theme-design-system
 *
 * Loaded straight from the module, no copy in the project: Hugo mounts this file
 * in assets/_jsconfig, and the module points the theme at it (hugo.yaml):
 *   params:
 *     css:
 *       postcss: "postcss.config.cjs"
 *
 * Install the dependencies:
 *   hugo mod get && hugo mod npm pack && yarn install
 *
 * Why CommonJS (.cjs), not ESM: Node runs this file from the Hugo module cache,
 * which has no node_modules, so the plugins must come from the project's
 * node_modules, which Hugo passes as NODE_PATH. require() has always read
 * NODE_PATH, on any Hugo version; ESM import ignores it, and Hugo only works
 * around that since 0.164. The .cjs extension is required because package.json
 * declares "type": "module": a .js file would be loaded as ESM.
 *
 * Since Hugo 0.161, Node runs with --permission: use Node >= 24.5 or >= 22.20,
 * older releases crash (or hang Hugo) while resolving this file.
 *
 * To override, add a postcss.config.cjs at the project root: Hugo mounts it in
 * assets/_jsconfig too, and the project's assets come first.
 *
 * postcss-import inlines the @import of the npm packages (Hugo's own inlineImports
 * skips them), postcss-custom-media resolves the @custom-media breakpoints.
 *
 * autoprefixer takes its browser floors from the module itself
 * (assets/_jsconfig/browserslist, exposed by Hugo as HUGO_FILE_BROWSERSLIST):
 * a project .browserslistrc is ignored and can be deleted.
 */

/* eslint-disable no-undef */
if (process.env.HUGO_FILE_BROWSERSLIST) {
  process.env.BROWSERSLIST_CONFIG ??= process.env.HUGO_FILE_BROWSERSLIST;
}

module.exports = {
  plugins: [
    require('postcss-import')(),
    require('postcss-custom-media')(),
    require('autoprefixer')(),
  ],
};
