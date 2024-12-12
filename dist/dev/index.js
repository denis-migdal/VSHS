/******/ var __webpack_modules__ = ({

/***/ "./VSHS.ts":
/*!*****************!*\
  !*** ./VSHS.ts ***!
  \*****************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SSEWriter: () => (/* binding */ SSEWriter),
/* harmony export */   VSHS: () => (/* binding */ VSHS),
/* harmony export */   assertResponse: () => (/* binding */ assertResponse),
/* harmony export */   "default": () => (/* binding */ startHTTPServer),
/* harmony export */   match: () => (/* binding */ match),
/* harmony export */   path2regex: () => (/* binding */ path2regex),
/* harmony export */   rootDir: () => (/* binding */ rootDir),
/* harmony export */   test: () => (/* binding */ test)
/* harmony export */ });
//#!/usr/bin/env -S deno run --allow-all --watch --check --unstable-sloppy-imports
if ("Deno" in globalThis && Deno.args.length) {
    const { parseArgs } = await __webpack_require__.e(/*! import() */ "jsr_std_cli_parse-args").then(__webpack_require__.t.bind(__webpack_require__, /*! jsr:@std/cli/parse-args */ "jsr:@std/cli/parse-args", 23));
    const args = parseArgs(Deno.args);
    /* --default	default
Route non trouvée	--not-found	not_found
Erreur non-capturée	--internal-error*/ if (args.help) {
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
        internal_error: args.internal_error
    });
}
async function test(test_name, request, expected_response) {
    if (typeof request === "string") request = new Request(encodeURI(request));
    for (let use_brython of [
        "true",
        "false"
    ]){
        const lang = use_brython === "true" ? "bry" : "js";
        Deno.test(`${test_name} (${lang})`, {
            sanitizeResources: false
        }, async ()=>{
            const r = request.clone();
            r.headers.set("use-brython", use_brython);
            await assertResponse(await fetch(r), expected_response);
        });
    }
}
function uint_equals(a, b) {
    if (b.byteLength !== b.byteLength) return false;
    for(let i = 0; i < a.byteLength; ++i)if (a.at(i) !== b.at(i)) return false;
    return true;
}
async function assertResponse(response, { status = 200, body = null, mime = null, statusText = "OK" }) {
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
    if (mime === null && rep_mime === "application/octet-stream") rep_mime = null;
    if (rep_mime !== mime) {
        throw new Error(`\x1b[1;31mWrong mime-type:\x1b[0m
\x1b[1;31m- ${rep_mime}\x1b[0m
\x1b[1;32m+ ${mime}\x1b[0m`);
    }
    if (body instanceof Uint8Array) {
        const rep = new Uint8Array(await response.bytes());
        if (!uint_equals(body, rep)) throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
    } else {
        const rep_text = await response.text();
        if (rep_text !== body && (body !== null || rep_text !== "")) throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep_text}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
    }
}
function rootDir() {
    return Deno.cwd();
}
async function startHTTPServer({ port = 8080, hostname = "localhost", routes = "/routes", default: _default = "/default/GET", not_found = _default, internal_error = _default, assets, assets_prefix = "/", logger = ()=>{} }) {
    let routesHandlers = routes;
    if (typeof routes === "string") {
        if (routes[0] === "/") routes = rootDir() + routes;
        routesHandlers = await loadAllRoutesHandlers(routes);
    }
    if (assets?.[0] === "/") assets = rootDir() + assets;
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
        hostname
    }, requestHandler).finished;
}
class SSEWriter {
    #writer;
    constructor(writer){
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
const VSHS = {
    SSEResponse: function(callback, options, ...args) {
        const { readable, writable } = new TransformStream();
        const writer = new SSEWriter(writable.getWriter());
        callback(writer, ...args).catch((e)=>{
            writer.abort();
            throw e;
        });
        const stream = readable.pipeThrough(new TextEncoderStream());
        options ??= {};
        options.headers ??= {};
        if (options.headers instanceof Headers) {
            if (!options.headers.has("Content-Type")) options.headers.set("Content-Type", "text/event-stream");
        } else options.headers["Content-Type"] ??= "text/event-stream";
        return new Response(stream, options);
    },
    async getMime (path) {
        const pos = path.lastIndexOf('.');
        const ext = path.slice(pos + 1);
        return (await loadMime()).getType(ext) ?? "text/plain";
    },
    async fetchAsset (path) {
        if (path[0] !== "/") path = rootDir() + path;
        return (await Deno.open(path)).readable;
    }
};
let mimelite = null;
async function loadMime() {
    if (mimelite === null) mimelite = __webpack_require__.e(/*! import() */ "jsr_https_deno_land_x_mimetypes_v1_0_0_mod_ts").then(__webpack_require__.t.bind(__webpack_require__, /*! jsr:https://deno.land/x/mimetypes@v1.0.0/mod.ts */ "jsr:https://deno.land/x/mimetypes@v1.0.0/mod.ts", 23));
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
    const dir = "file:///home/demigda/Data/Recherche/Git/VSHS-TS-/VSHS.ts".slice(6, "file:///home/demigda/Data/Recherche/Git/VSHS-TS-/VSHS.ts".lastIndexOf('/'));
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
    const handlers = await Promise.all(routes_uri.map(async (uri)=>{
        // only with imports map, but bugged
        // https://github.com/denoland/deno/issues/22237
        //if( uri.startsWith(ROOT) )
        //	uri = uri.slice(ROOT.length)
        /*if( uri[1] === ':' ) // windows drive
			uri = `file://${uri}`;*/ const is_brython = uri.endsWith('.bry');
        let ext = is_brython ? ".bry" : ".ts";
        let route = uri.slice(routes.length, -ext.length);
        let module;
        try {
            let code = await Deno.readTextFile(uri);
            if (route.endsWith('index')) route = code.slice(3, code.indexOf('\n') - ext.length);
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
            const url = URL.createObjectURL(new Blob([
                code
            ], {
                type: "text/javascript"
            }));
            module = await __webpack_require__("./. lazy recursive")(url);
        } catch (e) {
            console.error(e);
        }
        const handler = module.default;
        return [
            route,
            handler,
            is_brython
        ];
    }));
    return handlers;
}
async function getAllRoutes(currentPath) {
    const files = [];
    for await (const dirEntry of Deno.readDir(currentPath)){
        const entryPath = `${currentPath}/${dirEntry.name}`;
        if (!dirEntry.isDirectory) {
            if (![
                "test.ts",
                "request.bry",
                "request.js"
            ].includes(dirEntry.name)) files.push(entryPath);
        } else files.push(...await getAllRoutes(entryPath));
    }
    return files;
}
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*" // "use-brython"
};
function buildAnswer(response = null) {
    if (response === null) response = new Response(null);
    // Probably WebSocket upgrade
    if (response.status === 101) return response;
    if (!(response instanceof Response)) {
        console.warn(response);
        throw new Error("Request handler returned something else than a Response");
    }
    const rep_headers = new Headers(response.headers);
    for(let name in CORS_HEADERS)// @ts-ignore
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
        if ("error" in opts) return new Response(opts.error.message, {
            status: 500
        });
        let pathname = new URL(request.url).pathname;
        if (assets === undefined) {
            let uri = pathname;
            if (uri.startsWith(assets_prefix)) uri = uri.slice(assets_prefix.length);
            let filepath = `${assets}/${uri}`;
            try {
                const info = await Deno.stat(filepath);
                if (info.isDirectory) filepath = `${filepath}/index.html`;
                const [stream, mime] = await Promise.all([
                    VSHS.fetchAsset(filepath),
                    VSHS.getMime(filepath)
                ]);
                return new Response(stream, {
                    headers: {
                        "Content-Type": mime
                    }
                });
            } catch (e) {
                if (!(e instanceof Deno.errors.NotFound)) {
                    if (e instanceof Deno.errors.PermissionDenied) return new Response(`${pathname} access denied`, {
                        status: 403
                    });
                    throw e; // will be caught again.
                }
            }
        }
        return new Response(`${pathname} not found`, {
            status: 404
        });
    }
    return {
        handler: default_handler,
        path: "/default",
        vars: {}
    };
}
async function buildRequestHandler(routes, { assets, assets_prefix, logger, not_found = "/default/GET", internal_error = "/default/GET" }) {
    const regexes = routes.map(([uri, handler, is_bry])=>[
            path2regex(uri),
            handler,
            uri,
            is_bry
        ]);
    const default_route = await buildDefaultRoute(assets, assets_prefix);
    const not_found_route = [
        getRouteHandler(regexes, "GET", not_found, false) ?? default_route,
        getRouteHandler(regexes, "GET", not_found, true) ?? default_route
    ];
    const internal_error_route = [
        getRouteHandler(regexes, "GET", internal_error, false) ?? default_route,
        getRouteHandler(regexes, "GET", internal_error, true) ?? default_route
    ];
    return async function(request, connInfo) {
        const ip = connInfo.remoteAddr.hostname;
        const url = new URL(request.url);
        let error = null;
        const method = request.method;
        let answer;
        let use_brython = null;
        let route = null;
        try {
            if (method === "OPTIONS") return new Response(null, {
                headers: CORS_HEADERS
            });
            if (request.headers.has("use-brython")) use_brython = request.headers.get("use-brython") === "true";
            route = getRouteHandler(regexes, method, url, use_brython);
            if (route !== null) {
                answer = await route.handler(request, route);
            } else {
                const _route = await not_found_route[+use_brython];
                _route.route = route;
                answer = await _route.handler(request, _route);
            }
            return buildAnswer(answer);
        } catch (e) {
            if (!(e instanceof Response)) {
                const _route = internal_error_route[+use_brython];
                _route.route = route;
                error = _route.error = e;
                e = await _route.handler(request, _route);
            }
            return buildAnswer(e);
        } finally{
            if (logger !== undefined) logger(ip, method, url, error);
        }
    };
}
// tests
function path2regex(path) {
    // Escape special characters.
    // cf https://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
    path = path.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    return new RegExp("^" + path.replace(/\\\{[^\}]+\\\}/g, (captured)=>`(?<${captured.slice(2, -2)}>[^/]+)`) + "$");
}
function match(regex, uri) {
    let result = regex.exec(uri);
    if (result === null) return false;
    return result.groups ?? {};
}
function getRouteHandler(regexes, method, url, use_brython = null) {
    let curRoute;
    if (typeof url === "string") curRoute = `${url}/${method}`;
    else curRoute = `${decodeURI(url.pathname)}/${method}`;
    for (let route of regexes){
        if (use_brython !== null && route[3] !== use_brython) continue;
        var vars = match(route[0], curRoute);
        if (vars !== false) return {
            handler: route[1],
            path: route[2],
            vars
        };
    }
    return null;
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ }),

/***/ "./src/Fake/EventSource.ts":
/*!*********************************!*\
  !*** ./src/Fake/EventSource.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getFakeEventSource: () => (/* binding */ getFakeEventSource)
/* harmony export */ });
const EventSource = globalThis.EventSource;
function getFakeEventSource(use_server) {
    if (use_server) return class EventSourceServer extends EventSource {
        constructor(url){
            super(`${use_server}${url}`);
        }
    };
    return EventSourceFake;
}
// @ts-ignore
class EventSourceFake extends EventTarget {
    constructor(url){
        super();
        this.url = url;
        globalThis.fetch(url).then(async (response)=>{
            this.readyState = this.OPEN;
            this.dispatchEvent(new Event("open"));
            const reader = response.body.pipeThrough(new TextDecoderStream).getReader();
            let buffer = "";
            let chunk = await reader.read();
            while(!chunk.done){
                buffer += chunk.value;
                let pos = buffer.indexOf("\n\n");
                while(pos !== -1){
                    let event = buffer.slice(0, pos);
                    const data = Object.fromEntries(event.split("\n").map((l)=>l.split(": ")));
                    data.event ??= "message";
                    this.dispatchEvent(new MessageEvent(data.event, {
                        data: data.data
                    }));
                    buffer = buffer.slice(pos + 2);
                    pos = buffer.indexOf("\n\n");
                }
                chunk = await reader.read();
            }
        });
    }
    onerror = null;
    onmessage = null;
    onopen = null;
    close() {
        this.readyState = this.CLOSED;
    }
    readyState = 0;
    CONNECTING = 0;
    OPEN = 1;
    CLOSED = 2;
    // not implemented
    url;
    withCredentials = false;
}


/***/ }),

/***/ "./src/Fake/WebSocket.ts":
/*!*******************************!*\
  !*** ./src/Fake/WebSocket.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getFakeWebSocket: () => (/* binding */ getFakeWebSocket)
/* harmony export */ });
const WebSocket = globalThis.WebSocket;
function getFakeWebSocket(use_server) {
    if (use_server) return class WebSocketServer extends WebSocket {
        constructor(url){
            super(`${use_server}${url}`);
        }
    };
    return WebSocketFake;
}
globalThis.Deno = {
    upgradeWebSocket: function(request) {
        const socket = new WebSocketFake(null);
        const response = new Response();
        response.websocket = socket;
        return {
            socket,
            response
        };
    }
};
//TODO implemente Deno.upgrade => return fake Response + ServerWebSocket...
class WebSocketFake extends EventTarget {
    other = null;
    constructor(url){
        super();
        if (url === null) return;
        this.url = url;
        globalThis.fetch(url).then(async (response)=>{
            this.other = response.websocket;
            this.other.other = this;
            this.readyState = this.OPEN;
            this.dispatchEvent(new Event("open"));
            this.other.dispatchEvent(new Event("open"));
        });
    }
    close(code, reason) {
        this.readyState = this.CLOSED;
        let event = {};
        if (code !== undefined) event.code = code;
        if (reason !== undefined) event.reason = reason;
        this.other.dispatchEvent(new CloseEvent("close", event));
        this.dispatchEvent(new CloseEvent("close", event));
    }
    send(data) {
        this.other.dispatchEvent(new MessageEvent("message", {
            data
        }));
    }
    url = "";
    onclose = null;
    onerror = null;
    onmessage = null;
    onopen = null;
    readyState = 0;
    CONNECTING = 0;
    OPEN = 1;
    CLOSING = 2;
    CLOSED = 3;
    // not implemented
    binaryType = "arraybuffer";
    bufferedAmount = 0;
    extensions = "";
    protocol = "";
}


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getFakeEventSource: () => (/* reexport safe */ _Fake_EventSource__WEBPACK_IMPORTED_MODULE_1__.getFakeEventSource),
/* harmony export */   getFakeWebSocket: () => (/* reexport safe */ _Fake_WebSocket__WEBPACK_IMPORTED_MODULE_2__.getFakeWebSocket),
/* harmony export */   match: () => (/* reexport safe */ _VSHS__WEBPACK_IMPORTED_MODULE_0__.match),
/* harmony export */   path2regex: () => (/* reexport safe */ _VSHS__WEBPACK_IMPORTED_MODULE_0__.path2regex)
/* harmony export */ });
/* harmony import */ var _VSHS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../VSHS */ "./VSHS.ts");
/* harmony import */ var _Fake_EventSource__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Fake/EventSource */ "./src/Fake/EventSource.ts");
/* harmony import */ var _Fake_WebSocket__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Fake/WebSocket */ "./src/Fake/WebSocket.ts");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_VSHS__WEBPACK_IMPORTED_MODULE_0__]);
_VSHS__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];




__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./. lazy recursive":
/*!**********************************!*\
  !*** ././ lazy namespace object ***!
  \**********************************/
/***/ ((module) => {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(() => {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = () => ([]);
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./. lazy recursive";
module.exports = webpackEmptyAsyncContext;

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/******/ // expose the modules object (__webpack_modules__)
/******/ __webpack_require__.m = __webpack_modules__;
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/async module */
/******/ (() => {
/******/ 	var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 	var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 	var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 	var resolveQueue = (queue) => {
/******/ 		if(queue && queue.d < 1) {
/******/ 			queue.d = 1;
/******/ 			queue.forEach((fn) => (fn.r--));
/******/ 			queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 		}
/******/ 	}
/******/ 	var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 		if(dep !== null && typeof dep === "object") {
/******/ 			if(dep[webpackQueues]) return dep;
/******/ 			if(dep.then) {
/******/ 				var queue = [];
/******/ 				queue.d = 0;
/******/ 				dep.then((r) => {
/******/ 					obj[webpackExports] = r;
/******/ 					resolveQueue(queue);
/******/ 				}, (e) => {
/******/ 					obj[webpackError] = e;
/******/ 					resolveQueue(queue);
/******/ 				});
/******/ 				var obj = {};
/******/ 				obj[webpackQueues] = (fn) => (fn(queue));
/******/ 				return obj;
/******/ 			}
/******/ 		}
/******/ 		var ret = {};
/******/ 		ret[webpackQueues] = x => {};
/******/ 		ret[webpackExports] = dep;
/******/ 		return ret;
/******/ 	}));
/******/ 	__webpack_require__.a = (module, body, hasAwait) => {
/******/ 		var queue;
/******/ 		hasAwait && ((queue = []).d = -1);
/******/ 		var depQueues = new Set();
/******/ 		var exports = module.exports;
/******/ 		var currentDeps;
/******/ 		var outerResolve;
/******/ 		var reject;
/******/ 		var promise = new Promise((resolve, rej) => {
/******/ 			reject = rej;
/******/ 			outerResolve = resolve;
/******/ 		});
/******/ 		promise[webpackExports] = exports;
/******/ 		promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 		module.exports = promise;
/******/ 		body((deps) => {
/******/ 			currentDeps = wrapDeps(deps);
/******/ 			var fn;
/******/ 			var getResult = () => (currentDeps.map((d) => {
/******/ 				if(d[webpackError]) throw d[webpackError];
/******/ 				return d[webpackExports];
/******/ 			}))
/******/ 			var promise = new Promise((resolve) => {
/******/ 				fn = () => (resolve(getResult));
/******/ 				fn.r = 0;
/******/ 				var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 				currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 			});
/******/ 			return fn.r ? promise : getResult();
/******/ 		}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 		queue && queue.d < 0 && (queue.d = 0);
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/create fake namespace object */
/******/ (() => {
/******/ 	var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 	var leafPrototypes;
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 16: return value when it's Promise-like
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = this(value);
/******/ 		if(mode & 8) return value;
/******/ 		if(typeof value === 'object' && value) {
/******/ 			if((mode & 4) && value.__esModule) return value;
/******/ 			if((mode & 16) && typeof value.then === 'function') return value;
/******/ 		}
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		var def = {};
/******/ 		leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 		for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 			Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 		}
/******/ 		def['default'] = () => (value);
/******/ 		__webpack_require__.d(ns, def);
/******/ 		return ns;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/ensure chunk */
/******/ (() => {
/******/ 	__webpack_require__.f = {};
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = (chunkId) => {
/******/ 		return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 			__webpack_require__.f[key](chunkId, promises);
/******/ 			return promises;
/******/ 		}, []));
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/get javascript chunk filename */
/******/ (() => {
/******/ 	// This function allow to reference async chunks
/******/ 	__webpack_require__.u = (chunkId) => {
/******/ 		// return url for filenames based on template
/******/ 		return "" + chunkId + ".mjs";
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/get mini-css chunk filename */
/******/ (() => {
/******/ 	// This function allow to reference async chunks
/******/ 	__webpack_require__.miniCssF = (chunkId) => {
/******/ 		// return url for filenames based on template
/******/ 		return undefined;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/publicPath */
/******/ (() => {
/******/ 	__webpack_require__.p = "";
/******/ })();
/******/ 
/******/ /* webpack/runtime/import chunk loading */
/******/ (() => {
/******/ 	// no baseURI
/******/ 	
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// [resolve, Promise] = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"main": 0
/******/ 	};
/******/ 	
/******/ 	var installChunk = (data) => {
/******/ 		var {ids, modules, runtime} = data;
/******/ 		// add "modules" to the modules object,
/******/ 		// then flag all "ids" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0;
/******/ 		for(moduleId in modules) {
/******/ 			if(__webpack_require__.o(modules, moduleId)) {
/******/ 				__webpack_require__.m[moduleId] = modules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(runtime) runtime(__webpack_require__);
/******/ 		for(;i < ids.length; i++) {
/******/ 			chunkId = ids[i];
/******/ 			if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				installedChunks[chunkId][0]();
/******/ 			}
/******/ 			installedChunks[ids[i]] = 0;
/******/ 		}
/******/ 	
/******/ 	}
/******/ 	
/******/ 	__webpack_require__.f.j = (chunkId, promises) => {
/******/ 			// import() chunk loading for javascript
/******/ 			var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 			if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 	
/******/ 				// a Promise means "currently loading".
/******/ 				if(installedChunkData) {
/******/ 					promises.push(installedChunkData[1]);
/******/ 				} else {
/******/ 					if(true) { // all chunks have JS
/******/ 						// setup Promise in chunk cache
/******/ 						var promise = import("../" + __webpack_require__.u(chunkId)).then(installChunk, (e) => {
/******/ 							if(installedChunks[chunkId] !== 0) installedChunks[chunkId] = undefined;
/******/ 							throw e;
/******/ 						});
/******/ 						var promise = Promise.race([promise, new Promise((resolve) => (installedChunkData = installedChunks[chunkId] = [resolve]))])
/******/ 						promises.push(installedChunkData[1] = promise);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 	};
/******/ 	
/******/ 	// no prefetching
/******/ 	
/******/ 	// no preloaded
/******/ 	
/******/ 	// no external install chunk
/******/ 	
/******/ 	// no on chunks loaded
/******/ })();
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module used 'module' so it can't be inlined
/******/ var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ __webpack_exports__ = await __webpack_exports__;
/******/ var __webpack_exports__getFakeEventSource = __webpack_exports__.getFakeEventSource;
/******/ var __webpack_exports__getFakeWebSocket = __webpack_exports__.getFakeWebSocket;
/******/ var __webpack_exports__match = __webpack_exports__.match;
/******/ var __webpack_exports__path2regex = __webpack_exports__.path2regex;
/******/ export { __webpack_exports__getFakeEventSource as getFakeEventSource, __webpack_exports__getFakeWebSocket as getFakeWebSocket, __webpack_exports__match as match, __webpack_exports__path2regex as path2regex };
/******/ 

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO1VBQ0E7VUFDQTtVQUNBLE1BQU0sZ0JBQWdCO1VBQ3RCO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQSxpQ0FBaUM7O1VBRWpDO1VBQ0E7VUFDQTtVQUNBLEtBQUs7VUFDTCxlQUFlO1VBQ2Y7VUFDQTtVQUNBO1VBQ0E7VUFDQSxNQUFNO1VBQ047VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBOztVQUVBOztVQUVBOztVQUVBOzs7OztTRTFEQTtTQUNBO1NBQ0E7U0FDQSIsInNvdXJjZXMiOlsid2VicGFjazovL1ZTSFMvLi9WU0hTLnRzIiwid2VicGFjazovL1ZTSFMvLi9zcmMvRmFrZS9FdmVudFNvdXJjZS50cyIsIndlYnBhY2s6Ly9WU0hTLy4vc3JjL0Zha2UvV2ViU29ja2V0LnRzIiwid2VicGFjazovL1ZTSFMvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vVlNIUy8uLy4vIGxhenkgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2FzeW5jIG1vZHVsZSIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9jcmVhdGUgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2Vuc3VyZSBjaHVuayIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9nZXQgbWluaS1jc3MgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2ltcG9ydCBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiAtUyBkZW5vIHJ1biAtLWFsbG93LWFsbCAtLXdhdGNoIC0tY2hlY2sgLS11bnN0YWJsZS1zbG9wcHktaW1wb3J0c1xuXG5pZiggXCJEZW5vXCIgaW4gZ2xvYmFsVGhpcyAmJiBEZW5vLmFyZ3MubGVuZ3RoICkge1xuXG5cdGNvbnN0IHtwYXJzZUFyZ3N9ID0gYXdhaXQgaW1wb3J0KFwianNyOkBzdGQvY2xpL3BhcnNlLWFyZ3NcIik7XG5cblx0Y29uc3QgYXJncyA9IHBhcnNlQXJncyhEZW5vLmFyZ3MpXG5cblx0LyogLS1kZWZhdWx0XHRkZWZhdWx0XG5Sb3V0ZSBub24gdHJvdXbDqWVcdC0tbm90LWZvdW5kXHRub3RfZm91bmRcbkVycmV1ciBub24tY2FwdHVyw6llXHQtLWludGVybmFsLWVycm9yKi9cblxuXHRpZiggYXJncy5oZWxwICkge1xuXHRcdGNvbnNvbGUubG9nKGAuL1ZTSFMudHMgJFJPVVRFU1xuXHQtLWFzc2V0cyAgICAgICAgOiAoZGVmYXVsdCB1bmRlZmluZWQpXG5cdC0tYXNzZXRzX3ByZWZpeCA6IChkZWZhdWx0IFwiXCIpXG5cdC0taG9zdCAgICAgICAgICA6IChkZWZhdWx0IGxvY2Fob3N0KVxuXHQtLXBvcnQgICAgICAgICAgOiAoZGVmYXVsdCA4MDgwKVxuXHQtLWRlZmF1bHQgICAgICAgOiAoZGVmYXVsdCAvZGVmYXVsdClcblx0LS1ub3RfZm91bmQgICAgIDogKGRlZmF1bHQgLS1kZWZhdWx0KVxuXHQtLWludGVybmFsX2Vycm9yOiAoZGVmYXVsdCAtLWRlZmF1bHQpXG5cdGApXG5cdFx0RGVuby5leGl0KDApO1xuXHR9XG5cblx0c3RhcnRIVFRQU2VydmVyKHtcblx0XHRwb3J0ICAgICAgICAgIDogYXJncy5wb3J0ID8/IDgwODAsXG5cdFx0aG9zdG5hbWUgICAgICA6IGFyZ3MuaG9zdCA/PyBcImxvY2FsaG9zdFwiLFxuXHRcdHJvdXRlcyAgICAgICAgOiBhcmdzLl9bMF0gYXMgc3RyaW5nLFxuXHRcdGFzc2V0cyAgICAgICAgOiBhcmdzLmFzc2V0cyxcblx0XHRhc3NldHNfcHJlZml4IDogYXJncy5hc3NldHNfcHJlZml4LFxuXHRcdGRlZmF1bHQgICAgICAgOiBhcmdzLmRlZmF1bHQsXG5cdFx0bm90X2ZvdW5kICAgICA6IGFyZ3Mubm90X2ZvdW5kLFxuXHRcdGludGVybmFsX2Vycm9yOiBhcmdzLmludGVybmFsX2Vycm9yLCBcblx0fSlcblxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxudHlwZSBMb2dnZXIgPSAoaXA6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIHVybDogVVJMLCBlcnJvcjogbnVsbHxFcnJvcikgPT4gdm9pZDtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3QoXG5cdHRlc3RfbmFtZSAgOiBzdHJpbmcsXG5cdHJlcXVlc3QgICAgOiBSZXF1ZXN0fHN0cmluZyxcblx0ZXhwZWN0ZWRfcmVzcG9uc2U6IFBhcnRpYWw8RXhwZWN0ZWRBbnN3ZXI+XG4pIHtcblxuXHRpZih0eXBlb2YgcmVxdWVzdCA9PT0gXCJzdHJpbmdcIilcblx0XHRyZXF1ZXN0ID0gbmV3IFJlcXVlc3QoZW5jb2RlVVJJKHJlcXVlc3QpKTtcblxuXHRmb3IobGV0IHVzZV9icnl0aG9uIG9mIFtcInRydWVcIiwgXCJmYWxzZVwiXSkge1xuXHRcdGNvbnN0IGxhbmcgPSB1c2VfYnJ5dGhvbiA9PT0gXCJ0cnVlXCIgPyBcImJyeVwiIDogXCJqc1wiO1xuXHRcdERlbm8udGVzdChgJHt0ZXN0X25hbWV9ICgke2xhbmd9KWAsIHtzYW5pdGl6ZVJlc291cmNlczogZmFsc2V9LCBhc3luYygpID0+IHtcblxuXHRcdFx0Y29uc3QgciA9IHJlcXVlc3QuY2xvbmUoKTtcblx0XHRcdHIuaGVhZGVycy5zZXQoXCJ1c2UtYnJ5dGhvblwiLCB1c2VfYnJ5dGhvbik7XG5cdFx0XHRhd2FpdCBhc3NlcnRSZXNwb25zZShhd2FpdCBmZXRjaChyKSwgZXhwZWN0ZWRfcmVzcG9uc2UpO1xuXHRcdH0pO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHVpbnRfZXF1YWxzKGE6IFVpbnQ4QXJyYXksIGI6IFVpbnQ4QXJyYXkpIHtcblxuXHRpZihiLmJ5dGVMZW5ndGggIT09IGIuYnl0ZUxlbmd0aClcblx0XHRyZXR1cm4gZmFsc2U7XG5cblx0Zm9yKGxldCBpID0gMDsgaSA8IGEuYnl0ZUxlbmd0aDsgKytpKVxuXHRcdGlmKGEuYXQoaSkgIT09IGIuYXQoaSkpXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdHJldHVybiB0cnVlO1xufVxuXG50eXBlIEV4cGVjdGVkQW5zd2VyID0ge1xuXHRzdGF0dXMgICAgOiBudW1iZXIsXG5cdHN0YXR1c1RleHQ6IHN0cmluZyxcblx0Ym9keSAgOiBzdHJpbmd8VWludDhBcnJheXxudWxsLFxuXHRtaW1lICA6IHN0cmluZ3xudWxsLFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFzc2VydFJlc3BvbnNlKHJlc3BvbnNlOiBSZXNwb25zZSwge1xuXHRzdGF0dXMgPSAyMDAsXG5cdGJvZHkgICA9IG51bGwsXG5cdG1pbWUgICA9IG51bGwsXG5cdHN0YXR1c1RleHQgPSBcIk9LXCJcblxufTogUGFydGlhbDxFeHBlY3RlZEFuc3dlcj4pIHtcblxuXHRpZihyZXNwb25zZS5zdGF0dXMgIT09IHN0YXR1cykge1xuXHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBzdGF0dXMgY29kZTpcXHgxYlswbVxuXFx4MWJbMTszMW0tICR7cmVzcG9uc2Uuc3RhdHVzfVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtzdGF0dXN9XFx4MWJbMG1gKTtcblx0fVxuXG5cdGlmKHJlc3BvbnNlLnN0YXR1c1RleHQgIT09IHN0YXR1c1RleHQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFxceDFiWzE7MzFtV3Jvbmcgc3RhdHVzIHRleHQ6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9XFx4MWJbMG1cblxceDFiWzE7MzJtKyAke3N0YXR1c1RleHR9XFx4MWJbMG1gKTtcblx0fVxuXG5cdGxldCByZXBfbWltZSA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdDb250ZW50LVR5cGUnKTtcblx0aWYoIG1pbWUgPT09IG51bGwgJiYgcmVwX21pbWUgPT09IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIpXG5cdFx0cmVwX21pbWUgPSBudWxsO1xuXHRpZiggcmVwX21pbWUgIT09IG1pbWUgKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIG1pbWUtdHlwZTpcXHgxYlswbVxuXFx4MWJbMTszMW0tICR7cmVwX21pbWV9XFx4MWJbMG1cblxceDFiWzE7MzJtKyAke21pbWV9XFx4MWJbMG1gKTtcblx0XHR9XG5cblx0aWYoIGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5ICkge1xuXHRcdGNvbnN0IHJlcCA9IG5ldyBVaW50OEFycmF5KGF3YWl0IHJlc3BvbnNlLmJ5dGVzKCkpO1xuXHRcdGlmKCAhIHVpbnRfZXF1YWxzKGJvZHksIHJlcCkgKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIGJvZHk6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcH1cXHgxYlswbVxuXFx4MWJbMTszMm0rICR7Ym9keX1cXHgxYlswbWApO1xuXHR9IGVsc2Uge1xuXG5cdFx0Y29uc3QgcmVwX3RleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG5cdFx0aWYoIHJlcF90ZXh0ICE9PSBib2R5ICYmIChib2R5ICE9PSBudWxsIHx8IHJlcF90ZXh0ICE9PSBcIlwiKSApXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFxceDFiWzE7MzFtV3JvbmcgYm9keTpcXHgxYlswbVxuXFx4MWJbMTszMW0tICR7cmVwX3RleHR9XFx4MWJbMG1cblxceDFiWzE7MzJtKyAke2JvZHl9XFx4MWJbMG1gKTtcblx0fVxufVxuXG50eXBlIEhUVFBTZXJ2ZXJPcHRzID0ge1xuXHRwb3J0ICAgIDogbnVtYmVyLFxuXHRob3N0bmFtZTogc3RyaW5nLFxuXHRyb3V0ZXMgICAgICAgICA6IHN0cmluZ3xSb3V0ZXMsXG5cdGRlZmF1bHQgICAgICAgIDogc3RyaW5nLFxuXHRub3RfZm91bmQgICAgICA6IHN0cmluZyxcblx0aW50ZXJuYWxfZXJyb3IgOiBzdHJpbmcsXG5cblx0YXNzZXRzICAgICAgID86IHN0cmluZ3x1bmRlZmluZWQsXG5cdGFzc2V0c19wcmVmaXg/OiBzdHJpbmd8dW5kZWZpbmVkLFxuXHRsb2dnZXIgICAgICAgPzogTG9nZ2VyIC8vIG5vdCBkb2N1bWVudGVkXG59O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByb290RGlyKCkge1xuXHRyZXR1cm4gRGVuby5jd2QoKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gc3RhcnRIVFRQU2VydmVyKHsgcG9ydCA9IDgwODAsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRob3N0bmFtZSA9IFwibG9jYWxob3N0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyb3V0ZXMgPSBcIi9yb3V0ZXNcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHQ6IF9kZWZhdWx0ID0gXCIvZGVmYXVsdC9HRVRcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5vdF9mb3VuZCAgICAgID0gX2RlZmF1bHQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbnRlcm5hbF9lcnJvciA9IF9kZWZhdWx0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YXNzZXRzLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YXNzZXRzX3ByZWZpeCA9IFwiL1wiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bG9nZ2VyID0gKCkgPT4ge31cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9OiBIVFRQU2VydmVyT3B0cykge1xuXG5cdGxldCByb3V0ZXNIYW5kbGVyczogUm91dGVzID0gcm91dGVzIGFzIGFueTtcblx0aWYoIHR5cGVvZiByb3V0ZXMgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0aWYocm91dGVzWzBdID09PSBcIi9cIilcblx0XHRcdHJvdXRlcyA9IHJvb3REaXIoKSArIHJvdXRlcztcblx0XHRcdFxuXHRcdHJvdXRlc0hhbmRsZXJzID0gYXdhaXQgbG9hZEFsbFJvdXRlc0hhbmRsZXJzKHJvdXRlcyk7XG5cdH1cblx0XG5cdGlmKGFzc2V0cz8uWzBdID09PSBcIi9cIilcblx0XHRhc3NldHMgPSByb290RGlyKCkgKyBhc3NldHM7XG5cdFxuXHRjb25zdCByZXF1ZXN0SGFuZGxlciA9IGF3YWl0IGJ1aWxkUmVxdWVzdEhhbmRsZXIocm91dGVzSGFuZGxlcnMsIHtcblx0XHRhc3NldHMsXG5cdFx0YXNzZXRzX3ByZWZpeCxcblx0XHRsb2dnZXIsXG5cdFx0bm90X2ZvdW5kLFxuXHRcdGludGVybmFsX2Vycm9yXG5cdH0pO1xuXG5cdC8vIGh0dHBzOi8vZG9jcy5kZW5vLmNvbS9ydW50aW1lL3R1dG9yaWFscy9odHRwX3NlcnZlclxuXHRhd2FpdCBEZW5vLnNlcnZlKHtcblx0XHRwb3J0LFxuXHRcdGhvc3RuYW1lLFxuXHQgfSwgcmVxdWVzdEhhbmRsZXIpLmZpbmlzaGVkO1xufVxuXG5leHBvcnQgY2xhc3MgU1NFV3JpdGVyIHtcbiAgICAjd3JpdGVyOiBXcml0YWJsZVN0cmVhbURlZmF1bHRXcml0ZXI7XG4gICAgY29uc3RydWN0b3Iod3JpdGVyOiBXcml0YWJsZVN0cmVhbURlZmF1bHRXcml0ZXIpIHtcbiAgICAgICAgdGhpcy4jd3JpdGVyID0gd3JpdGVyO1xuICAgIH1cblxuICAgIHNlbmRFdmVudChkYXRhOiBhbnksIG5hbWUgPSAnbWVzc2FnZScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3dyaXRlci53cml0ZShcbmBldmVudDogJHtuYW1lfVxuZGF0YTogJHtKU09OLnN0cmluZ2lmeShkYXRhKX1cblxuYCk7XG4gICAgfVxuXG5cdGdldCBjbG9zZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuI3dyaXRlci5jbG9zZWQ7XG5cdH1cblxuXHRjbG9zZSgpIHtcblx0XHRyZXR1cm4gdGhpcy4jd3JpdGVyLmNsb3NlKCk7XG5cdH1cblxuXHRhYm9ydCgpIHtcblx0XHRyZXR1cm4gdGhpcy4jd3JpdGVyLmFib3J0KCk7XG5cdH1cbn1cblxuLy8gaGVscGVyXG5leHBvcnQgY29uc3QgVlNIUyA9IHtcblx0U1NFUmVzcG9uc2U6IGZ1bmN0aW9uPFQgZXh0ZW5kcyBhbnlbXT4oY2FsbGJhY2s6ICh3cml0ZXI6IFNTRVdyaXRlciwgLi4uYXJnczogVCkgPT4gUHJvbWlzZTx2b2lkPixcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICAgb3B0aW9uczogUmVzcG9uc2VJbml0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQgICAuLi5hcmdzOiBUKSB7XG5cdFx0Y29uc3Qge3JlYWRhYmxlLCB3cml0YWJsZX0gPSBuZXcgVHJhbnNmb3JtU3RyZWFtKCk7XG5cblx0XHRjb25zdCB3cml0ZXIgPSBuZXcgU1NFV3JpdGVyKHdyaXRhYmxlLmdldFdyaXRlcigpKTtcblx0XHRjYWxsYmFjayggd3JpdGVyLCAuLi5hcmdzICkuY2F0Y2goIChlKSA9PiB7XG5cdFx0XHR3cml0ZXIuYWJvcnQoKTtcblx0XHRcdHRocm93IGU7XG5cdFx0fSlcblx0XG5cdFx0Y29uc3Qgc3RyZWFtID0gcmVhZGFibGUucGlwZVRocm91Z2goIG5ldyBUZXh0RW5jb2RlclN0cmVhbSgpICk7XG5cblx0XHRvcHRpb25zPz89IHt9O1xuXHRcdG9wdGlvbnMuaGVhZGVycz8/PXt9O1xuXHRcdGlmKCBvcHRpb25zLmhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG5cdFx0XHRpZiggISBvcHRpb25zLmhlYWRlcnMuaGFzKFwiQ29udGVudC1UeXBlXCIpIClcblx0XHRcdFx0b3B0aW9ucy5oZWFkZXJzLnNldChcIkNvbnRlbnQtVHlwZVwiLCBcInRleHQvZXZlbnQtc3RyZWFtXCIpO1xuXHRcdH0gZWxzZVxuXHRcdFx0KG9wdGlvbnMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtcIkNvbnRlbnQtVHlwZVwiXSA/Pz0gXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiO1xuXG5cblx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKHN0cmVhbSwgb3B0aW9ucyk7XG5cdH0sXG5cdGFzeW5jIGdldE1pbWUocGF0aDogc3RyaW5nKSB7XG5cblx0XHRjb25zdCBwb3MgPSBwYXRoLmxhc3RJbmRleE9mKCcuJyk7XG5cdFx0Y29uc3QgZXh0ID0gcGF0aC5zbGljZShwb3MrMSk7XG5cblx0XHRyZXR1cm4gKGF3YWl0IGxvYWRNaW1lKCkpLmdldFR5cGUoZXh0KSA/PyBcInRleHQvcGxhaW5cIjtcblx0fSxcblx0YXN5bmMgZmV0Y2hBc3NldChwYXRoOiBzdHJpbmcpIHtcblxuXHRcdGlmKHBhdGhbMF0gIT09IFwiL1wiKVxuXHRcdFx0cGF0aCA9IHJvb3REaXIoKSArIHBhdGg7XG5cblx0XHRyZXR1cm4gKGF3YWl0IERlbm8ub3BlbihwYXRoKSkucmVhZGFibGU7XG5cdH1cbn07XG5cbmxldCBtaW1lbGl0ZTogYW55ID0gbnVsbDtcbmFzeW5jIGZ1bmN0aW9uIGxvYWRNaW1lKCkge1xuXHRpZiggbWltZWxpdGUgPT09IG51bGwgKVxuXHRcdG1pbWVsaXRlID0gaW1wb3J0KFwianNyOmh0dHBzOi8vZGVuby5sYW5kL3gvbWltZXR5cGVzQHYxLjAuMC9tb2QudHNcIik7XG5cdHJldHVybiBhd2FpdCBtaW1lbGl0ZTtcbn1cblxuLy8gQHRzLWlnbm9yZVxuZ2xvYmFsVGhpcy5WU0hTID0gVlNIUztcblxuZXhwb3J0IHR5cGUgSGFuZGxlclBhcmFtcyA9IFtcblx0UmVxdWVzdCwge1xuXHRcdHBhdGg6IHN0cmluZyxcblx0XHR2YXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG5cdH1cbl07XG5cbnR5cGUgSGFuZGxlciA9ICguLi5hcmdzOiBIYW5kbGVyUGFyYW1zKSA9PiBQcm9taXNlPGFueT47XG50eXBlIFJvdXRlcyAgPSAocmVhZG9ubHkgW3N0cmluZywgSGFuZGxlciwgYm9vbGVhbl0pW107XG5cbmxldCBicnl0aG9uX2xvYWRpbmcgID0gZmFsc2U7XG5sZXQgYnJ5dGhvbl9wcm9taXNlID0gUHJvbWlzZS53aXRoUmVzb2x2ZXJzPHZvaWQ+KCk7XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRfYnJ5dGhvbigpIHtcblx0aWYoIGJyeXRob25fbG9hZGluZyApIHtcblx0XHRhd2FpdCBicnl0aG9uX3Byb21pc2UucHJvbWlzZVxuXHRcdHJldHVybjtcblx0fVxuXG5cdGJyeXRob25fbG9hZGluZyA9IHRydWU7XG5cblx0Ly9icnl0aG9uID0gYXdhaXQgKGF3YWl0IGZldGNoKCBcImh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2JyeXRob24vMy4xMy4wL2JyeXRob24ubWluLmpzXCIgKSkudGV4dCgpO1xuXHRjb25zdCBmaWxlID0gXCJicnl0aG9uKDEpXCI7XG5cdGNvbnN0IGRpciA9IGltcG9ydC5tZXRhLnVybC5zbGljZSg2LCBpbXBvcnQubWV0YS51cmwubGFzdEluZGV4T2YoJy8nKSApO1xuXHRjb25zdCBicnl0aG9uID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoZGlyICsgYC8ke2ZpbGV9LmpzYCk7XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRnbG9iYWxUaGlzLiRCICA9IGdsb2JhbFRoaXMuX19CUllUSE9OX18gPSB7fTsgLy8gd2h5IGlzIGl0IHJlcXVpcmVkID8/P1xuXHQvLyBAdHMtaWdub3JlXG5cdGdsb2JhbFRoaXMuaW5uZXIgPSBudWxsO1xuXHQvLyBAdHMtaWdub3JlXG5cdGdsb2JhbFRoaXMuZ2xvYmFsID0ge307XG5cdC8vIEB0cy1pZ25vcmVcblx0Z2xvYmFsVGhpcy5tb2R1bGUgPSB7fTtcblx0ZXZhbChicnl0aG9uKTtcblxuXHRjb25zb2xlLndhcm4oXCI9PSBsb2FkZWQgPT1cIik7XG5cdGJyeXRob25fcHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRBbGxSb3V0ZXNIYW5kbGVycyhyb3V0ZXM6IHN0cmluZyk6IFByb21pc2U8Um91dGVzPiB7XG5cblx0Y29uc3QgUk9PVCA9IHJvb3REaXIoKTtcblx0bGV0IHJvdXRlc191cmkgPSBhd2FpdCBnZXRBbGxSb3V0ZXMocm91dGVzKTtcblxuXHR0eXBlIE1vZHVsZSA9IHtkZWZhdWx0OiBIYW5kbGVyfTtcblx0Y29uc3QgaGFuZGxlcnMgICA9IGF3YWl0IFByb21pc2UuYWxsKCByb3V0ZXNfdXJpLm1hcCggYXN5bmMgKHVyaSkgPT4ge1xuXG5cdFx0Ly8gb25seSB3aXRoIGltcG9ydHMgbWFwLCBidXQgYnVnZ2VkXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vaXNzdWVzLzIyMjM3XG5cdFx0Ly9pZiggdXJpLnN0YXJ0c1dpdGgoUk9PVCkgKVxuXHRcdC8vXHR1cmkgPSB1cmkuc2xpY2UoUk9PVC5sZW5ndGgpXG5cblx0XHQvKmlmKCB1cmlbMV0gPT09ICc6JyApIC8vIHdpbmRvd3MgZHJpdmVcblx0XHRcdHVyaSA9IGBmaWxlOi8vJHt1cml9YDsqL1xuXG5cdFx0Y29uc3QgaXNfYnJ5dGhvbiA9IHVyaS5lbmRzV2l0aCgnLmJyeScpO1xuXHRcdGxldCBleHQgPSBpc19icnl0aG9uID8gXCIuYnJ5XCIgOiBcIi50c1wiXG5cdFx0bGV0IHJvdXRlID0gdXJpLnNsaWNlKHJvdXRlcy5sZW5ndGgsIC0gZXh0Lmxlbmd0aCk7XG5cblx0XHRsZXQgbW9kdWxlITogTW9kdWxlO1xuXHRcdHRyeXtcblxuXHRcdFx0bGV0IGNvZGUgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZSh1cmkpO1xuXG5cdFx0XHRpZiggcm91dGUuZW5kc1dpdGgoJ2luZGV4JykgKVxuXHRcdFx0XHRyb3V0ZSA9IGNvZGUuc2xpY2UoMywgY29kZS5pbmRleE9mKCdcXG4nKSAtIGV4dC5sZW5ndGggKTtcblxuXHRcdFx0aWYoIGlzX2JyeXRob24gKSB7XG5cblx0XHRcdFx0YXdhaXQgbG9hZF9icnl0aG9uKCk7XG5cblx0XHRcdFx0Ly9UT0RPOiBkdXBsaWNhdGVkIGNvZGUgd2l0aCBwbGF5Z3JvdW5kLi4uICghIFxcYCB2cyBcXFxcXFxgKS5cblx0XHRcdFx0Y29kZSA9IGBjb25zdCAkQiA9IGdsb2JhbFRoaXMuX19CUllUSE9OX187XG5cblx0XHRcdFx0JEIucnVuUHl0aG9uU291cmNlKFxcYCR7Y29kZX1cXGAsIFwiX1wiKTtcblxuXHRcdFx0XHRjb25zdCBtb2R1bGUgPSAkQi5pbXBvcnRlZFtcIl9cIl07XG5cdFx0XHRcdGNvbnN0IGZjdCAgICA9ICRCLnB5b2JqMmpzb2JqKG1vZHVsZS5SZXF1ZXN0SGFuZGxlcik7XG5cblx0XHRcdFx0Y29uc3QgZmN0MiA9IGFzeW5jICguLi5hcmdzKSA9PiB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IHIgPSBhd2FpdCBmY3QoLi4uYXJncyk7XG5cdFx0XHRcdFx0XHRpZiggcj8uX19jbGFzc19fPy5fX3F1YWxuYW1lX18gPT09IFwiTm9uZVR5cGVcIilcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdHJldHVybiByO1xuXHRcdFx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHRcdFx0aWYoICEgKFwiJHB5X2Vycm9yXCIgaW4gZSkgKVxuXHRcdFx0XHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0XHRcdFx0bGV0IGpzX2Vycm9yID0gZS5hcmdzWzBdO1xuXG5cdFx0XHRcdFx0XHRpZiggISAoanNfZXJyb3IgaW5zdGFuY2VvZiBSZXNwb25zZSkgKVxuXHRcdFx0XHRcdFx0XHRqc19lcnJvciA9IG5ldyBFcnJvcihqc19lcnJvcik7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHRocm93IGpzX2Vycm9yO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV4cG9ydCBkZWZhdWx0IGZjdDI7XG5cdFx0XHRcdGA7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoIG5ldyBCbG9iKFtjb2RlXSwge3R5cGU6IFwidGV4dC9qYXZhc2NyaXB0XCJ9KSk7XG5cblx0XHRcdG1vZHVsZSA9IGF3YWl0IGltcG9ydCggdXJsICk7XG5cblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGFuZGxlcjogSGFuZGxlciA9IG1vZHVsZS5kZWZhdWx0O1xuXG5cdFx0cmV0dXJuIFtyb3V0ZSwgaGFuZGxlciwgaXNfYnJ5dGhvbl0gYXMgY29uc3Q7XG5cdH0pKTtcblxuXHRyZXR1cm4gaGFuZGxlcnM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFsbFJvdXRlcyhjdXJyZW50UGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuXG5cdGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuXG5cdGZvciBhd2FpdCAoY29uc3QgZGlyRW50cnkgb2YgRGVuby5yZWFkRGlyKGN1cnJlbnRQYXRoKSkge1xuXG5cdFx0Y29uc3QgZW50cnlQYXRoID0gYCR7Y3VycmVudFBhdGh9LyR7ZGlyRW50cnkubmFtZX1gO1xuXG5cdFx0aWYgKCAhIGRpckVudHJ5LmlzRGlyZWN0b3J5KSB7XG5cblx0XHRcdGlmKCAhIFtcInRlc3QudHNcIiwgXCJyZXF1ZXN0LmJyeVwiLCBcInJlcXVlc3QuanNcIl0uaW5jbHVkZXMoZGlyRW50cnkubmFtZSkgKVxuXHRcdFx0XHRmaWxlcy5wdXNoKCBlbnRyeVBhdGggKVxuXHRcdH0gZWxzZVxuXHRcdFx0ZmlsZXMucHVzaCguLi4gYXdhaXQgZ2V0QWxsUm91dGVzKGVudHJ5UGF0aCkpO1xuXG5cdH1cblxuXHRyZXR1cm4gZmlsZXM7XG59XG5cbnR5cGUgUkVTVF9NZXRob2RzID0gXCJQT1NUXCJ8XCJHRVRcInxcIkRFTEVURVwifFwiUFVUXCJ8XCJQQVRDSFwiO1xuXG5jb25zdCBDT1JTX0hFQURFUlMgPSB7XG5cdFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIgOiBcIipcIixcblx0XCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCI6IFwiKlwiLCAvLyBQT1NULCBHRVQsIFBBVENILCBQVVQsIE9QVElPTlMsIERFTEVURVxuXHRcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIjogXCIqXCIgIC8vIFwidXNlLWJyeXRob25cIlxufTtcblxuZnVuY3Rpb24gYnVpbGRBbnN3ZXIocmVzcG9uc2U6IFJlc3BvbnNlfG51bGwgPSBudWxsKSB7XG5cblx0aWYoIHJlc3BvbnNlID09PSBudWxsIClcblx0XHRyZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsKTtcblxuXHQvLyBQcm9iYWJseSBXZWJTb2NrZXQgdXBncmFkZVxuXHRpZiggcmVzcG9uc2Uuc3RhdHVzID09PSAxMDEpXG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXG5cdGlmKCAhIChyZXNwb25zZSBpbnN0YW5jZW9mIFJlc3BvbnNlKSApIHtcblx0XHRjb25zb2xlLndhcm4ocmVzcG9uc2UpO1xuXHRcdHRocm93IG5ldyBFcnJvcihcIlJlcXVlc3QgaGFuZGxlciByZXR1cm5lZCBzb21ldGhpbmcgZWxzZSB0aGFuIGEgUmVzcG9uc2VcIik7XG5cdH1cblxuXHRjb25zdCByZXBfaGVhZGVycyA9IG5ldyBIZWFkZXJzKHJlc3BvbnNlLmhlYWRlcnMpO1xuXG5cdGZvcihsZXQgbmFtZSBpbiBDT1JTX0hFQURFUlMpXG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdHJlcF9oZWFkZXJzLnNldChuYW1lLCBDT1JTX0hFQURFUlNbbmFtZV0pXG5cblx0Y29uc3QgcmVwID0gbmV3IFJlc3BvbnNlKCByZXNwb25zZS5ib2R5LCB7XG5cdFx0c3RhdHVzICAgIDogcmVzcG9uc2Uuc3RhdHVzLFxuXHRcdHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG5cdFx0aGVhZGVycyAgIDogcmVwX2hlYWRlcnNcblx0fSApO1xuXG5cdHJldHVybiByZXA7XG59XG5cbnR5cGUgYnVpbGRSZXF1ZXN0SGFuZGxlck9wdHMgPSB7XG5cdGFzc2V0cyAgICAgICA/OiBzdHJpbmcsXG5cdGFzc2V0c19wcmVmaXg/OiBzdHJpbmcsXG5cdGxvZ2dlcj86IExvZ2dlcixcblx0bm90X2ZvdW5kICAgICA6IHN0cmluZyxcblx0aW50ZXJuYWxfZXJyb3I6IHN0cmluZ1xufVxuXG50eXBlIERlZmF1bHRSb3V0ZU9wdHMgPSB7XG5cdHJvdXRlICAgOiBSb3V0ZXxudWxsLFxuXHRlcnJvciAgPzogRXJyb3IsXG59ICYgUm91dGU7XG5cblxuYXN5bmMgZnVuY3Rpb24gYnVpbGREZWZhdWx0Um91dGUoYXNzZXRzPzogc3RyaW5nLCBhc3NldHNfcHJlZml4OiBzdHJpbmcgPSBcIlwiKSB7XG5cblxuXG5cdGFzeW5jIGZ1bmN0aW9uIGRlZmF1bHRfaGFuZGxlcihyZXF1ZXN0OiBSZXF1ZXN0LCBvcHRzOiBEZWZhdWx0Um91dGVPcHRzKSB7XG5cblx0XHRpZiggXCJlcnJvclwiIGluIG9wdHMgKVxuXHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZShvcHRzLmVycm9yIS5tZXNzYWdlLCB7c3RhdHVzOiA1MDB9KTtcblxuXHRcdGxldCBwYXRobmFtZSA9IG5ldyBVUkwocmVxdWVzdC51cmwpLnBhdGhuYW1lO1xuXHRcdGlmKCBhc3NldHMgPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0bGV0IHVyaSA9IHBhdGhuYW1lO1xuXHRcdFx0aWYoIHVyaS5zdGFydHNXaXRoKGFzc2V0c19wcmVmaXgpIClcblx0XHRcdFx0dXJpID0gdXJpLnNsaWNlKGFzc2V0c19wcmVmaXgubGVuZ3RoKTtcblx0XHRcblx0XHRcdGxldCBmaWxlcGF0aCA9IGAke2Fzc2V0c30vJHt1cml9YDtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgaW5mbyA9IGF3YWl0IERlbm8uc3RhdChmaWxlcGF0aCk7XG5cblx0XHRcdFx0aWYoIGluZm8uaXNEaXJlY3RvcnkgKVxuXHRcdFx0XHRcdGZpbGVwYXRoID0gYCR7ZmlsZXBhdGh9L2luZGV4Lmh0bWxgO1xuXG5cdFx0XHRcdGNvbnN0IFtzdHJlYW0sIG1pbWVdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1ZTSFMuZmV0Y2hBc3NldChmaWxlcGF0aCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ICBWU0hTLmdldE1pbWUoZmlsZXBhdGgpXSk7XG5cdFx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2Uoc3RyZWFtLCB7aGVhZGVyczoge1wiQ29udGVudC1UeXBlXCI6IG1pbWV9fSk7XG5cblx0XHRcdH0gY2F0Y2goZSkge1xuXG5cdFx0XHRcdGlmKCAhIChlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpICkge1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmKCBlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuUGVybWlzc2lvbkRlbmllZCApXG5cdFx0XHRcdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKGAke3BhdGhuYW1lfSBhY2Nlc3MgZGVuaWVkYCwge3N0YXR1czogNDAzfSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dGhyb3cgZTsgLy8gd2lsbCBiZSBjYXVnaHQgYWdhaW4uXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKGAke3BhdGhuYW1lfSBub3QgZm91bmRgLCB7c3RhdHVzOiA0MDR9KTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0aGFuZGxlcjogZGVmYXVsdF9oYW5kbGVyLFxuXHRcdHBhdGggICA6IFwiL2RlZmF1bHRcIixcblx0XHR2YXJzICAgOiB7fVxuXHR9XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gYnVpbGRSZXF1ZXN0SGFuZGxlcihyb3V0ZXM6IFJvdXRlcywge1xuXHRhc3NldHMsXG5cdGFzc2V0c19wcmVmaXgsXG5cdGxvZ2dlciAsXG5cdG5vdF9mb3VuZCAgICAgID0gXCIvZGVmYXVsdC9HRVRcIixcblx0aW50ZXJuYWxfZXJyb3IgPSBcIi9kZWZhdWx0L0dFVFwiXG59OiBQYXJ0aWFsPGJ1aWxkUmVxdWVzdEhhbmRsZXJPcHRzPikge1xuXG5cdGNvbnN0IHJlZ2V4ZXMgPSByb3V0ZXMubWFwKCAoW3VyaSwgaGFuZGxlciwgaXNfYnJ5XSkgPT4gW3BhdGgycmVnZXgodXJpKSwgaGFuZGxlciwgdXJpLCBpc19icnldIGFzIGNvbnN0KTtcblxuXHRjb25zdCBkZWZhdWx0X3JvdXRlID0gYXdhaXQgYnVpbGREZWZhdWx0Um91dGUoYXNzZXRzLCBhc3NldHNfcHJlZml4KTtcblxuXHRjb25zdCBub3RfZm91bmRfcm91dGUgPSBbXG5cdFx0Z2V0Um91dGVIYW5kbGVyKHJlZ2V4ZXMsIFwiR0VUXCIsIG5vdF9mb3VuZCwgZmFsc2UpID8/IGRlZmF1bHRfcm91dGUsXG5cdFx0Z2V0Um91dGVIYW5kbGVyKHJlZ2V4ZXMsIFwiR0VUXCIsIG5vdF9mb3VuZCwgdHJ1ZSkgID8/IGRlZmF1bHRfcm91dGVcblx0XSBhcyBEZWZhdWx0Um91dGVPcHRzW107XG5cdGNvbnN0IGludGVybmFsX2Vycm9yX3JvdXRlID0gW1xuXHRcdGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBpbnRlcm5hbF9lcnJvciwgZmFsc2UpID8/IGRlZmF1bHRfcm91dGUsXG5cdFx0Z2V0Um91dGVIYW5kbGVyKHJlZ2V4ZXMsIFwiR0VUXCIsIGludGVybmFsX2Vycm9yLCB0cnVlKSAgPz8gZGVmYXVsdF9yb3V0ZVxuXHRdIGFzIERlZmF1bHRSb3V0ZU9wdHNbXTtcblxuXHRyZXR1cm4gYXN5bmMgZnVuY3Rpb24ocmVxdWVzdDogUmVxdWVzdCwgY29ubkluZm86IGFueSk6IFByb21pc2U8UmVzcG9uc2U+IHtcblxuXHRcdGNvbnN0IGlwID0gY29ubkluZm8ucmVtb3RlQWRkci5ob3N0bmFtZTtcblxuXHRcdGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuXHRcdGxldCBlcnJvciA9IG51bGw7XG5cdFx0Y29uc3QgbWV0aG9kID0gcmVxdWVzdC5tZXRob2QgYXMgUkVTVF9NZXRob2RzIHwgXCJPUFRJT05TXCI7XG5cblx0XHRsZXQgYW5zd2VyOiBSZXNwb25zZXx1bmRlZmluZWQ7XG5cdFx0bGV0IHVzZV9icnl0aG9uOiBudWxsfGJvb2xlYW4gPSBudWxsO1xuXG5cdFx0bGV0IHJvdXRlOiBSb3V0ZXxudWxsID0gbnVsbDtcblxuXHRcdHRyeSB7XG5cblx0XHRcdGlmKG1ldGhvZCA9PT0gXCJPUFRJT05TXCIpXG5cdFx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge2hlYWRlcnM6IENPUlNfSEVBREVSU30pO1xuXG5cdFx0XHRpZiggcmVxdWVzdC5oZWFkZXJzLmhhcyhcInVzZS1icnl0aG9uXCIpIClcblx0XHRcdFx0dXNlX2JyeXRob24gPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwidXNlLWJyeXRob25cIikgPT09IFwidHJ1ZVwiO1xuXG5cdFx0XHRyb3V0ZSA9IGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBtZXRob2QsIHVybCwgdXNlX2JyeXRob24pO1xuXG5cdFx0XHRpZiggcm91dGUgIT09IG51bGwpIHtcblx0XHRcdFx0YW5zd2VyID0gYXdhaXQgcm91dGUuaGFuZGxlcihyZXF1ZXN0LCByb3V0ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBfcm91dGUgPSBhd2FpdCBub3RfZm91bmRfcm91dGVbK3VzZV9icnl0aG9uIV07XG5cdFx0XHRcdF9yb3V0ZS5yb3V0ZSA9IHJvdXRlO1xuXHRcdFx0XHRhbnN3ZXIgPSBhd2FpdCBfcm91dGUuaGFuZGxlcihyZXF1ZXN0LCBfcm91dGUpXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBidWlsZEFuc3dlcihhbnN3ZXIpO1xuXG5cdFx0fSBjYXRjaChlKSB7XG5cblx0XHRcdGlmKCAhIChlIGluc3RhbmNlb2YgUmVzcG9uc2UpICkge1xuXHRcdFx0XHRjb25zdCBfcm91dGUgPSBpbnRlcm5hbF9lcnJvcl9yb3V0ZVsrdXNlX2JyeXRob24hXTtcblx0XHRcdFx0X3JvdXRlLnJvdXRlID0gcm91dGU7XG5cdFx0XHRcdGVycm9yID0gX3JvdXRlLmVycm9yID0gZSBhcyBFcnJvcjtcblx0XHRcdFx0ZSA9IGF3YWl0IF9yb3V0ZS5oYW5kbGVyKHJlcXVlc3QsIF9yb3V0ZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBidWlsZEFuc3dlcihlIGFzIFJlc3BvbnNlKTtcblxuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRpZiggbG9nZ2VyICE9PSB1bmRlZmluZWQgKVxuXHRcdFx0XHRsb2dnZXIoaXAsIG1ldGhvZCwgdXJsLCBlcnJvcik7XG5cdFx0fVxuXHR9O1xufVxuXG5cbi8vIHRlc3RzXG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoMnJlZ2V4KHBhdGg6IHN0cmluZykge1xuXG5cdC8vIEVzY2FwZSBzcGVjaWFsIGNoYXJhY3RlcnMuXG5cdC8vIGNmIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzMxMTUxNTAvaG93LXRvLWVzY2FwZS1yZWd1bGFyLWV4cHJlc3Npb24tc3BlY2lhbC1jaGFyYWN0ZXJzLXVzaW5nLWphdmFzY3JpcHRcblx0cGF0aCA9IHBhdGgucmVwbGFjZSgvWy1bXFxde30oKSorPy4sXFxcXF4kfCNcXHNdL2csICdcXFxcJCYnKTtcblxuXHRyZXR1cm4gbmV3IFJlZ0V4cChcIl5cIiArIHBhdGgucmVwbGFjZSgvXFxcXFxce1teXFx9XStcXFxcXFx9L2csIChjYXB0dXJlZCkgPT4gYCg/PCR7Y2FwdHVyZWQuc2xpY2UoMiwtMil9PlteL10rKWApICsgXCIkXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2gocmVnZXg6IFJlZ0V4cCwgdXJpOiBzdHJpbmcpIHtcblxuXHRsZXQgcmVzdWx0ID0gcmVnZXguZXhlYyh1cmkpO1xuXG5cdGlmKHJlc3VsdCA9PT0gbnVsbClcblx0XHRyZXR1cm4gZmFsc2U7XG5cblx0cmV0dXJuIHJlc3VsdC5ncm91cHMgPz8ge307XG59XG5cbnR5cGUgUm91dGUgPSB7XG5cdGhhbmRsZXI6IEhhbmRsZXIsXG5cdHBhdGggICA6IHN0cmluZyxcblx0dmFycyAgIDogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxufVxuXG5mdW5jdGlvbiBnZXRSb3V0ZUhhbmRsZXIocmVnZXhlczogKHJlYWRvbmx5IFtSZWdFeHAsIEhhbmRsZXIsIHN0cmluZywgYm9vbGVhbl0pW10sXG5cdFx0XHRcdFx0XHRtZXRob2Q6IFJFU1RfTWV0aG9kcyxcblx0XHRcdFx0XHRcdHVybDogVVJMfHN0cmluZyxcblx0XHRcdFx0XHRcdHVzZV9icnl0aG9uOiBib29sZWFufG51bGwgPSBudWxsKTogUm91dGV8bnVsbCB7XG5cblx0bGV0IGN1clJvdXRlOiBzdHJpbmc7XG5cdGlmKCB0eXBlb2YgdXJsID09PSBcInN0cmluZ1wiKVxuXHRcdGN1clJvdXRlID0gYCR7dXJsfS8ke21ldGhvZH1gO1xuXHRlbHNlXG5cdFx0Y3VyUm91dGUgPSBgJHsgZGVjb2RlVVJJKHVybC5wYXRobmFtZSkgfS8ke21ldGhvZH1gO1xuXG5cdGZvcihsZXQgcm91dGUgb2YgcmVnZXhlcykge1xuXG5cdFx0aWYoIHVzZV9icnl0aG9uICE9PSBudWxsICYmIHJvdXRlWzNdICE9PSB1c2VfYnJ5dGhvbiApXG5cdFx0XHRjb250aW51ZTtcblxuXHRcdHZhciB2YXJzID0gbWF0Y2gocm91dGVbMF0sIGN1clJvdXRlKTtcblxuXHRcdGlmKHZhcnMgIT09IGZhbHNlKVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aGFuZGxlcjogcm91dGVbMV0sXG5cdFx0XHRcdHBhdGggICA6IHJvdXRlWzJdLFxuXHRcdFx0XHR2YXJzXG5cdFx0XHR9O1xuXHR9XG5cblx0cmV0dXJuIG51bGw7XG59IiwiY29uc3QgRXZlbnRTb3VyY2UgPSBnbG9iYWxUaGlzLkV2ZW50U291cmNlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFrZUV2ZW50U291cmNlKHVzZV9zZXJ2ZXI6IHN0cmluZ3xudWxsKSB7XG5cbiAgICBpZiggdXNlX3NlcnZlciApXG4gICAgICAgIHJldHVybiBjbGFzcyBFdmVudFNvdXJjZVNlcnZlciBleHRlbmRzIEV2ZW50U291cmNlIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKHVybDogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIoYCR7dXNlX3NlcnZlcn0ke3VybH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIEV2ZW50U291cmNlRmFrZTtcbn1cblxuLy8gQHRzLWlnbm9yZVxuY2xhc3MgRXZlbnRTb3VyY2VGYWtlIGV4dGVuZHMgRXZlbnRUYXJnZXQgaW1wbGVtZW50cyBFdmVudFNvdXJjZSB7XG4gICAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG5cbiAgICAgICAgZ2xvYmFsVGhpcy5mZXRjaCh1cmwpLnRoZW4oIGFzeW5jIChyZXNwb25zZSkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSB0aGlzLk9QRU47XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoIG5ldyBFdmVudChcIm9wZW5cIikgKTtcblxuICAgICAgICAgICAgY29uc3QgcmVhZGVyID0gcmVzcG9uc2UuYm9keSEucGlwZVRocm91Z2gobmV3IFRleHREZWNvZGVyU3RyZWFtKS5nZXRSZWFkZXIoKTtcblxuICAgICAgICAgICAgbGV0IGJ1ZmZlciA9IFwiXCI7XG4gICAgICAgICAgICBsZXQgY2h1bmsgPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuXG4gICAgICAgICAgICB3aGlsZSggISBjaHVuay5kb25lICkge1xuXG4gICAgICAgICAgICAgICAgYnVmZmVyICs9IGNodW5rLnZhbHVlITtcblxuICAgICAgICAgICAgICAgIGxldCBwb3MgPSBidWZmZXIuaW5kZXhPZihcIlxcblxcblwiKTtcbiAgICAgICAgICAgICAgICB3aGlsZSggcG9zICE9PSAtMSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBldmVudCA9IGJ1ZmZlci5zbGljZSgwLCBwb3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBPYmplY3QuZnJvbUVudHJpZXMoIGV2ZW50LnNwbGl0KFwiXFxuXCIpLm1hcCggbCA9PiBsLnNwbGl0KFwiOiBcIikgKSApO1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZXZlbnQgPz89IFwibWVzc2FnZVwiO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCggbmV3IE1lc3NhZ2VFdmVudChkYXRhLmV2ZW50LCB7ZGF0YTogZGF0YS5kYXRhfSkgKVxuXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IGJ1ZmZlci5zbGljZShwb3MgKyAyKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zID0gYnVmZmVyLmluZGV4T2YoXCJcXG5cXG5cIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2h1bmsgPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgb25lcnJvciAgOiAoKHRoaXM6IEV2ZW50U291cmNlLCBldjogRXZlbnQgICAgICAgKSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG4gICAgb25tZXNzYWdlOiAoKHRoaXM6IEV2ZW50U291cmNlLCBldjogTWVzc2FnZUV2ZW50KSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG4gICAgb25vcGVuICAgOiAoKHRoaXM6IEV2ZW50U291cmNlLCBldjogRXZlbnQgICAgICAgKSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG4gICAgY2xvc2UoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IHRoaXMuQ0xPU0VEO1xuICAgIH1cblxuICAgIHJlYWR5U3RhdGU6IG51bWJlciA9IDA7XG5cbiAgICByZWFkb25seSBDT05ORUNUSU5HID0gMDtcbiAgICByZWFkb25seSBPUEVOID0gMTtcbiAgICByZWFkb25seSBDTE9TRUQgPSAyO1xuXG4gICAgLy8gbm90IGltcGxlbWVudGVkXG4gICAgdXJsOiBzdHJpbmc7XG4gICAgd2l0aENyZWRlbnRpYWxzOiBib29sZWFuID0gZmFsc2U7XG59IiwiY29uc3QgV2ViU29ja2V0ID0gZ2xvYmFsVGhpcy5XZWJTb2NrZXQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWtlV2ViU29ja2V0KHVzZV9zZXJ2ZXI6IHN0cmluZ3xudWxsKSB7XG5cbiAgICBpZiggdXNlX3NlcnZlciApXG4gICAgICAgIHJldHVybiBjbGFzcyBXZWJTb2NrZXRTZXJ2ZXIgZXh0ZW5kcyBXZWJTb2NrZXQge1xuICAgICAgICAgICAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihgJHt1c2Vfc2VydmVyfSR7dXJsfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICByZXR1cm4gV2ViU29ja2V0RmFrZTtcbn1cblxuZ2xvYmFsVGhpcy5EZW5vID0ge1xuICAgIHVwZ3JhZGVXZWJTb2NrZXQ6IGZ1bmN0aW9uKHJlcXVlc3Q6IFJlcXVlc3QpIHtcblxuICAgICAgICBjb25zdCBzb2NrZXQgICA9IG5ldyBXZWJTb2NrZXRGYWtlKG51bGwpO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IG5ldyBSZXNwb25zZSgpO1xuXG4gICAgICAgIChyZXNwb25zZSBhcyBhbnkpLndlYnNvY2tldCA9IHNvY2tldDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc29ja2V0LFxuICAgICAgICAgICAgcmVzcG9uc2VcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy9UT0RPIGltcGxlbWVudGUgRGVuby51cGdyYWRlID0+IHJldHVybiBmYWtlIFJlc3BvbnNlICsgU2VydmVyV2ViU29ja2V0Li4uXG5cbmNsYXNzIFdlYlNvY2tldEZha2UgZXh0ZW5kcyBFdmVudFRhcmdldCBpbXBsZW1lbnRzIFdlYlNvY2tldCB7XG5cbiAgICBvdGhlcjogV2ViU29ja2V0RmFrZXxudWxsID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKHVybDogc3RyaW5nfG51bGwpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBpZiggdXJsID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xuXG4gICAgICAgIGdsb2JhbFRoaXMuZmV0Y2godXJsKS50aGVuKCBhc3luYyAocmVzcG9uc2UpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5vdGhlciA9IChyZXNwb25zZSBhcyBhbnkpLndlYnNvY2tldDtcbiAgICAgICAgICAgIHRoaXMub3RoZXIhLm90aGVyID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gdGhpcy5PUEVOO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoXCJvcGVuXCIpICk7XG4gICAgICAgICAgICB0aGlzLm90aGVyIS5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoXCJvcGVuXCIpICk7XG5cbiAgICAgICAgfSk7XG5cblxuICAgIH1cblxuICAgIGNsb3NlKGNvZGU/OiBudW1iZXIsIHJlYXNvbj86IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSB0aGlzLkNMT1NFRDtcbiAgICAgICAgbGV0IGV2ZW50OiBDbG9zZUV2ZW50SW5pdCA9IHt9O1xuICAgICAgICBpZiggY29kZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgZXZlbnQuY29kZSA9IGNvZGU7XG4gICAgICAgIGlmKCByZWFzb24gIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGV2ZW50LnJlYXNvbiA9IHJlYXNvbjtcblxuICAgICAgICB0aGlzLm90aGVyIS5kaXNwYXRjaEV2ZW50KCBuZXcgQ2xvc2VFdmVudChcImNsb3NlXCIsIGV2ZW50KSApO1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoIG5ldyBDbG9zZUV2ZW50KFwiY2xvc2VcIiwgZXZlbnQpICk7XG4gICAgfVxuICAgIHNlbmQoZGF0YTogc3RyaW5nIHwgQXJyYXlCdWZmZXJMaWtlIHwgQmxvYiB8IEFycmF5QnVmZmVyVmlldyk6IHZvaWQge1xuICAgICAgICB0aGlzLm90aGVyIS5kaXNwYXRjaEV2ZW50KG5ldyBNZXNzYWdlRXZlbnQoXCJtZXNzYWdlXCIsIHtkYXRhfSkpO1xuICAgIH1cblxuICAgIHVybDogc3RyaW5nID0gXCJcIjtcbiAgICBcbiAgICBvbmNsb3NlICA6ICgodGhpczogV2ViU29ja2V0LCBldjogQ2xvc2VFdmVudCAgKSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG4gICAgb25lcnJvciAgOiAoKHRoaXM6IFdlYlNvY2tldCwgZXY6IEV2ZW50ICAgICAgICkgPT4gYW55KSB8IG51bGwgPSBudWxsO1xuICAgIG9ubWVzc2FnZTogKCh0aGlzOiBXZWJTb2NrZXQsIGV2OiBNZXNzYWdlRXZlbnQpID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgICBvbm9wZW4gICA6ICgodGhpczogV2ViU29ja2V0LCBldjogRXZlbnQgICAgICAgKSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG5cbiAgICByZWFkeVN0YXRlOiBudW1iZXIgPSAwO1xuXG4gICAgcmVhZG9ubHkgQ09OTkVDVElORyA9IDA7XG4gICAgcmVhZG9ubHkgT1BFTiAgICAgICA9IDE7XG4gICAgcmVhZG9ubHkgQ0xPU0lORyAgICA9IDI7XG4gICAgcmVhZG9ubHkgQ0xPU0VEICAgICA9IDM7XG5cbiAgICAvLyBub3QgaW1wbGVtZW50ZWRcbiAgICBiaW5hcnlUeXBlOiBCaW5hcnlUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuICAgIGJ1ZmZlcmVkQW1vdW50OiBudW1iZXIgPSAwO1xuICAgIGV4dGVuc2lvbnM6IHN0cmluZyAgICAgPSBcIlwiO1xuICAgIHByb3RvY29sOiBzdHJpbmcgICAgICAgPSBcIlwiO1xufSIsImV4cG9ydCB7cGF0aDJyZWdleCwgbWF0Y2h9IGZyb20gXCIuLi9WU0hTXCI7XG5leHBvcnQge2dldEZha2VFdmVudFNvdXJjZX0gZnJvbSBcIi4vRmFrZS9FdmVudFNvdXJjZVwiO1xuZXhwb3J0IHtnZXRGYWtlV2ViU29ja2V0fSBmcm9tIFwiLi9GYWtlL1dlYlNvY2tldFwiOyIsImZ1bmN0aW9uIHdlYnBhY2tFbXB0eUFzeW5jQ29udGV4dChyZXEpIHtcblx0Ly8gSGVyZSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCkgaXMgdXNlZCBpbnN0ZWFkIG9mIG5ldyBQcm9taXNlKCkgdG8gcHJldmVudFxuXHQvLyB1bmNhdWdodCBleGNlcHRpb24gcG9wcGluZyB1cCBpbiBkZXZ0b29sc1xuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgcmVxICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9KTtcbn1cbndlYnBhY2tFbXB0eUFzeW5jQ29udGV4dC5rZXlzID0gKCkgPT4gKFtdKTtcbndlYnBhY2tFbXB0eUFzeW5jQ29udGV4dC5yZXNvbHZlID0gd2VicGFja0VtcHR5QXN5bmNDb250ZXh0O1xud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LmlkID0gXCIuLy4gbGF6eSByZWN1cnNpdmVcIjtcbm1vZHVsZS5leHBvcnRzID0gd2VicGFja0VtcHR5QXN5bmNDb250ZXh0OyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuIiwidmFyIHdlYnBhY2tRdWV1ZXMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgPyBTeW1ib2woXCJ3ZWJwYWNrIHF1ZXVlc1wiKSA6IFwiX193ZWJwYWNrX3F1ZXVlc19fXCI7XG52YXIgd2VicGFja0V4cG9ydHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgPyBTeW1ib2woXCJ3ZWJwYWNrIGV4cG9ydHNcIikgOiBcIl9fd2VicGFja19leHBvcnRzX19cIjtcbnZhciB3ZWJwYWNrRXJyb3IgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgPyBTeW1ib2woXCJ3ZWJwYWNrIGVycm9yXCIpIDogXCJfX3dlYnBhY2tfZXJyb3JfX1wiO1xudmFyIHJlc29sdmVRdWV1ZSA9IChxdWV1ZSkgPT4ge1xuXHRpZihxdWV1ZSAmJiBxdWV1ZS5kIDwgMSkge1xuXHRcdHF1ZXVlLmQgPSAxO1xuXHRcdHF1ZXVlLmZvckVhY2goKGZuKSA9PiAoZm4uci0tKSk7XG5cdFx0cXVldWUuZm9yRWFjaCgoZm4pID0+IChmbi5yLS0gPyBmbi5yKysgOiBmbigpKSk7XG5cdH1cbn1cbnZhciB3cmFwRGVwcyA9IChkZXBzKSA9PiAoZGVwcy5tYXAoKGRlcCkgPT4ge1xuXHRpZihkZXAgIT09IG51bGwgJiYgdHlwZW9mIGRlcCA9PT0gXCJvYmplY3RcIikge1xuXHRcdGlmKGRlcFt3ZWJwYWNrUXVldWVzXSkgcmV0dXJuIGRlcDtcblx0XHRpZihkZXAudGhlbikge1xuXHRcdFx0dmFyIHF1ZXVlID0gW107XG5cdFx0XHRxdWV1ZS5kID0gMDtcblx0XHRcdGRlcC50aGVuKChyKSA9PiB7XG5cdFx0XHRcdG9ialt3ZWJwYWNrRXhwb3J0c10gPSByO1xuXHRcdFx0XHRyZXNvbHZlUXVldWUocXVldWUpO1xuXHRcdFx0fSwgKGUpID0+IHtcblx0XHRcdFx0b2JqW3dlYnBhY2tFcnJvcl0gPSBlO1xuXHRcdFx0XHRyZXNvbHZlUXVldWUocXVldWUpO1xuXHRcdFx0fSk7XG5cdFx0XHR2YXIgb2JqID0ge307XG5cdFx0XHRvYmpbd2VicGFja1F1ZXVlc10gPSAoZm4pID0+IChmbihxdWV1ZSkpO1xuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR9XG5cdH1cblx0dmFyIHJldCA9IHt9O1xuXHRyZXRbd2VicGFja1F1ZXVlc10gPSB4ID0+IHt9O1xuXHRyZXRbd2VicGFja0V4cG9ydHNdID0gZGVwO1xuXHRyZXR1cm4gcmV0O1xufSkpO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5hID0gKG1vZHVsZSwgYm9keSwgaGFzQXdhaXQpID0+IHtcblx0dmFyIHF1ZXVlO1xuXHRoYXNBd2FpdCAmJiAoKHF1ZXVlID0gW10pLmQgPSAtMSk7XG5cdHZhciBkZXBRdWV1ZXMgPSBuZXcgU2V0KCk7XG5cdHZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHM7XG5cdHZhciBjdXJyZW50RGVwcztcblx0dmFyIG91dGVyUmVzb2x2ZTtcblx0dmFyIHJlamVjdDtcblx0dmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqKSA9PiB7XG5cdFx0cmVqZWN0ID0gcmVqO1xuXHRcdG91dGVyUmVzb2x2ZSA9IHJlc29sdmU7XG5cdH0pO1xuXHRwcm9taXNlW3dlYnBhY2tFeHBvcnRzXSA9IGV4cG9ydHM7XG5cdHByb21pc2Vbd2VicGFja1F1ZXVlc10gPSAoZm4pID0+IChxdWV1ZSAmJiBmbihxdWV1ZSksIGRlcFF1ZXVlcy5mb3JFYWNoKGZuKSwgcHJvbWlzZVtcImNhdGNoXCJdKHggPT4ge30pKTtcblx0bW9kdWxlLmV4cG9ydHMgPSBwcm9taXNlO1xuXHRib2R5KChkZXBzKSA9PiB7XG5cdFx0Y3VycmVudERlcHMgPSB3cmFwRGVwcyhkZXBzKTtcblx0XHR2YXIgZm47XG5cdFx0dmFyIGdldFJlc3VsdCA9ICgpID0+IChjdXJyZW50RGVwcy5tYXAoKGQpID0+IHtcblx0XHRcdGlmKGRbd2VicGFja0Vycm9yXSkgdGhyb3cgZFt3ZWJwYWNrRXJyb3JdO1xuXHRcdFx0cmV0dXJuIGRbd2VicGFja0V4cG9ydHNdO1xuXHRcdH0pKVxuXHRcdHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGZuID0gKCkgPT4gKHJlc29sdmUoZ2V0UmVzdWx0KSk7XG5cdFx0XHRmbi5yID0gMDtcblx0XHRcdHZhciBmblF1ZXVlID0gKHEpID0+IChxICE9PSBxdWV1ZSAmJiAhZGVwUXVldWVzLmhhcyhxKSAmJiAoZGVwUXVldWVzLmFkZChxKSwgcSAmJiAhcS5kICYmIChmbi5yKyssIHEucHVzaChmbikpKSk7XG5cdFx0XHRjdXJyZW50RGVwcy5tYXAoKGRlcCkgPT4gKGRlcFt3ZWJwYWNrUXVldWVzXShmblF1ZXVlKSkpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBmbi5yID8gcHJvbWlzZSA6IGdldFJlc3VsdCgpO1xuXHR9LCAoZXJyKSA9PiAoKGVyciA/IHJlamVjdChwcm9taXNlW3dlYnBhY2tFcnJvcl0gPSBlcnIpIDogb3V0ZXJSZXNvbHZlKGV4cG9ydHMpKSwgcmVzb2x2ZVF1ZXVlKHF1ZXVlKSkpO1xuXHRxdWV1ZSAmJiBxdWV1ZS5kIDwgMCAmJiAocXVldWUuZCA9IDApO1xufTsiLCJ2YXIgZ2V0UHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgPyAob2JqKSA9PiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikpIDogKG9iaikgPT4gKG9iai5fX3Byb3RvX18pO1xudmFyIGxlYWZQcm90b3R5cGVzO1xuLy8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4vLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbi8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuLy8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4vLyBtb2RlICYgMTY6IHJldHVybiB2YWx1ZSB3aGVuIGl0J3MgUHJvbWlzZS1saWtlXG4vLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuXHRpZihtb2RlICYgMSkgdmFsdWUgPSB0aGlzKHZhbHVlKTtcblx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcblx0aWYodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSkge1xuXHRcdGlmKChtb2RlICYgNCkgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuXHRcdGlmKChtb2RlICYgMTYpICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nKSByZXR1cm4gdmFsdWU7XG5cdH1cblx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcblx0dmFyIGRlZiA9IHt9O1xuXHRsZWFmUHJvdG90eXBlcyA9IGxlYWZQcm90b3R5cGVzIHx8IFtudWxsLCBnZXRQcm90byh7fSksIGdldFByb3RvKFtdKSwgZ2V0UHJvdG8oZ2V0UHJvdG8pXTtcblx0Zm9yKHZhciBjdXJyZW50ID0gbW9kZSAmIDIgJiYgdmFsdWU7IHR5cGVvZiBjdXJyZW50ID09ICdvYmplY3QnICYmICF+bGVhZlByb3RvdHlwZXMuaW5kZXhPZihjdXJyZW50KTsgY3VycmVudCA9IGdldFByb3RvKGN1cnJlbnQpKSB7XG5cdFx0T2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoY3VycmVudCkuZm9yRWFjaCgoa2V5KSA9PiAoZGVmW2tleV0gPSAoKSA9PiAodmFsdWVba2V5XSkpKTtcblx0fVxuXHRkZWZbJ2RlZmF1bHQnXSA9ICgpID0+ICh2YWx1ZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChucywgZGVmKTtcblx0cmV0dXJuIG5zO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmYgPSB7fTtcbi8vIFRoaXMgZmlsZSBjb250YWlucyBvbmx5IHRoZSBlbnRyeSBjaHVuay5cbi8vIFRoZSBjaHVuayBsb2FkaW5nIGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIGNodW5rc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5lID0gKGNodW5rSWQpID0+IHtcblx0cmV0dXJuIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uZikucmVkdWNlKChwcm9taXNlcywga2V5KSA9PiB7XG5cdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mW2tleV0oY2h1bmtJZCwgcHJvbWlzZXMpO1xuXHRcdHJldHVybiBwcm9taXNlcztcblx0fSwgW10pKTtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnUgPSAoY2h1bmtJZCkgPT4ge1xuXHQvLyByZXR1cm4gdXJsIGZvciBmaWxlbmFtZXMgYmFzZWQgb24gdGVtcGxhdGVcblx0cmV0dXJuIFwiXCIgKyBjaHVua0lkICsgXCIubWpzXCI7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5taW5pQ3NzRiA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gdW5kZWZpbmVkO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjsiLCIvLyBubyBiYXNlVVJJXG5cbi8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4vLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbi8vIFtyZXNvbHZlLCBQcm9taXNlXSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbnZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG5cdFwibWFpblwiOiAwXG59O1xuXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0dmFyIHtpZHMsIG1vZHVsZXMsIHJ1bnRpbWV9ID0gZGF0YTtcblx0Ly8gYWRkIFwibW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcblx0Ly8gdGhlbiBmbGFnIGFsbCBcImlkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuXHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwO1xuXHRmb3IobW9kdWxlSWQgaW4gbW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubVttb2R1bGVJZF0gPSBtb2R1bGVzW21vZHVsZUlkXTtcblx0XHR9XG5cdH1cblx0aWYocnVudGltZSkgcnVudGltZShfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblx0Zm9yKDtpIDwgaWRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y2h1bmtJZCA9IGlkc1tpXTtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oaW5zdGFsbGVkQ2h1bmtzLCBjaHVua0lkKSAmJiBpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSgpO1xuXHRcdH1cblx0XHRpbnN0YWxsZWRDaHVua3NbaWRzW2ldXSA9IDA7XG5cdH1cblxufVxuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmYuaiA9IChjaHVua0lkLCBwcm9taXNlcykgPT4ge1xuXHRcdC8vIGltcG9ydCgpIGNodW5rIGxvYWRpbmcgZm9yIGphdmFzY3JpcHRcblx0XHR2YXIgaW5zdGFsbGVkQ2h1bmtEYXRhID0gX193ZWJwYWNrX3JlcXVpcmVfXy5vKGluc3RhbGxlZENodW5rcywgY2h1bmtJZCkgPyBpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gOiB1bmRlZmluZWQ7XG5cdFx0aWYoaW5zdGFsbGVkQ2h1bmtEYXRhICE9PSAwKSB7IC8vIDAgbWVhbnMgXCJhbHJlYWR5IGluc3RhbGxlZFwiLlxuXG5cdFx0XHQvLyBhIFByb21pc2UgbWVhbnMgXCJjdXJyZW50bHkgbG9hZGluZ1wiLlxuXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtEYXRhKSB7XG5cdFx0XHRcdHByb21pc2VzLnB1c2goaW5zdGFsbGVkQ2h1bmtEYXRhWzFdKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmKHRydWUpIHsgLy8gYWxsIGNodW5rcyBoYXZlIEpTXG5cdFx0XHRcdFx0Ly8gc2V0dXAgUHJvbWlzZSBpbiBjaHVuayBjYWNoZVxuXHRcdFx0XHRcdHZhciBwcm9taXNlID0gaW1wb3J0KFwiLi4vXCIgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLnUoY2h1bmtJZCkpLnRoZW4oaW5zdGFsbENodW5rLCAoZSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdICE9PSAwKSBpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHZhciBwcm9taXNlID0gUHJvbWlzZS5yYWNlKFtwcm9taXNlLCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gKGluc3RhbGxlZENodW5rRGF0YSA9IGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IFtyZXNvbHZlXSkpXSlcblx0XHRcdFx0XHRwcm9taXNlcy5wdXNoKGluc3RhbGxlZENodW5rRGF0YVsxXSA9IHByb21pc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxufTtcblxuLy8gbm8gcHJlZmV0Y2hpbmdcblxuLy8gbm8gcHJlbG9hZGVkXG5cbi8vIG5vIGV4dGVybmFsIGluc3RhbGwgY2h1bmtcblxuLy8gbm8gb24gY2h1bmtzIGxvYWRlZCIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgdXNlZCAnbW9kdWxlJyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC50c1wiKTtcbiIsIiJdLCJuYW1lcyI6WyJnbG9iYWxUaGlzIiwiRGVubyIsImFyZ3MiLCJsZW5ndGgiLCJwYXJzZUFyZ3MiLCJoZWxwIiwiY29uc29sZSIsImxvZyIsImV4aXQiLCJzdGFydEhUVFBTZXJ2ZXIiLCJwb3J0IiwiaG9zdG5hbWUiLCJob3N0Iiwicm91dGVzIiwiXyIsImFzc2V0cyIsImFzc2V0c19wcmVmaXgiLCJkZWZhdWx0Iiwibm90X2ZvdW5kIiwiaW50ZXJuYWxfZXJyb3IiLCJ0ZXN0IiwidGVzdF9uYW1lIiwicmVxdWVzdCIsImV4cGVjdGVkX3Jlc3BvbnNlIiwiUmVxdWVzdCIsImVuY29kZVVSSSIsInVzZV9icnl0aG9uIiwibGFuZyIsInNhbml0aXplUmVzb3VyY2VzIiwiciIsImNsb25lIiwiaGVhZGVycyIsInNldCIsImFzc2VydFJlc3BvbnNlIiwiZmV0Y2giLCJ1aW50X2VxdWFscyIsImEiLCJiIiwiYnl0ZUxlbmd0aCIsImkiLCJhdCIsInJlc3BvbnNlIiwic3RhdHVzIiwiYm9keSIsIm1pbWUiLCJzdGF0dXNUZXh0IiwiRXJyb3IiLCJyZXBfbWltZSIsImdldCIsIlVpbnQ4QXJyYXkiLCJyZXAiLCJieXRlcyIsInJlcF90ZXh0IiwidGV4dCIsInJvb3REaXIiLCJjd2QiLCJfZGVmYXVsdCIsImxvZ2dlciIsInJvdXRlc0hhbmRsZXJzIiwibG9hZEFsbFJvdXRlc0hhbmRsZXJzIiwicmVxdWVzdEhhbmRsZXIiLCJidWlsZFJlcXVlc3RIYW5kbGVyIiwic2VydmUiLCJmaW5pc2hlZCIsIlNTRVdyaXRlciIsImNvbnN0cnVjdG9yIiwid3JpdGVyIiwic2VuZEV2ZW50IiwiZGF0YSIsIm5hbWUiLCJ3cml0ZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJjbG9zZWQiLCJjbG9zZSIsImFib3J0IiwiVlNIUyIsIlNTRVJlc3BvbnNlIiwiY2FsbGJhY2siLCJvcHRpb25zIiwicmVhZGFibGUiLCJ3cml0YWJsZSIsIlRyYW5zZm9ybVN0cmVhbSIsImdldFdyaXRlciIsImNhdGNoIiwiZSIsInN0cmVhbSIsInBpcGVUaHJvdWdoIiwiVGV4dEVuY29kZXJTdHJlYW0iLCJIZWFkZXJzIiwiaGFzIiwiUmVzcG9uc2UiLCJnZXRNaW1lIiwicGF0aCIsInBvcyIsImxhc3RJbmRleE9mIiwiZXh0Iiwic2xpY2UiLCJsb2FkTWltZSIsImdldFR5cGUiLCJmZXRjaEFzc2V0Iiwib3BlbiIsIm1pbWVsaXRlIiwiYnJ5dGhvbl9sb2FkaW5nIiwiYnJ5dGhvbl9wcm9taXNlIiwiUHJvbWlzZSIsIndpdGhSZXNvbHZlcnMiLCJsb2FkX2JyeXRob24iLCJwcm9taXNlIiwiZmlsZSIsImRpciIsInVybCIsImJyeXRob24iLCJyZWFkVGV4dEZpbGUiLCIkQiIsIl9fQlJZVEhPTl9fIiwiaW5uZXIiLCJnbG9iYWwiLCJtb2R1bGUiLCJldmFsIiwid2FybiIsInJlc29sdmUiLCJST09UIiwicm91dGVzX3VyaSIsImdldEFsbFJvdXRlcyIsImhhbmRsZXJzIiwiYWxsIiwibWFwIiwidXJpIiwiaXNfYnJ5dGhvbiIsImVuZHNXaXRoIiwicm91dGUiLCJjb2RlIiwiaW5kZXhPZiIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJ0eXBlIiwiZXJyb3IiLCJoYW5kbGVyIiwiY3VycmVudFBhdGgiLCJmaWxlcyIsImRpckVudHJ5IiwicmVhZERpciIsImVudHJ5UGF0aCIsImlzRGlyZWN0b3J5IiwiaW5jbHVkZXMiLCJwdXNoIiwiQ09SU19IRUFERVJTIiwiYnVpbGRBbnN3ZXIiLCJyZXBfaGVhZGVycyIsImJ1aWxkRGVmYXVsdFJvdXRlIiwiZGVmYXVsdF9oYW5kbGVyIiwib3B0cyIsIm1lc3NhZ2UiLCJwYXRobmFtZSIsInVuZGVmaW5lZCIsInN0YXJ0c1dpdGgiLCJmaWxlcGF0aCIsImluZm8iLCJzdGF0IiwiZXJyb3JzIiwiTm90Rm91bmQiLCJQZXJtaXNzaW9uRGVuaWVkIiwidmFycyIsInJlZ2V4ZXMiLCJpc19icnkiLCJwYXRoMnJlZ2V4IiwiZGVmYXVsdF9yb3V0ZSIsIm5vdF9mb3VuZF9yb3V0ZSIsImdldFJvdXRlSGFuZGxlciIsImludGVybmFsX2Vycm9yX3JvdXRlIiwiY29ubkluZm8iLCJpcCIsInJlbW90ZUFkZHIiLCJtZXRob2QiLCJhbnN3ZXIiLCJfcm91dGUiLCJyZXBsYWNlIiwiUmVnRXhwIiwiY2FwdHVyZWQiLCJtYXRjaCIsInJlZ2V4IiwicmVzdWx0IiwiZXhlYyIsImdyb3VwcyIsImN1clJvdXRlIiwiZGVjb2RlVVJJIiwiRXZlbnRTb3VyY2UiLCJnZXRGYWtlRXZlbnRTb3VyY2UiLCJ1c2Vfc2VydmVyIiwiRXZlbnRTb3VyY2VTZXJ2ZXIiLCJFdmVudFNvdXJjZUZha2UiLCJFdmVudFRhcmdldCIsInRoZW4iLCJyZWFkeVN0YXRlIiwiT1BFTiIsImRpc3BhdGNoRXZlbnQiLCJFdmVudCIsInJlYWRlciIsIlRleHREZWNvZGVyU3RyZWFtIiwiZ2V0UmVhZGVyIiwiYnVmZmVyIiwiY2h1bmsiLCJyZWFkIiwiZG9uZSIsInZhbHVlIiwiZXZlbnQiLCJPYmplY3QiLCJmcm9tRW50cmllcyIsInNwbGl0IiwibCIsIk1lc3NhZ2VFdmVudCIsIm9uZXJyb3IiLCJvbm1lc3NhZ2UiLCJvbm9wZW4iLCJDTE9TRUQiLCJDT05ORUNUSU5HIiwid2l0aENyZWRlbnRpYWxzIiwiV2ViU29ja2V0IiwiZ2V0RmFrZVdlYlNvY2tldCIsIldlYlNvY2tldFNlcnZlciIsIldlYlNvY2tldEZha2UiLCJ1cGdyYWRlV2ViU29ja2V0Iiwic29ja2V0Iiwid2Vic29ja2V0Iiwib3RoZXIiLCJyZWFzb24iLCJDbG9zZUV2ZW50Iiwic2VuZCIsIm9uY2xvc2UiLCJDTE9TSU5HIiwiYmluYXJ5VHlwZSIsImJ1ZmZlcmVkQW1vdW50IiwiZXh0ZW5zaW9ucyIsInByb3RvY29sIl0sInNvdXJjZVJvb3QiOiIifQ==