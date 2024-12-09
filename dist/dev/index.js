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
    // deno run --allow-all index.ts route
    if (args.help) {
        console.log(`./VSHS.ts $ROUTES
	--host : default locahost
	--port : default 8080`);
        Deno.exit(0);
    }
    startHTTPServer({
        port: args.port ?? 8080,
        hostname: args.host ?? "localhost",
        routes: args._[0]
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
async function startHTTPServer({ port = 8080, hostname = "localhost", routes = "/routes", static: _static, logger = ()=>{} }) {
    let routesHandlers = routes;
    if (typeof routes === "string") {
        if (routes[0] === "/") routes = rootDir() + routes;
        routesHandlers = await loadAllRoutesHandlers(routes);
    }
    if (_static?.[0] === "/") _static = rootDir() + _static;
    const requestHandler = buildRequestHandler(routesHandlers, _static, logger);
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
// use async ?
//import { mimelite } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
function buildRequestHandler(routes, _static, logger) {
    const regexes = routes.map(([uri, handler, is_bry])=>[
            path2regex(uri),
            handler,
            uri,
            is_bry
        ]);
    return async function(request, connInfo) {
        const ip = connInfo.remoteAddr.hostname;
        const url = new URL(request.url);
        let error = null;
        const method = request.method;
        try {
            if (method === "OPTIONS") return new Response(null, {
                headers: CORS_HEADERS
            });
            let use_brython = null;
            if (request.headers.has("use-brython")) use_brython = request.headers.get("use-brython") === "true";
            const route = getRouteHandler(regexes, method, url, use_brython);
            if (route === null) {
                if (_static === undefined) throw new HTTPError(404, "Not found");
                let filepath = `${_static}/${url.pathname}`;
                let content;
                try {
                    const info = await Deno.stat(filepath);
                    if (info.isDirectory) filepath = `${filepath}/index.html`;
                    content = await Deno.readFile(filepath);
                } catch (e) {
                    if (e instanceof Deno.errors.NotFound) throw new HTTPError(404, "Not Found");
                    if (e instanceof Deno.errors.PermissionDenied) throw new HTTPError(403, "Forbidden");
                    throw new HTTPError(500, e.message);
                }
                const parts = filepath.split('.');
                const ext = parts[parts.length - 1];
                const mime = null; //mimelite.getType(ext) ?? "text/plain";
                throw new Error('not implemented');
            //return await buildAnswer(200, content, mime);
            }
            let answer = await route.handler(request, route);
            return buildAnswer(answer);
        } catch (e) {
            if (e instanceof Response) return buildAnswer(e);
            return buildAnswer(new Response(e.message, {
                status: 500
            }));
        // TODO: remove
        /*
			error = e;

			let error_code = 500;
			if( e instanceof HTTPError )
				error_code = e.error_code;
			else
				console.error(e);

			const error_url = new URL(`/errors/${error_code}`, url);
			const route = getRouteHandler(regexes, "GET", error_url);
			let answer  = e.message;
			if(route !== null) {
				try{
					answer = await route.handler({url, body: e.message}, route);	
				} catch(e) {
					console.error(e); // errors handlers shoudn't raise errors...
				}
			}

			return await buildAnswer(error_code, answer);
			*/ } finally{
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
    let curRoute = `${decodeURI(url.pathname)}/${method}`;
    for (let route of regexes){
        if (use_brython !== null && route[3] !== use_brython) continue;
        var vars = match(route[0], curRoute);
        if (vars !== false) return {
            handler: route[1],
            path: route[2],
            vars,
            url
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
/******/ 

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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VUFDakY7VUFDQTtVQUNBOzs7OztVQ1BBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EsRUFBRTtVQUNGOzs7OztVQ1JBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7Ozs7O1VDSkE7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7Ozs7VUNKQTs7Ozs7VUNBQTtVQUNBO1VBQ0E7VUFDQSx1REFBdUQsaUJBQWlCO1VBQ3hFO1VBQ0EsZ0RBQWdELGFBQWE7VUFDN0Q7Ozs7O1VDTkE7Ozs7O1VDQUE7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0EsTUFBTSx1QkFBdUI7VUFDN0I7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EsTUFBTSxnQkFBZ0I7VUFDdEI7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBOztVQUVBO1VBQ0E7VUFDQTtVQUNBLGlDQUFpQzs7VUFFakM7VUFDQTtVQUNBO1VBQ0EsS0FBSztVQUNMLGVBQWU7VUFDZjtVQUNBO1VBQ0E7VUFDQTtVQUNBLE1BQU07VUFDTjtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7O1VBRUE7O1VBRUE7O1VBRUE7Ozs7O1NFMURBO1NBQ0E7U0FDQTtTQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vVlNIUy8uL1ZTSFMudHMiLCJ3ZWJwYWNrOi8vVlNIUy8uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9WU0hTLy4vLi8gbGF6eSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvYXN5bmMgbW9kdWxlIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2NyZWF0ZSBmYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvZW5zdXJlIGNodW5rIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2dldCBtaW5pLWNzcyBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL3B1YmxpY1BhdGgiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvaW1wb3J0IGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IC1TIGRlbm8gcnVuIC0tYWxsb3ctYWxsIC0td2F0Y2ggLS1jaGVjayAtLXVuc3RhYmxlLXNsb3BweS1pbXBvcnRzXG5cblxuaWYoIFwiRGVub1wiIGluIGdsb2JhbFRoaXMgJiYgRGVuby5hcmdzLmxlbmd0aCApIHtcblxuXHRjb25zdCB7cGFyc2VBcmdzfSA9IGF3YWl0IGltcG9ydChcImpzcjpAc3RkL2NsaS9wYXJzZS1hcmdzXCIpO1xuXG5cdGNvbnN0IGFyZ3MgPSBwYXJzZUFyZ3MoRGVuby5hcmdzKVxuXHQvLyBkZW5vIHJ1biAtLWFsbG93LWFsbCBpbmRleC50cyByb3V0ZVxuXG5cdGlmKCBhcmdzLmhlbHAgKSB7XG5cdFx0Y29uc29sZS5sb2coYC4vVlNIUy50cyAkUk9VVEVTXG5cdC0taG9zdCA6IGRlZmF1bHQgbG9jYWhvc3Rcblx0LS1wb3J0IDogZGVmYXVsdCA4MDgwYClcblx0XHREZW5vLmV4aXQoMCk7XG5cdH1cblxuXHRzdGFydEhUVFBTZXJ2ZXIoe1xuXHRcdHBvcnQgICAgOiBhcmdzLnBvcnQgPz8gODA4MCxcblx0XHRob3N0bmFtZTogYXJncy5ob3N0ID8/IFwibG9jYWxob3N0XCIsXG5cdFx0cm91dGVzICA6IGFyZ3MuX1swXSBhcyBzdHJpbmdcblx0fSlcblxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxudHlwZSBMb2dnZXIgPSAoaXA6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIHVybDogVVJMLCBlcnJvcjogbnVsbHxIVFRQRXJyb3J8RXJyb3IpID0+IHZvaWQ7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0KFxuXHR0ZXN0X25hbWUgIDogc3RyaW5nLFxuXHRyZXF1ZXN0ICAgIDogUmVxdWVzdHxzdHJpbmcsXG5cdGV4cGVjdGVkX3Jlc3BvbnNlOiBQYXJ0aWFsPEV4cGVjdGVkQW5zd2VyPlxuKSB7XG5cblx0aWYodHlwZW9mIHJlcXVlc3QgPT09IFwic3RyaW5nXCIpXG5cdFx0cmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGVuY29kZVVSSShyZXF1ZXN0KSk7XG5cblx0Zm9yKGxldCB1c2VfYnJ5dGhvbiBvZiBbXCJ0cnVlXCIsIFwiZmFsc2VcIl0pIHtcblx0XHRjb25zdCBsYW5nID0gdXNlX2JyeXRob24gPT09IFwidHJ1ZVwiID8gXCJicnlcIiA6IFwianNcIjtcblx0XHREZW5vLnRlc3QoYCR7dGVzdF9uYW1lfSAoJHtsYW5nfSlgLCB7c2FuaXRpemVSZXNvdXJjZXM6IGZhbHNlfSwgYXN5bmMoKSA9PiB7XG5cblx0XHRcdGNvbnN0IHIgPSByZXF1ZXN0LmNsb25lKCk7XG5cdFx0XHRyLmhlYWRlcnMuc2V0KFwidXNlLWJyeXRob25cIiwgdXNlX2JyeXRob24pO1xuXHRcdFx0YXdhaXQgYXNzZXJ0UmVzcG9uc2UoYXdhaXQgZmV0Y2gociksIGV4cGVjdGVkX3Jlc3BvbnNlKTtcblx0XHR9KTtcblx0fVxufVxuXG5mdW5jdGlvbiB1aW50X2VxdWFscyhhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KSB7XG5cblx0aWYoYi5ieXRlTGVuZ3RoICE9PSBiLmJ5dGVMZW5ndGgpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdGZvcihsZXQgaSA9IDA7IGkgPCBhLmJ5dGVMZW5ndGg7ICsraSlcblx0XHRpZihhLmF0KGkpICE9PSBiLmF0KGkpKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxudHlwZSBFeHBlY3RlZEFuc3dlciA9IHtcblx0c3RhdHVzICAgIDogbnVtYmVyLFxuXHRzdGF0dXNUZXh0OiBzdHJpbmcsXG5cdGJvZHkgIDogc3RyaW5nfFVpbnQ4QXJyYXl8bnVsbCxcblx0bWltZSAgOiBzdHJpbmd8bnVsbCxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRSZXNwb25zZShyZXNwb25zZTogUmVzcG9uc2UsIHtcblx0c3RhdHVzID0gMjAwLFxuXHRib2R5ICAgPSBudWxsLFxuXHRtaW1lICAgPSBudWxsLFxuXHRzdGF0dXNUZXh0ID0gXCJPS1wiXG5cbn06IFBhcnRpYWw8RXhwZWN0ZWRBbnN3ZXI+KSB7XG5cblx0aWYocmVzcG9uc2Uuc3RhdHVzICE9PSBzdGF0dXMpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFxceDFiWzE7MzFtV3Jvbmcgc3RhdHVzIGNvZGU6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3Jlc3BvbnNlLnN0YXR1c31cXHgxYlswbVxuXFx4MWJbMTszMm0rICR7c3RhdHVzfVxceDFiWzBtYCk7XG5cdH1cblxuXHRpZihyZXNwb25zZS5zdGF0dXNUZXh0ICE9PSBzdGF0dXNUZXh0KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIHN0YXR1cyB0ZXh0OlxceDFiWzBtXG5cXHgxYlsxOzMxbS0gJHtyZXNwb25zZS5zdGF0dXNUZXh0fVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtzdGF0dXNUZXh0fVxceDFiWzBtYCk7XG5cdH1cblxuXHRsZXQgcmVwX21pbWUgPSByZXNwb25zZS5oZWFkZXJzLmdldCgnQ29udGVudC1UeXBlJyk7XG5cdGlmKCBtaW1lID09PSBudWxsICYmIHJlcF9taW1lID09PSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKVxuXHRcdHJlcF9taW1lID0gbnVsbDtcblx0aWYoIHJlcF9taW1lICE9PSBtaW1lICkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBtaW1lLXR5cGU6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcF9taW1lfVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHttaW1lfVxceDFiWzBtYCk7XG5cdFx0fVxuXG5cdGlmKCBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSApIHtcblx0XHRjb25zdCByZXAgPSBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5ieXRlcygpKTtcblx0XHRpZiggISB1aW50X2VxdWFscyhib2R5LCByZXApIClcblx0XHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBib2R5OlxceDFiWzBtXG5cXHgxYlsxOzMxbS0gJHtyZXB9XFx4MWJbMG1cblxceDFiWzE7MzJtKyAke2JvZHl9XFx4MWJbMG1gKTtcblx0fSBlbHNlIHtcblxuXHRcdGNvbnN0IHJlcF90ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuXHRcdGlmKCByZXBfdGV4dCAhPT0gYm9keSAmJiAoYm9keSAhPT0gbnVsbCB8fCByZXBfdGV4dCAhPT0gXCJcIikgKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIGJvZHk6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcF90ZXh0fVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtib2R5fVxceDFiWzBtYCk7XG5cdH1cbn1cblxudHlwZSBIVFRQU2VydmVyT3B0cyA9IHtcblx0cG9ydDogbnVtYmVyLFxuXHRob3N0bmFtZTogc3RyaW5nLFxuXHRyb3V0ZXM6IHN0cmluZ3xSb3V0ZXMsXG5cdHN0YXRpYz86IHN0cmluZyxcblx0bG9nZ2VyPzogTG9nZ2VyIC8vIG5vdCBkb2N1bWVudGVkXG59O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByb290RGlyKCkge1xuXHRyZXR1cm4gRGVuby5jd2QoKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gc3RhcnRIVFRQU2VydmVyKHsgcG9ydCA9IDgwODAsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRob3N0bmFtZSA9IFwibG9jYWxob3N0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyb3V0ZXMgPSBcIi9yb3V0ZXNcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXRpYzogX3N0YXRpYyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxvZ2dlciA9ICgpID0+IHt9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTogSFRUUFNlcnZlck9wdHMpIHtcblxuXHRsZXQgcm91dGVzSGFuZGxlcnM6IFJvdXRlcyA9IHJvdXRlcyBhcyBhbnk7XG5cdGlmKCB0eXBlb2Ygcm91dGVzID09PSBcInN0cmluZ1wiICkge1xuXHRcdGlmKHJvdXRlc1swXSA9PT0gXCIvXCIpXG5cdFx0XHRyb3V0ZXMgPSByb290RGlyKCkgKyByb3V0ZXM7XG5cdFx0XHRcblx0XHRyb3V0ZXNIYW5kbGVycyA9IGF3YWl0IGxvYWRBbGxSb3V0ZXNIYW5kbGVycyhyb3V0ZXMpO1xuXHR9XG5cdFxuXHRpZihfc3RhdGljPy5bMF0gPT09IFwiL1wiKVxuXHRcdF9zdGF0aWMgPSByb290RGlyKCkgKyBfc3RhdGljO1xuXHRcblx0Y29uc3QgcmVxdWVzdEhhbmRsZXIgPSBidWlsZFJlcXVlc3RIYW5kbGVyKHJvdXRlc0hhbmRsZXJzLCBfc3RhdGljLCBsb2dnZXIpO1xuXG5cdC8vIGh0dHBzOi8vZG9jcy5kZW5vLmNvbS9ydW50aW1lL3R1dG9yaWFscy9odHRwX3NlcnZlclxuXHRhd2FpdCBEZW5vLnNlcnZlKHtcblx0XHRwb3J0LFxuXHRcdGhvc3RuYW1lLFxuXHQgfSwgcmVxdWVzdEhhbmRsZXIpLmZpbmlzaGVkO1xufVxuXG5cbi8vVE9ETzogcmVtb3ZlXG5jbGFzcyBIVFRQRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG5cblx0I2Vycm9yX2NvZGU6bnVtYmVyO1xuXG5cdGNvbnN0cnVjdG9yKGh0dHBfZXJyb3JfY29kZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpIHtcblx0XHRzdXBlcihtZXNzYWdlKTtcblx0XHR0aGlzLm5hbWUgPSBcIkhUVFBFcnJvclwiO1xuXHRcdHRoaXMuI2Vycm9yX2NvZGUgPSBodHRwX2Vycm9yX2NvZGU7XG5cdH1cblxuXHRnZXQgZXJyb3JfY29kZSgpIHtcblx0XHRyZXR1cm4gdGhpcy4jZXJyb3JfY29kZTtcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgU1NFV3JpdGVyIHtcbiAgICAjd3JpdGVyOiBXcml0YWJsZVN0cmVhbURlZmF1bHRXcml0ZXI7XG4gICAgY29uc3RydWN0b3Iod3JpdGVyOiBXcml0YWJsZVN0cmVhbURlZmF1bHRXcml0ZXIpIHtcbiAgICAgICAgdGhpcy4jd3JpdGVyID0gd3JpdGVyO1xuICAgIH1cblxuICAgIHNlbmRFdmVudChkYXRhOiBhbnksIG5hbWUgPSAnbWVzc2FnZScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3dyaXRlci53cml0ZShcbmBldmVudDogJHtuYW1lfVxuZGF0YTogJHtKU09OLnN0cmluZ2lmeShkYXRhKX1cblxuYCk7XG4gICAgfVxuXG5cdGdldCBjbG9zZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuI3dyaXRlci5jbG9zZWQ7XG5cdH1cblxuXHRjbG9zZSgpIHtcblx0XHRyZXR1cm4gdGhpcy4jd3JpdGVyLmNsb3NlKCk7XG5cdH1cblxuXHRhYm9ydCgpIHtcblx0XHRyZXR1cm4gdGhpcy4jd3JpdGVyLmFib3J0KCk7XG5cdH1cbn1cblxuLy8gaGVscGVyXG5leHBvcnQgY29uc3QgVlNIUyA9IHtcblx0U1NFUmVzcG9uc2U6IGZ1bmN0aW9uPFQgZXh0ZW5kcyBhbnlbXT4oY2FsbGJhY2s6ICh3cml0ZXI6IFNTRVdyaXRlciwgLi4uYXJnczogVCkgPT4gUHJvbWlzZTx2b2lkPixcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICAgb3B0aW9uczogUmVzcG9uc2VJbml0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQgICAuLi5hcmdzOiBUKSB7XG5cdFx0Y29uc3Qge3JlYWRhYmxlLCB3cml0YWJsZX0gPSBuZXcgVHJhbnNmb3JtU3RyZWFtKCk7XG5cblx0XHRjb25zdCB3cml0ZXIgPSBuZXcgU1NFV3JpdGVyKHdyaXRhYmxlLmdldFdyaXRlcigpKTtcblx0XHRjYWxsYmFjayggd3JpdGVyLCAuLi5hcmdzICkuY2F0Y2goIChlKSA9PiB7XG5cdFx0XHR3cml0ZXIuYWJvcnQoKTtcblx0XHRcdHRocm93IGU7XG5cdFx0fSlcblx0XG5cdFx0Y29uc3Qgc3RyZWFtID0gcmVhZGFibGUucGlwZVRocm91Z2goIG5ldyBUZXh0RW5jb2RlclN0cmVhbSgpICk7XG5cblx0XHRvcHRpb25zPz89IHt9O1xuXHRcdG9wdGlvbnMuaGVhZGVycz8/PXt9O1xuXHRcdGlmKCBvcHRpb25zLmhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG5cdFx0XHRpZiggISBvcHRpb25zLmhlYWRlcnMuaGFzKFwiQ29udGVudC1UeXBlXCIpIClcblx0XHRcdFx0b3B0aW9ucy5oZWFkZXJzLnNldChcIkNvbnRlbnQtVHlwZVwiLCBcInRleHQvZXZlbnQtc3RyZWFtXCIpO1xuXHRcdH0gZWxzZVxuXHRcdFx0KG9wdGlvbnMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtcIkNvbnRlbnQtVHlwZVwiXSA/Pz0gXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiO1xuXG5cblx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKHN0cmVhbSwgb3B0aW9ucyk7XG5cblx0fVxufTtcbi8vIEB0cy1pZ25vcmVcbmdsb2JhbFRoaXMuVlNIUyA9IFZTSFM7XG5cbmV4cG9ydCB0eXBlIEhhbmRsZXJQYXJhbXMgPSBbe1xuXHR1cmwgOiBVUkx8c3RyaW5nLFxuXHRib2R5OiBudWxsfGFueVxuXHR9LHtcblx0XHRwYXRoOiBzdHJpbmcsXG5cdFx0dmFyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuXHR9XG5dO1xuXG50eXBlIEhhbmRsZXIgPSAoLi4uYXJnczogSGFuZGxlclBhcmFtcykgPT4gUHJvbWlzZTxhbnk+O1xudHlwZSBSb3V0ZXMgID0gKHJlYWRvbmx5IFtzdHJpbmcsIEhhbmRsZXIsIGJvb2xlYW5dKVtdO1xuXG5sZXQgYnJ5dGhvbl9sb2FkaW5nICA9IGZhbHNlO1xubGV0IGJyeXRob25fcHJvbWlzZSA9IFByb21pc2Uud2l0aFJlc29sdmVyczx2b2lkPigpO1xuXG5hc3luYyBmdW5jdGlvbiBsb2FkX2JyeXRob24oKSB7XG5cdGlmKCBicnl0aG9uX2xvYWRpbmcgKSB7XG5cdFx0YXdhaXQgYnJ5dGhvbl9wcm9taXNlLnByb21pc2Vcblx0XHRyZXR1cm47XG5cdH1cblxuXHRicnl0aG9uX2xvYWRpbmcgPSB0cnVlO1xuXG5cdC8vYnJ5dGhvbiA9IGF3YWl0IChhd2FpdCBmZXRjaCggXCJodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9icnl0aG9uLzMuMTMuMC9icnl0aG9uLm1pbi5qc1wiICkpLnRleHQoKTtcblx0Y29uc3QgZmlsZSA9IFwiYnJ5dGhvbigxKVwiO1xuXHRjb25zdCBkaXIgPSBpbXBvcnQubWV0YS51cmwuc2xpY2UoNiwgaW1wb3J0Lm1ldGEudXJsLmxhc3RJbmRleE9mKCcvJykgKTtcblx0Y29uc3QgYnJ5dGhvbiA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKGRpciArIGAvJHtmaWxlfS5qc2ApO1xuXG5cdC8vIEB0cy1pZ25vcmVcblx0Z2xvYmFsVGhpcy4kQiAgPSBnbG9iYWxUaGlzLl9fQlJZVEhPTl9fID0ge307IC8vIHdoeSBpcyBpdCByZXF1aXJlZCA/Pz9cblx0Ly8gQHRzLWlnbm9yZVxuXHRnbG9iYWxUaGlzLmlubmVyID0gbnVsbDtcblx0Ly8gQHRzLWlnbm9yZVxuXHRnbG9iYWxUaGlzLmdsb2JhbCA9IHt9O1xuXHQvLyBAdHMtaWdub3JlXG5cdGdsb2JhbFRoaXMubW9kdWxlID0ge307XG5cdGV2YWwoYnJ5dGhvbik7XG5cblx0Y29uc29sZS53YXJuKFwiPT0gbG9hZGVkID09XCIpO1xuXHRicnl0aG9uX3Byb21pc2UucmVzb2x2ZSgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkQWxsUm91dGVzSGFuZGxlcnMocm91dGVzOiBzdHJpbmcpOiBQcm9taXNlPFJvdXRlcz4ge1xuXG5cdGNvbnN0IFJPT1QgPSByb290RGlyKCk7XG5cdGxldCByb3V0ZXNfdXJpID0gYXdhaXQgZ2V0QWxsUm91dGVzKHJvdXRlcyk7XG5cblx0dHlwZSBNb2R1bGUgPSB7ZGVmYXVsdDogSGFuZGxlcn07XG5cdGNvbnN0IGhhbmRsZXJzICAgPSBhd2FpdCBQcm9taXNlLmFsbCggcm91dGVzX3VyaS5tYXAoIGFzeW5jICh1cmkpID0+IHtcblxuXHRcdC8vIG9ubHkgd2l0aCBpbXBvcnRzIG1hcCwgYnV0IGJ1Z2dlZFxuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZW5vL2lzc3Vlcy8yMjIzN1xuXHRcdC8vaWYoIHVyaS5zdGFydHNXaXRoKFJPT1QpIClcblx0XHQvL1x0dXJpID0gdXJpLnNsaWNlKFJPT1QubGVuZ3RoKVxuXG5cdFx0LyppZiggdXJpWzFdID09PSAnOicgKSAvLyB3aW5kb3dzIGRyaXZlXG5cdFx0XHR1cmkgPSBgZmlsZTovLyR7dXJpfWA7Ki9cblxuXHRcdGNvbnN0IGlzX2JyeXRob24gPSB1cmkuZW5kc1dpdGgoJy5icnknKTtcblx0XHRsZXQgZXh0ID0gaXNfYnJ5dGhvbiA/IFwiLmJyeVwiIDogXCIudHNcIlxuXHRcdGxldCByb3V0ZSA9IHVyaS5zbGljZShyb3V0ZXMubGVuZ3RoLCAtIGV4dC5sZW5ndGgpO1xuXG5cdFx0bGV0IG1vZHVsZSE6IE1vZHVsZTtcblx0XHR0cnl7XG5cblx0XHRcdGxldCBjb2RlID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUodXJpKTtcblxuXHRcdFx0aWYoIHJvdXRlLmVuZHNXaXRoKCdpbmRleCcpIClcblx0XHRcdFx0cm91dGUgPSBjb2RlLnNsaWNlKDMsIGNvZGUuaW5kZXhPZignXFxuJykgLSBleHQubGVuZ3RoICk7XG5cblx0XHRcdGlmKCBpc19icnl0aG9uICkge1xuXG5cdFx0XHRcdGF3YWl0IGxvYWRfYnJ5dGhvbigpO1xuXG5cdFx0XHRcdC8vVE9ETzogZHVwbGljYXRlZCBjb2RlIHdpdGggcGxheWdyb3VuZC4uLiAoISBcXGAgdnMgXFxcXFxcYCkuXG5cdFx0XHRcdGNvZGUgPSBgY29uc3QgJEIgPSBnbG9iYWxUaGlzLl9fQlJZVEhPTl9fO1xuXG5cdFx0XHRcdCRCLnJ1blB5dGhvblNvdXJjZShcXGAke2NvZGV9XFxgLCBcIl9cIik7XG5cblx0XHRcdFx0Y29uc3QgbW9kdWxlID0gJEIuaW1wb3J0ZWRbXCJfXCJdO1xuXHRcdFx0XHRjb25zdCBmY3QgICAgPSAkQi5weW9iajJqc29iaihtb2R1bGUuUmVxdWVzdEhhbmRsZXIpO1xuXG5cdFx0XHRcdGNvbnN0IGZjdDIgPSBhc3luYyAoLi4uYXJncykgPT4ge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRjb25zdCByID0gYXdhaXQgZmN0KC4uLmFyZ3MpO1xuXHRcdFx0XHRcdFx0aWYoIHI/Ll9fY2xhc3NfXz8uX19xdWFsbmFtZV9fID09PSBcIk5vbmVUeXBlXCIpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0XHRcdGlmKCAhIChcIiRweV9lcnJvclwiIGluIGUpIClcblx0XHRcdFx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdFx0XHRcdGxldCBqc19lcnJvciA9IGUuYXJnc1swXTtcblxuXHRcdFx0XHRcdFx0aWYoICEgKGpzX2Vycm9yIGluc3RhbmNlb2YgUmVzcG9uc2UpIClcblx0XHRcdFx0XHRcdFx0anNfZXJyb3IgPSBuZXcgRXJyb3IoanNfZXJyb3IpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR0aHJvdyBqc19lcnJvcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRleHBvcnQgZGVmYXVsdCBmY3QyO1xuXHRcdFx0XHRgO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKCBuZXcgQmxvYihbY29kZV0sIHt0eXBlOiBcInRleHQvamF2YXNjcmlwdFwifSkpO1xuXG5cdFx0XHRtb2R1bGUgPSBhd2FpdCBpbXBvcnQoIHVybCApO1xuXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhhbmRsZXI6IEhhbmRsZXIgPSBtb2R1bGUuZGVmYXVsdDtcblxuXHRcdHJldHVybiBbcm91dGUsIGhhbmRsZXIsIGlzX2JyeXRob25dIGFzIGNvbnN0O1xuXHR9KSk7XG5cblx0cmV0dXJuIGhhbmRsZXJzO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoY3VycmVudFBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcblxuXHRjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcblxuXHRmb3IgYXdhaXQgKGNvbnN0IGRpckVudHJ5IG9mIERlbm8ucmVhZERpcihjdXJyZW50UGF0aCkpIHtcblxuXHRcdGNvbnN0IGVudHJ5UGF0aCA9IGAke2N1cnJlbnRQYXRofS8ke2RpckVudHJ5Lm5hbWV9YDtcblxuXHRcdGlmICggISBkaXJFbnRyeS5pc0RpcmVjdG9yeSkge1xuXG5cdFx0XHRpZiggISBbXCJ0ZXN0LnRzXCIsIFwicmVxdWVzdC5icnlcIiwgXCJyZXF1ZXN0LmpzXCJdLmluY2x1ZGVzKGRpckVudHJ5Lm5hbWUpIClcblx0XHRcdFx0ZmlsZXMucHVzaCggZW50cnlQYXRoIClcblx0XHR9IGVsc2Vcblx0XHRcdGZpbGVzLnB1c2goLi4uIGF3YWl0IGdldEFsbFJvdXRlcyhlbnRyeVBhdGgpKTtcblxuXHR9XG5cblx0cmV0dXJuIGZpbGVzO1xufVxuXG50eXBlIFJFU1RfTWV0aG9kcyA9IFwiUE9TVFwifFwiR0VUXCJ8XCJERUxFVEVcInxcIlBVVFwifFwiUEFUQ0hcIjtcblxuY29uc3QgQ09SU19IRUFERVJTID0ge1xuXHRcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIixcblx0XCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCI6IFwiKlwiLCAvLyBQT1NULCBHRVQsIFBBVENILCBQVVQsIE9QVElPTlMsIERFTEVURVxuXHRcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIjogXCIqXCIgIC8vIFwidXNlLWJyeXRob25cIlxufTtcblxuZnVuY3Rpb24gYnVpbGRBbnN3ZXIocmVzcG9uc2U6IFJlc3BvbnNlfG51bGwgPSBudWxsKSB7XG5cblx0aWYoIHJlc3BvbnNlID09PSBudWxsIClcblx0XHRyZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsKTtcblxuXHQvLyBQcm9iYWJseSBXZWJTb2NrZXQgdXBncmFkZVxuXHRpZiggcmVzcG9uc2Uuc3RhdHVzID09PSAxMDEpXG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXG5cdGlmKCAhIChyZXNwb25zZSBpbnN0YW5jZW9mIFJlc3BvbnNlKSApIHtcblx0XHRjb25zb2xlLndhcm4ocmVzcG9uc2UpO1xuXHRcdHRocm93IG5ldyBFcnJvcihcIlJlcXVlc3QgaGFuZGxlciByZXR1cm5lZCBzb21ldGhpbmcgZWxzZSB0aGFuIGEgUmVzcG9uc2VcIik7XG5cdH1cblxuXHRjb25zdCByZXBfaGVhZGVycyA9IG5ldyBIZWFkZXJzKHJlc3BvbnNlLmhlYWRlcnMpO1xuXG5cdGZvcihsZXQgbmFtZSBpbiBDT1JTX0hFQURFUlMpXG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdHJlcF9oZWFkZXJzLnNldChuYW1lLCBDT1JTX0hFQURFUlNbbmFtZV0pXG5cblx0Y29uc3QgcmVwID0gbmV3IFJlc3BvbnNlKCByZXNwb25zZS5ib2R5LCB7XG5cdFx0c3RhdHVzICAgIDogcmVzcG9uc2Uuc3RhdHVzLFxuXHRcdHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG5cdFx0aGVhZGVycyAgIDogcmVwX2hlYWRlcnNcblx0fSApO1xuXG5cdHJldHVybiByZXA7XG59XG5cbi8vIHVzZSBhc3luYyA/XG4vL2ltcG9ydCB7IG1pbWVsaXRlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvbWltZXR5cGVzQHYxLjAuMC9tb2QudHNcIjtcbmZ1bmN0aW9uIGJ1aWxkUmVxdWVzdEhhbmRsZXIocm91dGVzOiBSb3V0ZXMsIF9zdGF0aWM/OiBzdHJpbmcsIGxvZ2dlcj86IExvZ2dlcikge1xuXG5cdGNvbnN0IHJlZ2V4ZXMgPSByb3V0ZXMubWFwKCAoW3VyaSwgaGFuZGxlciwgaXNfYnJ5XSkgPT4gW3BhdGgycmVnZXgodXJpKSwgaGFuZGxlciwgdXJpLCBpc19icnldIGFzIGNvbnN0KTtcblxuXHRyZXR1cm4gYXN5bmMgZnVuY3Rpb24ocmVxdWVzdDogUmVxdWVzdCwgY29ubkluZm86IGFueSk6IFByb21pc2U8UmVzcG9uc2U+IHtcblxuXHRcdGNvbnN0IGlwID0gY29ubkluZm8ucmVtb3RlQWRkci5ob3N0bmFtZTtcblxuXHRcdGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuXHRcdGxldCBlcnJvciA9IG51bGw7XG5cdFx0Y29uc3QgbWV0aG9kID0gcmVxdWVzdC5tZXRob2QgYXMgUkVTVF9NZXRob2RzIHwgXCJPUFRJT05TXCI7XG5cblx0XHR0cnkge1xuXG5cdFx0XHRpZihtZXRob2QgPT09IFwiT1BUSU9OU1wiKVxuXHRcdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtoZWFkZXJzOiBDT1JTX0hFQURFUlN9KTtcblxuXHRcdFx0bGV0IHVzZV9icnl0aG9uOiBudWxsfGJvb2xlYW4gPSBudWxsO1xuXHRcdFx0aWYoIHJlcXVlc3QuaGVhZGVycy5oYXMoXCJ1c2UtYnJ5dGhvblwiKSApXG5cdFx0XHRcdHVzZV9icnl0aG9uID0gcmVxdWVzdC5oZWFkZXJzLmdldChcInVzZS1icnl0aG9uXCIpID09PSBcInRydWVcIjtcblxuXHRcdFx0Y29uc3Qgcm91dGUgPSBnZXRSb3V0ZUhhbmRsZXIocmVnZXhlcywgbWV0aG9kLCB1cmwsIHVzZV9icnl0aG9uKTtcblxuXHRcdFx0aWYocm91dGUgPT09IG51bGwpIHtcblx0XHRcdFxuXHRcdFx0XHRpZiggX3N0YXRpYyA9PT0gdW5kZWZpbmVkIClcblx0XHRcdFx0XHR0aHJvdyBuZXcgSFRUUEVycm9yKDQwNCwgXCJOb3QgZm91bmRcIik7XG5cblx0XHRcdFx0bGV0IGZpbGVwYXRoID0gYCR7X3N0YXRpY30vJHt1cmwucGF0aG5hbWV9YDtcblx0XHRcdFx0bGV0IGNvbnRlbnQhOiBVaW50OEFycmF5O1xuXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29uc3QgaW5mbyA9IGF3YWl0IERlbm8uc3RhdChmaWxlcGF0aCk7XG5cblx0XHRcdFx0XHRpZiggaW5mby5pc0RpcmVjdG9yeSApXG5cdFx0XHRcdFx0XHRmaWxlcGF0aCA9IGAke2ZpbGVwYXRofS9pbmRleC5odG1sYDtcblxuXHRcdFx0XHRcdGNvbnRlbnQgPSBhd2FpdCBEZW5vLnJlYWRGaWxlKGZpbGVwYXRoKTtcblxuXHRcdFx0XHR9IGNhdGNoKGUpIHtcblxuXHRcdFx0XHRcdGlmKGUgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZClcblx0XHRcdFx0XHRcdHRocm93IG5ldyBIVFRQRXJyb3IoNDA0LCBcIk5vdCBGb3VuZFwiKTtcblx0XHRcdFx0XHRpZiggZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLlBlcm1pc3Npb25EZW5pZWQgKVxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEhUVFBFcnJvcig0MDMsIFwiRm9yYmlkZGVuXCIpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHRocm93IG5ldyBIVFRQRXJyb3IoNTAwLCAoZSBhcyBhbnkpLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgcGFydHMgPSBmaWxlcGF0aC5zcGxpdCgnLicpO1xuXHRcdFx0XHRjb25zdCBleHQgPSBwYXJ0c1twYXJ0cy5sZW5ndGgtMV07XG5cblx0XHRcdFx0Y29uc3QgbWltZSA9IG51bGw7IC8vbWltZWxpdGUuZ2V0VHlwZShleHQpID8/IFwidGV4dC9wbGFpblwiO1xuXHRcdFx0XHRcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQnKTtcblx0XHRcdFx0Ly9yZXR1cm4gYXdhaXQgYnVpbGRBbnN3ZXIoMjAwLCBjb250ZW50LCBtaW1lKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGFuc3dlciA9IGF3YWl0IHJvdXRlLmhhbmRsZXIocmVxdWVzdCwgcm91dGUpO1xuXG5cdFx0XHRyZXR1cm4gYnVpbGRBbnN3ZXIoYW5zd2VyKTtcblxuXHRcdH0gY2F0Y2goZSkge1xuXG5cdFx0XHRpZiggZSBpbnN0YW5jZW9mIFJlc3BvbnNlIClcblx0XHRcdFx0cmV0dXJuIGJ1aWxkQW5zd2VyKGUpO1xuXG5cdFx0XHRyZXR1cm4gYnVpbGRBbnN3ZXIobmV3IFJlc3BvbnNlKCAoZSBhcyBhbnkpLm1lc3NhZ2UsIHtzdGF0dXM6IDUwMH0pICk7XG5cblx0XHRcdC8vIFRPRE86IHJlbW92ZVxuXHRcdFx0Lypcblx0XHRcdGVycm9yID0gZTtcblxuXHRcdFx0bGV0IGVycm9yX2NvZGUgPSA1MDA7XG5cdFx0XHRpZiggZSBpbnN0YW5jZW9mIEhUVFBFcnJvciApXG5cdFx0XHRcdGVycm9yX2NvZGUgPSBlLmVycm9yX2NvZGU7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cblx0XHRcdGNvbnN0IGVycm9yX3VybCA9IG5ldyBVUkwoYC9lcnJvcnMvJHtlcnJvcl9jb2RlfWAsIHVybCk7XG5cdFx0XHRjb25zdCByb3V0ZSA9IGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBlcnJvcl91cmwpO1xuXHRcdFx0bGV0IGFuc3dlciAgPSBlLm1lc3NhZ2U7XG5cdFx0XHRpZihyb3V0ZSAhPT0gbnVsbCkge1xuXHRcdFx0XHR0cnl7XG5cdFx0XHRcdFx0YW5zd2VyID0gYXdhaXQgcm91dGUuaGFuZGxlcih7dXJsLCBib2R5OiBlLm1lc3NhZ2V9LCByb3V0ZSk7XHRcblx0XHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlKTsgLy8gZXJyb3JzIGhhbmRsZXJzIHNob3Vkbid0IHJhaXNlIGVycm9ycy4uLlxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhd2FpdCBidWlsZEFuc3dlcihlcnJvcl9jb2RlLCBhbnN3ZXIpO1xuXHRcdFx0Ki9cblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0aWYoIGxvZ2dlciAhPT0gdW5kZWZpbmVkIClcblx0XHRcdFx0bG9nZ2VyKGlwLCBtZXRob2QsIHVybCwgZXJyb3IpO1xuXHRcdH1cblx0fTtcbn1cblxuXG4vLyB0ZXN0c1xuXG5leHBvcnQgZnVuY3Rpb24gcGF0aDJyZWdleChwYXRoOiBzdHJpbmcpIHtcblxuXHQvLyBFc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzLlxuXHQvLyBjZiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMTE1MTUwL2hvdy10by1lc2NhcGUtcmVndWxhci1leHByZXNzaW9uLXNwZWNpYWwtY2hhcmFjdGVycy11c2luZy1qYXZhc2NyaXB0XG5cdHBhdGggPSBwYXRoLnJlcGxhY2UoL1stW1xcXXt9KCkqKz8uLFxcXFxeJHwjXFxzXS9nLCAnXFxcXCQmJyk7XG5cblx0cmV0dXJuIG5ldyBSZWdFeHAoXCJeXCIgKyBwYXRoLnJlcGxhY2UoL1xcXFxcXHtbXlxcfV0rXFxcXFxcfS9nLCAoY2FwdHVyZWQpID0+IGAoPzwke2NhcHR1cmVkLnNsaWNlKDIsLTIpfT5bXi9dKylgKSArIFwiJFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoKHJlZ2V4OiBSZWdFeHAsIHVyaTogc3RyaW5nKSB7XG5cblx0bGV0IHJlc3VsdCA9IHJlZ2V4LmV4ZWModXJpKTtcblxuXHRpZihyZXN1bHQgPT09IG51bGwpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdHJldHVybiByZXN1bHQuZ3JvdXBzID8/IHt9O1xufVxuXG5mdW5jdGlvbiBnZXRSb3V0ZUhhbmRsZXIocmVnZXhlczogKHJlYWRvbmx5IFtSZWdFeHAsIEhhbmRsZXIsIHN0cmluZywgYm9vbGVhbl0pW10sIG1ldGhvZDogUkVTVF9NZXRob2RzLCB1cmw6IFVSTCwgdXNlX2JyeXRob246IGJvb2xlYW58bnVsbCA9IG51bGwpIHtcblxuXHRsZXQgY3VyUm91dGUgPSBgJHsgZGVjb2RlVVJJKHVybC5wYXRobmFtZSkgfS8ke21ldGhvZH1gO1xuXG5cdGZvcihsZXQgcm91dGUgb2YgcmVnZXhlcykge1xuXG5cdFx0aWYoIHVzZV9icnl0aG9uICE9PSBudWxsICYmIHJvdXRlWzNdICE9PSB1c2VfYnJ5dGhvbiApXG5cdFx0XHRjb250aW51ZTtcblxuXHRcdHZhciB2YXJzID0gbWF0Y2gocm91dGVbMF0sIGN1clJvdXRlKTtcblxuXHRcdGlmKHZhcnMgIT09IGZhbHNlKVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aGFuZGxlcjogcm91dGVbMV0sXG5cdFx0XHRcdHBhdGggICA6IHJvdXRlWzJdLFxuXHRcdFx0XHR2YXJzLFxuXHRcdFx0XHR1cmxcblx0XHRcdH07XG5cdH1cblxuXHRyZXR1cm4gbnVsbDtcbn0iLCJpbXBvcnQgXCIuLi9WU0hTXCI7IiwiZnVuY3Rpb24gd2VicGFja0VtcHR5QXN5bmNDb250ZXh0KHJlcSkge1xuXHQvLyBIZXJlIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKSBpcyB1c2VkIGluc3RlYWQgb2YgbmV3IFByb21pc2UoKSB0byBwcmV2ZW50XG5cdC8vIHVuY2F1Z2h0IGV4Y2VwdGlvbiBwb3BwaW5nIHVwIGluIGRldnRvb2xzXG5cdHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyByZXEgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH0pO1xufVxud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LmtleXMgPSAoKSA9PiAoW10pO1xud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LnJlc29sdmUgPSB3ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQ7XG53ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQuaWQgPSBcIi4vLiBsYXp5IHJlY3Vyc2l2ZVwiO1xubW9kdWxlLmV4cG9ydHMgPSB3ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQ7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4iLCJ2YXIgd2VicGFja1F1ZXVlcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgcXVldWVzXCIpIDogXCJfX3dlYnBhY2tfcXVldWVzX19cIjtcbnZhciB3ZWJwYWNrRXhwb3J0cyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgZXhwb3J0c1wiKSA6IFwiX193ZWJwYWNrX2V4cG9ydHNfX1wiO1xudmFyIHdlYnBhY2tFcnJvciA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgZXJyb3JcIikgOiBcIl9fd2VicGFja19lcnJvcl9fXCI7XG52YXIgcmVzb2x2ZVF1ZXVlID0gKHF1ZXVlKSA9PiB7XG5cdGlmKHF1ZXVlICYmIHF1ZXVlLmQgPCAxKSB7XG5cdFx0cXVldWUuZCA9IDE7XG5cdFx0cXVldWUuZm9yRWFjaCgoZm4pID0+IChmbi5yLS0pKTtcblx0XHRxdWV1ZS5mb3JFYWNoKChmbikgPT4gKGZuLnItLSA/IGZuLnIrKyA6IGZuKCkpKTtcblx0fVxufVxudmFyIHdyYXBEZXBzID0gKGRlcHMpID0+IChkZXBzLm1hcCgoZGVwKSA9PiB7XG5cdGlmKGRlcCAhPT0gbnVsbCAmJiB0eXBlb2YgZGVwID09PSBcIm9iamVjdFwiKSB7XG5cdFx0aWYoZGVwW3dlYnBhY2tRdWV1ZXNdKSByZXR1cm4gZGVwO1xuXHRcdGlmKGRlcC50aGVuKSB7XG5cdFx0XHR2YXIgcXVldWUgPSBbXTtcblx0XHRcdHF1ZXVlLmQgPSAwO1xuXHRcdFx0ZGVwLnRoZW4oKHIpID0+IHtcblx0XHRcdFx0b2JqW3dlYnBhY2tFeHBvcnRzXSA9IHI7XG5cdFx0XHRcdHJlc29sdmVRdWV1ZShxdWV1ZSk7XG5cdFx0XHR9LCAoZSkgPT4ge1xuXHRcdFx0XHRvYmpbd2VicGFja0Vycm9yXSA9IGU7XG5cdFx0XHRcdHJlc29sdmVRdWV1ZShxdWV1ZSk7XG5cdFx0XHR9KTtcblx0XHRcdHZhciBvYmogPSB7fTtcblx0XHRcdG9ialt3ZWJwYWNrUXVldWVzXSA9IChmbikgPT4gKGZuKHF1ZXVlKSk7XG5cdFx0XHRyZXR1cm4gb2JqO1xuXHRcdH1cblx0fVxuXHR2YXIgcmV0ID0ge307XG5cdHJldFt3ZWJwYWNrUXVldWVzXSA9IHggPT4ge307XG5cdHJldFt3ZWJwYWNrRXhwb3J0c10gPSBkZXA7XG5cdHJldHVybiByZXQ7XG59KSk7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmEgPSAobW9kdWxlLCBib2R5LCBoYXNBd2FpdCkgPT4ge1xuXHR2YXIgcXVldWU7XG5cdGhhc0F3YWl0ICYmICgocXVldWUgPSBbXSkuZCA9IC0xKTtcblx0dmFyIGRlcFF1ZXVlcyA9IG5ldyBTZXQoKTtcblx0dmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cztcblx0dmFyIGN1cnJlbnREZXBzO1xuXHR2YXIgb3V0ZXJSZXNvbHZlO1xuXHR2YXIgcmVqZWN0O1xuXHR2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWopID0+IHtcblx0XHRyZWplY3QgPSByZWo7XG5cdFx0b3V0ZXJSZXNvbHZlID0gcmVzb2x2ZTtcblx0fSk7XG5cdHByb21pc2Vbd2VicGFja0V4cG9ydHNdID0gZXhwb3J0cztcblx0cHJvbWlzZVt3ZWJwYWNrUXVldWVzXSA9IChmbikgPT4gKHF1ZXVlICYmIGZuKHF1ZXVlKSwgZGVwUXVldWVzLmZvckVhY2goZm4pLCBwcm9taXNlW1wiY2F0Y2hcIl0oeCA9PiB7fSkpO1xuXHRtb2R1bGUuZXhwb3J0cyA9IHByb21pc2U7XG5cdGJvZHkoKGRlcHMpID0+IHtcblx0XHRjdXJyZW50RGVwcyA9IHdyYXBEZXBzKGRlcHMpO1xuXHRcdHZhciBmbjtcblx0XHR2YXIgZ2V0UmVzdWx0ID0gKCkgPT4gKGN1cnJlbnREZXBzLm1hcCgoZCkgPT4ge1xuXHRcdFx0aWYoZFt3ZWJwYWNrRXJyb3JdKSB0aHJvdyBkW3dlYnBhY2tFcnJvcl07XG5cdFx0XHRyZXR1cm4gZFt3ZWJwYWNrRXhwb3J0c107XG5cdFx0fSkpXG5cdFx0dmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Zm4gPSAoKSA9PiAocmVzb2x2ZShnZXRSZXN1bHQpKTtcblx0XHRcdGZuLnIgPSAwO1xuXHRcdFx0dmFyIGZuUXVldWUgPSAocSkgPT4gKHEgIT09IHF1ZXVlICYmICFkZXBRdWV1ZXMuaGFzKHEpICYmIChkZXBRdWV1ZXMuYWRkKHEpLCBxICYmICFxLmQgJiYgKGZuLnIrKywgcS5wdXNoKGZuKSkpKTtcblx0XHRcdGN1cnJlbnREZXBzLm1hcCgoZGVwKSA9PiAoZGVwW3dlYnBhY2tRdWV1ZXNdKGZuUXVldWUpKSk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZuLnIgPyBwcm9taXNlIDogZ2V0UmVzdWx0KCk7XG5cdH0sIChlcnIpID0+ICgoZXJyID8gcmVqZWN0KHByb21pc2Vbd2VicGFja0Vycm9yXSA9IGVycikgOiBvdXRlclJlc29sdmUoZXhwb3J0cykpLCByZXNvbHZlUXVldWUocXVldWUpKSk7XG5cdHF1ZXVlICYmIHF1ZXVlLmQgPCAwICYmIChxdWV1ZS5kID0gMCk7XG59OyIsInZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiA/IChvYmopID0+IChPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSkgOiAob2JqKSA9PiAob2JqLl9fcHJvdG9fXyk7XG52YXIgbGVhZlByb3RvdHlwZXM7XG4vLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3Rcbi8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuLy8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4vLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3Rcbi8vIG1vZGUgJiAxNjogcmV0dXJuIHZhbHVlIHdoZW4gaXQncyBQcm9taXNlLWxpa2Vcbi8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbl9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG5cdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IHRoaXModmFsdWUpO1xuXHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuXHRpZih0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSB7XG5cdFx0aWYoKG1vZGUgJiA0KSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG5cdFx0aWYoKG1vZGUgJiAxNikgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbicpIHJldHVybiB2YWx1ZTtcblx0fVxuXHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuXHR2YXIgZGVmID0ge307XG5cdGxlYWZQcm90b3R5cGVzID0gbGVhZlByb3RvdHlwZXMgfHwgW251bGwsIGdldFByb3RvKHt9KSwgZ2V0UHJvdG8oW10pLCBnZXRQcm90byhnZXRQcm90byldO1xuXHRmb3IodmFyIGN1cnJlbnQgPSBtb2RlICYgMiAmJiB2YWx1ZTsgdHlwZW9mIGN1cnJlbnQgPT0gJ29iamVjdCcgJiYgIX5sZWFmUHJvdG90eXBlcy5pbmRleE9mKGN1cnJlbnQpOyBjdXJyZW50ID0gZ2V0UHJvdG8oY3VycmVudCkpIHtcblx0XHRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjdXJyZW50KS5mb3JFYWNoKChrZXkpID0+IChkZWZba2V5XSA9ICgpID0+ICh2YWx1ZVtrZXldKSkpO1xuXHR9XG5cdGRlZlsnZGVmYXVsdCddID0gKCkgPT4gKHZhbHVlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBkZWYpO1xuXHRyZXR1cm4gbnM7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5tanNcIjtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm1pbmlDc3NGID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiB1bmRlZmluZWQ7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3Ncbi8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuLy8gW3Jlc29sdmUsIFByb21pc2VdID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJtYWluXCI6IDBcbn07XG5cbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIge2lkcywgbW9kdWxlcywgcnVudGltZX0gPSBkYXRhO1xuXHQvLyBhZGQgXCJtb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuXHQvLyB0aGVuIGZsYWcgYWxsIFwiaWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG5cdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDA7XG5cdGZvcihtb2R1bGVJZCBpbiBtb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHRmb3IoO2kgPCBpZHMubGVuZ3RoOyBpKyspIHtcblx0XHRjaHVua0lkID0gaWRzW2ldO1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhpbnN0YWxsZWRDaHVua3MsIGNodW5rSWQpICYmIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKCk7XG5cdFx0fVxuXHRcdGluc3RhbGxlZENodW5rc1tpZHNbaV1dID0gMDtcblx0fVxuXG59XG5cbl9fd2VicGFja19yZXF1aXJlX18uZi5qID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdFx0Ly8gaW1wb3J0KCkgY2h1bmsgbG9hZGluZyBmb3IgamF2YXNjcmlwdFxuXHRcdHZhciBpbnN0YWxsZWRDaHVua0RhdGEgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLm8oaW5zdGFsbGVkQ2h1bmtzLCBjaHVua0lkKSA/IGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA6IHVuZGVmaW5lZDtcblx0XHRpZihpbnN0YWxsZWRDaHVua0RhdGEgIT09IDApIHsgLy8gMCBtZWFucyBcImFscmVhZHkgaW5zdGFsbGVkXCIuXG5cblx0XHRcdC8vIGEgUHJvbWlzZSBtZWFucyBcImN1cnJlbnRseSBsb2FkaW5nXCIuXG5cdFx0XHRpZihpbnN0YWxsZWRDaHVua0RhdGEpIHtcblx0XHRcdFx0cHJvbWlzZXMucHVzaChpbnN0YWxsZWRDaHVua0RhdGFbMV0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdFx0XHQvLyBzZXR1cCBQcm9taXNlIGluIGNodW5rIGNhY2hlXG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSBpbXBvcnQoXCIuLi9cIiArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSkudGhlbihpbnN0YWxsQ2h1bmssIChlKSA9PiB7XG5cdFx0XHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gIT09IDApIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdHRocm93IGU7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSBQcm9taXNlLnJhY2UoW3Byb21pc2UsIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiAoaW5zdGFsbGVkQ2h1bmtEYXRhID0gaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gW3Jlc29sdmVdKSldKVxuXHRcdFx0XHRcdHByb21pc2VzLnB1c2goaW5zdGFsbGVkQ2h1bmtEYXRhWzFdID0gcHJvbWlzZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG59O1xuXG4vLyBubyBwcmVmZXRjaGluZ1xuXG4vLyBubyBwcmVsb2FkZWRcblxuLy8gbm8gZXh0ZXJuYWwgaW5zdGFsbCBjaHVua1xuXG4vLyBubyBvbiBjaHVua3MgbG9hZGVkIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSB1c2VkICdtb2R1bGUnIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LnRzXCIpO1xuIiwiIl0sIm5hbWVzIjpbImdsb2JhbFRoaXMiLCJEZW5vIiwiYXJncyIsImxlbmd0aCIsInBhcnNlQXJncyIsImhlbHAiLCJjb25zb2xlIiwibG9nIiwiZXhpdCIsInN0YXJ0SFRUUFNlcnZlciIsInBvcnQiLCJob3N0bmFtZSIsImhvc3QiLCJyb3V0ZXMiLCJfIiwidGVzdCIsInRlc3RfbmFtZSIsInJlcXVlc3QiLCJleHBlY3RlZF9yZXNwb25zZSIsIlJlcXVlc3QiLCJlbmNvZGVVUkkiLCJ1c2VfYnJ5dGhvbiIsImxhbmciLCJzYW5pdGl6ZVJlc291cmNlcyIsInIiLCJjbG9uZSIsImhlYWRlcnMiLCJzZXQiLCJhc3NlcnRSZXNwb25zZSIsImZldGNoIiwidWludF9lcXVhbHMiLCJhIiwiYiIsImJ5dGVMZW5ndGgiLCJpIiwiYXQiLCJyZXNwb25zZSIsInN0YXR1cyIsImJvZHkiLCJtaW1lIiwic3RhdHVzVGV4dCIsIkVycm9yIiwicmVwX21pbWUiLCJnZXQiLCJVaW50OEFycmF5IiwicmVwIiwiYnl0ZXMiLCJyZXBfdGV4dCIsInRleHQiLCJyb290RGlyIiwiY3dkIiwic3RhdGljIiwiX3N0YXRpYyIsImxvZ2dlciIsInJvdXRlc0hhbmRsZXJzIiwibG9hZEFsbFJvdXRlc0hhbmRsZXJzIiwicmVxdWVzdEhhbmRsZXIiLCJidWlsZFJlcXVlc3RIYW5kbGVyIiwic2VydmUiLCJmaW5pc2hlZCIsIkhUVFBFcnJvciIsImNvbnN0cnVjdG9yIiwiaHR0cF9lcnJvcl9jb2RlIiwibWVzc2FnZSIsIm5hbWUiLCJlcnJvcl9jb2RlIiwiU1NFV3JpdGVyIiwid3JpdGVyIiwic2VuZEV2ZW50IiwiZGF0YSIsIndyaXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsImNsb3NlZCIsImNsb3NlIiwiYWJvcnQiLCJWU0hTIiwiU1NFUmVzcG9uc2UiLCJjYWxsYmFjayIsIm9wdGlvbnMiLCJyZWFkYWJsZSIsIndyaXRhYmxlIiwiVHJhbnNmb3JtU3RyZWFtIiwiZ2V0V3JpdGVyIiwiY2F0Y2giLCJlIiwic3RyZWFtIiwicGlwZVRocm91Z2giLCJUZXh0RW5jb2RlclN0cmVhbSIsIkhlYWRlcnMiLCJoYXMiLCJSZXNwb25zZSIsImJyeXRob25fbG9hZGluZyIsImJyeXRob25fcHJvbWlzZSIsIlByb21pc2UiLCJ3aXRoUmVzb2x2ZXJzIiwibG9hZF9icnl0aG9uIiwicHJvbWlzZSIsImZpbGUiLCJkaXIiLCJ1cmwiLCJzbGljZSIsImxhc3RJbmRleE9mIiwiYnJ5dGhvbiIsInJlYWRUZXh0RmlsZSIsIiRCIiwiX19CUllUSE9OX18iLCJpbm5lciIsImdsb2JhbCIsIm1vZHVsZSIsImV2YWwiLCJ3YXJuIiwicmVzb2x2ZSIsIlJPT1QiLCJyb3V0ZXNfdXJpIiwiZ2V0QWxsUm91dGVzIiwiaGFuZGxlcnMiLCJhbGwiLCJtYXAiLCJ1cmkiLCJpc19icnl0aG9uIiwiZW5kc1dpdGgiLCJleHQiLCJyb3V0ZSIsImNvZGUiLCJpbmRleE9mIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsInR5cGUiLCJlcnJvciIsImhhbmRsZXIiLCJkZWZhdWx0IiwiY3VycmVudFBhdGgiLCJmaWxlcyIsImRpckVudHJ5IiwicmVhZERpciIsImVudHJ5UGF0aCIsImlzRGlyZWN0b3J5IiwiaW5jbHVkZXMiLCJwdXNoIiwiQ09SU19IRUFERVJTIiwiYnVpbGRBbnN3ZXIiLCJyZXBfaGVhZGVycyIsInJlZ2V4ZXMiLCJpc19icnkiLCJwYXRoMnJlZ2V4IiwiY29ubkluZm8iLCJpcCIsInJlbW90ZUFkZHIiLCJtZXRob2QiLCJnZXRSb3V0ZUhhbmRsZXIiLCJ1bmRlZmluZWQiLCJmaWxlcGF0aCIsInBhdGhuYW1lIiwiY29udGVudCIsImluZm8iLCJzdGF0IiwicmVhZEZpbGUiLCJlcnJvcnMiLCJOb3RGb3VuZCIsIlBlcm1pc3Npb25EZW5pZWQiLCJwYXJ0cyIsInNwbGl0IiwiYW5zd2VyIiwicGF0aCIsInJlcGxhY2UiLCJSZWdFeHAiLCJjYXB0dXJlZCIsIm1hdGNoIiwicmVnZXgiLCJyZXN1bHQiLCJleGVjIiwiZ3JvdXBzIiwiY3VyUm91dGUiLCJkZWNvZGVVUkkiLCJ2YXJzIl0sInNvdXJjZVJvb3QiOiIifQ==