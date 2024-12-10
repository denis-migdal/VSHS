#!/usr/bin/env -S deno run --allow-all --watch --check --unstable-sloppy-imports
if ("Deno" in globalThis && Deno.args.length) {
    const { parseArgs } = await import("jsr:@std/cli/parse-args");
    const args = parseArgs(Deno.args);
    /* --default	default
Route non trouvée	--not-found	not_found
Erreur non-capturée	--internal-error*/
    if (args.help) {
        console.log(`./VSHS.ts $ROUTES
	--assets        : (default undefined)
	--assets_prefix : (default "")
	--host          : (default locahost)
	--port          : (default 8080)
	--default       : (default /default)
	--not_found     : (default --default)
	--internal_error: (default --default)
	`);
        Deno.exit(0);
    }
    startHTTPServer({
        port: args.port ?? 8080,
        hostname: args.host ?? "localhost",
        routes: args._[0],
        assets: args.assets,
        assets_prefix: args.assets_prefix,
        default: args.default,
        not_found: args.not_found,
        internal_error: args.internal_error,
    });
}
export async function test(test_name, request, expected_response) {
    if (typeof request === "string")
        request = new Request(encodeURI(request));
    for (let use_brython of ["true", "false"]) {
        const lang = use_brython === "true" ? "bry" : "js";
        Deno.test(`${test_name} (${lang})`, { sanitizeResources: false }, async () => {
            const r = request.clone();
            r.headers.set("use-brython", use_brython);
            await assertResponse(await fetch(r), expected_response);
        });
    }
}
function uint_equals(a, b) {
    if (b.byteLength !== b.byteLength)
        return false;
    for (let i = 0; i < a.byteLength; ++i)
        if (a.at(i) !== b.at(i))
            return false;
    return true;
}
export async function assertResponse(response, { status = 200, body = null, mime = null, statusText = "OK" }) {
    if (response.status !== status) {
        throw new Error(`\x1b[1;31mWrong status code:\x1b[0m
\x1b[1;31m- ${response.status}\x1b[0m
\x1b[1;32m+ ${status}\x1b[0m`);
    }
    if (response.statusText !== statusText) {
        throw new Error(`\x1b[1;31mWrong status text:\x1b[0m
\x1b[1;31m- ${response.statusText}\x1b[0m
\x1b[1;32m+ ${statusText}\x1b[0m`);
    }
    let rep_mime = response.headers.get('Content-Type');
    if (mime === null && rep_mime === "application/octet-stream")
        rep_mime = null;
    if (rep_mime !== mime) {
        throw new Error(`\x1b[1;31mWrong mime-type:\x1b[0m
\x1b[1;31m- ${rep_mime}\x1b[0m
\x1b[1;32m+ ${mime}\x1b[0m`);
    }
    if (body instanceof Uint8Array) {
        const rep = new Uint8Array(await response.bytes());
        if (!uint_equals(body, rep))
            throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
    }
    else {
        const rep_text = await response.text();
        if (rep_text !== body && (body !== null || rep_text !== ""))
            throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep_text}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
    }
}
export function rootDir() {
    return Deno.cwd();
}
export default async function startHTTPServer({ port = 8080, hostname = "localhost", routes = "/routes", default: _default = "/default/GET", not_found = _default, internal_error = _default, assets, assets_prefix = "/", logger = () => { } }) {
    let routesHandlers = routes;
    if (typeof routes === "string") {
        if (routes[0] === "/")
            routes = rootDir() + routes;
        routesHandlers = await loadAllRoutesHandlers(routes);
    }
    if (assets?.[0] === "/")
        assets = rootDir() + assets;
    const requestHandler = await buildRequestHandler(routesHandlers, {
        assets,
        assets_prefix,
        logger,
        not_found,
        internal_error
    });
    // https://docs.deno.com/runtime/tutorials/http_server
    await Deno.serve({
        port,
        hostname,
    }, requestHandler).finished;
}
export class SSEWriter {
    #writer;
    constructor(writer) {
        this.#writer = writer;
    }
    sendEvent(data, name = 'message') {
        return this.#writer.write(`event: ${name}
data: ${JSON.stringify(data)}

`);
    }
    get closed() {
        return this.#writer.closed;
    }
    close() {
        return this.#writer.close();
    }
    abort() {
        return this.#writer.abort();
    }
}
// helper
export const VSHS = {
    SSEResponse: function (callback, options, ...args) {
        const { readable, writable } = new TransformStream();
        const writer = new SSEWriter(writable.getWriter());
        callback(writer, ...args).catch((e) => {
            writer.abort();
            throw e;
        });
        const stream = readable.pipeThrough(new TextEncoderStream());
        options ??= {};
        options.headers ??= {};
        if (options.headers instanceof Headers) {
            if (!options.headers.has("Content-Type"))
                options.headers.set("Content-Type", "text/event-stream");
        }
        else
            options.headers["Content-Type"] ??= "text/event-stream";
        return new Response(stream, options);
    },
    async getMime(path) {
        const pos = path.lastIndexOf('.');
        const ext = path.slice(pos + 1);
        return (await loadMime()).getType(ext) ?? "text/plain";
    },
    async fetchAsset(path) {
        if (path[0] !== "/")
            path = rootDir() + path;
        return (await Deno.open(path)).readable;
    }
};
let mimelite = null;
async function loadMime() {
    if (mimelite === null)
        mimelite = import("jsr:https://deno.land/x/mimetypes@v1.0.0/mod.ts");
    return await mimelite;
}
// @ts-ignore
globalThis.VSHS = VSHS;
let brython_loading = false;
let brython_promise = Promise.withResolvers();
async function load_brython() {
    if (brython_loading) {
        await brython_promise.promise;
        return;
    }
    brython_loading = true;
    //brython = await (await fetch( "https://cdnjs.cloudflare.com/ajax/libs/brython/3.13.0/brython.min.js" )).text();
    const file = "brython(1)";
    const dir = import.meta.url.slice(6, import.meta.url.lastIndexOf('/'));
    const brython = await Deno.readTextFile(dir + `/${file}.js`);
    // @ts-ignore
    globalThis.$B = globalThis.__BRYTHON__ = {}; // why is it required ???
    // @ts-ignore
    globalThis.inner = null;
    // @ts-ignore
    globalThis.global = {};
    // @ts-ignore
    globalThis.module = {};
    eval(brython);
    console.warn("== loaded ==");
    brython_promise.resolve();
}
async function loadAllRoutesHandlers(routes) {
    const ROOT = rootDir();
    let routes_uri = await getAllRoutes(routes);
    const handlers = await Promise.all(routes_uri.map(async (uri) => {
        // only with imports map, but bugged
        // https://github.com/denoland/deno/issues/22237
        //if( uri.startsWith(ROOT) )
        //	uri = uri.slice(ROOT.length)
        /*if( uri[1] === ':' ) // windows drive
            uri = `file://${uri}`;*/
        const is_brython = uri.endsWith('.bry');
        let ext = is_brython ? ".bry" : ".ts";
        let route = uri.slice(routes.length, -ext.length);
        let module;
        try {
            let code = await Deno.readTextFile(uri);
            if (route.endsWith('index'))
                route = code.slice(3, code.indexOf('\n') - ext.length);
            if (is_brython) {
                await load_brython();
                //TODO: duplicated code with playground... (! \` vs \\\`).
                code = `const $B = globalThis.__BRYTHON__;

				$B.runPythonSource(\`${code}\`, "_");

				const module = $B.imported["_"];
				const fct    = $B.pyobj2jsobj(module.RequestHandler);

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
            }
            const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
            module = await import(url);
        }
        catch (e) {
            console.error(e);
        }
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
    "Access-Control-Allow-Methods": "*", // POST, GET, PATCH, PUT, OPTIONS, DELETE
    "Access-Control-Allow-Headers": "*" // "use-brython"
};
function buildAnswer(response = null) {
    if (response === null)
        response = new Response(null);
    // Probably WebSocket upgrade
    if (response.status === 101)
        return response;
    if (!(response instanceof Response)) {
        console.warn(response);
        throw new Error("Request handler returned something else than a Response");
    }
    const rep_headers = new Headers(response.headers);
    for (let name in CORS_HEADERS)
        // @ts-ignore
        rep_headers.set(name, CORS_HEADERS[name]);
    const rep = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: rep_headers
    });
    return rep;
}
async function buildDefaultRoute(assets, assets_prefix = "") {
    async function default_handler(request, opts) {
        if ("error" in opts)
            return new Response(opts.error.message, { status: 500 });
        let pathname = new URL(request.url).pathname;
        if (assets === undefined) {
            let uri = pathname;
            if (uri.startsWith(assets_prefix))
                uri = uri.slice(assets_prefix.length);
            let filepath = `${assets}/${uri}`;
            try {
                const info = await Deno.stat(filepath);
                if (info.isDirectory)
                    filepath = `${filepath}/index.html`;
                const [stream, mime] = await Promise.all([VSHS.fetchAsset(filepath),
                    VSHS.getMime(filepath)]);
                return new Response(stream, { headers: { "Content-Type": mime } });
            }
            catch (e) {
                if (!(e instanceof Deno.errors.NotFound)) {
                    if (e instanceof Deno.errors.PermissionDenied)
                        return new Response(`${pathname} access denied`, { status: 403 });
                    throw e; // will be caught again.
                }
            }
        }
        return new Response(`${pathname} not found`, { status: 404 });
    }
    return {
        handler: default_handler,
        path: "/default",
        vars: {}
    };
}
async function buildRequestHandler(routes, { assets, assets_prefix, logger, not_found = "/default/GET", internal_error = "/default/GET" }) {
    const regexes = routes.map(([uri, handler, is_bry]) => [path2regex(uri), handler, uri, is_bry]);
    const default_route = await buildDefaultRoute(assets, assets_prefix);
    const not_found_route = [
        getRouteHandler(regexes, "GET", not_found, false) ?? default_route,
        getRouteHandler(regexes, "GET", not_found, true) ?? default_route
    ];
    const internal_error_route = [
        getRouteHandler(regexes, "GET", internal_error, false) ?? default_route,
        getRouteHandler(regexes, "GET", internal_error, true) ?? default_route
    ];
    return async function (request, connInfo) {
        const ip = connInfo.remoteAddr.hostname;
        const url = new URL(request.url);
        let error = null;
        const method = request.method;
        let answer;
        let use_brython = null;
        let route = null;
        try {
            if (method === "OPTIONS")
                return new Response(null, { headers: CORS_HEADERS });
            if (request.headers.has("use-brython"))
                use_brython = request.headers.get("use-brython") === "true";
            route = getRouteHandler(regexes, method, url, use_brython);
            if (route !== null) {
                answer = await route.handler(request, route);
            }
            else {
                const _route = await not_found_route[+use_brython];
                _route.route = route;
                answer = await _route.handler(request, _route);
            }
            return buildAnswer(answer);
        }
        catch (e) {
            if (!(e instanceof Response)) {
                const _route = internal_error_route[+use_brython];
                _route.route = route;
                error = _route.error = e;
                e = await _route.handler(request, _route);
            }
            return buildAnswer(e);
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
    let curRoute;
    if (typeof url === "string")
        curRoute = `${url}/${method}`;
    else
        curRoute = `${decodeURI(url.pathname)}/${method}`;
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
//# sourceMappingURL=VSHS.js.map