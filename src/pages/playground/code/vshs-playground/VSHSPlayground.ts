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

        let ext = ".js";
        let code = codes['index.js'];
        if( use_brython ) {
            ext = ".bry"
            code = codes['index.bry'];
        }
        const route = code.slice(3, code.indexOf('\n') - ext.length );

        let fetch_override = "";
        
        const use_server = this.host.hasAttribute('server');

        const handler_code = this.resources['index.code'].ctrler!;
        handler_code.isRO = use_server;

        if( use_server )
            handler_code.reset();

        const server = use_server ? `"${this.host.getAttribute("server")}"`
                                  : "null";


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
                const fetch = window.fetch = async function( target, args ) {
                    
                    const request = target instanceof Request ? target
                                                              : new Request(target, args);

                    const path = "${route}";
                    const reg  = path2regex(path);

                    const url = new URL(request.url);
                    const uri = \`\${ decodeURI(url.pathname) }/\${request.method}\`
                    const vars = match(reg, uri);

                    const route = {
                        url,
                        vars,
                        path
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

                import {
                        match, path2regex,
                        getFakeEventSource,
                        getFakeWebSocket
                    } from "${rootdir}/dist/dev/index.js";

                const handler_code = \`${js_code}\`;
                const blob = new Blob([handler_code], {type: "text/javascript"});
                const url = URL.createObjectURL(blob);
                const handler= (await import(url)).default;

                window.print_response = async (r) => {
                    document.body.textContent = \`\${r.status}: \${r.statusText}
\${r.headers.get("content-type")}

\${await r.text()}\`
                }

                const EventSource = window.EventSource = getFakeEventSource(${server}, handler);
                const WebSocket   = window.WebSocket   = getFakeWebSocket  (${server}, handler);

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