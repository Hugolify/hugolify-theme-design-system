/**
 * PostCSS config — hugolify-theme-design-system
 *
 * Copy this file to the "postcss/design-system" directory of your Hugo project,
 * and install the dependencies:
 *   hugo mod get && hugo mod npm pack && yarn install
 *
 * The directory is declared by the module itself (hugo.yaml), no need to set it
 * in your project params:
 *   params:
 *     css:
 *       postcss: "postcss/design-system"
 *
 * Hugo resolves that path from the project root on the real filesystem — a module
 * cannot provide the file through a mount, it has to exist in the project.
 *
 * postcss-import inlines the @import of the npm packages (Hugo's own inlineImports
 * skips them), postcss-custom-media resolves the @custom-media breakpoints.
 */

/* eslint-disable no-undef */
module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-custom-media': {},
    autoprefixer: {},
  }
};
