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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBLHNEQUFzRDtVQUN0RCxzQ0FBc0MsaUVBQWlFO1VBQ3ZHO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7Ozs7VUN6QkE7VUFDQTtVQUNBO1VBQ0E7VUFDQSx5Q0FBeUMsd0NBQXdDO1VBQ2pGO1VBQ0E7VUFDQTs7Ozs7VUNQQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBLEVBQUU7VUFDRjs7Ozs7VUNSQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOzs7OztVQ0pBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7Ozs7O1VDSkE7Ozs7O1VDQUE7VUFDQTtVQUNBO1VBQ0EsdURBQXVELGlCQUFpQjtVQUN4RTtVQUNBLGdEQUFnRCxhQUFhO1VBQzdEOzs7OztVQ05BOzs7OztVQ0FBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBLE1BQU0sdUJBQXVCO1VBQzdCO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBLE1BQU0sZ0JBQWdCO1VBQ3RCO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQSxpQ0FBaUM7O1VBRWpDO1VBQ0E7VUFDQTtVQUNBLEtBQUs7VUFDTCxlQUFlO1VBQ2Y7VUFDQTtVQUNBO1VBQ0E7VUFDQSxNQUFNO1VBQ047VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBOztVQUVBOztVQUVBOztVQUVBOzs7OztTRTFEQTtTQUNBO1NBQ0E7U0FDQSIsInNvdXJjZXMiOlsid2VicGFjazovL1ZTSFMvLi9WU0hTLnRzIiwid2VicGFjazovL1ZTSFMvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vVlNIUy8uLy4vIGxhenkgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2FzeW5jIG1vZHVsZSIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9jcmVhdGUgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2Vuc3VyZSBjaHVuayIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9nZXQgbWluaS1jc3MgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2ltcG9ydCBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiAtUyBkZW5vIHJ1biAtLWFsbG93LWFsbCAtLXdhdGNoIC0tY2hlY2sgLS11bnN0YWJsZS1zbG9wcHktaW1wb3J0c1xuXG5pZiggXCJEZW5vXCIgaW4gZ2xvYmFsVGhpcyAmJiBEZW5vLmFyZ3MubGVuZ3RoICkge1xuXG5cdGNvbnN0IHtwYXJzZUFyZ3N9ID0gYXdhaXQgaW1wb3J0KFwianNyOkBzdGQvY2xpL3BhcnNlLWFyZ3NcIik7XG5cblx0Y29uc3QgYXJncyA9IHBhcnNlQXJncyhEZW5vLmFyZ3MpXG5cblx0LyogLS1kZWZhdWx0XHRkZWZhdWx0XG5Sb3V0ZSBub24gdHJvdXbDqWVcdC0tbm90LWZvdW5kXHRub3RfZm91bmRcbkVycmV1ciBub24tY2FwdHVyw6llXHQtLWludGVybmFsLWVycm9yKi9cblxuXHRpZiggYXJncy5oZWxwICkge1xuXHRcdGNvbnNvbGUubG9nKGAuL1ZTSFMudHMgJFJPVVRFU1xuXHQtLWhvc3QgICAgICAgICAgOiAoZGVmYXVsdCBsb2NhaG9zdClcblx0LS1wb3J0ICAgICAgICAgIDogKGRlZmF1bHQgODA4MClcblx0LS1kZWZhdWx0ICAgICAgIDogKGRlZmF1bHQgL2RlZmF1bHQpXG5cdC0tbm90X2ZvdW5kICAgICA6IChkZWZhdWx0IC0tZGVmYXVsdClcblx0LS1pbnRlcm5hbF9lcnJvcjogKGRlZmF1bHQgLS1kZWZhdWx0KVxuXHRgKVxuXHRcdERlbm8uZXhpdCgwKTtcblx0fVxuXG5cdHN0YXJ0SFRUUFNlcnZlcih7XG5cdFx0cG9ydCAgICA6IGFyZ3MucG9ydCA/PyA4MDgwLFxuXHRcdGhvc3RuYW1lOiBhcmdzLmhvc3QgPz8gXCJsb2NhbGhvc3RcIixcblx0XHRyb3V0ZXMgIDogYXJncy5fWzBdIGFzIHN0cmluZyxcblx0XHRkZWZhdWx0ICAgICAgIDogYXJncy5kZWZhdWx0LFxuXHRcdG5vdF9mb3VuZCAgICAgOiBhcmdzLm5vdF9mb3VuZCxcblx0XHRpbnRlcm5hbF9lcnJvcjogYXJncy5pbnRlcm5hbF9lcnJvcixcblx0fSlcblxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxudHlwZSBMb2dnZXIgPSAoaXA6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIHVybDogVVJMLCBlcnJvcjogbnVsbHxIVFRQRXJyb3J8RXJyb3IpID0+IHZvaWQ7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0KFxuXHR0ZXN0X25hbWUgIDogc3RyaW5nLFxuXHRyZXF1ZXN0ICAgIDogUmVxdWVzdHxzdHJpbmcsXG5cdGV4cGVjdGVkX3Jlc3BvbnNlOiBQYXJ0aWFsPEV4cGVjdGVkQW5zd2VyPlxuKSB7XG5cblx0aWYodHlwZW9mIHJlcXVlc3QgPT09IFwic3RyaW5nXCIpXG5cdFx0cmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGVuY29kZVVSSShyZXF1ZXN0KSk7XG5cblx0Zm9yKGxldCB1c2VfYnJ5dGhvbiBvZiBbXCJ0cnVlXCIsIFwiZmFsc2VcIl0pIHtcblx0XHRjb25zdCBsYW5nID0gdXNlX2JyeXRob24gPT09IFwidHJ1ZVwiID8gXCJicnlcIiA6IFwianNcIjtcblx0XHREZW5vLnRlc3QoYCR7dGVzdF9uYW1lfSAoJHtsYW5nfSlgLCB7c2FuaXRpemVSZXNvdXJjZXM6IGZhbHNlfSwgYXN5bmMoKSA9PiB7XG5cblx0XHRcdGNvbnN0IHIgPSByZXF1ZXN0LmNsb25lKCk7XG5cdFx0XHRyLmhlYWRlcnMuc2V0KFwidXNlLWJyeXRob25cIiwgdXNlX2JyeXRob24pO1xuXHRcdFx0YXdhaXQgYXNzZXJ0UmVzcG9uc2UoYXdhaXQgZmV0Y2gociksIGV4cGVjdGVkX3Jlc3BvbnNlKTtcblx0XHR9KTtcblx0fVxufVxuXG5mdW5jdGlvbiB1aW50X2VxdWFscyhhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KSB7XG5cblx0aWYoYi5ieXRlTGVuZ3RoICE9PSBiLmJ5dGVMZW5ndGgpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdGZvcihsZXQgaSA9IDA7IGkgPCBhLmJ5dGVMZW5ndGg7ICsraSlcblx0XHRpZihhLmF0KGkpICE9PSBiLmF0KGkpKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxudHlwZSBFeHBlY3RlZEFuc3dlciA9IHtcblx0c3RhdHVzICAgIDogbnVtYmVyLFxuXHRzdGF0dXNUZXh0OiBzdHJpbmcsXG5cdGJvZHkgIDogc3RyaW5nfFVpbnQ4QXJyYXl8bnVsbCxcblx0bWltZSAgOiBzdHJpbmd8bnVsbCxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRSZXNwb25zZShyZXNwb25zZTogUmVzcG9uc2UsIHtcblx0c3RhdHVzID0gMjAwLFxuXHRib2R5ICAgPSBudWxsLFxuXHRtaW1lICAgPSBudWxsLFxuXHRzdGF0dXNUZXh0ID0gXCJPS1wiXG5cbn06IFBhcnRpYWw8RXhwZWN0ZWRBbnN3ZXI+KSB7XG5cblx0aWYocmVzcG9uc2Uuc3RhdHVzICE9PSBzdGF0dXMpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFxceDFiWzE7MzFtV3Jvbmcgc3RhdHVzIGNvZGU6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3Jlc3BvbnNlLnN0YXR1c31cXHgxYlswbVxuXFx4MWJbMTszMm0rICR7c3RhdHVzfVxceDFiWzBtYCk7XG5cdH1cblxuXHRpZihyZXNwb25zZS5zdGF0dXNUZXh0ICE9PSBzdGF0dXNUZXh0KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIHN0YXR1cyB0ZXh0OlxceDFiWzBtXG5cXHgxYlsxOzMxbS0gJHtyZXNwb25zZS5zdGF0dXNUZXh0fVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtzdGF0dXNUZXh0fVxceDFiWzBtYCk7XG5cdH1cblxuXHRsZXQgcmVwX21pbWUgPSByZXNwb25zZS5oZWFkZXJzLmdldCgnQ29udGVudC1UeXBlJyk7XG5cdGlmKCBtaW1lID09PSBudWxsICYmIHJlcF9taW1lID09PSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKVxuXHRcdHJlcF9taW1lID0gbnVsbDtcblx0aWYoIHJlcF9taW1lICE9PSBtaW1lICkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBtaW1lLXR5cGU6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcF9taW1lfVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHttaW1lfVxceDFiWzBtYCk7XG5cdFx0fVxuXG5cdGlmKCBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSApIHtcblx0XHRjb25zdCByZXAgPSBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5ieXRlcygpKTtcblx0XHRpZiggISB1aW50X2VxdWFscyhib2R5LCByZXApIClcblx0XHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBib2R5OlxceDFiWzBtXG5cXHgxYlsxOzMxbS0gJHtyZXB9XFx4MWJbMG1cblxceDFiWzE7MzJtKyAke2JvZHl9XFx4MWJbMG1gKTtcblx0fSBlbHNlIHtcblxuXHRcdGNvbnN0IHJlcF90ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuXHRcdGlmKCByZXBfdGV4dCAhPT0gYm9keSAmJiAoYm9keSAhPT0gbnVsbCB8fCByZXBfdGV4dCAhPT0gXCJcIikgKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIGJvZHk6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcF90ZXh0fVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtib2R5fVxceDFiWzBtYCk7XG5cdH1cbn1cblxudHlwZSBIVFRQU2VydmVyT3B0cyA9IHtcblx0cG9ydCAgICA6IG51bWJlcixcblx0aG9zdG5hbWU6IHN0cmluZyxcblx0cm91dGVzICAgICAgICAgOiBzdHJpbmd8Um91dGVzLFxuXHRkZWZhdWx0ICAgICAgICA6IHN0cmluZyxcblx0bm90X2ZvdW5kICAgICAgOiBzdHJpbmcsXG5cdGludGVybmFsX2Vycm9yIDogc3RyaW5nLFxuXG5cdHN0YXRpYz86IHN0cmluZ3x1bmRlZmluZWQsXG5cdGxvZ2dlcj86IExvZ2dlciAvLyBub3QgZG9jdW1lbnRlZFxufTtcblxuXG5leHBvcnQgZnVuY3Rpb24gcm9vdERpcigpIHtcblx0cmV0dXJuIERlbm8uY3dkKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0SFRUUFNlcnZlcih7IHBvcnQgPSA4MDgwLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aG9zdG5hbWUgPSBcImxvY2FsaG9zdFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cm91dGVzID0gXCIvcm91dGVzXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OiBfZGVmYXVsdCA9IFwiL2RlZmF1bHQvR0VUXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRub3RfZm91bmQgICAgICA9IF9kZWZhdWx0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aW50ZXJuYWxfZXJyb3IgPSBfZGVmYXVsdCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXRpYzogX3N0YXRpYyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxvZ2dlciA9ICgpID0+IHt9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTogSFRUUFNlcnZlck9wdHMpIHtcblxuXHRsZXQgcm91dGVzSGFuZGxlcnM6IFJvdXRlcyA9IHJvdXRlcyBhcyBhbnk7XG5cdGlmKCB0eXBlb2Ygcm91dGVzID09PSBcInN0cmluZ1wiICkge1xuXHRcdGlmKHJvdXRlc1swXSA9PT0gXCIvXCIpXG5cdFx0XHRyb3V0ZXMgPSByb290RGlyKCkgKyByb3V0ZXM7XG5cdFx0XHRcblx0XHRyb3V0ZXNIYW5kbGVycyA9IGF3YWl0IGxvYWRBbGxSb3V0ZXNIYW5kbGVycyhyb3V0ZXMpO1xuXHR9XG5cdFxuXHRpZihfc3RhdGljPy5bMF0gPT09IFwiL1wiKVxuXHRcdF9zdGF0aWMgPSByb290RGlyKCkgKyBfc3RhdGljO1xuXHRcblx0Y29uc3QgcmVxdWVzdEhhbmRsZXIgPSBidWlsZFJlcXVlc3RIYW5kbGVyKHJvdXRlc0hhbmRsZXJzLCB7XG5cdFx0X3N0YXRpYyxcblx0XHRsb2dnZXIsXG5cdFx0bm90X2ZvdW5kLFxuXHRcdGludGVybmFsX2Vycm9yXG5cdH0pO1xuXG5cdC8vIGh0dHBzOi8vZG9jcy5kZW5vLmNvbS9ydW50aW1lL3R1dG9yaWFscy9odHRwX3NlcnZlclxuXHRhd2FpdCBEZW5vLnNlcnZlKHtcblx0XHRwb3J0LFxuXHRcdGhvc3RuYW1lLFxuXHQgfSwgcmVxdWVzdEhhbmRsZXIpLmZpbmlzaGVkO1xufVxuXG5leHBvcnQgY2xhc3MgU1NFV3JpdGVyIHtcbiAgICAjd3JpdGVyOiBXcml0YWJsZVN0cmVhbURlZmF1bHRXcml0ZXI7XG4gICAgY29uc3RydWN0b3Iod3JpdGVyOiBXcml0YWJsZVN0cmVhbURlZmF1bHRXcml0ZXIpIHtcbiAgICAgICAgdGhpcy4jd3JpdGVyID0gd3JpdGVyO1xuICAgIH1cblxuICAgIHNlbmRFdmVudChkYXRhOiBhbnksIG5hbWUgPSAnbWVzc2FnZScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3dyaXRlci53cml0ZShcbmBldmVudDogJHtuYW1lfVxuZGF0YTogJHtKU09OLnN0cmluZ2lmeShkYXRhKX1cblxuYCk7XG4gICAgfVxuXG5cdGdldCBjbG9zZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuI3dyaXRlci5jbG9zZWQ7XG5cdH1cblxuXHRjbG9zZSgpIHtcblx0XHRyZXR1cm4gdGhpcy4jd3JpdGVyLmNsb3NlKCk7XG5cdH1cblxuXHRhYm9ydCgpIHtcblx0XHRyZXR1cm4gdGhpcy4jd3JpdGVyLmFib3J0KCk7XG5cdH1cbn1cblxuLy8gaGVscGVyXG5leHBvcnQgY29uc3QgVlNIUyA9IHtcblx0U1NFUmVzcG9uc2U6IGZ1bmN0aW9uPFQgZXh0ZW5kcyBhbnlbXT4oY2FsbGJhY2s6ICh3cml0ZXI6IFNTRVdyaXRlciwgLi4uYXJnczogVCkgPT4gUHJvbWlzZTx2b2lkPixcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICAgb3B0aW9uczogUmVzcG9uc2VJbml0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQgICAuLi5hcmdzOiBUKSB7XG5cdFx0Y29uc3Qge3JlYWRhYmxlLCB3cml0YWJsZX0gPSBuZXcgVHJhbnNmb3JtU3RyZWFtKCk7XG5cblx0XHRjb25zdCB3cml0ZXIgPSBuZXcgU1NFV3JpdGVyKHdyaXRhYmxlLmdldFdyaXRlcigpKTtcblx0XHRjYWxsYmFjayggd3JpdGVyLCAuLi5hcmdzICkuY2F0Y2goIChlKSA9PiB7XG5cdFx0XHR3cml0ZXIuYWJvcnQoKTtcblx0XHRcdHRocm93IGU7XG5cdFx0fSlcblx0XG5cdFx0Y29uc3Qgc3RyZWFtID0gcmVhZGFibGUucGlwZVRocm91Z2goIG5ldyBUZXh0RW5jb2RlclN0cmVhbSgpICk7XG5cblx0XHRvcHRpb25zPz89IHt9O1xuXHRcdG9wdGlvbnMuaGVhZGVycz8/PXt9O1xuXHRcdGlmKCBvcHRpb25zLmhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG5cdFx0XHRpZiggISBvcHRpb25zLmhlYWRlcnMuaGFzKFwiQ29udGVudC1UeXBlXCIpIClcblx0XHRcdFx0b3B0aW9ucy5oZWFkZXJzLnNldChcIkNvbnRlbnQtVHlwZVwiLCBcInRleHQvZXZlbnQtc3RyZWFtXCIpO1xuXHRcdH0gZWxzZVxuXHRcdFx0KG9wdGlvbnMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtcIkNvbnRlbnQtVHlwZVwiXSA/Pz0gXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiO1xuXG5cblx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKHN0cmVhbSwgb3B0aW9ucyk7XG5cblx0fVxufTtcbi8vIEB0cy1pZ25vcmVcbmdsb2JhbFRoaXMuVlNIUyA9IFZTSFM7XG5cbmV4cG9ydCB0eXBlIEhhbmRsZXJQYXJhbXMgPSBbXG5cdFJlcXVlc3QsIHtcblx0XHRwYXRoOiBzdHJpbmcsXG5cdFx0dmFyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuXHR9XG5dO1xuXG50eXBlIEhhbmRsZXIgPSAoLi4uYXJnczogSGFuZGxlclBhcmFtcykgPT4gUHJvbWlzZTxhbnk+O1xudHlwZSBSb3V0ZXMgID0gKHJlYWRvbmx5IFtzdHJpbmcsIEhhbmRsZXIsIGJvb2xlYW5dKVtdO1xuXG5sZXQgYnJ5dGhvbl9sb2FkaW5nICA9IGZhbHNlO1xubGV0IGJyeXRob25fcHJvbWlzZSA9IFByb21pc2Uud2l0aFJlc29sdmVyczx2b2lkPigpO1xuXG5hc3luYyBmdW5jdGlvbiBsb2FkX2JyeXRob24oKSB7XG5cdGlmKCBicnl0aG9uX2xvYWRpbmcgKSB7XG5cdFx0YXdhaXQgYnJ5dGhvbl9wcm9taXNlLnByb21pc2Vcblx0XHRyZXR1cm47XG5cdH1cblxuXHRicnl0aG9uX2xvYWRpbmcgPSB0cnVlO1xuXG5cdC8vYnJ5dGhvbiA9IGF3YWl0IChhd2FpdCBmZXRjaCggXCJodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9icnl0aG9uLzMuMTMuMC9icnl0aG9uLm1pbi5qc1wiICkpLnRleHQoKTtcblx0Y29uc3QgZmlsZSA9IFwiYnJ5dGhvbigxKVwiO1xuXHRjb25zdCBkaXIgPSBpbXBvcnQubWV0YS51cmwuc2xpY2UoNiwgaW1wb3J0Lm1ldGEudXJsLmxhc3RJbmRleE9mKCcvJykgKTtcblx0Y29uc3QgYnJ5dGhvbiA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKGRpciArIGAvJHtmaWxlfS5qc2ApO1xuXG5cdC8vIEB0cy1pZ25vcmVcblx0Z2xvYmFsVGhpcy4kQiAgPSBnbG9iYWxUaGlzLl9fQlJZVEhPTl9fID0ge307IC8vIHdoeSBpcyBpdCByZXF1aXJlZCA/Pz9cblx0Ly8gQHRzLWlnbm9yZVxuXHRnbG9iYWxUaGlzLmlubmVyID0gbnVsbDtcblx0Ly8gQHRzLWlnbm9yZVxuXHRnbG9iYWxUaGlzLmdsb2JhbCA9IHt9O1xuXHQvLyBAdHMtaWdub3JlXG5cdGdsb2JhbFRoaXMubW9kdWxlID0ge307XG5cdGV2YWwoYnJ5dGhvbik7XG5cblx0Y29uc29sZS53YXJuKFwiPT0gbG9hZGVkID09XCIpO1xuXHRicnl0aG9uX3Byb21pc2UucmVzb2x2ZSgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkQWxsUm91dGVzSGFuZGxlcnMocm91dGVzOiBzdHJpbmcpOiBQcm9taXNlPFJvdXRlcz4ge1xuXG5cdGNvbnN0IFJPT1QgPSByb290RGlyKCk7XG5cdGxldCByb3V0ZXNfdXJpID0gYXdhaXQgZ2V0QWxsUm91dGVzKHJvdXRlcyk7XG5cblx0dHlwZSBNb2R1bGUgPSB7ZGVmYXVsdDogSGFuZGxlcn07XG5cdGNvbnN0IGhhbmRsZXJzICAgPSBhd2FpdCBQcm9taXNlLmFsbCggcm91dGVzX3VyaS5tYXAoIGFzeW5jICh1cmkpID0+IHtcblxuXHRcdC8vIG9ubHkgd2l0aCBpbXBvcnRzIG1hcCwgYnV0IGJ1Z2dlZFxuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZW5vL2lzc3Vlcy8yMjIzN1xuXHRcdC8vaWYoIHVyaS5zdGFydHNXaXRoKFJPT1QpIClcblx0XHQvL1x0dXJpID0gdXJpLnNsaWNlKFJPT1QubGVuZ3RoKVxuXG5cdFx0LyppZiggdXJpWzFdID09PSAnOicgKSAvLyB3aW5kb3dzIGRyaXZlXG5cdFx0XHR1cmkgPSBgZmlsZTovLyR7dXJpfWA7Ki9cblxuXHRcdGNvbnN0IGlzX2JyeXRob24gPSB1cmkuZW5kc1dpdGgoJy5icnknKTtcblx0XHRsZXQgZXh0ID0gaXNfYnJ5dGhvbiA/IFwiLmJyeVwiIDogXCIudHNcIlxuXHRcdGxldCByb3V0ZSA9IHVyaS5zbGljZShyb3V0ZXMubGVuZ3RoLCAtIGV4dC5sZW5ndGgpO1xuXG5cdFx0bGV0IG1vZHVsZSE6IE1vZHVsZTtcblx0XHR0cnl7XG5cblx0XHRcdGxldCBjb2RlID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUodXJpKTtcblxuXHRcdFx0aWYoIHJvdXRlLmVuZHNXaXRoKCdpbmRleCcpIClcblx0XHRcdFx0cm91dGUgPSBjb2RlLnNsaWNlKDMsIGNvZGUuaW5kZXhPZignXFxuJykgLSBleHQubGVuZ3RoICk7XG5cblx0XHRcdGlmKCBpc19icnl0aG9uICkge1xuXG5cdFx0XHRcdGF3YWl0IGxvYWRfYnJ5dGhvbigpO1xuXG5cdFx0XHRcdC8vVE9ETzogZHVwbGljYXRlZCBjb2RlIHdpdGggcGxheWdyb3VuZC4uLiAoISBcXGAgdnMgXFxcXFxcYCkuXG5cdFx0XHRcdGNvZGUgPSBgY29uc3QgJEIgPSBnbG9iYWxUaGlzLl9fQlJZVEhPTl9fO1xuXG5cdFx0XHRcdCRCLnJ1blB5dGhvblNvdXJjZShcXGAke2NvZGV9XFxgLCBcIl9cIik7XG5cblx0XHRcdFx0Y29uc3QgbW9kdWxlID0gJEIuaW1wb3J0ZWRbXCJfXCJdO1xuXHRcdFx0XHRjb25zdCBmY3QgICAgPSAkQi5weW9iajJqc29iaihtb2R1bGUuUmVxdWVzdEhhbmRsZXIpO1xuXG5cdFx0XHRcdGNvbnN0IGZjdDIgPSBhc3luYyAoLi4uYXJncykgPT4ge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRjb25zdCByID0gYXdhaXQgZmN0KC4uLmFyZ3MpO1xuXHRcdFx0XHRcdFx0aWYoIHI/Ll9fY2xhc3NfXz8uX19xdWFsbmFtZV9fID09PSBcIk5vbmVUeXBlXCIpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0XHRcdGlmKCAhIChcIiRweV9lcnJvclwiIGluIGUpIClcblx0XHRcdFx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdFx0XHRcdGxldCBqc19lcnJvciA9IGUuYXJnc1swXTtcblxuXHRcdFx0XHRcdFx0aWYoICEgKGpzX2Vycm9yIGluc3RhbmNlb2YgUmVzcG9uc2UpIClcblx0XHRcdFx0XHRcdFx0anNfZXJyb3IgPSBuZXcgRXJyb3IoanNfZXJyb3IpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR0aHJvdyBqc19lcnJvcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRleHBvcnQgZGVmYXVsdCBmY3QyO1xuXHRcdFx0XHRgO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKCBuZXcgQmxvYihbY29kZV0sIHt0eXBlOiBcInRleHQvamF2YXNjcmlwdFwifSkpO1xuXG5cdFx0XHRtb2R1bGUgPSBhd2FpdCBpbXBvcnQoIHVybCApO1xuXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhhbmRsZXI6IEhhbmRsZXIgPSBtb2R1bGUuZGVmYXVsdDtcblxuXHRcdHJldHVybiBbcm91dGUsIGhhbmRsZXIsIGlzX2JyeXRob25dIGFzIGNvbnN0O1xuXHR9KSk7XG5cblx0cmV0dXJuIGhhbmRsZXJzO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoY3VycmVudFBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcblxuXHRjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcblxuXHRmb3IgYXdhaXQgKGNvbnN0IGRpckVudHJ5IG9mIERlbm8ucmVhZERpcihjdXJyZW50UGF0aCkpIHtcblxuXHRcdGNvbnN0IGVudHJ5UGF0aCA9IGAke2N1cnJlbnRQYXRofS8ke2RpckVudHJ5Lm5hbWV9YDtcblxuXHRcdGlmICggISBkaXJFbnRyeS5pc0RpcmVjdG9yeSkge1xuXG5cdFx0XHRpZiggISBbXCJ0ZXN0LnRzXCIsIFwicmVxdWVzdC5icnlcIiwgXCJyZXF1ZXN0LmpzXCJdLmluY2x1ZGVzKGRpckVudHJ5Lm5hbWUpIClcblx0XHRcdFx0ZmlsZXMucHVzaCggZW50cnlQYXRoIClcblx0XHR9IGVsc2Vcblx0XHRcdGZpbGVzLnB1c2goLi4uIGF3YWl0IGdldEFsbFJvdXRlcyhlbnRyeVBhdGgpKTtcblxuXHR9XG5cblx0cmV0dXJuIGZpbGVzO1xufVxuXG50eXBlIFJFU1RfTWV0aG9kcyA9IFwiUE9TVFwifFwiR0VUXCJ8XCJERUxFVEVcInxcIlBVVFwifFwiUEFUQ0hcIjtcblxuY29uc3QgQ09SU19IRUFERVJTID0ge1xuXHRcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiIDogXCIqXCIsXG5cdFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiOiBcIipcIiwgLy8gUE9TVCwgR0VULCBQQVRDSCwgUFVULCBPUFRJT05TLCBERUxFVEVcblx0XCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCI6IFwiKlwiICAvLyBcInVzZS1icnl0aG9uXCJcbn07XG5cbmZ1bmN0aW9uIGJ1aWxkQW5zd2VyKHJlc3BvbnNlOiBSZXNwb25zZXxudWxsID0gbnVsbCkge1xuXG5cdGlmKCByZXNwb25zZSA9PT0gbnVsbCApXG5cdFx0cmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCk7XG5cblx0Ly8gUHJvYmFibHkgV2ViU29ja2V0IHVwZ3JhZGVcblx0aWYoIHJlc3BvbnNlLnN0YXR1cyA9PT0gMTAxKVxuXHRcdHJldHVybiByZXNwb25zZTtcblxuXHRpZiggISAocmVzcG9uc2UgaW5zdGFuY2VvZiBSZXNwb25zZSkgKSB7XG5cdFx0Y29uc29sZS53YXJuKHJlc3BvbnNlKTtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJSZXF1ZXN0IGhhbmRsZXIgcmV0dXJuZWQgc29tZXRoaW5nIGVsc2UgdGhhbiBhIFJlc3BvbnNlXCIpO1xuXHR9XG5cblx0Y29uc3QgcmVwX2hlYWRlcnMgPSBuZXcgSGVhZGVycyhyZXNwb25zZS5oZWFkZXJzKTtcblxuXHRmb3IobGV0IG5hbWUgaW4gQ09SU19IRUFERVJTKVxuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRyZXBfaGVhZGVycy5zZXQobmFtZSwgQ09SU19IRUFERVJTW25hbWVdKVxuXG5cdGNvbnN0IHJlcCA9IG5ldyBSZXNwb25zZSggcmVzcG9uc2UuYm9keSwge1xuXHRcdHN0YXR1cyAgICA6IHJlc3BvbnNlLnN0YXR1cyxcblx0XHRzdGF0dXNUZXh0OiByZXNwb25zZS5zdGF0dXNUZXh0LFxuXHRcdGhlYWRlcnMgICA6IHJlcF9oZWFkZXJzXG5cdH0gKTtcblxuXHRyZXR1cm4gcmVwO1xufVxuXG50eXBlIGJ1aWxkUmVxdWVzdEhhbmRsZXJPcHRzID0ge1xuXHRfc3RhdGljPzogc3RyaW5nfHVuZGVmaW5lZCxcblx0bG9nZ2VyPzogTG9nZ2VyLFxuXHRub3RfZm91bmQgICAgIDogc3RyaW5nLFxuXHRpbnRlcm5hbF9lcnJvcjogc3RyaW5nXG59XG5cbnR5cGUgRGVmYXVsdFJvdXRlT3B0cyA9IHtcblx0cm91dGUgICA6IFJvdXRlfG51bGwsXG5cdGVycm9yICA/OiBFcnJvcixcbn0gJiBSb3V0ZTtcblxuYXN5bmMgZnVuY3Rpb24gZGVmYXVsdF9oYW5kbGVyKHJlcXVlc3Q6IFJlcXVlc3QsIG9wdHM6IERlZmF1bHRSb3V0ZU9wdHMpIHtcblxuXHRpZiggXCJlcnJvclwiIGluIG9wdHMgKVxuXHRcdHJldHVybiBuZXcgUmVzcG9uc2Uob3B0cy5lcnJvciEubWVzc2FnZSwge3N0YXR1czogNTAwfSk7XG5cblx0Ly9UT0RPIGFzc2V0c1xuXG5cdHJldHVybiBuZXcgUmVzcG9uc2UoYCR7cmVxdWVzdC51cmx9IG5vdCBmb3VuZGAsIHtzdGF0dXM6IDQwNH0pO1xuXG5cdC8qXG5cdFx0Ly8gdXNlIGFzeW5jID9cblx0XHQvL2ltcG9ydCB7IG1pbWVsaXRlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvbWltZXR5cGVzQHYxLjAuMC9tb2QudHNcIjtcblxuXHRcdGlmKCBfc3RhdGljID09PSB1bmRlZmluZWQgKVxuXHRcdFx0dGhyb3cgbmV3IEhUVFBFcnJvcig0MDQsIFwiTm90IGZvdW5kXCIpO1xuXG5cdFx0bGV0IGZpbGVwYXRoID0gYCR7X3N0YXRpY30vJHt1cmwucGF0aG5hbWV9YDtcblx0XHRsZXQgY29udGVudCE6IFVpbnQ4QXJyYXk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgaW5mbyA9IGF3YWl0IERlbm8uc3RhdChmaWxlcGF0aCk7XG5cblx0XHRcdGlmKCBpbmZvLmlzRGlyZWN0b3J5IClcblx0XHRcdFx0ZmlsZXBhdGggPSBgJHtmaWxlcGF0aH0vaW5kZXguaHRtbGA7XG5cblx0XHRcdGNvbnRlbnQgPSBhd2FpdCBEZW5vLnJlYWRGaWxlKGZpbGVwYXRoKTtcblxuXHRcdH0gY2F0Y2goZSkge1xuXG5cdFx0XHRpZihlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpXG5cdFx0XHRcdHRocm93IG5ldyBIVFRQRXJyb3IoNDA0LCBcIk5vdCBGb3VuZFwiKTtcblx0XHRcdGlmKCBlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuUGVybWlzc2lvbkRlbmllZCApXG5cdFx0XHRcdHRocm93IG5ldyBIVFRQRXJyb3IoNDAzLCBcIkZvcmJpZGRlblwiKTtcblx0XHRcdFxuXHRcdFx0dGhyb3cgbmV3IEhUVFBFcnJvcig1MDAsIChlIGFzIGFueSkubWVzc2FnZSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcGFydHMgPSBmaWxlcGF0aC5zcGxpdCgnLicpO1xuXHRcdGNvbnN0IGV4dCA9IHBhcnRzW3BhcnRzLmxlbmd0aC0xXTtcblxuXHRcdGNvbnN0IG1pbWUgPSBudWxsOyAvL21pbWVsaXRlLmdldFR5cGUoZXh0KSA/PyBcInRleHQvcGxhaW5cIjtcblx0XHRcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCcpO1xuXHRcdC8vcmV0dXJuIGF3YWl0IGJ1aWxkQW5zd2VyKDIwMCwgY29udGVudCwgbWltZSk7XG5cdCovXG59XG5cbmNvbnN0IGRlZmF1bHRfcm91dGUgPSB7XG5cdGhhbmRsZXI6IGRlZmF1bHRfaGFuZGxlcixcblx0cGF0aCAgIDogXCIvZGVmYXVsdFwiLFxuXHR2YXJzICAgOiB7fVxufVxuXG5mdW5jdGlvbiBidWlsZFJlcXVlc3RIYW5kbGVyKHJvdXRlczogUm91dGVzLCB7XG5cdF9zdGF0aWMsXG5cdGxvZ2dlciAsXG5cdG5vdF9mb3VuZCAgICAgID0gXCIvZGVmYXVsdC9HRVRcIixcblx0aW50ZXJuYWxfZXJyb3IgPSBcIi9kZWZhdWx0L0dFVFwiXG59OiBQYXJ0aWFsPGJ1aWxkUmVxdWVzdEhhbmRsZXJPcHRzPikge1xuXG5cdGNvbnN0IHJlZ2V4ZXMgPSByb3V0ZXMubWFwKCAoW3VyaSwgaGFuZGxlciwgaXNfYnJ5XSkgPT4gW3BhdGgycmVnZXgodXJpKSwgaGFuZGxlciwgdXJpLCBpc19icnldIGFzIGNvbnN0KTtcblxuXHRjb25zdCBub3RfZm91bmRfcm91dGUgPSBbXG5cdFx0Z2V0Um91dGVIYW5kbGVyKHJlZ2V4ZXMsIFwiR0VUXCIsIG5vdF9mb3VuZCwgZmFsc2UpID8/IGRlZmF1bHRfcm91dGUsXG5cdFx0Z2V0Um91dGVIYW5kbGVyKHJlZ2V4ZXMsIFwiR0VUXCIsIG5vdF9mb3VuZCwgdHJ1ZSkgID8/IGRlZmF1bHRfcm91dGVcblx0XSBhcyBEZWZhdWx0Um91dGVPcHRzW107XG5cdGNvbnN0IGludGVybmFsX2Vycm9yX3JvdXRlID0gW1xuXHRcdGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBpbnRlcm5hbF9lcnJvciwgZmFsc2UpID8/IGRlZmF1bHRfcm91dGUsXG5cdFx0Z2V0Um91dGVIYW5kbGVyKHJlZ2V4ZXMsIFwiR0VUXCIsIGludGVybmFsX2Vycm9yLCB0cnVlKSAgPz8gZGVmYXVsdF9yb3V0ZVxuXHRdIGFzIERlZmF1bHRSb3V0ZU9wdHNbXTtcblxuXHRyZXR1cm4gYXN5bmMgZnVuY3Rpb24ocmVxdWVzdDogUmVxdWVzdCwgY29ubkluZm86IGFueSk6IFByb21pc2U8UmVzcG9uc2U+IHtcblxuXHRcdGNvbnN0IGlwID0gY29ubkluZm8ucmVtb3RlQWRkci5ob3N0bmFtZTtcblxuXHRcdGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuXHRcdGxldCBlcnJvciA9IG51bGw7XG5cdFx0Y29uc3QgbWV0aG9kID0gcmVxdWVzdC5tZXRob2QgYXMgUkVTVF9NZXRob2RzIHwgXCJPUFRJT05TXCI7XG5cblx0XHRsZXQgYW5zd2VyOiBSZXNwb25zZXx1bmRlZmluZWQ7XG5cdFx0bGV0IHVzZV9icnl0aG9uOiBudWxsfGJvb2xlYW4gPSBudWxsO1xuXG5cdFx0bGV0IHJvdXRlOiBSb3V0ZXxudWxsID0gbnVsbDtcblxuXHRcdHRyeSB7XG5cblx0XHRcdGlmKG1ldGhvZCA9PT0gXCJPUFRJT05TXCIpXG5cdFx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge2hlYWRlcnM6IENPUlNfSEVBREVSU30pO1xuXG5cdFx0XHRpZiggcmVxdWVzdC5oZWFkZXJzLmhhcyhcInVzZS1icnl0aG9uXCIpIClcblx0XHRcdFx0dXNlX2JyeXRob24gPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwidXNlLWJyeXRob25cIikgPT09IFwidHJ1ZVwiO1xuXG5cdFx0XHRyb3V0ZSA9IGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBtZXRob2QsIHVybCwgdXNlX2JyeXRob24pO1xuXG5cdFx0XHRpZiggcm91dGUgIT09IG51bGwpIHtcblx0XHRcdFx0YW5zd2VyID0gYXdhaXQgcm91dGUuaGFuZGxlcihyZXF1ZXN0LCByb3V0ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBfcm91dGUgPSBhd2FpdCBub3RfZm91bmRfcm91dGVbK3VzZV9icnl0aG9uIV07XG5cdFx0XHRcdF9yb3V0ZS5yb3V0ZSA9IHJvdXRlO1xuXHRcdFx0XHRhbnN3ZXIgPSBhd2FpdCBfcm91dGUuaGFuZGxlcihyZXF1ZXN0LCBfcm91dGUpXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBidWlsZEFuc3dlcihhbnN3ZXIpO1xuXG5cdFx0fSBjYXRjaChlKSB7XG5cblx0XHRcdGlmKCAhIChlIGluc3RhbmNlb2YgUmVzcG9uc2UpICkge1xuXHRcdFx0XHRjb25zdCBfcm91dGUgPSBpbnRlcm5hbF9lcnJvcl9yb3V0ZVsrdXNlX2JyeXRob24hXTtcblx0XHRcdFx0X3JvdXRlLnJvdXRlID0gcm91dGU7XG5cdFx0XHRcdF9yb3V0ZS5lcnJvciA9IGUgYXMgRXJyb3I7XG5cdFx0XHRcdGUgPSBhd2FpdCBfcm91dGUuaGFuZGxlcihyZXF1ZXN0LCBfcm91dGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYnVpbGRBbnN3ZXIoZSBhcyBSZXNwb25zZSk7XG5cblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0aWYoIGxvZ2dlciAhPT0gdW5kZWZpbmVkIClcblx0XHRcdFx0bG9nZ2VyKGlwLCBtZXRob2QsIHVybCwgZXJyb3IpO1xuXHRcdH1cblx0fTtcbn1cblxuXG4vLyB0ZXN0c1xuXG5leHBvcnQgZnVuY3Rpb24gcGF0aDJyZWdleChwYXRoOiBzdHJpbmcpIHtcblxuXHQvLyBFc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzLlxuXHQvLyBjZiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMTE1MTUwL2hvdy10by1lc2NhcGUtcmVndWxhci1leHByZXNzaW9uLXNwZWNpYWwtY2hhcmFjdGVycy11c2luZy1qYXZhc2NyaXB0XG5cdHBhdGggPSBwYXRoLnJlcGxhY2UoL1stW1xcXXt9KCkqKz8uLFxcXFxeJHwjXFxzXS9nLCAnXFxcXCQmJyk7XG5cblx0cmV0dXJuIG5ldyBSZWdFeHAoXCJeXCIgKyBwYXRoLnJlcGxhY2UoL1xcXFxcXHtbXlxcfV0rXFxcXFxcfS9nLCAoY2FwdHVyZWQpID0+IGAoPzwke2NhcHR1cmVkLnNsaWNlKDIsLTIpfT5bXi9dKylgKSArIFwiJFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoKHJlZ2V4OiBSZWdFeHAsIHVyaTogc3RyaW5nKSB7XG5cblx0bGV0IHJlc3VsdCA9IHJlZ2V4LmV4ZWModXJpKTtcblxuXHRpZihyZXN1bHQgPT09IG51bGwpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdHJldHVybiByZXN1bHQuZ3JvdXBzID8/IHt9O1xufVxuXG50eXBlIFJvdXRlID0ge1xuXHRoYW5kbGVyOiBIYW5kbGVyLFxuXHRwYXRoICAgOiBzdHJpbmcsXG5cdHZhcnMgICA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbn1cblxuZnVuY3Rpb24gZ2V0Um91dGVIYW5kbGVyKHJlZ2V4ZXM6IChyZWFkb25seSBbUmVnRXhwLCBIYW5kbGVyLCBzdHJpbmcsIGJvb2xlYW5dKVtdLFxuXHRcdFx0XHRcdFx0bWV0aG9kOiBSRVNUX01ldGhvZHMsXG5cdFx0XHRcdFx0XHR1cmw6IFVSTHxzdHJpbmcsXG5cdFx0XHRcdFx0XHR1c2VfYnJ5dGhvbjogYm9vbGVhbnxudWxsID0gbnVsbCk6IFJvdXRlfG51bGwge1xuXG5cdGxldCBjdXJSb3V0ZTogc3RyaW5nO1xuXHRpZiggdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIilcblx0XHRjdXJSb3V0ZSA9IGAke3VybH0vJHttZXRob2R9YDtcblx0ZWxzZVxuXHRcdGN1clJvdXRlID0gYCR7IGRlY29kZVVSSSh1cmwucGF0aG5hbWUpIH0vJHttZXRob2R9YDtcblxuXHRmb3IobGV0IHJvdXRlIG9mIHJlZ2V4ZXMpIHtcblxuXHRcdGlmKCB1c2VfYnJ5dGhvbiAhPT0gbnVsbCAmJiByb3V0ZVszXSAhPT0gdXNlX2JyeXRob24gKVxuXHRcdFx0Y29udGludWU7XG5cblx0XHR2YXIgdmFycyA9IG1hdGNoKHJvdXRlWzBdLCBjdXJSb3V0ZSk7XG5cblx0XHRpZih2YXJzICE9PSBmYWxzZSlcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGhhbmRsZXI6IHJvdXRlWzFdLFxuXHRcdFx0XHRwYXRoICAgOiByb3V0ZVsyXSxcblx0XHRcdFx0dmFyc1xuXHRcdFx0fTtcblx0fVxuXG5cdHJldHVybiBudWxsO1xufSIsImV4cG9ydCB7cGF0aDJyZWdleCwgbWF0Y2h9IGZyb20gXCIuLi9WU0hTXCI7IiwiZnVuY3Rpb24gd2VicGFja0VtcHR5QXN5bmNDb250ZXh0KHJlcSkge1xuXHQvLyBIZXJlIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKSBpcyB1c2VkIGluc3RlYWQgb2YgbmV3IFByb21pc2UoKSB0byBwcmV2ZW50XG5cdC8vIHVuY2F1Z2h0IGV4Y2VwdGlvbiBwb3BwaW5nIHVwIGluIGRldnRvb2xzXG5cdHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyByZXEgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH0pO1xufVxud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LmtleXMgPSAoKSA9PiAoW10pO1xud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LnJlc29sdmUgPSB3ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQ7XG53ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQuaWQgPSBcIi4vLiBsYXp5IHJlY3Vyc2l2ZVwiO1xubW9kdWxlLmV4cG9ydHMgPSB3ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQ7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4iLCJ2YXIgd2VicGFja1F1ZXVlcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgcXVldWVzXCIpIDogXCJfX3dlYnBhY2tfcXVldWVzX19cIjtcbnZhciB3ZWJwYWNrRXhwb3J0cyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgZXhwb3J0c1wiKSA6IFwiX193ZWJwYWNrX2V4cG9ydHNfX1wiO1xudmFyIHdlYnBhY2tFcnJvciA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgZXJyb3JcIikgOiBcIl9fd2VicGFja19lcnJvcl9fXCI7XG52YXIgcmVzb2x2ZVF1ZXVlID0gKHF1ZXVlKSA9PiB7XG5cdGlmKHF1ZXVlICYmIHF1ZXVlLmQgPCAxKSB7XG5cdFx0cXVldWUuZCA9IDE7XG5cdFx0cXVldWUuZm9yRWFjaCgoZm4pID0+IChmbi5yLS0pKTtcblx0XHRxdWV1ZS5mb3JFYWNoKChmbikgPT4gKGZuLnItLSA/IGZuLnIrKyA6IGZuKCkpKTtcblx0fVxufVxudmFyIHdyYXBEZXBzID0gKGRlcHMpID0+IChkZXBzLm1hcCgoZGVwKSA9PiB7XG5cdGlmKGRlcCAhPT0gbnVsbCAmJiB0eXBlb2YgZGVwID09PSBcIm9iamVjdFwiKSB7XG5cdFx0aWYoZGVwW3dlYnBhY2tRdWV1ZXNdKSByZXR1cm4gZGVwO1xuXHRcdGlmKGRlcC50aGVuKSB7XG5cdFx0XHR2YXIgcXVldWUgPSBbXTtcblx0XHRcdHF1ZXVlLmQgPSAwO1xuXHRcdFx0ZGVwLnRoZW4oKHIpID0+IHtcblx0XHRcdFx0b2JqW3dlYnBhY2tFeHBvcnRzXSA9IHI7XG5cdFx0XHRcdHJlc29sdmVRdWV1ZShxdWV1ZSk7XG5cdFx0XHR9LCAoZSkgPT4ge1xuXHRcdFx0XHRvYmpbd2VicGFja0Vycm9yXSA9IGU7XG5cdFx0XHRcdHJlc29sdmVRdWV1ZShxdWV1ZSk7XG5cdFx0XHR9KTtcblx0XHRcdHZhciBvYmogPSB7fTtcblx0XHRcdG9ialt3ZWJwYWNrUXVldWVzXSA9IChmbikgPT4gKGZuKHF1ZXVlKSk7XG5cdFx0XHRyZXR1cm4gb2JqO1xuXHRcdH1cblx0fVxuXHR2YXIgcmV0ID0ge307XG5cdHJldFt3ZWJwYWNrUXVldWVzXSA9IHggPT4ge307XG5cdHJldFt3ZWJwYWNrRXhwb3J0c10gPSBkZXA7XG5cdHJldHVybiByZXQ7XG59KSk7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmEgPSAobW9kdWxlLCBib2R5LCBoYXNBd2FpdCkgPT4ge1xuXHR2YXIgcXVldWU7XG5cdGhhc0F3YWl0ICYmICgocXVldWUgPSBbXSkuZCA9IC0xKTtcblx0dmFyIGRlcFF1ZXVlcyA9IG5ldyBTZXQoKTtcblx0dmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cztcblx0dmFyIGN1cnJlbnREZXBzO1xuXHR2YXIgb3V0ZXJSZXNvbHZlO1xuXHR2YXIgcmVqZWN0O1xuXHR2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWopID0+IHtcblx0XHRyZWplY3QgPSByZWo7XG5cdFx0b3V0ZXJSZXNvbHZlID0gcmVzb2x2ZTtcblx0fSk7XG5cdHByb21pc2Vbd2VicGFja0V4cG9ydHNdID0gZXhwb3J0cztcblx0cHJvbWlzZVt3ZWJwYWNrUXVldWVzXSA9IChmbikgPT4gKHF1ZXVlICYmIGZuKHF1ZXVlKSwgZGVwUXVldWVzLmZvckVhY2goZm4pLCBwcm9taXNlW1wiY2F0Y2hcIl0oeCA9PiB7fSkpO1xuXHRtb2R1bGUuZXhwb3J0cyA9IHByb21pc2U7XG5cdGJvZHkoKGRlcHMpID0+IHtcblx0XHRjdXJyZW50RGVwcyA9IHdyYXBEZXBzKGRlcHMpO1xuXHRcdHZhciBmbjtcblx0XHR2YXIgZ2V0UmVzdWx0ID0gKCkgPT4gKGN1cnJlbnREZXBzLm1hcCgoZCkgPT4ge1xuXHRcdFx0aWYoZFt3ZWJwYWNrRXJyb3JdKSB0aHJvdyBkW3dlYnBhY2tFcnJvcl07XG5cdFx0XHRyZXR1cm4gZFt3ZWJwYWNrRXhwb3J0c107XG5cdFx0fSkpXG5cdFx0dmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Zm4gPSAoKSA9PiAocmVzb2x2ZShnZXRSZXN1bHQpKTtcblx0XHRcdGZuLnIgPSAwO1xuXHRcdFx0dmFyIGZuUXVldWUgPSAocSkgPT4gKHEgIT09IHF1ZXVlICYmICFkZXBRdWV1ZXMuaGFzKHEpICYmIChkZXBRdWV1ZXMuYWRkKHEpLCBxICYmICFxLmQgJiYgKGZuLnIrKywgcS5wdXNoKGZuKSkpKTtcblx0XHRcdGN1cnJlbnREZXBzLm1hcCgoZGVwKSA9PiAoZGVwW3dlYnBhY2tRdWV1ZXNdKGZuUXVldWUpKSk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZuLnIgPyBwcm9taXNlIDogZ2V0UmVzdWx0KCk7XG5cdH0sIChlcnIpID0+ICgoZXJyID8gcmVqZWN0KHByb21pc2Vbd2VicGFja0Vycm9yXSA9IGVycikgOiBvdXRlclJlc29sdmUoZXhwb3J0cykpLCByZXNvbHZlUXVldWUocXVldWUpKSk7XG5cdHF1ZXVlICYmIHF1ZXVlLmQgPCAwICYmIChxdWV1ZS5kID0gMCk7XG59OyIsInZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiA/IChvYmopID0+IChPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSkgOiAob2JqKSA9PiAob2JqLl9fcHJvdG9fXyk7XG52YXIgbGVhZlByb3RvdHlwZXM7XG4vLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3Rcbi8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuLy8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4vLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3Rcbi8vIG1vZGUgJiAxNjogcmV0dXJuIHZhbHVlIHdoZW4gaXQncyBQcm9taXNlLWxpa2Vcbi8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbl9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG5cdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IHRoaXModmFsdWUpO1xuXHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuXHRpZih0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSB7XG5cdFx0aWYoKG1vZGUgJiA0KSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG5cdFx0aWYoKG1vZGUgJiAxNikgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbicpIHJldHVybiB2YWx1ZTtcblx0fVxuXHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuXHR2YXIgZGVmID0ge307XG5cdGxlYWZQcm90b3R5cGVzID0gbGVhZlByb3RvdHlwZXMgfHwgW251bGwsIGdldFByb3RvKHt9KSwgZ2V0UHJvdG8oW10pLCBnZXRQcm90byhnZXRQcm90byldO1xuXHRmb3IodmFyIGN1cnJlbnQgPSBtb2RlICYgMiAmJiB2YWx1ZTsgdHlwZW9mIGN1cnJlbnQgPT0gJ29iamVjdCcgJiYgIX5sZWFmUHJvdG90eXBlcy5pbmRleE9mKGN1cnJlbnQpOyBjdXJyZW50ID0gZ2V0UHJvdG8oY3VycmVudCkpIHtcblx0XHRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjdXJyZW50KS5mb3JFYWNoKChrZXkpID0+IChkZWZba2V5XSA9ICgpID0+ICh2YWx1ZVtrZXldKSkpO1xuXHR9XG5cdGRlZlsnZGVmYXVsdCddID0gKCkgPT4gKHZhbHVlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBkZWYpO1xuXHRyZXR1cm4gbnM7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5tanNcIjtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm1pbmlDc3NGID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiB1bmRlZmluZWQ7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3Ncbi8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuLy8gW3Jlc29sdmUsIFByb21pc2VdID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJtYWluXCI6IDBcbn07XG5cbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIge2lkcywgbW9kdWxlcywgcnVudGltZX0gPSBkYXRhO1xuXHQvLyBhZGQgXCJtb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuXHQvLyB0aGVuIGZsYWcgYWxsIFwiaWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG5cdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDA7XG5cdGZvcihtb2R1bGVJZCBpbiBtb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHRmb3IoO2kgPCBpZHMubGVuZ3RoOyBpKyspIHtcblx0XHRjaHVua0lkID0gaWRzW2ldO1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhpbnN0YWxsZWRDaHVua3MsIGNodW5rSWQpICYmIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKCk7XG5cdFx0fVxuXHRcdGluc3RhbGxlZENodW5rc1tpZHNbaV1dID0gMDtcblx0fVxuXG59XG5cbl9fd2VicGFja19yZXF1aXJlX18uZi5qID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdFx0Ly8gaW1wb3J0KCkgY2h1bmsgbG9hZGluZyBmb3IgamF2YXNjcmlwdFxuXHRcdHZhciBpbnN0YWxsZWRDaHVua0RhdGEgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLm8oaW5zdGFsbGVkQ2h1bmtzLCBjaHVua0lkKSA/IGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA6IHVuZGVmaW5lZDtcblx0XHRpZihpbnN0YWxsZWRDaHVua0RhdGEgIT09IDApIHsgLy8gMCBtZWFucyBcImFscmVhZHkgaW5zdGFsbGVkXCIuXG5cblx0XHRcdC8vIGEgUHJvbWlzZSBtZWFucyBcImN1cnJlbnRseSBsb2FkaW5nXCIuXG5cdFx0XHRpZihpbnN0YWxsZWRDaHVua0RhdGEpIHtcblx0XHRcdFx0cHJvbWlzZXMucHVzaChpbnN0YWxsZWRDaHVua0RhdGFbMV0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdFx0XHQvLyBzZXR1cCBQcm9taXNlIGluIGNodW5rIGNhY2hlXG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSBpbXBvcnQoXCIuLi9cIiArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSkudGhlbihpbnN0YWxsQ2h1bmssIChlKSA9PiB7XG5cdFx0XHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gIT09IDApIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdHRocm93IGU7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSBQcm9taXNlLnJhY2UoW3Byb21pc2UsIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiAoaW5zdGFsbGVkQ2h1bmtEYXRhID0gaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gW3Jlc29sdmVdKSldKVxuXHRcdFx0XHRcdHByb21pc2VzLnB1c2goaW5zdGFsbGVkQ2h1bmtEYXRhWzFdID0gcHJvbWlzZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG59O1xuXG4vLyBubyBwcmVmZXRjaGluZ1xuXG4vLyBubyBwcmVsb2FkZWRcblxuLy8gbm8gZXh0ZXJuYWwgaW5zdGFsbCBjaHVua1xuXG4vLyBubyBvbiBjaHVua3MgbG9hZGVkIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSB1c2VkICdtb2R1bGUnIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LnRzXCIpO1xuIiwiIl0sIm5hbWVzIjpbImdsb2JhbFRoaXMiLCJEZW5vIiwiYXJncyIsImxlbmd0aCIsInBhcnNlQXJncyIsImhlbHAiLCJjb25zb2xlIiwibG9nIiwiZXhpdCIsInN0YXJ0SFRUUFNlcnZlciIsInBvcnQiLCJob3N0bmFtZSIsImhvc3QiLCJyb3V0ZXMiLCJfIiwiZGVmYXVsdCIsIm5vdF9mb3VuZCIsImludGVybmFsX2Vycm9yIiwidGVzdCIsInRlc3RfbmFtZSIsInJlcXVlc3QiLCJleHBlY3RlZF9yZXNwb25zZSIsIlJlcXVlc3QiLCJlbmNvZGVVUkkiLCJ1c2VfYnJ5dGhvbiIsImxhbmciLCJzYW5pdGl6ZVJlc291cmNlcyIsInIiLCJjbG9uZSIsImhlYWRlcnMiLCJzZXQiLCJhc3NlcnRSZXNwb25zZSIsImZldGNoIiwidWludF9lcXVhbHMiLCJhIiwiYiIsImJ5dGVMZW5ndGgiLCJpIiwiYXQiLCJyZXNwb25zZSIsInN0YXR1cyIsImJvZHkiLCJtaW1lIiwic3RhdHVzVGV4dCIsIkVycm9yIiwicmVwX21pbWUiLCJnZXQiLCJVaW50OEFycmF5IiwicmVwIiwiYnl0ZXMiLCJyZXBfdGV4dCIsInRleHQiLCJyb290RGlyIiwiY3dkIiwiX2RlZmF1bHQiLCJzdGF0aWMiLCJfc3RhdGljIiwibG9nZ2VyIiwicm91dGVzSGFuZGxlcnMiLCJsb2FkQWxsUm91dGVzSGFuZGxlcnMiLCJyZXF1ZXN0SGFuZGxlciIsImJ1aWxkUmVxdWVzdEhhbmRsZXIiLCJzZXJ2ZSIsImZpbmlzaGVkIiwiU1NFV3JpdGVyIiwiY29uc3RydWN0b3IiLCJ3cml0ZXIiLCJzZW5kRXZlbnQiLCJkYXRhIiwibmFtZSIsIndyaXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsImNsb3NlZCIsImNsb3NlIiwiYWJvcnQiLCJWU0hTIiwiU1NFUmVzcG9uc2UiLCJjYWxsYmFjayIsIm9wdGlvbnMiLCJyZWFkYWJsZSIsIndyaXRhYmxlIiwiVHJhbnNmb3JtU3RyZWFtIiwiZ2V0V3JpdGVyIiwiY2F0Y2giLCJlIiwic3RyZWFtIiwicGlwZVRocm91Z2giLCJUZXh0RW5jb2RlclN0cmVhbSIsIkhlYWRlcnMiLCJoYXMiLCJSZXNwb25zZSIsImJyeXRob25fbG9hZGluZyIsImJyeXRob25fcHJvbWlzZSIsIlByb21pc2UiLCJ3aXRoUmVzb2x2ZXJzIiwibG9hZF9icnl0aG9uIiwicHJvbWlzZSIsImZpbGUiLCJkaXIiLCJ1cmwiLCJzbGljZSIsImxhc3RJbmRleE9mIiwiYnJ5dGhvbiIsInJlYWRUZXh0RmlsZSIsIiRCIiwiX19CUllUSE9OX18iLCJpbm5lciIsImdsb2JhbCIsIm1vZHVsZSIsImV2YWwiLCJ3YXJuIiwicmVzb2x2ZSIsIlJPT1QiLCJyb3V0ZXNfdXJpIiwiZ2V0QWxsUm91dGVzIiwiaGFuZGxlcnMiLCJhbGwiLCJtYXAiLCJ1cmkiLCJpc19icnl0aG9uIiwiZW5kc1dpdGgiLCJleHQiLCJyb3V0ZSIsImNvZGUiLCJpbmRleE9mIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsInR5cGUiLCJlcnJvciIsImhhbmRsZXIiLCJjdXJyZW50UGF0aCIsImZpbGVzIiwiZGlyRW50cnkiLCJyZWFkRGlyIiwiZW50cnlQYXRoIiwiaXNEaXJlY3RvcnkiLCJpbmNsdWRlcyIsInB1c2giLCJDT1JTX0hFQURFUlMiLCJidWlsZEFuc3dlciIsInJlcF9oZWFkZXJzIiwiZGVmYXVsdF9oYW5kbGVyIiwib3B0cyIsIm1lc3NhZ2UiLCJkZWZhdWx0X3JvdXRlIiwicGF0aCIsInZhcnMiLCJyZWdleGVzIiwiaXNfYnJ5IiwicGF0aDJyZWdleCIsIm5vdF9mb3VuZF9yb3V0ZSIsImdldFJvdXRlSGFuZGxlciIsImludGVybmFsX2Vycm9yX3JvdXRlIiwiY29ubkluZm8iLCJpcCIsInJlbW90ZUFkZHIiLCJtZXRob2QiLCJhbnN3ZXIiLCJfcm91dGUiLCJ1bmRlZmluZWQiLCJyZXBsYWNlIiwiUmVnRXhwIiwiY2FwdHVyZWQiLCJtYXRjaCIsInJlZ2V4IiwicmVzdWx0IiwiZXhlYyIsImdyb3VwcyIsImN1clJvdXRlIiwiZGVjb2RlVVJJIiwicGF0aG5hbWUiXSwic291cmNlUm9vdCI6IiJ9