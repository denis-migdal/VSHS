import LISS from "../../../../../libs/LISS/src/";
import PlaygroundArea, { ASSETS, rootdir } from "../../../../../libs/LISS/src/pages/docs/skeleton/code/playground-area/PlaygroundArea";

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

        this.host.style.setProperty('grid', 'auto / 1fr 1fr');
    }

    override async generateIFrameContent() {

        const codes = this.getAllCodes();

        const use_brython = this.host.hasAttribute("brython");
        if( use_brython ) {

            let code = codes["index.bry"];

            codes["index.js"] = `const $B = globalThis.__BRYTHON__;

const result = $B.runPythonSource(\\\`${code}\\\`, "_");

const module = __BRYTHON__.imported["_"];

const fct = __BRYTHON__.pyobj2jsobj(module.RequestHandler);
const fct2 = async (...args) => {
    try {
        const r = await fct(...args);
        if( r?.__class__?.__qualname__ === "NoneType")
            return undefined;
        return r;
    } catch(e) {
        if( ! ("$py_error" in e) )
            throw e;
        let js_error = e.args[0];

        if( ! (js_error instanceof Response) )
            js_error = new Error(js_error);

        throw js_error;
    }
}

export default fct2;

`;

            let request = codes["request.bry"];
            codes["request.js"] = `const $B = globalThis.__BRYTHON__;
            
const result = $B.runPythonSource(\`${request}\`);`;

        }
        
        let js_code = codes['index.js'];
        
        if( ! use_brython ) {
            js_code = js_code.replaceAll('`', '\\\`').replaceAll('$', '\\\$');
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

        const EventSource_override = `
            class NEventSource extends window.EventSource {
                constructor(url) {
                    super("${this.host.getAttribute('server')}" + url);
                }
            }

            const _EventSource = window.EventSource;
            const EventSource = window.EventSource = NEventSource;
        `;

        const WebSocket_override = `
class NWebSocket extends window.WebSocket {
    constructor(url) {
        super("${this.host.getAttribute('server')}" + url)
    }
}

const _WebSocket = window.WebSocket;
const WebSocket = window.WebSocket = NWebSocket;
`;

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
                    
                    const request = url instanceof Request ? url
                                                           : new Request(url, args);

                    //TODO: path + vars
                    const route = {
                        url: new URL(request.url)
                    };

                    let response;
                    try {
                        response = await handler( request, route );
                    } catch(e) {
                        if( e instanceof Response )
                            return e;

                        return new Response(e.message, {status: 500});
                    }

                    if( response === undefined)
                        response = new Response();

                    if( !response.ok && response.headers.has("location") ) {
                        response = new Response("Redirections not supported (use server in playground).", {status: 500, statusText: "Redirections not supported"})
                    }

                    return response;
                }`;

        const brython_script = `${rootdir}/brython(1)-web.js`;
        //const brython_script = "https://cdnjs.cloudflare.com/ajax/libs/brython/3.13.0/brython.min.js";

        const result = `<!DOCTYPE html>
        <head>
            <style>
                body {
                    margin: 0;
                    background-color: white;
                    white-space: pre-wrap;
                }
            </style>
            <script type="text/javascript" src="${brython_script}"></script>
            <script type="module" defer>

                import "${rootdir}/dist/dev/index.js";

                const handler_code = \`${js_code}\`;
                const blob = new Blob([handler_code], {type: "text/javascript"});
                const url = URL.createObjectURL(blob);
                const handler= (await import(url)).default;

                window.print_response = async (r) => {
                    document.body.textContent = \`\${r.status}: \${r.statusText}
\${r.headers.get("content-type")}

\${await r.text()}\`
                }

                ${EventSource_override}

                ${WebSocket_override}

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