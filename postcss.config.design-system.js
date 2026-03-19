/**
 * PostCSS config — hugolify-theme-design-system
 *
 * Copy this file to the root of your Hugo project and install the dependencies:
 *   npm install -D postcss postcss-import postcss-custom-media autoprefixer
 *
 * Declare in your params (config/_default/params.yaml):
 *   css:
 *     postcss: "postcss.config.design-system.js"
 */

/* eslint-disable no-undef */
module.exports = {
  plugins: {
    'postcss-custom-media': {},
    autoprefixer: {},
  }
};
