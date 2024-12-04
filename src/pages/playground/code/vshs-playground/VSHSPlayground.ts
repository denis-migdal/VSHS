import LISS from "../../../../../libs/LISS/src/";
import PlaygroundArea, { ASSETS } from "../../../../../libs/LISS/src/pages/docs/skeleton/code/playground-area/PlaygroundArea";

const resources = [{
        file : 'index.js',
        lang : 'js',
        title: 'Request Handler (JS)'
    },{
        file : 'index.bry',
        lang : 'python',
        title: 'Request Handler (Brython)'
    },{
        file : 'request.js',
        lang : 'js',
        title: 'Request (JS)'
    },{
        file : 'request.bry',
        lang : 'python',
        title: 'Request (Brython)'
    },
]

//TODO: move...
export function path2regex(path: string) {

	// Escape special characters.
	// cf https://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
	path = path.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

	return new RegExp("^" + path.replace(/\\\{[^\}]+\\\}/g, (captured) => `(?<${captured.slice(2,-2)}>[^/]+)`) + "$");
}

export function match(regex: RegExp, uri: string) {

	let result = regex.exec(uri);

	if(result === null)
		return false;

	return result.groups ?? {};
}

class VSHSPlayground extends LISS({extends: PlaygroundArea}) {

    constructor() {
        super(resources);
    }

    static override observedAttributes = [...PlaygroundArea.observedAttributes, "server"];

    override setGrid() {
        this.host.style.setProperty('grid', '1fr 1fr / 1fr 1fr');
    }

    override async generateIFrameContent() {

        const codes = this.getAllCodes();

        const use_brython = this.host.hasAttribute("brython");
        if( use_brython ) {

            let code = codes["index.bry"];

            codes["index.js"] = `const $B = globalThis.__BRYTHON__;

const result = $B.runPythonSource(\\\`${code}\\\`, "_");

//const imported = [...Object.values(__BRYTHON__.imported)];
//const last = imported[imported.length-1];
//export default last.RequestHandler;

const module = __BRYTHON__.imported["_"];
export default module.RequestHandler;

`;

            let request = codes["request.bry"];
            codes["request.js"] = `const $B = globalThis.__BRYTHON__;
            
const result = $B.runPythonSource(\`${request}\`);`;

        }

        /*
        const reg = path2regex(config.route);
        const vars = match(reg, config.query.url);
        */

        let fetch_override = "";
        
        const use_server = this.host.hasAttribute('server');

        const handler_code = this.resources['index.code'].ctrler!;
        handler_code.isRO = use_server;

        if( use_server )
            handler_code.reset();

        //TODO: if URL is a request...
        if( use_server )
            fetch_override = `
            const _fetch = window.fetch;        
            const fetch = window.fetch = function (url, args = {}) {
                const headers = args.headers ?? {};
                args.headers = {...headers, "use-brython": "${use_brython}"};
                return _fetch("${this.host.getAttribute('server')}" + url, args );
            }`;
        else
            fetch_override = `
                const fetch = window.fetch = async function( url, args ) {
                    //TODO: build Request.
                    const request = new Request(url, args)

                    return handler( request );
                }`;


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

                const handler_code = \`${codes['index.js']}\`;
                const blob = new Blob([handler_code], {type: "text/javascript"});
                const url = URL.createObjectURL(blob);
                const handler= (await import(url)).default;

                ${fetch_override}
                
                ${codes["request.js"]}
            </script>
        </head>
        <body></body>
    </html>
    `;
    
            return result;
    }
}

LISS.define('vshs-playground', VSHSPlayground);