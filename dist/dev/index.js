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
async function startHTTPServer({ port = 8080, hostname = "localhost", routes = "/routes", default: _default = "/default/GET", not_found = _default, internal_error = _default, static: _static, logger = ()=>{} }) {
    let routesHandlers = routes;
    if (typeof routes === "string") {
        if (routes[0] === "/") routes = rootDir() + routes;
        routesHandlers = await loadAllRoutesHandlers(routes);
    }
    if (_static?.[0] === "/") _static = rootDir() + _static;
    const requestHandler = buildRequestHandler(routesHandlers, {
        _static,
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
//TODO: remove
class HTTPError extends Error {
    #error_code;
    constructor(http_error_code, message){
        super(message);
        this.name = "HTTPError";
        this.#error_code = http_error_code;
    }
    get error_code() {
        return this.#error_code;
    }
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
    }
};
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
async function default_handler(request, opts) {
    console.warn("called", opts, opts.error);
    if ("error" in opts) return new Response(opts.error.message, {
        status: 500
    });
    //TODO assets
    return new Response(`${request.url} not found`, {
        status: 404
    });
/*
		// use async ?
		//import { mimelite } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";

		if( _static === undefined )
			throw new HTTPError(404, "Not found");

		let filepath = `${_static}/${url.pathname}`;
		let content!: Uint8Array;

		try {
			const info = await Deno.stat(filepath);

			if( info.isDirectory )
				filepath = `${filepath}/index.html`;

			content = await Deno.readFile(filepath);

		} catch(e) {

			if(e instanceof Deno.errors.NotFound)
				throw new HTTPError(404, "Not Found");
			if( e instanceof Deno.errors.PermissionDenied )
				throw new HTTPError(403, "Forbidden");
			
			throw new HTTPError(500, (e as any).message);
		}

		const parts = filepath.split('.');
		const ext = parts[parts.length-1];

		const mime = null; //mimelite.getType(ext) ?? "text/plain";
		
		throw new Error('not implemented');
		//return await buildAnswer(200, content, mime);
	*/ }
const default_route = {
    handler: default_handler,
    path: "/default",
    vars: {}
};
function buildRequestHandler(routes, { _static, logger, not_found = "/default/GET", internal_error = "/default/GET" }) {
    const regexes = routes.map(([uri, handler, is_bry])=>[
            path2regex(uri),
            handler,
            uri,
            is_bry
        ]);
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
                _route.error = e;
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

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   match: () => (/* reexport safe */ _VSHS__WEBPACK_IMPORTED_MODULE_0__.match),
/* harmony export */   path2regex: () => (/* reexport safe */ _VSHS__WEBPACK_IMPORTED_MODULE_0__.path2regex)
/* harmony export */ });
/* harmony import */ var _VSHS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../VSHS */ "./VSHS.ts");
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
/******/ var __webpack_exports__match = __webpack_exports__.match;
/******/ var __webpack_exports__path2regex = __webpack_exports__.path2regex;
/******/ export { __webpack_exports__match as match, __webpack_exports__path2regex as path2regex };
/******/ 

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O1VBQ047VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBOztVQUVBOztVQUVBOztVQUVBOzs7OztTRTFEQTtTQUNBO1NBQ0E7U0FDQSIsInNvdXJjZXMiOlsid2VicGFjazovL1ZTSFMvLi9WU0hTLnRzIiwid2VicGFjazovL1ZTSFMvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vVlNIUy8uLy4vIGxhenkgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2FzeW5jIG1vZHVsZSIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9jcmVhdGUgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2Vuc3VyZSBjaHVuayIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9nZXQgbWluaS1jc3MgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2ltcG9ydCBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiAtUyBkZW5vIHJ1biAtLWFsbG93LWFsbCAtLXdhdGNoIC0tY2hlY2sgLS11bnN0YWJsZS1zbG9wcHktaW1wb3J0c1xuXG5pZiggXCJEZW5vXCIgaW4gZ2xvYmFsVGhpcyAmJiBEZW5vLmFyZ3MubGVuZ3RoICkge1xuXG5cdGNvbnN0IHtwYXJzZUFyZ3N9ID0gYXdhaXQgaW1wb3J0KFwianNyOkBzdGQvY2xpL3BhcnNlLWFyZ3NcIik7XG5cblx0Y29uc3QgYXJncyA9IHBhcnNlQXJncyhEZW5vLmFyZ3MpXG5cblx0LyogLS1kZWZhdWx0XHRkZWZhdWx0XG5Sb3V0ZSBub24gdHJvdXbDqWVcdC0tbm90LWZvdW5kXHRub3RfZm91bmRcbkVycmV1ciBub24tY2FwdHVyw6llXHQtLWludGVybmFsLWVycm9yKi9cblxuXHRpZiggYXJncy5oZWxwICkge1xuXHRcdGNvbnNvbGUubG9nKGAuL1ZTSFMudHMgJFJPVVRFU1xuXHQtLWhvc3QgICAgICAgICAgOiAoZGVmYXVsdCBsb2NhaG9zdClcblx0LS1wb3J0ICAgICAgICAgIDogKGRlZmF1bHQgODA4MClcblx0LS1kZWZhdWx0ICAgICAgIDogKGRlZmF1bHQgL2RlZmF1bHQpXG5cdC0tbm90X2ZvdW5kICAgICA6IChkZWZhdWx0IC0tZGVmYXVsdClcblx0LS1pbnRlcm5hbF9lcnJvcjogKGRlZmF1bHQgLS1kZWZhdWx0KVxuXHRgKVxuXHRcdERlbm8uZXhpdCgwKTtcblx0fVxuXG5cdHN0YXJ0SFRUUFNlcnZlcih7XG5cdFx0cG9ydCAgICA6IGFyZ3MucG9ydCA/PyA4MDgwLFxuXHRcdGhvc3RuYW1lOiBhcmdzLmhvc3QgPz8gXCJsb2NhbGhvc3RcIixcblx0XHRyb3V0ZXMgIDogYXJncy5fWzBdIGFzIHN0cmluZyxcblx0XHRkZWZhdWx0ICAgICAgIDogYXJncy5kZWZhdWx0LFxuXHRcdG5vdF9mb3VuZCAgICAgOiBhcmdzLm5vdF9mb3VuZCxcblx0XHRpbnRlcm5hbF9lcnJvcjogYXJncy5pbnRlcm5hbF9lcnJvcixcblx0fSlcblxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxudHlwZSBMb2dnZXIgPSAoaXA6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIHVybDogVVJMLCBlcnJvcjogbnVsbHxIVFRQRXJyb3J8RXJyb3IpID0+IHZvaWQ7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0KFxuXHR0ZXN0X25hbWUgIDogc3RyaW5nLFxuXHRyZXF1ZXN0ICAgIDogUmVxdWVzdHxzdHJpbmcsXG5cdGV4cGVjdGVkX3Jlc3BvbnNlOiBQYXJ0aWFsPEV4cGVjdGVkQW5zd2VyPlxuKSB7XG5cblx0aWYodHlwZW9mIHJlcXVlc3QgPT09IFwic3RyaW5nXCIpXG5cdFx0cmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGVuY29kZVVSSShyZXF1ZXN0KSk7XG5cblx0Zm9yKGxldCB1c2VfYnJ5dGhvbiBvZiBbXCJ0cnVlXCIsIFwiZmFsc2VcIl0pIHtcblx0XHRjb25zdCBsYW5nID0gdXNlX2JyeXRob24gPT09IFwidHJ1ZVwiID8gXCJicnlcIiA6IFwianNcIjtcblx0XHREZW5vLnRlc3QoYCR7dGVzdF9uYW1lfSAoJHtsYW5nfSlgLCB7c2FuaXRpemVSZXNvdXJjZXM6IGZhbHNlfSwgYXN5bmMoKSA9PiB7XG5cblx0XHRcdGNvbnN0IHIgPSByZXF1ZXN0LmNsb25lKCk7XG5cdFx0XHRyLmhlYWRlcnMuc2V0KFwidXNlLWJyeXRob25cIiwgdXNlX2JyeXRob24pO1xuXHRcdFx0YXdhaXQgYXNzZXJ0UmVzcG9uc2UoYXdhaXQgZmV0Y2gociksIGV4cGVjdGVkX3Jlc3BvbnNlKTtcblx0XHR9KTtcblx0fVxufVxuXG5mdW5jdGlvbiB1aW50X2VxdWFscyhhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KSB7XG5cblx0aWYoYi5ieXRlTGVuZ3RoICE9PSBiLmJ5dGVMZW5ndGgpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdGZvcihsZXQgaSA9IDA7IGkgPCBhLmJ5dGVMZW5ndGg7ICsraSlcblx0XHRpZihhLmF0KGkpICE9PSBiLmF0KGkpKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxudHlwZSBFeHBlY3RlZEFuc3dlciA9IHtcblx0c3RhdHVzICAgIDogbnVtYmVyLFxuXHRzdGF0dXNUZXh0OiBzdHJpbmcsXG5cdGJvZHkgIDogc3RyaW5nfFVpbnQ4QXJyYXl8bnVsbCxcblx0bWltZSAgOiBzdHJpbmd8bnVsbCxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRSZXNwb25zZShyZXNwb25zZTogUmVzcG9uc2UsIHtcblx0c3RhdHVzID0gMjAwLFxuXHRib2R5ICAgPSBudWxsLFxuXHRtaW1lICAgPSBudWxsLFxuXHRzdGF0dXNUZXh0ID0gXCJPS1wiXG5cbn06IFBhcnRpYWw8RXhwZWN0ZWRBbnN3ZXI+KSB7XG5cblx0aWYocmVzcG9uc2Uuc3RhdHVzICE9PSBzdGF0dXMpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFxceDFiWzE7MzFtV3Jvbmcgc3RhdHVzIGNvZGU6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3Jlc3BvbnNlLnN0YXR1c31cXHgxYlswbVxuXFx4MWJbMTszMm0rICR7c3RhdHVzfVxceDFiWzBtYCk7XG5cdH1cblxuXHRpZihyZXNwb25zZS5zdGF0dXNUZXh0ICE9PSBzdGF0dXNUZXh0KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIHN0YXR1cyB0ZXh0OlxceDFiWzBtXG5cXHgxYlsxOzMxbS0gJHtyZXNwb25zZS5zdGF0dXNUZXh0fVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtzdGF0dXNUZXh0fVxceDFiWzBtYCk7XG5cdH1cblxuXHRsZXQgcmVwX21pbWUgPSByZXNwb25zZS5oZWFkZXJzLmdldCgnQ29udGVudC1UeXBlJyk7XG5cdGlmKCBtaW1lID09PSBudWxsICYmIHJlcF9taW1lID09PSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKVxuXHRcdHJlcF9taW1lID0gbnVsbDtcblx0aWYoIHJlcF9taW1lICE9PSBtaW1lICkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBtaW1lLXR5cGU6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcF9taW1lfVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHttaW1lfVxceDFiWzBtYCk7XG5cdFx0fVxuXG5cdGlmKCBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSApIHtcblx0XHRjb25zdCByZXAgPSBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5ieXRlcygpKTtcblx0XHRpZiggISB1aW50X2VxdWFscyhib2R5LCByZXApIClcblx0XHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBib2R5OlxceDFiWzBtXG5cXHgxYlsxOzMxbS0gJHtyZXB9XFx4MWJbMG1cblxceDFiWzE7MzJtKyAke2JvZHl9XFx4MWJbMG1gKTtcblx0fSBlbHNlIHtcblxuXHRcdGNvbnN0IHJlcF90ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuXHRcdGlmKCByZXBfdGV4dCAhPT0gYm9keSAmJiAoYm9keSAhPT0gbnVsbCB8fCByZXBfdGV4dCAhPT0gXCJcIikgKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIGJvZHk6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcF90ZXh0fVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtib2R5fVxceDFiWzBtYCk7XG5cdH1cbn1cblxudHlwZSBIVFRQU2VydmVyT3B0cyA9IHtcblx0cG9ydCAgICA6IG51bWJlcixcblx0aG9zdG5hbWU6IHN0cmluZyxcblx0cm91dGVzICAgICAgICAgOiBzdHJpbmd8Um91dGVzLFxuXHRkZWZhdWx0ICAgICAgICA6IHN0cmluZyxcblx0bm90X2ZvdW5kICAgICAgOiBzdHJpbmcsXG5cdGludGVybmFsX2Vycm9yIDogc3RyaW5nLFxuXG5cdHN0YXRpYz86IHN0cmluZyxcblx0bG9nZ2VyPzogTG9nZ2VyIC8vIG5vdCBkb2N1bWVudGVkXG59O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByb290RGlyKCkge1xuXHRyZXR1cm4gRGVuby5jd2QoKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gc3RhcnRIVFRQU2VydmVyKHsgcG9ydCA9IDgwODAsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRob3N0bmFtZSA9IFwibG9jYWxob3N0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyb3V0ZXMgPSBcIi9yb3V0ZXNcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHQ6IF9kZWZhdWx0ID0gXCIvZGVmYXVsdC9HRVRcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5vdF9mb3VuZCAgICAgID0gX2RlZmF1bHQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbnRlcm5hbF9lcnJvciA9IF9kZWZhdWx0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhdGljOiBfc3RhdGljLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bG9nZ2VyID0gKCkgPT4ge31cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9OiBIVFRQU2VydmVyT3B0cykge1xuXG5cdGxldCByb3V0ZXNIYW5kbGVyczogUm91dGVzID0gcm91dGVzIGFzIGFueTtcblx0aWYoIHR5cGVvZiByb3V0ZXMgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0aWYocm91dGVzWzBdID09PSBcIi9cIilcblx0XHRcdHJvdXRlcyA9IHJvb3REaXIoKSArIHJvdXRlcztcblx0XHRcdFxuXHRcdHJvdXRlc0hhbmRsZXJzID0gYXdhaXQgbG9hZEFsbFJvdXRlc0hhbmRsZXJzKHJvdXRlcyk7XG5cdH1cblx0XG5cdGlmKF9zdGF0aWM/LlswXSA9PT0gXCIvXCIpXG5cdFx0X3N0YXRpYyA9IHJvb3REaXIoKSArIF9zdGF0aWM7XG5cdFxuXHRjb25zdCByZXF1ZXN0SGFuZGxlciA9IGJ1aWxkUmVxdWVzdEhhbmRsZXIocm91dGVzSGFuZGxlcnMsIHtcblx0XHRfc3RhdGljLFxuXHRcdGxvZ2dlcixcblx0XHRub3RfZm91bmQsXG5cdFx0aW50ZXJuYWxfZXJyb3Jcblx0fSk7XG5cblx0Ly8gaHR0cHM6Ly9kb2NzLmRlbm8uY29tL3J1bnRpbWUvdHV0b3JpYWxzL2h0dHBfc2VydmVyXG5cdGF3YWl0IERlbm8uc2VydmUoe1xuXHRcdHBvcnQsXG5cdFx0aG9zdG5hbWUsXG5cdCB9LCByZXF1ZXN0SGFuZGxlcikuZmluaXNoZWQ7XG59XG5cblxuLy9UT0RPOiByZW1vdmVcbmNsYXNzIEhUVFBFcnJvciBleHRlbmRzIEVycm9yIHtcblxuXHQjZXJyb3JfY29kZTpudW1iZXI7XG5cblx0Y29uc3RydWN0b3IoaHR0cF9lcnJvcl9jb2RlOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykge1xuXHRcdHN1cGVyKG1lc3NhZ2UpO1xuXHRcdHRoaXMubmFtZSA9IFwiSFRUUEVycm9yXCI7XG5cdFx0dGhpcy4jZXJyb3JfY29kZSA9IGh0dHBfZXJyb3JfY29kZTtcblx0fVxuXG5cdGdldCBlcnJvcl9jb2RlKCkge1xuXHRcdHJldHVybiB0aGlzLiNlcnJvcl9jb2RlO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBTU0VXcml0ZXIge1xuICAgICN3cml0ZXI6IFdyaXRhYmxlU3RyZWFtRGVmYXVsdFdyaXRlcjtcbiAgICBjb25zdHJ1Y3Rvcih3cml0ZXI6IFdyaXRhYmxlU3RyZWFtRGVmYXVsdFdyaXRlcikge1xuICAgICAgICB0aGlzLiN3cml0ZXIgPSB3cml0ZXI7XG4gICAgfVxuXG4gICAgc2VuZEV2ZW50KGRhdGE6IGFueSwgbmFtZSA9ICdtZXNzYWdlJykge1xuICAgICAgICByZXR1cm4gdGhpcy4jd3JpdGVyLndyaXRlKFxuYGV2ZW50OiAke25hbWV9XG5kYXRhOiAke0pTT04uc3RyaW5naWZ5KGRhdGEpfVxuXG5gKTtcbiAgICB9XG5cblx0Z2V0IGNsb3NlZCgpIHtcblx0XHRyZXR1cm4gdGhpcy4jd3JpdGVyLmNsb3NlZDtcblx0fVxuXG5cdGNsb3NlKCkge1xuXHRcdHJldHVybiB0aGlzLiN3cml0ZXIuY2xvc2UoKTtcblx0fVxuXG5cdGFib3J0KCkge1xuXHRcdHJldHVybiB0aGlzLiN3cml0ZXIuYWJvcnQoKTtcblx0fVxufVxuXG4vLyBoZWxwZXJcbmV4cG9ydCBjb25zdCBWU0hTID0ge1xuXHRTU0VSZXNwb25zZTogZnVuY3Rpb248VCBleHRlbmRzIGFueVtdPihjYWxsYmFjazogKHdyaXRlcjogU1NFV3JpdGVyLCAuLi5hcmdzOiBUKSA9PiBQcm9taXNlPHZvaWQ+LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQgICBvcHRpb25zOiBSZXNwb25zZUluaXQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCAgIC4uLmFyZ3M6IFQpIHtcblx0XHRjb25zdCB7cmVhZGFibGUsIHdyaXRhYmxlfSA9IG5ldyBUcmFuc2Zvcm1TdHJlYW0oKTtcblxuXHRcdGNvbnN0IHdyaXRlciA9IG5ldyBTU0VXcml0ZXIod3JpdGFibGUuZ2V0V3JpdGVyKCkpO1xuXHRcdGNhbGxiYWNrKCB3cml0ZXIsIC4uLmFyZ3MgKS5jYXRjaCggKGUpID0+IHtcblx0XHRcdHdyaXRlci5hYm9ydCgpO1xuXHRcdFx0dGhyb3cgZTtcblx0XHR9KVxuXHRcblx0XHRjb25zdCBzdHJlYW0gPSByZWFkYWJsZS5waXBlVGhyb3VnaCggbmV3IFRleHRFbmNvZGVyU3RyZWFtKCkgKTtcblxuXHRcdG9wdGlvbnM/Pz0ge307XG5cdFx0b3B0aW9ucy5oZWFkZXJzPz89e307XG5cdFx0aWYoIG9wdGlvbnMuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcblx0XHRcdGlmKCAhIG9wdGlvbnMuaGVhZGVycy5oYXMoXCJDb250ZW50LVR5cGVcIikgKVxuXHRcdFx0XHRvcHRpb25zLmhlYWRlcnMuc2V0KFwiQ29udGVudC1UeXBlXCIsIFwidGV4dC9ldmVudC1zdHJlYW1cIik7XG5cdFx0fSBlbHNlXG5cdFx0XHQob3B0aW9ucy5oZWFkZXJzIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pW1wiQ29udGVudC1UeXBlXCJdID8/PSBcInRleHQvZXZlbnQtc3RyZWFtXCI7XG5cblxuXHRcdHJldHVybiBuZXcgUmVzcG9uc2Uoc3RyZWFtLCBvcHRpb25zKTtcblxuXHR9XG59O1xuLy8gQHRzLWlnbm9yZVxuZ2xvYmFsVGhpcy5WU0hTID0gVlNIUztcblxuZXhwb3J0IHR5cGUgSGFuZGxlclBhcmFtcyA9IFtcblx0UmVxdWVzdCwge1xuXHRcdHBhdGg6IHN0cmluZyxcblx0XHR2YXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG5cdH1cbl07XG5cbnR5cGUgSGFuZGxlciA9ICguLi5hcmdzOiBIYW5kbGVyUGFyYW1zKSA9PiBQcm9taXNlPGFueT47XG50eXBlIFJvdXRlcyAgPSAocmVhZG9ubHkgW3N0cmluZywgSGFuZGxlciwgYm9vbGVhbl0pW107XG5cbmxldCBicnl0aG9uX2xvYWRpbmcgID0gZmFsc2U7XG5sZXQgYnJ5dGhvbl9wcm9taXNlID0gUHJvbWlzZS53aXRoUmVzb2x2ZXJzPHZvaWQ+KCk7XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRfYnJ5dGhvbigpIHtcblx0aWYoIGJyeXRob25fbG9hZGluZyApIHtcblx0XHRhd2FpdCBicnl0aG9uX3Byb21pc2UucHJvbWlzZVxuXHRcdHJldHVybjtcblx0fVxuXG5cdGJyeXRob25fbG9hZGluZyA9IHRydWU7XG5cblx0Ly9icnl0aG9uID0gYXdhaXQgKGF3YWl0IGZldGNoKCBcImh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2JyeXRob24vMy4xMy4wL2JyeXRob24ubWluLmpzXCIgKSkudGV4dCgpO1xuXHRjb25zdCBmaWxlID0gXCJicnl0aG9uKDEpXCI7XG5cdGNvbnN0IGRpciA9IGltcG9ydC5tZXRhLnVybC5zbGljZSg2LCBpbXBvcnQubWV0YS51cmwubGFzdEluZGV4T2YoJy8nKSApO1xuXHRjb25zdCBicnl0aG9uID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoZGlyICsgYC8ke2ZpbGV9LmpzYCk7XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRnbG9iYWxUaGlzLiRCICA9IGdsb2JhbFRoaXMuX19CUllUSE9OX18gPSB7fTsgLy8gd2h5IGlzIGl0IHJlcXVpcmVkID8/P1xuXHQvLyBAdHMtaWdub3JlXG5cdGdsb2JhbFRoaXMuaW5uZXIgPSBudWxsO1xuXHQvLyBAdHMtaWdub3JlXG5cdGdsb2JhbFRoaXMuZ2xvYmFsID0ge307XG5cdC8vIEB0cy1pZ25vcmVcblx0Z2xvYmFsVGhpcy5tb2R1bGUgPSB7fTtcblx0ZXZhbChicnl0aG9uKTtcblxuXHRjb25zb2xlLndhcm4oXCI9PSBsb2FkZWQgPT1cIik7XG5cdGJyeXRob25fcHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRBbGxSb3V0ZXNIYW5kbGVycyhyb3V0ZXM6IHN0cmluZyk6IFByb21pc2U8Um91dGVzPiB7XG5cblx0Y29uc3QgUk9PVCA9IHJvb3REaXIoKTtcblx0bGV0IHJvdXRlc191cmkgPSBhd2FpdCBnZXRBbGxSb3V0ZXMocm91dGVzKTtcblxuXHR0eXBlIE1vZHVsZSA9IHtkZWZhdWx0OiBIYW5kbGVyfTtcblx0Y29uc3QgaGFuZGxlcnMgICA9IGF3YWl0IFByb21pc2UuYWxsKCByb3V0ZXNfdXJpLm1hcCggYXN5bmMgKHVyaSkgPT4ge1xuXG5cdFx0Ly8gb25seSB3aXRoIGltcG9ydHMgbWFwLCBidXQgYnVnZ2VkXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vaXNzdWVzLzIyMjM3XG5cdFx0Ly9pZiggdXJpLnN0YXJ0c1dpdGgoUk9PVCkgKVxuXHRcdC8vXHR1cmkgPSB1cmkuc2xpY2UoUk9PVC5sZW5ndGgpXG5cblx0XHQvKmlmKCB1cmlbMV0gPT09ICc6JyApIC8vIHdpbmRvd3MgZHJpdmVcblx0XHRcdHVyaSA9IGBmaWxlOi8vJHt1cml9YDsqL1xuXG5cdFx0Y29uc3QgaXNfYnJ5dGhvbiA9IHVyaS5lbmRzV2l0aCgnLmJyeScpO1xuXHRcdGxldCBleHQgPSBpc19icnl0aG9uID8gXCIuYnJ5XCIgOiBcIi50c1wiXG5cdFx0bGV0IHJvdXRlID0gdXJpLnNsaWNlKHJvdXRlcy5sZW5ndGgsIC0gZXh0Lmxlbmd0aCk7XG5cblx0XHRsZXQgbW9kdWxlITogTW9kdWxlO1xuXHRcdHRyeXtcblxuXHRcdFx0bGV0IGNvZGUgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZSh1cmkpO1xuXG5cdFx0XHRpZiggcm91dGUuZW5kc1dpdGgoJ2luZGV4JykgKVxuXHRcdFx0XHRyb3V0ZSA9IGNvZGUuc2xpY2UoMywgY29kZS5pbmRleE9mKCdcXG4nKSAtIGV4dC5sZW5ndGggKTtcblxuXHRcdFx0aWYoIGlzX2JyeXRob24gKSB7XG5cblx0XHRcdFx0YXdhaXQgbG9hZF9icnl0aG9uKCk7XG5cblx0XHRcdFx0Ly9UT0RPOiBkdXBsaWNhdGVkIGNvZGUgd2l0aCBwbGF5Z3JvdW5kLi4uICghIFxcYCB2cyBcXFxcXFxgKS5cblx0XHRcdFx0Y29kZSA9IGBjb25zdCAkQiA9IGdsb2JhbFRoaXMuX19CUllUSE9OX187XG5cblx0XHRcdFx0JEIucnVuUHl0aG9uU291cmNlKFxcYCR7Y29kZX1cXGAsIFwiX1wiKTtcblxuXHRcdFx0XHRjb25zdCBtb2R1bGUgPSAkQi5pbXBvcnRlZFtcIl9cIl07XG5cdFx0XHRcdGNvbnN0IGZjdCAgICA9ICRCLnB5b2JqMmpzb2JqKG1vZHVsZS5SZXF1ZXN0SGFuZGxlcik7XG5cblx0XHRcdFx0Y29uc3QgZmN0MiA9IGFzeW5jICguLi5hcmdzKSA9PiB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IHIgPSBhd2FpdCBmY3QoLi4uYXJncyk7XG5cdFx0XHRcdFx0XHRpZiggcj8uX19jbGFzc19fPy5fX3F1YWxuYW1lX18gPT09IFwiTm9uZVR5cGVcIilcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdHJldHVybiByO1xuXHRcdFx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHRcdFx0aWYoICEgKFwiJHB5X2Vycm9yXCIgaW4gZSkgKVxuXHRcdFx0XHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0XHRcdFx0bGV0IGpzX2Vycm9yID0gZS5hcmdzWzBdO1xuXG5cdFx0XHRcdFx0XHRpZiggISAoanNfZXJyb3IgaW5zdGFuY2VvZiBSZXNwb25zZSkgKVxuXHRcdFx0XHRcdFx0XHRqc19lcnJvciA9IG5ldyBFcnJvcihqc19lcnJvcik7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHRocm93IGpzX2Vycm9yO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV4cG9ydCBkZWZhdWx0IGZjdDI7XG5cdFx0XHRcdGA7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoIG5ldyBCbG9iKFtjb2RlXSwge3R5cGU6IFwidGV4dC9qYXZhc2NyaXB0XCJ9KSk7XG5cblx0XHRcdG1vZHVsZSA9IGF3YWl0IGltcG9ydCggdXJsICk7XG5cblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGFuZGxlcjogSGFuZGxlciA9IG1vZHVsZS5kZWZhdWx0O1xuXG5cdFx0cmV0dXJuIFtyb3V0ZSwgaGFuZGxlciwgaXNfYnJ5dGhvbl0gYXMgY29uc3Q7XG5cdH0pKTtcblxuXHRyZXR1cm4gaGFuZGxlcnM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFsbFJvdXRlcyhjdXJyZW50UGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuXG5cdGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuXG5cdGZvciBhd2FpdCAoY29uc3QgZGlyRW50cnkgb2YgRGVuby5yZWFkRGlyKGN1cnJlbnRQYXRoKSkge1xuXG5cdFx0Y29uc3QgZW50cnlQYXRoID0gYCR7Y3VycmVudFBhdGh9LyR7ZGlyRW50cnkubmFtZX1gO1xuXG5cdFx0aWYgKCAhIGRpckVudHJ5LmlzRGlyZWN0b3J5KSB7XG5cblx0XHRcdGlmKCAhIFtcInRlc3QudHNcIiwgXCJyZXF1ZXN0LmJyeVwiLCBcInJlcXVlc3QuanNcIl0uaW5jbHVkZXMoZGlyRW50cnkubmFtZSkgKVxuXHRcdFx0XHRmaWxlcy5wdXNoKCBlbnRyeVBhdGggKVxuXHRcdH0gZWxzZVxuXHRcdFx0ZmlsZXMucHVzaCguLi4gYXdhaXQgZ2V0QWxsUm91dGVzKGVudHJ5UGF0aCkpO1xuXG5cdH1cblxuXHRyZXR1cm4gZmlsZXM7XG59XG5cbnR5cGUgUkVTVF9NZXRob2RzID0gXCJQT1NUXCJ8XCJHRVRcInxcIkRFTEVURVwifFwiUFVUXCJ8XCJQQVRDSFwiO1xuXG5jb25zdCBDT1JTX0hFQURFUlMgPSB7XG5cdFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLFxuXHRcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIjogXCIqXCIsIC8vIFBPU1QsIEdFVCwgUEFUQ0gsIFBVVCwgT1BUSU9OUywgREVMRVRFXG5cdFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOiBcIipcIiAgLy8gXCJ1c2UtYnJ5dGhvblwiXG59O1xuXG5mdW5jdGlvbiBidWlsZEFuc3dlcihyZXNwb25zZTogUmVzcG9uc2V8bnVsbCA9IG51bGwpIHtcblxuXHRpZiggcmVzcG9uc2UgPT09IG51bGwgKVxuXHRcdHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwpO1xuXG5cdC8vIFByb2JhYmx5IFdlYlNvY2tldCB1cGdyYWRlXG5cdGlmKCByZXNwb25zZS5zdGF0dXMgPT09IDEwMSlcblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cblx0aWYoICEgKHJlc3BvbnNlIGluc3RhbmNlb2YgUmVzcG9uc2UpICkge1xuXHRcdGNvbnNvbGUud2FybihyZXNwb25zZSk7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiUmVxdWVzdCBoYW5kbGVyIHJldHVybmVkIHNvbWV0aGluZyBlbHNlIHRoYW4gYSBSZXNwb25zZVwiKTtcblx0fVxuXG5cdGNvbnN0IHJlcF9oZWFkZXJzID0gbmV3IEhlYWRlcnMocmVzcG9uc2UuaGVhZGVycyk7XG5cblx0Zm9yKGxldCBuYW1lIGluIENPUlNfSEVBREVSUylcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0cmVwX2hlYWRlcnMuc2V0KG5hbWUsIENPUlNfSEVBREVSU1tuYW1lXSlcblxuXHRjb25zdCByZXAgPSBuZXcgUmVzcG9uc2UoIHJlc3BvbnNlLmJvZHksIHtcblx0XHRzdGF0dXMgICAgOiByZXNwb25zZS5zdGF0dXMsXG5cdFx0c3RhdHVzVGV4dDogcmVzcG9uc2Uuc3RhdHVzVGV4dCxcblx0XHRoZWFkZXJzICAgOiByZXBfaGVhZGVyc1xuXHR9ICk7XG5cblx0cmV0dXJuIHJlcDtcbn1cblxudHlwZSBidWlsZFJlcXVlc3RIYW5kbGVyT3B0cyA9IHtcblx0X3N0YXRpYz86IHN0cmluZyxcblx0bG9nZ2VyPzogTG9nZ2VyLFxuXHRub3RfZm91bmQgICAgIDogc3RyaW5nLFxuXHRpbnRlcm5hbF9lcnJvcjogc3RyaW5nXG59XG5cbnR5cGUgRGVmYXVsdFJvdXRlT3B0cyA9IHtcblx0cm91dGUgICA6IFJvdXRlfG51bGwsXG5cdGVycm9yICA/OiBFcnJvcixcbn0gJiBSb3V0ZTtcblxuYXN5bmMgZnVuY3Rpb24gZGVmYXVsdF9oYW5kbGVyKHJlcXVlc3Q6IFJlcXVlc3QsIG9wdHM6IERlZmF1bHRSb3V0ZU9wdHMpIHtcblxuXHRjb25zb2xlLndhcm4oXCJjYWxsZWRcIiwgb3B0cywgb3B0cy5lcnJvcik7XG5cblx0aWYoIFwiZXJyb3JcIiBpbiBvcHRzIClcblx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKG9wdHMuZXJyb3IhLm1lc3NhZ2UsIHtzdGF0dXM6IDUwMH0pO1xuXG5cdC8vVE9ETyBhc3NldHNcblxuXHRyZXR1cm4gbmV3IFJlc3BvbnNlKGAke3JlcXVlc3QudXJsfSBub3QgZm91bmRgLCB7c3RhdHVzOiA0MDR9KTtcblxuXHQvKlxuXHRcdC8vIHVzZSBhc3luYyA/XG5cdFx0Ly9pbXBvcnQgeyBtaW1lbGl0ZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L21pbWV0eXBlc0B2MS4wLjAvbW9kLnRzXCI7XG5cblx0XHRpZiggX3N0YXRpYyA9PT0gdW5kZWZpbmVkIClcblx0XHRcdHRocm93IG5ldyBIVFRQRXJyb3IoNDA0LCBcIk5vdCBmb3VuZFwiKTtcblxuXHRcdGxldCBmaWxlcGF0aCA9IGAke19zdGF0aWN9LyR7dXJsLnBhdGhuYW1lfWA7XG5cdFx0bGV0IGNvbnRlbnQhOiBVaW50OEFycmF5O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGluZm8gPSBhd2FpdCBEZW5vLnN0YXQoZmlsZXBhdGgpO1xuXG5cdFx0XHRpZiggaW5mby5pc0RpcmVjdG9yeSApXG5cdFx0XHRcdGZpbGVwYXRoID0gYCR7ZmlsZXBhdGh9L2luZGV4Lmh0bWxgO1xuXG5cdFx0XHRjb250ZW50ID0gYXdhaXQgRGVuby5yZWFkRmlsZShmaWxlcGF0aCk7XG5cblx0XHR9IGNhdGNoKGUpIHtcblxuXHRcdFx0aWYoZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKVxuXHRcdFx0XHR0aHJvdyBuZXcgSFRUUEVycm9yKDQwNCwgXCJOb3QgRm91bmRcIik7XG5cdFx0XHRpZiggZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLlBlcm1pc3Npb25EZW5pZWQgKVxuXHRcdFx0XHR0aHJvdyBuZXcgSFRUUEVycm9yKDQwMywgXCJGb3JiaWRkZW5cIik7XG5cdFx0XHRcblx0XHRcdHRocm93IG5ldyBIVFRQRXJyb3IoNTAwLCAoZSBhcyBhbnkpLm1lc3NhZ2UpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHBhcnRzID0gZmlsZXBhdGguc3BsaXQoJy4nKTtcblx0XHRjb25zdCBleHQgPSBwYXJ0c1twYXJ0cy5sZW5ndGgtMV07XG5cblx0XHRjb25zdCBtaW1lID0gbnVsbDsgLy9taW1lbGl0ZS5nZXRUeXBlKGV4dCkgPz8gXCJ0ZXh0L3BsYWluXCI7XG5cdFx0XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQnKTtcblx0XHQvL3JldHVybiBhd2FpdCBidWlsZEFuc3dlcigyMDAsIGNvbnRlbnQsIG1pbWUpO1xuXHQqL1xufVxuXG5jb25zdCBkZWZhdWx0X3JvdXRlID0ge1xuXHRoYW5kbGVyOiBkZWZhdWx0X2hhbmRsZXIsXG5cdHBhdGggICA6IFwiL2RlZmF1bHRcIixcblx0dmFycyAgIDoge31cbn1cblxuZnVuY3Rpb24gYnVpbGRSZXF1ZXN0SGFuZGxlcihyb3V0ZXM6IFJvdXRlcywge1xuXHRfc3RhdGljLFxuXHRsb2dnZXIgLFxuXHRub3RfZm91bmQgICAgICA9IFwiL2RlZmF1bHQvR0VUXCIsXG5cdGludGVybmFsX2Vycm9yID0gXCIvZGVmYXVsdC9HRVRcIlxufTogUGFydGlhbDxidWlsZFJlcXVlc3RIYW5kbGVyT3B0cz4pIHtcblxuXHRjb25zdCByZWdleGVzID0gcm91dGVzLm1hcCggKFt1cmksIGhhbmRsZXIsIGlzX2JyeV0pID0+IFtwYXRoMnJlZ2V4KHVyaSksIGhhbmRsZXIsIHVyaSwgaXNfYnJ5XSBhcyBjb25zdCk7XG5cblx0Y29uc3Qgbm90X2ZvdW5kX3JvdXRlID0gW1xuXHRcdGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBub3RfZm91bmQsIGZhbHNlKSA/PyBkZWZhdWx0X3JvdXRlLFxuXHRcdGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBub3RfZm91bmQsIHRydWUpICA/PyBkZWZhdWx0X3JvdXRlXG5cdF0gYXMgRGVmYXVsdFJvdXRlT3B0c1tdO1xuXHRjb25zdCBpbnRlcm5hbF9lcnJvcl9yb3V0ZSA9IFtcblx0XHRnZXRSb3V0ZUhhbmRsZXIocmVnZXhlcywgXCJHRVRcIiwgaW50ZXJuYWxfZXJyb3IsIGZhbHNlKSA/PyBkZWZhdWx0X3JvdXRlLFxuXHRcdGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBpbnRlcm5hbF9lcnJvciwgdHJ1ZSkgID8/IGRlZmF1bHRfcm91dGVcblx0XSBhcyBEZWZhdWx0Um91dGVPcHRzW107XG5cblx0cmV0dXJuIGFzeW5jIGZ1bmN0aW9uKHJlcXVlc3Q6IFJlcXVlc3QsIGNvbm5JbmZvOiBhbnkpOiBQcm9taXNlPFJlc3BvbnNlPiB7XG5cblx0XHRjb25zdCBpcCA9IGNvbm5JbmZvLnJlbW90ZUFkZHIuaG9zdG5hbWU7XG5cblx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKHJlcXVlc3QudXJsKTtcblx0XHRsZXQgZXJyb3IgPSBudWxsO1xuXHRcdGNvbnN0IG1ldGhvZCA9IHJlcXVlc3QubWV0aG9kIGFzIFJFU1RfTWV0aG9kcyB8IFwiT1BUSU9OU1wiO1xuXG5cdFx0bGV0IGFuc3dlcjogUmVzcG9uc2V8dW5kZWZpbmVkO1xuXHRcdGxldCB1c2VfYnJ5dGhvbjogbnVsbHxib29sZWFuID0gbnVsbDtcblxuXHRcdGxldCByb3V0ZTogUm91dGV8bnVsbCA9IG51bGw7XG5cblx0XHR0cnkge1xuXG5cdFx0XHRpZihtZXRob2QgPT09IFwiT1BUSU9OU1wiKVxuXHRcdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtoZWFkZXJzOiBDT1JTX0hFQURFUlN9KTtcblxuXHRcdFx0aWYoIHJlcXVlc3QuaGVhZGVycy5oYXMoXCJ1c2UtYnJ5dGhvblwiKSApXG5cdFx0XHRcdHVzZV9icnl0aG9uID0gcmVxdWVzdC5oZWFkZXJzLmdldChcInVzZS1icnl0aG9uXCIpID09PSBcInRydWVcIjtcblxuXHRcdFx0cm91dGUgPSBnZXRSb3V0ZUhhbmRsZXIocmVnZXhlcywgbWV0aG9kLCB1cmwsIHVzZV9icnl0aG9uKTtcblxuXHRcdFx0aWYoIHJvdXRlICE9PSBudWxsKSB7XG5cdFx0XHRcdGFuc3dlciA9IGF3YWl0IHJvdXRlLmhhbmRsZXIocmVxdWVzdCwgcm91dGUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgX3JvdXRlID0gYXdhaXQgbm90X2ZvdW5kX3JvdXRlWyt1c2VfYnJ5dGhvbiFdO1xuXHRcdFx0XHRfcm91dGUucm91dGUgPSByb3V0ZTtcblx0XHRcdFx0YW5zd2VyID0gYXdhaXQgX3JvdXRlLmhhbmRsZXIocmVxdWVzdCwgX3JvdXRlKVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYnVpbGRBbnN3ZXIoYW5zd2VyKTtcblxuXHRcdH0gY2F0Y2goZSkge1xuXG5cdFx0XHRpZiggISAoZSBpbnN0YW5jZW9mIFJlc3BvbnNlKSApIHtcblx0XHRcdFx0Y29uc3QgX3JvdXRlID0gaW50ZXJuYWxfZXJyb3Jfcm91dGVbK3VzZV9icnl0aG9uIV07XG5cdFx0XHRcdF9yb3V0ZS5yb3V0ZSA9IHJvdXRlO1xuXHRcdFx0XHRfcm91dGUuZXJyb3IgPSBlIGFzIEVycm9yO1xuXHRcdFx0XHRlID0gYXdhaXQgX3JvdXRlLmhhbmRsZXIocmVxdWVzdCwgX3JvdXRlKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGJ1aWxkQW5zd2VyKGUgYXMgUmVzcG9uc2UpO1xuXG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGlmKCBsb2dnZXIgIT09IHVuZGVmaW5lZCApXG5cdFx0XHRcdGxvZ2dlcihpcCwgbWV0aG9kLCB1cmwsIGVycm9yKTtcblx0XHR9XG5cdH07XG59XG5cblxuLy8gdGVzdHNcblxuZXhwb3J0IGZ1bmN0aW9uIHBhdGgycmVnZXgocGF0aDogc3RyaW5nKSB7XG5cblx0Ly8gRXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycy5cblx0Ly8gY2YgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzExNTE1MC9ob3ctdG8tZXNjYXBlLXJlZ3VsYXItZXhwcmVzc2lvbi1zcGVjaWFsLWNoYXJhY3RlcnMtdXNpbmctamF2YXNjcmlwdFxuXHRwYXRoID0gcGF0aC5yZXBsYWNlKC9bLVtcXF17fSgpKis/LixcXFxcXiR8I1xcc10vZywgJ1xcXFwkJicpO1xuXG5cdHJldHVybiBuZXcgUmVnRXhwKFwiXlwiICsgcGF0aC5yZXBsYWNlKC9cXFxcXFx7W15cXH1dK1xcXFxcXH0vZywgKGNhcHR1cmVkKSA9PiBgKD88JHtjYXB0dXJlZC5zbGljZSgyLC0yKX0+W14vXSspYCkgKyBcIiRcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaChyZWdleDogUmVnRXhwLCB1cmk6IHN0cmluZykge1xuXG5cdGxldCByZXN1bHQgPSByZWdleC5leGVjKHVyaSk7XG5cblx0aWYocmVzdWx0ID09PSBudWxsKVxuXHRcdHJldHVybiBmYWxzZTtcblxuXHRyZXR1cm4gcmVzdWx0Lmdyb3VwcyA/PyB7fTtcbn1cblxudHlwZSBSb3V0ZSA9IHtcblx0aGFuZGxlcjogSGFuZGxlcixcblx0cGF0aCAgIDogc3RyaW5nLFxuXHR2YXJzICAgOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG59XG5cbmZ1bmN0aW9uIGdldFJvdXRlSGFuZGxlcihyZWdleGVzOiAocmVhZG9ubHkgW1JlZ0V4cCwgSGFuZGxlciwgc3RyaW5nLCBib29sZWFuXSlbXSxcblx0XHRcdFx0XHRcdG1ldGhvZDogUkVTVF9NZXRob2RzLFxuXHRcdFx0XHRcdFx0dXJsOiBVUkx8c3RyaW5nLFxuXHRcdFx0XHRcdFx0dXNlX2JyeXRob246IGJvb2xlYW58bnVsbCA9IG51bGwpOiBSb3V0ZXxudWxsIHtcblxuXHRsZXQgY3VyUm91dGU6IHN0cmluZztcblx0aWYoIHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIpXG5cdFx0Y3VyUm91dGUgPSBgJHt1cmx9LyR7bWV0aG9kfWA7XG5cdGVsc2Vcblx0XHRjdXJSb3V0ZSA9IGAkeyBkZWNvZGVVUkkodXJsLnBhdGhuYW1lKSB9LyR7bWV0aG9kfWA7XG5cblx0Zm9yKGxldCByb3V0ZSBvZiByZWdleGVzKSB7XG5cblx0XHRpZiggdXNlX2JyeXRob24gIT09IG51bGwgJiYgcm91dGVbM10gIT09IHVzZV9icnl0aG9uIClcblx0XHRcdGNvbnRpbnVlO1xuXG5cdFx0dmFyIHZhcnMgPSBtYXRjaChyb3V0ZVswXSwgY3VyUm91dGUpO1xuXG5cdFx0aWYodmFycyAhPT0gZmFsc2UpXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRoYW5kbGVyOiByb3V0ZVsxXSxcblx0XHRcdFx0cGF0aCAgIDogcm91dGVbMl0sXG5cdFx0XHRcdHZhcnNcblx0XHRcdH07XG5cdH1cblxuXHRyZXR1cm4gbnVsbDtcbn0iLCJleHBvcnQge3BhdGgycmVnZXgsIG1hdGNofSBmcm9tIFwiLi4vVlNIU1wiOyIsImZ1bmN0aW9uIHdlYnBhY2tFbXB0eUFzeW5jQ29udGV4dChyZXEpIHtcblx0Ly8gSGVyZSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCkgaXMgdXNlZCBpbnN0ZWFkIG9mIG5ldyBQcm9taXNlKCkgdG8gcHJldmVudFxuXHQvLyB1bmNhdWdodCBleGNlcHRpb24gcG9wcGluZyB1cCBpbiBkZXZ0b29sc1xuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgcmVxICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9KTtcbn1cbndlYnBhY2tFbXB0eUFzeW5jQ29udGV4dC5rZXlzID0gKCkgPT4gKFtdKTtcbndlYnBhY2tFbXB0eUFzeW5jQ29udGV4dC5yZXNvbHZlID0gd2VicGFja0VtcHR5QXN5bmNDb250ZXh0O1xud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LmlkID0gXCIuLy4gbGF6eSByZWN1cnNpdmVcIjtcbm1vZHVsZS5leHBvcnRzID0gd2VicGFja0VtcHR5QXN5bmNDb250ZXh0OyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuIiwidmFyIHdlYnBhY2tRdWV1ZXMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgPyBTeW1ib2woXCJ3ZWJwYWNrIHF1ZXVlc1wiKSA6IFwiX193ZWJwYWNrX3F1ZXVlc19fXCI7XG52YXIgd2VicGFja0V4cG9ydHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgPyBTeW1ib2woXCJ3ZWJwYWNrIGV4cG9ydHNcIikgOiBcIl9fd2VicGFja19leHBvcnRzX19cIjtcbnZhciB3ZWJwYWNrRXJyb3IgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgPyBTeW1ib2woXCJ3ZWJwYWNrIGVycm9yXCIpIDogXCJfX3dlYnBhY2tfZXJyb3JfX1wiO1xudmFyIHJlc29sdmVRdWV1ZSA9IChxdWV1ZSkgPT4ge1xuXHRpZihxdWV1ZSAmJiBxdWV1ZS5kIDwgMSkge1xuXHRcdHF1ZXVlLmQgPSAxO1xuXHRcdHF1ZXVlLmZvckVhY2goKGZuKSA9PiAoZm4uci0tKSk7XG5cdFx0cXVldWUuZm9yRWFjaCgoZm4pID0+IChmbi5yLS0gPyBmbi5yKysgOiBmbigpKSk7XG5cdH1cbn1cbnZhciB3cmFwRGVwcyA9IChkZXBzKSA9PiAoZGVwcy5tYXAoKGRlcCkgPT4ge1xuXHRpZihkZXAgIT09IG51bGwgJiYgdHlwZW9mIGRlcCA9PT0gXCJvYmplY3RcIikge1xuXHRcdGlmKGRlcFt3ZWJwYWNrUXVldWVzXSkgcmV0dXJuIGRlcDtcblx0XHRpZihkZXAudGhlbikge1xuXHRcdFx0dmFyIHF1ZXVlID0gW107XG5cdFx0XHRxdWV1ZS5kID0gMDtcblx0XHRcdGRlcC50aGVuKChyKSA9PiB7XG5cdFx0XHRcdG9ialt3ZWJwYWNrRXhwb3J0c10gPSByO1xuXHRcdFx0XHRyZXNvbHZlUXVldWUocXVldWUpO1xuXHRcdFx0fSwgKGUpID0+IHtcblx0XHRcdFx0b2JqW3dlYnBhY2tFcnJvcl0gPSBlO1xuXHRcdFx0XHRyZXNvbHZlUXVldWUocXVldWUpO1xuXHRcdFx0fSk7XG5cdFx0XHR2YXIgb2JqID0ge307XG5cdFx0XHRvYmpbd2VicGFja1F1ZXVlc10gPSAoZm4pID0+IChmbihxdWV1ZSkpO1xuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR9XG5cdH1cblx0dmFyIHJldCA9IHt9O1xuXHRyZXRbd2VicGFja1F1ZXVlc10gPSB4ID0+IHt9O1xuXHRyZXRbd2VicGFja0V4cG9ydHNdID0gZGVwO1xuXHRyZXR1cm4gcmV0O1xufSkpO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5hID0gKG1vZHVsZSwgYm9keSwgaGFzQXdhaXQpID0+IHtcblx0dmFyIHF1ZXVlO1xuXHRoYXNBd2FpdCAmJiAoKHF1ZXVlID0gW10pLmQgPSAtMSk7XG5cdHZhciBkZXBRdWV1ZXMgPSBuZXcgU2V0KCk7XG5cdHZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHM7XG5cdHZhciBjdXJyZW50RGVwcztcblx0dmFyIG91dGVyUmVzb2x2ZTtcblx0dmFyIHJlamVjdDtcblx0dmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqKSA9PiB7XG5cdFx0cmVqZWN0ID0gcmVqO1xuXHRcdG91dGVyUmVzb2x2ZSA9IHJlc29sdmU7XG5cdH0pO1xuXHRwcm9taXNlW3dlYnBhY2tFeHBvcnRzXSA9IGV4cG9ydHM7XG5cdHByb21pc2Vbd2VicGFja1F1ZXVlc10gPSAoZm4pID0+IChxdWV1ZSAmJiBmbihxdWV1ZSksIGRlcFF1ZXVlcy5mb3JFYWNoKGZuKSwgcHJvbWlzZVtcImNhdGNoXCJdKHggPT4ge30pKTtcblx0bW9kdWxlLmV4cG9ydHMgPSBwcm9taXNlO1xuXHRib2R5KChkZXBzKSA9PiB7XG5cdFx0Y3VycmVudERlcHMgPSB3cmFwRGVwcyhkZXBzKTtcblx0XHR2YXIgZm47XG5cdFx0dmFyIGdldFJlc3VsdCA9ICgpID0+IChjdXJyZW50RGVwcy5tYXAoKGQpID0+IHtcblx0XHRcdGlmKGRbd2VicGFja0Vycm9yXSkgdGhyb3cgZFt3ZWJwYWNrRXJyb3JdO1xuXHRcdFx0cmV0dXJuIGRbd2VicGFja0V4cG9ydHNdO1xuXHRcdH0pKVxuXHRcdHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGZuID0gKCkgPT4gKHJlc29sdmUoZ2V0UmVzdWx0KSk7XG5cdFx0XHRmbi5yID0gMDtcblx0XHRcdHZhciBmblF1ZXVlID0gKHEpID0+IChxICE9PSBxdWV1ZSAmJiAhZGVwUXVldWVzLmhhcyhxKSAmJiAoZGVwUXVldWVzLmFkZChxKSwgcSAmJiAhcS5kICYmIChmbi5yKyssIHEucHVzaChmbikpKSk7XG5cdFx0XHRjdXJyZW50RGVwcy5tYXAoKGRlcCkgPT4gKGRlcFt3ZWJwYWNrUXVldWVzXShmblF1ZXVlKSkpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBmbi5yID8gcHJvbWlzZSA6IGdldFJlc3VsdCgpO1xuXHR9LCAoZXJyKSA9PiAoKGVyciA/IHJlamVjdChwcm9taXNlW3dlYnBhY2tFcnJvcl0gPSBlcnIpIDogb3V0ZXJSZXNvbHZlKGV4cG9ydHMpKSwgcmVzb2x2ZVF1ZXVlKHF1ZXVlKSkpO1xuXHRxdWV1ZSAmJiBxdWV1ZS5kIDwgMCAmJiAocXVldWUuZCA9IDApO1xufTsiLCJ2YXIgZ2V0UHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgPyAob2JqKSA9PiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikpIDogKG9iaikgPT4gKG9iai5fX3Byb3RvX18pO1xudmFyIGxlYWZQcm90b3R5cGVzO1xuLy8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4vLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbi8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuLy8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4vLyBtb2RlICYgMTY6IHJldHVybiB2YWx1ZSB3aGVuIGl0J3MgUHJvbWlzZS1saWtlXG4vLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuXHRpZihtb2RlICYgMSkgdmFsdWUgPSB0aGlzKHZhbHVlKTtcblx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcblx0aWYodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSkge1xuXHRcdGlmKChtb2RlICYgNCkgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuXHRcdGlmKChtb2RlICYgMTYpICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nKSByZXR1cm4gdmFsdWU7XG5cdH1cblx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcblx0dmFyIGRlZiA9IHt9O1xuXHRsZWFmUHJvdG90eXBlcyA9IGxlYWZQcm90b3R5cGVzIHx8IFtudWxsLCBnZXRQcm90byh7fSksIGdldFByb3RvKFtdKSwgZ2V0UHJvdG8oZ2V0UHJvdG8pXTtcblx0Zm9yKHZhciBjdXJyZW50ID0gbW9kZSAmIDIgJiYgdmFsdWU7IHR5cGVvZiBjdXJyZW50ID09ICdvYmplY3QnICYmICF+bGVhZlByb3RvdHlwZXMuaW5kZXhPZihjdXJyZW50KTsgY3VycmVudCA9IGdldFByb3RvKGN1cnJlbnQpKSB7XG5cdFx0T2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoY3VycmVudCkuZm9yRWFjaCgoa2V5KSA9PiAoZGVmW2tleV0gPSAoKSA9PiAodmFsdWVba2V5XSkpKTtcblx0fVxuXHRkZWZbJ2RlZmF1bHQnXSA9ICgpID0+ICh2YWx1ZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChucywgZGVmKTtcblx0cmV0dXJuIG5zO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmYgPSB7fTtcbi8vIFRoaXMgZmlsZSBjb250YWlucyBvbmx5IHRoZSBlbnRyeSBjaHVuay5cbi8vIFRoZSBjaHVuayBsb2FkaW5nIGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIGNodW5rc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5lID0gKGNodW5rSWQpID0+IHtcblx0cmV0dXJuIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uZikucmVkdWNlKChwcm9taXNlcywga2V5KSA9PiB7XG5cdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mW2tleV0oY2h1bmtJZCwgcHJvbWlzZXMpO1xuXHRcdHJldHVybiBwcm9taXNlcztcblx0fSwgW10pKTtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnUgPSAoY2h1bmtJZCkgPT4ge1xuXHQvLyByZXR1cm4gdXJsIGZvciBmaWxlbmFtZXMgYmFzZWQgb24gdGVtcGxhdGVcblx0cmV0dXJuIFwiXCIgKyBjaHVua0lkICsgXCIubWpzXCI7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5taW5pQ3NzRiA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gdW5kZWZpbmVkO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjsiLCIvLyBubyBiYXNlVVJJXG5cbi8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4vLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbi8vIFtyZXNvbHZlLCBQcm9taXNlXSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbnZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG5cdFwibWFpblwiOiAwXG59O1xuXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0dmFyIHtpZHMsIG1vZHVsZXMsIHJ1bnRpbWV9ID0gZGF0YTtcblx0Ly8gYWRkIFwibW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcblx0Ly8gdGhlbiBmbGFnIGFsbCBcImlkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuXHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwO1xuXHRmb3IobW9kdWxlSWQgaW4gbW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubVttb2R1bGVJZF0gPSBtb2R1bGVzW21vZHVsZUlkXTtcblx0XHR9XG5cdH1cblx0aWYocnVudGltZSkgcnVudGltZShfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblx0Zm9yKDtpIDwgaWRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y2h1bmtJZCA9IGlkc1tpXTtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oaW5zdGFsbGVkQ2h1bmtzLCBjaHVua0lkKSAmJiBpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSgpO1xuXHRcdH1cblx0XHRpbnN0YWxsZWRDaHVua3NbaWRzW2ldXSA9IDA7XG5cdH1cblxufVxuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmYuaiA9IChjaHVua0lkLCBwcm9taXNlcykgPT4ge1xuXHRcdC8vIGltcG9ydCgpIGNodW5rIGxvYWRpbmcgZm9yIGphdmFzY3JpcHRcblx0XHR2YXIgaW5zdGFsbGVkQ2h1bmtEYXRhID0gX193ZWJwYWNrX3JlcXVpcmVfXy5vKGluc3RhbGxlZENodW5rcywgY2h1bmtJZCkgPyBpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gOiB1bmRlZmluZWQ7XG5cdFx0aWYoaW5zdGFsbGVkQ2h1bmtEYXRhICE9PSAwKSB7IC8vIDAgbWVhbnMgXCJhbHJlYWR5IGluc3RhbGxlZFwiLlxuXG5cdFx0XHQvLyBhIFByb21pc2UgbWVhbnMgXCJjdXJyZW50bHkgbG9hZGluZ1wiLlxuXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtEYXRhKSB7XG5cdFx0XHRcdHByb21pc2VzLnB1c2goaW5zdGFsbGVkQ2h1bmtEYXRhWzFdKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmKHRydWUpIHsgLy8gYWxsIGNodW5rcyBoYXZlIEpTXG5cdFx0XHRcdFx0Ly8gc2V0dXAgUHJvbWlzZSBpbiBjaHVuayBjYWNoZVxuXHRcdFx0XHRcdHZhciBwcm9taXNlID0gaW1wb3J0KFwiLi4vXCIgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLnUoY2h1bmtJZCkpLnRoZW4oaW5zdGFsbENodW5rLCAoZSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdICE9PSAwKSBpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHZhciBwcm9taXNlID0gUHJvbWlzZS5yYWNlKFtwcm9taXNlLCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gKGluc3RhbGxlZENodW5rRGF0YSA9IGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IFtyZXNvbHZlXSkpXSlcblx0XHRcdFx0XHRwcm9taXNlcy5wdXNoKGluc3RhbGxlZENodW5rRGF0YVsxXSA9IHByb21pc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxufTtcblxuLy8gbm8gcHJlZmV0Y2hpbmdcblxuLy8gbm8gcHJlbG9hZGVkXG5cbi8vIG5vIGV4dGVybmFsIGluc3RhbGwgY2h1bmtcblxuLy8gbm8gb24gY2h1bmtzIGxvYWRlZCIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgdXNlZCAnbW9kdWxlJyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC50c1wiKTtcbiIsIiJdLCJuYW1lcyI6WyJnbG9iYWxUaGlzIiwiRGVubyIsImFyZ3MiLCJsZW5ndGgiLCJwYXJzZUFyZ3MiLCJoZWxwIiwiY29uc29sZSIsImxvZyIsImV4aXQiLCJzdGFydEhUVFBTZXJ2ZXIiLCJwb3J0IiwiaG9zdG5hbWUiLCJob3N0Iiwicm91dGVzIiwiXyIsImRlZmF1bHQiLCJub3RfZm91bmQiLCJpbnRlcm5hbF9lcnJvciIsInRlc3QiLCJ0ZXN0X25hbWUiLCJyZXF1ZXN0IiwiZXhwZWN0ZWRfcmVzcG9uc2UiLCJSZXF1ZXN0IiwiZW5jb2RlVVJJIiwidXNlX2JyeXRob24iLCJsYW5nIiwic2FuaXRpemVSZXNvdXJjZXMiLCJyIiwiY2xvbmUiLCJoZWFkZXJzIiwic2V0IiwiYXNzZXJ0UmVzcG9uc2UiLCJmZXRjaCIsInVpbnRfZXF1YWxzIiwiYSIsImIiLCJieXRlTGVuZ3RoIiwiaSIsImF0IiwicmVzcG9uc2UiLCJzdGF0dXMiLCJib2R5IiwibWltZSIsInN0YXR1c1RleHQiLCJFcnJvciIsInJlcF9taW1lIiwiZ2V0IiwiVWludDhBcnJheSIsInJlcCIsImJ5dGVzIiwicmVwX3RleHQiLCJ0ZXh0Iiwicm9vdERpciIsImN3ZCIsIl9kZWZhdWx0Iiwic3RhdGljIiwiX3N0YXRpYyIsImxvZ2dlciIsInJvdXRlc0hhbmRsZXJzIiwibG9hZEFsbFJvdXRlc0hhbmRsZXJzIiwicmVxdWVzdEhhbmRsZXIiLCJidWlsZFJlcXVlc3RIYW5kbGVyIiwic2VydmUiLCJmaW5pc2hlZCIsIkhUVFBFcnJvciIsImNvbnN0cnVjdG9yIiwiaHR0cF9lcnJvcl9jb2RlIiwibWVzc2FnZSIsIm5hbWUiLCJlcnJvcl9jb2RlIiwiU1NFV3JpdGVyIiwid3JpdGVyIiwic2VuZEV2ZW50IiwiZGF0YSIsIndyaXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsImNsb3NlZCIsImNsb3NlIiwiYWJvcnQiLCJWU0hTIiwiU1NFUmVzcG9uc2UiLCJjYWxsYmFjayIsIm9wdGlvbnMiLCJyZWFkYWJsZSIsIndyaXRhYmxlIiwiVHJhbnNmb3JtU3RyZWFtIiwiZ2V0V3JpdGVyIiwiY2F0Y2giLCJlIiwic3RyZWFtIiwicGlwZVRocm91Z2giLCJUZXh0RW5jb2RlclN0cmVhbSIsIkhlYWRlcnMiLCJoYXMiLCJSZXNwb25zZSIsImJyeXRob25fbG9hZGluZyIsImJyeXRob25fcHJvbWlzZSIsIlByb21pc2UiLCJ3aXRoUmVzb2x2ZXJzIiwibG9hZF9icnl0aG9uIiwicHJvbWlzZSIsImZpbGUiLCJkaXIiLCJ1cmwiLCJzbGljZSIsImxhc3RJbmRleE9mIiwiYnJ5dGhvbiIsInJlYWRUZXh0RmlsZSIsIiRCIiwiX19CUllUSE9OX18iLCJpbm5lciIsImdsb2JhbCIsIm1vZHVsZSIsImV2YWwiLCJ3YXJuIiwicmVzb2x2ZSIsIlJPT1QiLCJyb3V0ZXNfdXJpIiwiZ2V0QWxsUm91dGVzIiwiaGFuZGxlcnMiLCJhbGwiLCJtYXAiLCJ1cmkiLCJpc19icnl0aG9uIiwiZW5kc1dpdGgiLCJleHQiLCJyb3V0ZSIsImNvZGUiLCJpbmRleE9mIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsInR5cGUiLCJlcnJvciIsImhhbmRsZXIiLCJjdXJyZW50UGF0aCIsImZpbGVzIiwiZGlyRW50cnkiLCJyZWFkRGlyIiwiZW50cnlQYXRoIiwiaXNEaXJlY3RvcnkiLCJpbmNsdWRlcyIsInB1c2giLCJDT1JTX0hFQURFUlMiLCJidWlsZEFuc3dlciIsInJlcF9oZWFkZXJzIiwiZGVmYXVsdF9oYW5kbGVyIiwib3B0cyIsImRlZmF1bHRfcm91dGUiLCJwYXRoIiwidmFycyIsInJlZ2V4ZXMiLCJpc19icnkiLCJwYXRoMnJlZ2V4Iiwibm90X2ZvdW5kX3JvdXRlIiwiZ2V0Um91dGVIYW5kbGVyIiwiaW50ZXJuYWxfZXJyb3Jfcm91dGUiLCJjb25uSW5mbyIsImlwIiwicmVtb3RlQWRkciIsIm1ldGhvZCIsImFuc3dlciIsIl9yb3V0ZSIsInVuZGVmaW5lZCIsInJlcGxhY2UiLCJSZWdFeHAiLCJjYXB0dXJlZCIsIm1hdGNoIiwicmVnZXgiLCJyZXN1bHQiLCJleGVjIiwiZ3JvdXBzIiwiY3VyUm91dGUiLCJkZWNvZGVVUkkiLCJwYXRobmFtZSJdLCJzb3VyY2VSb290IjoiIn0=