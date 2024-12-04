export async function test(test_name, request, expected_response) {
    Deno.test(test_name, { sanitizeResources: false }, async () => {
        if (typeof request === "string")
            request = new Request(encodeURI(request));
        for (let use_brython of ["true", "false"]) {
            const r = request.clone();
            r.headers.set("use-brython", use_brython);
            await assertResponse(await fetch(r), expected_response);
        }
    });
}
function uint_equals(a, b) {
    if (b.byteLength !== b.byteLength)
        return false;
    for (let i = 0; i < a.byteLength; ++i)
        if (a.at(i) !== b.at(i))
            return false;
    return true;
}
export async function assertResponse(response, { status = 200, body = null, mime = null, }) {
    if (response.status !== status)
        throw new Error(`\x1b[1;31mWrong status code:\x1b[0m
\x1b[1;31m- ${response.status}\x1b[0m
\x1b[1;32m+ ${status}\x1b[0m`);
    let rep_mime = response.headers.get('Content-Type');
    if (mime === null && rep_mime === "application/octet-stream")
        rep_mime = null;
    if (rep_mime !== mime)
        throw new Error(`\x1b[1;31mWrong mime-type:\x1b[0m
\x1b[1;31m- ${rep_mime}\x1b[0m
\x1b[1;32m+ ${mime}\x1b[0m`);
    if (body instanceof Uint8Array) {
        // @ts-ignore
        const rep = new Uint8Array(await response.bytes());
        if (!uint_equals(body, rep))
            throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
    }
    else {
        const rep_text = await response.text();
        if (rep_text !== body)
            throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep_text}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
    }
}
export function rootDir() {
    return Deno.cwd();
}
export default async function startHTTPServer({ port = 8080, hostname = "localhost", routes = "/routes", static: _static, logger = () => { } }) {
    let routesHandlers = routes;
    if (typeof routes === "string") {
        if (routes[0] === "/")
            routes = rootDir() + routes;
        routesHandlers = await loadAllRoutesHandlers(routes);
    }
    if (_static?.[0] === "/")
        _static = rootDir() + _static;
    const requestHandler = buildRequestHandler(routesHandlers, _static, logger);
    // https://docs.deno.com/runtime/tutorials/http_server
    await Deno.serve({ port, hostname }, requestHandler).finished;
}
export class HTTPError extends Error {
    #error_code;
    constructor(http_error_code, message) {
        super(message);
        this.name = "HTTPError";
        this.#error_code = http_error_code;
    }
    get error_code() {
        return this.#error_code;
    }
}
export class SSEResponse {
    #controller;
    #stream = new ReadableStream({
        start: (controller) => {
            this.#controller = controller;
        },
        cancel: () => {
            this.onConnectionClosed?.();
        }
    });
    onConnectionClosed = null;
    constructor(run) {
        run(this);
    }
    get _body() {
        return this.#stream;
    }
    async send(data, event) {
        // JSON.stringify is required to escape characters.
        let text = `data: ${JSON.stringify(data)}\n\n`;
        if (event !== undefined)
            text = `event: ${event}\n${text}`;
        this.#controller?.enqueue(new TextEncoder().encode(text));
    }
}
let brython = null;
async function load_brython() {
    if (brython !== null)
        return;
    //brython = await (await fetch( "https://cdnjs.cloudflare.com/ajax/libs/brython/3.13.0/brython.min.js" )).text();
    const dir = import.meta.url.slice(6, import.meta.url.lastIndexOf('/'));
    brython = await Deno.readTextFile(dir + '/brython.js');
    // @ts-ignore
    window.__BRYTHON__ = {}; // why is it required ???
    eval(brython);
}
async function loadAllRoutesHandlers(routes) {
    const ROOT = rootDir();
    let routes_uri = await getAllRoutes(routes);
    //TODO: other examples
    routes_uri = routes_uri.filter(e => e.includes("Hello World"));
    const handlers = await Promise.all(routes_uri.map(async (uri) => {
        // only with imports map, but bugged
        // https://github.com/denoland/deno/issues/22237
        //if( uri.startsWith(ROOT) )
        //	uri = uri.slice(ROOT.length)
        /*if( uri[1] === ':' ) // windows drive
            uri = `file://${uri}`;*/
        const is_brython = uri.endsWith('.bry');
        let module;
        try {
            let code = await Deno.readTextFile(uri);
            if (is_brython) {
                await load_brython();
                //TODO: duplicated code with playground... (! \` vs \\\`).
                code = `const $B = globalThis.__BRYTHON__;

				$B.runPythonSource(\`${code}\`, "_");

				const module = $B.imported["_"];
				const fct    = $B.pyobj2jsobj(module.RequestHandler);

				export default fct;
				`;
                //TODO load __BRYTHON__...
            }
            const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
            //TODO Brython switch...
            module = await import(url);
        }
        catch (e) {
            console.error(e);
        }
        let ext = is_brython ? ".bry" : ".ts";
        let route = uri.slice(routes.length, -ext.length);
        //TODO: get real method
        if (route.endsWith('index'))
            route = route.slice(0, -'index'.length) + 'GET';
        const handler = module.default;
        return [route, handler, is_brython];
    }));
    return handlers;
}
async function getAllRoutes(currentPath) {
    const files = [];
    for await (const dirEntry of Deno.readDir(currentPath)) {
        const entryPath = `${currentPath}/${dirEntry.name}`;
        if (!dirEntry.isDirectory) {
            if (!["test.ts", "request.bry", "request.js"].includes(dirEntry.name))
                files.push(entryPath);
        }
        else
            files.push(...await getAllRoutes(entryPath));
    }
    return files;
}
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PATCH, PUT, OPTIONS, DELETE",
    "Access-Control-Allow-Headers": "use-brython"
};
async function buildAnswer(http_code, response, mime = null) {
    const headers = { ...CORS_HEADERS };
    if (response instanceof Response) {
        return new Response(response.body, {
            status: http_code,
            headers: { ...headers, ...response.headers }
        });
    }
    switch (true) {
        case response === null || response === undefined:
            response = null;
            mime = null;
            break;
        case response instanceof SSEResponse:
            response = response._body;
            mime = "text/event-stream";
            break;
        case typeof response === "string":
            mime ??= "text/plain";
            break;
        case response instanceof FormData:
            response = new URLSearchParams(response);
        case response instanceof URLSearchParams:
            mime = "application/x-www-form-urlencoded";
            response = response.toString();
            break;
        case response instanceof Uint8Array:
            mime ??= "application/octet-stream";
            break;
        case response instanceof Blob:
            mime ??= response.type ?? "application/octet-stream";
            response = await response.arrayBuffer();
            break;
        default:
            response = JSON.stringify(response, null, 4);
            mime = "application/json";
    }
    if (mime !== null)
        headers["content-type"] = mime;
    return new Response(response, { status: http_code,
        headers });
}
async function parseBody(request) {
    if (request.body === null)
        return null;
    let content_type = request.headers.get('Content-Type');
    if (content_type === null || content_type === 'application/octet-stream') {
        const buffer = await request.arrayBuffer();
        if (buffer.byteLength === 0)
            return null;
        return new Uint8Array(buffer);
    }
    const [mime] = content_type.split(';');
    if (["text/plain", "application/json", "application/x-www-form-urlencoded"].includes(mime)) {
        const text = await request.text();
        if (text === "")
            return null;
        try {
            return JSON.parse(text);
        }
        catch (e) {
            if (mime === "application/json")
                throw e;
            if (mime === "application/x-www-form-urlencoded")
                return Object.fromEntries(new URLSearchParams(text).entries());
            return text;
        }
    }
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength === 0)
        return null;
    return new Blob([buffer], { type: mime });
}
import { mimelite } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
function buildRequestHandler(routes, _static, logger) {
    const regexes = routes.map(([uri, handler, is_bry]) => [path2regex(uri), handler, uri, is_bry]);
    return async function (request, connInfo) {
        const ip = connInfo.remoteAddr.hostname;
        const url = new URL(request.url);
        let error = null;
        const method = request.method;
        try {
            if (method === "OPTIONS")
                return new Response(null, { headers: CORS_HEADERS });
            let use_brython = null;
            if (request.headers.has("use-brython"))
                use_brython = request.headers.get("use-brython") === "true";
            const route = getRouteHandler(regexes, method, url, use_brython);
            if (route === null) {
                if (_static === undefined)
                    throw new HTTPError(404, "Not found");
                let filepath = `${_static}/${url.pathname}`;
                let content;
                try {
                    const info = await Deno.stat(filepath);
                    if (info.isDirectory)
                        filepath = `${filepath}/index.html`;
                    content = await Deno.readFile(filepath);
                }
                catch (e) {
                    if (e instanceof Deno.errors.NotFound)
                        throw new HTTPError(404, "Not Found");
                    if (e instanceof Deno.errors.PermissionDenied)
                        throw new HTTPError(403, "Forbidden");
                    throw new HTTPError(500, e.message);
                }
                const parts = filepath.split('.');
                const ext = parts[parts.length - 1];
                const mime = mimelite.getType(ext) ?? "text/plain";
                return await buildAnswer(200, content, mime);
            }
            const body = await parseBody(request);
            let answer = await route.handler({ url, body, route });
            return await buildAnswer(200, answer);
        }
        catch (e) {
            error = e;
            let error_code = 500;
            if (e instanceof HTTPError)
                error_code = e.error_code;
            else
                console.error(e);
            const error_url = new URL(`/errors/${error_code}`, url);
            const route = getRouteHandler(regexes, "GET", error_url);
            let answer = e.message;
            if (route !== null) {
                try {
                    answer = await route.handler({ url, body: e.message, route });
                }
                catch (e) {
                    console.error(e); // errors handlers shoudn't raise errors...
                }
            }
            return await buildAnswer(error_code, answer);
        }
        finally {
            if (logger !== undefined)
                logger(ip, method, url, error);
        }
    };
}
// tests
export function path2regex(path) {
    // Escape special characters.
    // cf https://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
    path = path.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    return new RegExp("^" + path.replace(/\\\{[^\}]+\\\}/g, (captured) => `(?<${captured.slice(2, -2)}>[^/]+)`) + "$");
}
export function match(regex, uri) {
    let result = regex.exec(uri);
    if (result === null)
        return false;
    return result.groups ?? {};
}
function getRouteHandler(regexes, method, url, use_brython = null) {
    let curRoute = `${decodeURI(url.pathname)}/${method}`;
    for (let route of regexes) {
        if (use_brython !== null && route[3] !== use_brython)
            continue;
        var vars = match(route[0], curRoute);
        if (vars !== false)
            return {
                handler: route[1],
                path: route[2],
                vars
            };
    }
    return null;
}
//# sourceMappingURL=index.js.map