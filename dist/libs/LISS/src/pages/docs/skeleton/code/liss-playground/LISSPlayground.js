import LISS from "../../../../../index";
import PlaygroundArea, { rootdir } from "../playground-area/PlaygroundArea";
const resources = [{
        file: 'index.html',
        lang: 'html',
        title: 'WebComponent HTML'
    }, {
        file: 'index.js',
        lang: 'js',
        title: 'WebComponent JS'
    }, {
        file: 'index.bry',
        lang: 'python',
        title: 'WebComponent Brython'
    }, {
        file: 'index.css',
        lang: 'css',
        title: 'WebComponent CSS'
    }, {
        file: 'page.html',
        lang: 'html',
        title: 'WebPage HTML'
    }, {
        file: 'page.js',
        lang: 'js',
        title: 'WebPage JS'
    }, {
        file: 'page.bry',
        lang: 'python',
        title: 'WebPage Brython'
    },
];
class LISSPlayground extends LISS({ extends: PlaygroundArea }) {
    constructor() {
        super(resources);
    }
    async generateIFrameContent() {
        const codes = this.getAllCodes();
        const webcomp_name = this.host.getAttribute('name');
        let c_html = escapeStr(codes["index.html"]);
        let c_css = escapeStr(codes["index.css"]);
        let c_bry = escapeStr(codes["index.bry"]);
        let c_js = escapeStr(codes["index.js"]);
        const p_js = ""; //codes["page.js" ];
        const p_html = codes["page.html"];
        const result = `<!DOCTYPE html>
    <head>
        <style>
            body {
                margin: 0;
                background-color: white;
            }
        </style>
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/brython/3.13.0/brython.min.js"></script>
        <script type="module" defer>

            import LISS from '${rootdir}/dist/dev/index.js';

            window.LISS = LISS;

            const files = {
                "index.js"  : ${c_js},
                "index.bry" : ${c_bry},
                "index.html": ${c_html},
                "index.css" : ${c_css},
            }
            
            const host = document.querySelector('[is]')?.constructor;

            await LISS.importComponent("${webcomp_name}", {
                cdir   : null, //TODO...
                brython: true, //TODO...
                host,
                files
            } );

            //await LISS.whenAllDefined();

            ${p_js}
        </script>
    </head>
    <body>
${p_html}
    </body>
</html>
`;
        return result;
    }
}
function escapeStr(data) {
    if (data === undefined || data === "")
        return undefined;
    return '"' + data.replaceAll('\n', '\\n').replaceAll('"', '\\"') + '"';
}
LISS.define('liss-playground', LISSPlayground);
//# sourceMappingURL=LISSPlayground.js.map