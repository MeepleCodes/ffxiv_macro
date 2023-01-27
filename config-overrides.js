const {
    override,
    addWebpackModuleRule,
    useBabelRc
  } = require("customize-cra");
module.exports = override(
    // Anything in the src/res/ folder gets
    // a) treated as an asset (not parsed as JSON)
    // b) predictable filenames so the JSON can refer to the PNG
    addWebpackModuleRule({
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
    }),
    useBabelRc()
);