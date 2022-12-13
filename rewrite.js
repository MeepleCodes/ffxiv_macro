/**
 * Monkey-patcher for react-scripts to modify their webpack config
 *
 * Currently works for 'build' and 'start' scripts.
 *
 * Call as "node ./rewrite.js <scriptname>" where scriptname is one of "build"
 * or "start" (omit the .js). It will use rewire to patch the webpack config
 * used and then run the rest of the script.
 */

const rewire = require('rewire');
const fs = require("fs");

/** Script we're patching config for */
const scriptName = process.argv[2];
/** Load the script via rewire */
const script = rewire(`react-scripts/scripts/${scriptName}.js`);

/* The react-scripts use a configFactory function to generate a webpack config,
 * but when this is called varies between scripts.
 *
 * For start it's only called after a couple of promises have resolved (brower
 * and port checks) whereas in build it's called immediately at the top level
 * with `const config = configFactory('production')`;
 *
 * We always patch the factory but if we find a top-level config property we
 * also patch that by calling the factory manually. This seems the most
 * future-proof solution.
 */

// Get the existing factory function
const webpackConfigFactory = script.__get__("configFactory");

/**
 * Replacement configFactory() function that modifies the config returned by the
 * original
 * 
 * @param {string} webpackEnv Env, passed to original configFactory. One of
 *  'development' or 'production'.
 * @returns A webpack config, modified as we desire
 */
const rewrittenConfigFactory = function(webpackEnv) {
    // Get what the original produces
    var config = webpackConfigFactory(webpackEnv);

    // If you want to reuse this, replace the rest of this function with your
    // own mutation rules.

    // Modify the module.rules[] array to insert our own rule for assets
    // The default rules array has one optional element then a oneOf: entry
    // to handle most file types. The latter is what we want to patch so find
    // out where it is in the array
    const which = config.module.rules[0].oneOf ? 0 : 1;
    // Insert our new rule at the top of the array so it's processed first
    config.module.rules[which].oneOf.unshift(
        // Anything in the src/res/ folder gets
        // a) treated as an asset (not parsed as JSON)
        // b) predictable filenames so the JSON can refer to the PNG
        {
            test: [/\/res\/.*/],
            type: 'asset',
            parser: {
                dataUrlCondition: {
                //   maxSize: webpackConfigFactory.__get__("imageInlineSizeLimit"),
                    maxSize: 10000
                },
            },
            generator: {
                filename: 'static/media/[name][ext]'
            }
        }
  );

  // Return the mutated config
  return config;
}
// Patch the configFactory in our target script
script.__set__("configFactory", rewrittenConfigFactory);
// If config has already been stored at the top level, patch that too
if(script.__get__("config")) {
    script.__set__("config", rewrittenConfigFactory(script.__get__("config").mode));
}