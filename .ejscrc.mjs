import { minify } from 'html-minifier-next';
import prettier from 'prettier';
import { parsers as htmlPlugin } from 'prettier/plugins/html';
import * as estreePlugin from 'prettier/plugins/estree';
import myapps from './scripts/myapps.json' assert { type: "json" };

/**
 * @type {import('@wcj/ejs-cli').Options}
 */
export default {
    sitemap: true,
    sitemapPrefix: "https://wangchujiang.com/filesamples/",
    homepage: "https://wangchujiang.com/filesamples/",
    globalData: {
        myapp: myapps
    },
    data: {
        "templates/audio.ejs": "./scripts/audio.json",
        "templates/video.ejs": "./scripts/video.json",
        "templates/index.ejs": "./scripts/video.json",
    },
    beforeSaveHTML: async (html, output, filename) => {
        const minHTML = await minify(html, {
            collapseWhitespace: true,
            preserveLineBreaks: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeOptionalTags: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyCSS: true,
            minifyJS: true,
        });
        let plugins = [htmlPlugin, estreePlugin];
        let htmlPrettier = await prettier.format(minHTML, {
            parser: "html",
            tabWidth: 2,
            printWidth: 120,
            plugins: plugins
        });
        return htmlPrettier;
    },
}