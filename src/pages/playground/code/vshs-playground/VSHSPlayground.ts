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

    override setGrid() {
        this.host.style.setProperty('grid', '1fr 1fr / 1fr 1fr');
    }

    override async generateIFrameContent() {

        const codes = this.getAllCodes();

        if( this.host.hasAttribute("brython") ) {

            let code = codes["index.bry"];

            codes["index.js"] = `const $B = globalThis.__BRYTHON__;

const result = $B.runPythonSource(\\\`${code}\\\`);

const imported = [...Object.values(__BRYTHON__.imported)];
const last = imported[imported.length-1];

export default last.RequestHandler;
`;

            let request = codes["request.bry"];
            codes["request.js"] = `const $B = globalThis.__BRYTHON__;
            
const result = $B.runPythonSource(\`${request}\`);`;

        }

        const blob = new Blob([codes["index.js"]], {type: "application/javascript"});
        
        //const rule = (await import( /* webpackIgnore: true */ URL.createObjectURL(blob) )).default;
        /*
        const config = JSON.parse(codes["index.json"]);

        const server = config.server ?? "http://fake.server/";

        const reg = path2regex(config.route);
        const vars = match(reg, config.query.url);
        
        let result = rule({
            body : config.query.body,
            url  : new URL( encodeURI(config.query.url), server),
            route: config.route,
            route_vars: vars
        }); //TODO: args

        if( typeof result !== "string") {

            if( result !== undefined && "$strings" in result)
                result = result.$strings;

            result = JSON.stringify(result, null, 4);
            result = new Blob([result], {type: "application/json"});
        }*/

        const js = "";

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

                const fetch = window.fetch = async function( url, args ) {
                    // build Request.
                    const request = new Request(url, args)

                    return handler( request );
                }
                
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