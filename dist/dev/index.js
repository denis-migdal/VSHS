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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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VUFDQTtVQUNBO1VBQ0E7O1VBRUE7O1VBRUE7VUFDQTtVQUNBO1VBQ0EsaUNBQWlDOztVQUVqQztVQUNBO1VBQ0E7VUFDQSxLQUFLO1VBQ0wsZUFBZTtVQUNmO1VBQ0E7VUFDQTtVQUNBO1VBQ0EsTUFBTTtVQUNOO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTs7VUFFQTs7VUFFQTs7VUFFQTs7Ozs7U0UxREE7U0FDQTtTQUNBO1NBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9WU0hTLy4vVlNIUy50cyIsIndlYnBhY2s6Ly9WU0hTLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL1ZTSFMvLi8uLyBsYXp5IG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9hc3luYyBtb2R1bGUiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvY3JlYXRlIGZha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvZ2V0IGphdmFzY3JpcHQgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvZ2V0IG1pbmktY3NzIGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3J1bnRpbWUvcHVibGljUGF0aCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9pbXBvcnQgY2h1bmsgbG9hZGluZyIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vVlNIUy93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgLVMgZGVubyBydW4gLS1hbGxvdy1hbGwgLS13YXRjaCAtLWNoZWNrIC0tdW5zdGFibGUtc2xvcHB5LWltcG9ydHNcblxuaWYoIFwiRGVub1wiIGluIGdsb2JhbFRoaXMgJiYgRGVuby5hcmdzLmxlbmd0aCApIHtcblxuXHRjb25zdCB7cGFyc2VBcmdzfSA9IGF3YWl0IGltcG9ydChcImpzcjpAc3RkL2NsaS9wYXJzZS1hcmdzXCIpO1xuXG5cdGNvbnN0IGFyZ3MgPSBwYXJzZUFyZ3MoRGVuby5hcmdzKVxuXG5cdC8qIC0tZGVmYXVsdFx0ZGVmYXVsdFxuUm91dGUgbm9uIHRyb3V2w6llXHQtLW5vdC1mb3VuZFx0bm90X2ZvdW5kXG5FcnJldXIgbm9uLWNhcHR1csOpZVx0LS1pbnRlcm5hbC1lcnJvciovXG5cblx0aWYoIGFyZ3MuaGVscCApIHtcblx0XHRjb25zb2xlLmxvZyhgLi9WU0hTLnRzICRST1VURVNcblx0LS1hc3NldHMgICAgICAgIDogKGRlZmF1bHQgdW5kZWZpbmVkKVxuXHQtLWFzc2V0c19wcmVmaXggOiAoZGVmYXVsdCBcIlwiKVxuXHQtLWhvc3QgICAgICAgICAgOiAoZGVmYXVsdCBsb2NhaG9zdClcblx0LS1wb3J0ICAgICAgICAgIDogKGRlZmF1bHQgODA4MClcblx0LS1kZWZhdWx0ICAgICAgIDogKGRlZmF1bHQgL2RlZmF1bHQpXG5cdC0tbm90X2ZvdW5kICAgICA6IChkZWZhdWx0IC0tZGVmYXVsdClcblx0LS1pbnRlcm5hbF9lcnJvcjogKGRlZmF1bHQgLS1kZWZhdWx0KVxuXHRgKVxuXHRcdERlbm8uZXhpdCgwKTtcblx0fVxuXG5cdHN0YXJ0SFRUUFNlcnZlcih7XG5cdFx0cG9ydCAgICAgICAgICA6IGFyZ3MucG9ydCA/PyA4MDgwLFxuXHRcdGhvc3RuYW1lICAgICAgOiBhcmdzLmhvc3QgPz8gXCJsb2NhbGhvc3RcIixcblx0XHRyb3V0ZXMgICAgICAgIDogYXJncy5fWzBdIGFzIHN0cmluZyxcblx0XHRhc3NldHMgICAgICAgIDogYXJncy5hc3NldHMsXG5cdFx0YXNzZXRzX3ByZWZpeCA6IGFyZ3MuYXNzZXRzX3ByZWZpeCxcblx0XHRkZWZhdWx0ICAgICAgIDogYXJncy5kZWZhdWx0LFxuXHRcdG5vdF9mb3VuZCAgICAgOiBhcmdzLm5vdF9mb3VuZCxcblx0XHRpbnRlcm5hbF9lcnJvcjogYXJncy5pbnRlcm5hbF9lcnJvciwgXG5cdH0pXG5cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbnR5cGUgTG9nZ2VyID0gKGlwOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nLCB1cmw6IFVSTCwgZXJyb3I6IG51bGx8RXJyb3IpID0+IHZvaWQ7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0KFxuXHR0ZXN0X25hbWUgIDogc3RyaW5nLFxuXHRyZXF1ZXN0ICAgIDogUmVxdWVzdHxzdHJpbmcsXG5cdGV4cGVjdGVkX3Jlc3BvbnNlOiBQYXJ0aWFsPEV4cGVjdGVkQW5zd2VyPlxuKSB7XG5cblx0aWYodHlwZW9mIHJlcXVlc3QgPT09IFwic3RyaW5nXCIpXG5cdFx0cmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGVuY29kZVVSSShyZXF1ZXN0KSk7XG5cblx0Zm9yKGxldCB1c2VfYnJ5dGhvbiBvZiBbXCJ0cnVlXCIsIFwiZmFsc2VcIl0pIHtcblx0XHRjb25zdCBsYW5nID0gdXNlX2JyeXRob24gPT09IFwidHJ1ZVwiID8gXCJicnlcIiA6IFwianNcIjtcblx0XHREZW5vLnRlc3QoYCR7dGVzdF9uYW1lfSAoJHtsYW5nfSlgLCB7c2FuaXRpemVSZXNvdXJjZXM6IGZhbHNlfSwgYXN5bmMoKSA9PiB7XG5cblx0XHRcdGNvbnN0IHIgPSByZXF1ZXN0LmNsb25lKCk7XG5cdFx0XHRyLmhlYWRlcnMuc2V0KFwidXNlLWJyeXRob25cIiwgdXNlX2JyeXRob24pO1xuXHRcdFx0YXdhaXQgYXNzZXJ0UmVzcG9uc2UoYXdhaXQgZmV0Y2gociksIGV4cGVjdGVkX3Jlc3BvbnNlKTtcblx0XHR9KTtcblx0fVxufVxuXG5mdW5jdGlvbiB1aW50X2VxdWFscyhhOiBVaW50OEFycmF5LCBiOiBVaW50OEFycmF5KSB7XG5cblx0aWYoYi5ieXRlTGVuZ3RoICE9PSBiLmJ5dGVMZW5ndGgpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdGZvcihsZXQgaSA9IDA7IGkgPCBhLmJ5dGVMZW5ndGg7ICsraSlcblx0XHRpZihhLmF0KGkpICE9PSBiLmF0KGkpKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxudHlwZSBFeHBlY3RlZEFuc3dlciA9IHtcblx0c3RhdHVzICAgIDogbnVtYmVyLFxuXHRzdGF0dXNUZXh0OiBzdHJpbmcsXG5cdGJvZHkgIDogc3RyaW5nfFVpbnQ4QXJyYXl8bnVsbCxcblx0bWltZSAgOiBzdHJpbmd8bnVsbCxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRSZXNwb25zZShyZXNwb25zZTogUmVzcG9uc2UsIHtcblx0c3RhdHVzID0gMjAwLFxuXHRib2R5ICAgPSBudWxsLFxuXHRtaW1lICAgPSBudWxsLFxuXHRzdGF0dXNUZXh0ID0gXCJPS1wiXG5cbn06IFBhcnRpYWw8RXhwZWN0ZWRBbnN3ZXI+KSB7XG5cblx0aWYocmVzcG9uc2Uuc3RhdHVzICE9PSBzdGF0dXMpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFxceDFiWzE7MzFtV3Jvbmcgc3RhdHVzIGNvZGU6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3Jlc3BvbnNlLnN0YXR1c31cXHgxYlswbVxuXFx4MWJbMTszMm0rICR7c3RhdHVzfVxceDFiWzBtYCk7XG5cdH1cblxuXHRpZihyZXNwb25zZS5zdGF0dXNUZXh0ICE9PSBzdGF0dXNUZXh0KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIHN0YXR1cyB0ZXh0OlxceDFiWzBtXG5cXHgxYlsxOzMxbS0gJHtyZXNwb25zZS5zdGF0dXNUZXh0fVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtzdGF0dXNUZXh0fVxceDFiWzBtYCk7XG5cdH1cblxuXHRsZXQgcmVwX21pbWUgPSByZXNwb25zZS5oZWFkZXJzLmdldCgnQ29udGVudC1UeXBlJyk7XG5cdGlmKCBtaW1lID09PSBudWxsICYmIHJlcF9taW1lID09PSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKVxuXHRcdHJlcF9taW1lID0gbnVsbDtcblx0aWYoIHJlcF9taW1lICE9PSBtaW1lICkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBtaW1lLXR5cGU6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcF9taW1lfVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHttaW1lfVxceDFiWzBtYCk7XG5cdFx0fVxuXG5cdGlmKCBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSApIHtcblx0XHRjb25zdCByZXAgPSBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5ieXRlcygpKTtcblx0XHRpZiggISB1aW50X2VxdWFscyhib2R5LCByZXApIClcblx0XHRcdHRocm93IG5ldyBFcnJvcihgXFx4MWJbMTszMW1Xcm9uZyBib2R5OlxceDFiWzBtXG5cXHgxYlsxOzMxbS0gJHtyZXB9XFx4MWJbMG1cblxceDFiWzE7MzJtKyAke2JvZHl9XFx4MWJbMG1gKTtcblx0fSBlbHNlIHtcblxuXHRcdGNvbnN0IHJlcF90ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuXHRcdGlmKCByZXBfdGV4dCAhPT0gYm9keSAmJiAoYm9keSAhPT0gbnVsbCB8fCByZXBfdGV4dCAhPT0gXCJcIikgKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBcXHgxYlsxOzMxbVdyb25nIGJvZHk6XFx4MWJbMG1cblxceDFiWzE7MzFtLSAke3JlcF90ZXh0fVxceDFiWzBtXG5cXHgxYlsxOzMybSsgJHtib2R5fVxceDFiWzBtYCk7XG5cdH1cbn1cblxudHlwZSBIVFRQU2VydmVyT3B0cyA9IHtcblx0cG9ydCAgICA6IG51bWJlcixcblx0aG9zdG5hbWU6IHN0cmluZyxcblx0cm91dGVzICAgICAgICAgOiBzdHJpbmd8Um91dGVzLFxuXHRkZWZhdWx0ICAgICAgICA6IHN0cmluZyxcblx0bm90X2ZvdW5kICAgICAgOiBzdHJpbmcsXG5cdGludGVybmFsX2Vycm9yIDogc3RyaW5nLFxuXG5cdGFzc2V0cyAgICAgICA/OiBzdHJpbmd8dW5kZWZpbmVkLFxuXHRhc3NldHNfcHJlZml4Pzogc3RyaW5nfHVuZGVmaW5lZCxcblx0bG9nZ2VyICAgICAgID86IExvZ2dlciAvLyBub3QgZG9jdW1lbnRlZFxufTtcblxuXG5leHBvcnQgZnVuY3Rpb24gcm9vdERpcigpIHtcblx0cmV0dXJuIERlbm8uY3dkKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0SFRUUFNlcnZlcih7IHBvcnQgPSA4MDgwLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aG9zdG5hbWUgPSBcImxvY2FsaG9zdFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cm91dGVzID0gXCIvcm91dGVzXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OiBfZGVmYXVsdCA9IFwiL2RlZmF1bHQvR0VUXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRub3RfZm91bmQgICAgICA9IF9kZWZhdWx0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aW50ZXJuYWxfZXJyb3IgPSBfZGVmYXVsdCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFzc2V0cyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFzc2V0c19wcmVmaXggPSBcIi9cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxvZ2dlciA9ICgpID0+IHt9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTogSFRUUFNlcnZlck9wdHMpIHtcblxuXHRsZXQgcm91dGVzSGFuZGxlcnM6IFJvdXRlcyA9IHJvdXRlcyBhcyBhbnk7XG5cdGlmKCB0eXBlb2Ygcm91dGVzID09PSBcInN0cmluZ1wiICkge1xuXHRcdGlmKHJvdXRlc1swXSA9PT0gXCIvXCIpXG5cdFx0XHRyb3V0ZXMgPSByb290RGlyKCkgKyByb3V0ZXM7XG5cdFx0XHRcblx0XHRyb3V0ZXNIYW5kbGVycyA9IGF3YWl0IGxvYWRBbGxSb3V0ZXNIYW5kbGVycyhyb3V0ZXMpO1xuXHR9XG5cdFxuXHRpZihhc3NldHM/LlswXSA9PT0gXCIvXCIpXG5cdFx0YXNzZXRzID0gcm9vdERpcigpICsgYXNzZXRzO1xuXHRcblx0Y29uc3QgcmVxdWVzdEhhbmRsZXIgPSBhd2FpdCBidWlsZFJlcXVlc3RIYW5kbGVyKHJvdXRlc0hhbmRsZXJzLCB7XG5cdFx0YXNzZXRzLFxuXHRcdGFzc2V0c19wcmVmaXgsXG5cdFx0bG9nZ2VyLFxuXHRcdG5vdF9mb3VuZCxcblx0XHRpbnRlcm5hbF9lcnJvclxuXHR9KTtcblxuXHQvLyBodHRwczovL2RvY3MuZGVuby5jb20vcnVudGltZS90dXRvcmlhbHMvaHR0cF9zZXJ2ZXJcblx0YXdhaXQgRGVuby5zZXJ2ZSh7XG5cdFx0cG9ydCxcblx0XHRob3N0bmFtZSxcblx0IH0sIHJlcXVlc3RIYW5kbGVyKS5maW5pc2hlZDtcbn1cblxuZXhwb3J0IGNsYXNzIFNTRVdyaXRlciB7XG4gICAgI3dyaXRlcjogV3JpdGFibGVTdHJlYW1EZWZhdWx0V3JpdGVyO1xuICAgIGNvbnN0cnVjdG9yKHdyaXRlcjogV3JpdGFibGVTdHJlYW1EZWZhdWx0V3JpdGVyKSB7XG4gICAgICAgIHRoaXMuI3dyaXRlciA9IHdyaXRlcjtcbiAgICB9XG5cbiAgICBzZW5kRXZlbnQoZGF0YTogYW55LCBuYW1lID0gJ21lc3NhZ2UnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiN3cml0ZXIud3JpdGUoXG5gZXZlbnQ6ICR7bmFtZX1cbmRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoZGF0YSl9XG5cbmApO1xuICAgIH1cblxuXHRnZXQgY2xvc2VkKCkge1xuXHRcdHJldHVybiB0aGlzLiN3cml0ZXIuY2xvc2VkO1xuXHR9XG5cblx0Y2xvc2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuI3dyaXRlci5jbG9zZSgpO1xuXHR9XG5cblx0YWJvcnQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuI3dyaXRlci5hYm9ydCgpO1xuXHR9XG59XG5cbi8vIGhlbHBlclxuZXhwb3J0IGNvbnN0IFZTSFMgPSB7XG5cdFNTRVJlc3BvbnNlOiBmdW5jdGlvbjxUIGV4dGVuZHMgYW55W10+KGNhbGxiYWNrOiAod3JpdGVyOiBTU0VXcml0ZXIsIC4uLmFyZ3M6IFQpID0+IFByb21pc2U8dm9pZD4sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCAgIG9wdGlvbnM6IFJlc3BvbnNlSW5pdCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICAgLi4uYXJnczogVCkge1xuXHRcdGNvbnN0IHtyZWFkYWJsZSwgd3JpdGFibGV9ID0gbmV3IFRyYW5zZm9ybVN0cmVhbSgpO1xuXG5cdFx0Y29uc3Qgd3JpdGVyID0gbmV3IFNTRVdyaXRlcih3cml0YWJsZS5nZXRXcml0ZXIoKSk7XG5cdFx0Y2FsbGJhY2soIHdyaXRlciwgLi4uYXJncyApLmNhdGNoKCAoZSkgPT4ge1xuXHRcdFx0d3JpdGVyLmFib3J0KCk7XG5cdFx0XHR0aHJvdyBlO1xuXHRcdH0pXG5cdFxuXHRcdGNvbnN0IHN0cmVhbSA9IHJlYWRhYmxlLnBpcGVUaHJvdWdoKCBuZXcgVGV4dEVuY29kZXJTdHJlYW0oKSApO1xuXG5cdFx0b3B0aW9ucz8/PSB7fTtcblx0XHRvcHRpb25zLmhlYWRlcnM/Pz17fTtcblx0XHRpZiggb3B0aW9ucy5oZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuXHRcdFx0aWYoICEgb3B0aW9ucy5oZWFkZXJzLmhhcyhcIkNvbnRlbnQtVHlwZVwiKSApXG5cdFx0XHRcdG9wdGlvbnMuaGVhZGVycy5zZXQoXCJDb250ZW50LVR5cGVcIiwgXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiKTtcblx0XHR9IGVsc2Vcblx0XHRcdChvcHRpb25zLmhlYWRlcnMgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilbXCJDb250ZW50LVR5cGVcIl0gPz89IFwidGV4dC9ldmVudC1zdHJlYW1cIjtcblxuXG5cdFx0cmV0dXJuIG5ldyBSZXNwb25zZShzdHJlYW0sIG9wdGlvbnMpO1xuXHR9LFxuXHRhc3luYyBnZXRNaW1lKHBhdGg6IHN0cmluZykge1xuXG5cdFx0Y29uc3QgcG9zID0gcGF0aC5sYXN0SW5kZXhPZignLicpO1xuXHRcdGNvbnN0IGV4dCA9IHBhdGguc2xpY2UocG9zKzEpO1xuXG5cdFx0cmV0dXJuIChhd2FpdCBsb2FkTWltZSgpKS5nZXRUeXBlKGV4dCkgPz8gXCJ0ZXh0L3BsYWluXCI7XG5cdH0sXG5cdGFzeW5jIGZldGNoQXNzZXQocGF0aDogc3RyaW5nKSB7XG5cblx0XHRpZihwYXRoWzBdICE9PSBcIi9cIilcblx0XHRcdHBhdGggPSByb290RGlyKCkgKyBwYXRoO1xuXG5cdFx0cmV0dXJuIChhd2FpdCBEZW5vLm9wZW4ocGF0aCkpLnJlYWRhYmxlO1xuXHR9XG59O1xuXG5sZXQgbWltZWxpdGU6IGFueSA9IG51bGw7XG5hc3luYyBmdW5jdGlvbiBsb2FkTWltZSgpIHtcblx0aWYoIG1pbWVsaXRlID09PSBudWxsIClcblx0XHRtaW1lbGl0ZSA9IGltcG9ydChcImpzcjpodHRwczovL2Rlbm8ubGFuZC94L21pbWV0eXBlc0B2MS4wLjAvbW9kLnRzXCIpO1xuXHRyZXR1cm4gYXdhaXQgbWltZWxpdGU7XG59XG5cbi8vIEB0cy1pZ25vcmVcbmdsb2JhbFRoaXMuVlNIUyA9IFZTSFM7XG5cbmV4cG9ydCB0eXBlIEhhbmRsZXJQYXJhbXMgPSBbXG5cdFJlcXVlc3QsIHtcblx0XHRwYXRoOiBzdHJpbmcsXG5cdFx0dmFyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuXHR9XG5dO1xuXG50eXBlIEhhbmRsZXIgPSAoLi4uYXJnczogSGFuZGxlclBhcmFtcykgPT4gUHJvbWlzZTxhbnk+O1xudHlwZSBSb3V0ZXMgID0gKHJlYWRvbmx5IFtzdHJpbmcsIEhhbmRsZXIsIGJvb2xlYW5dKVtdO1xuXG5sZXQgYnJ5dGhvbl9sb2FkaW5nICA9IGZhbHNlO1xubGV0IGJyeXRob25fcHJvbWlzZSA9IFByb21pc2Uud2l0aFJlc29sdmVyczx2b2lkPigpO1xuXG5hc3luYyBmdW5jdGlvbiBsb2FkX2JyeXRob24oKSB7XG5cdGlmKCBicnl0aG9uX2xvYWRpbmcgKSB7XG5cdFx0YXdhaXQgYnJ5dGhvbl9wcm9taXNlLnByb21pc2Vcblx0XHRyZXR1cm47XG5cdH1cblxuXHRicnl0aG9uX2xvYWRpbmcgPSB0cnVlO1xuXG5cdC8vYnJ5dGhvbiA9IGF3YWl0IChhd2FpdCBmZXRjaCggXCJodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9icnl0aG9uLzMuMTMuMC9icnl0aG9uLm1pbi5qc1wiICkpLnRleHQoKTtcblx0Y29uc3QgZmlsZSA9IFwiYnJ5dGhvbigxKVwiO1xuXHRjb25zdCBkaXIgPSBpbXBvcnQubWV0YS51cmwuc2xpY2UoNiwgaW1wb3J0Lm1ldGEudXJsLmxhc3RJbmRleE9mKCcvJykgKTtcblx0Y29uc3QgYnJ5dGhvbiA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKGRpciArIGAvJHtmaWxlfS5qc2ApO1xuXG5cdC8vIEB0cy1pZ25vcmVcblx0Z2xvYmFsVGhpcy4kQiAgPSBnbG9iYWxUaGlzLl9fQlJZVEhPTl9fID0ge307IC8vIHdoeSBpcyBpdCByZXF1aXJlZCA/Pz9cblx0Ly8gQHRzLWlnbm9yZVxuXHRnbG9iYWxUaGlzLmlubmVyID0gbnVsbDtcblx0Ly8gQHRzLWlnbm9yZVxuXHRnbG9iYWxUaGlzLmdsb2JhbCA9IHt9O1xuXHQvLyBAdHMtaWdub3JlXG5cdGdsb2JhbFRoaXMubW9kdWxlID0ge307XG5cdGV2YWwoYnJ5dGhvbik7XG5cblx0Y29uc29sZS53YXJuKFwiPT0gbG9hZGVkID09XCIpO1xuXHRicnl0aG9uX3Byb21pc2UucmVzb2x2ZSgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkQWxsUm91dGVzSGFuZGxlcnMocm91dGVzOiBzdHJpbmcpOiBQcm9taXNlPFJvdXRlcz4ge1xuXG5cdGNvbnN0IFJPT1QgPSByb290RGlyKCk7XG5cdGxldCByb3V0ZXNfdXJpID0gYXdhaXQgZ2V0QWxsUm91dGVzKHJvdXRlcyk7XG5cblx0dHlwZSBNb2R1bGUgPSB7ZGVmYXVsdDogSGFuZGxlcn07XG5cdGNvbnN0IGhhbmRsZXJzICAgPSBhd2FpdCBQcm9taXNlLmFsbCggcm91dGVzX3VyaS5tYXAoIGFzeW5jICh1cmkpID0+IHtcblxuXHRcdC8vIG9ubHkgd2l0aCBpbXBvcnRzIG1hcCwgYnV0IGJ1Z2dlZFxuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZW5vL2lzc3Vlcy8yMjIzN1xuXHRcdC8vaWYoIHVyaS5zdGFydHNXaXRoKFJPT1QpIClcblx0XHQvL1x0dXJpID0gdXJpLnNsaWNlKFJPT1QubGVuZ3RoKVxuXG5cdFx0LyppZiggdXJpWzFdID09PSAnOicgKSAvLyB3aW5kb3dzIGRyaXZlXG5cdFx0XHR1cmkgPSBgZmlsZTovLyR7dXJpfWA7Ki9cblxuXHRcdGNvbnN0IGlzX2JyeXRob24gPSB1cmkuZW5kc1dpdGgoJy5icnknKTtcblx0XHRsZXQgZXh0ID0gaXNfYnJ5dGhvbiA/IFwiLmJyeVwiIDogXCIudHNcIlxuXHRcdGxldCByb3V0ZSA9IHVyaS5zbGljZShyb3V0ZXMubGVuZ3RoLCAtIGV4dC5sZW5ndGgpO1xuXG5cdFx0bGV0IG1vZHVsZSE6IE1vZHVsZTtcblx0XHR0cnl7XG5cblx0XHRcdGxldCBjb2RlID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUodXJpKTtcblxuXHRcdFx0aWYoIHJvdXRlLmVuZHNXaXRoKCdpbmRleCcpIClcblx0XHRcdFx0cm91dGUgPSBjb2RlLnNsaWNlKDMsIGNvZGUuaW5kZXhPZignXFxuJykgLSBleHQubGVuZ3RoICk7XG5cblx0XHRcdGlmKCBpc19icnl0aG9uICkge1xuXG5cdFx0XHRcdGF3YWl0IGxvYWRfYnJ5dGhvbigpO1xuXG5cdFx0XHRcdC8vVE9ETzogZHVwbGljYXRlZCBjb2RlIHdpdGggcGxheWdyb3VuZC4uLiAoISBcXGAgdnMgXFxcXFxcYCkuXG5cdFx0XHRcdGNvZGUgPSBgY29uc3QgJEIgPSBnbG9iYWxUaGlzLl9fQlJZVEhPTl9fO1xuXG5cdFx0XHRcdCRCLnJ1blB5dGhvblNvdXJjZShcXGAke2NvZGV9XFxgLCBcIl9cIik7XG5cblx0XHRcdFx0Y29uc3QgbW9kdWxlID0gJEIuaW1wb3J0ZWRbXCJfXCJdO1xuXHRcdFx0XHRjb25zdCBmY3QgICAgPSAkQi5weW9iajJqc29iaihtb2R1bGUuUmVxdWVzdEhhbmRsZXIpO1xuXG5cdFx0XHRcdGNvbnN0IGZjdDIgPSBhc3luYyAoLi4uYXJncykgPT4ge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRjb25zdCByID0gYXdhaXQgZmN0KC4uLmFyZ3MpO1xuXHRcdFx0XHRcdFx0aWYoIHI/Ll9fY2xhc3NfXz8uX19xdWFsbmFtZV9fID09PSBcIk5vbmVUeXBlXCIpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0XHRcdGlmKCAhIChcIiRweV9lcnJvclwiIGluIGUpIClcblx0XHRcdFx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdFx0XHRcdGxldCBqc19lcnJvciA9IGUuYXJnc1swXTtcblxuXHRcdFx0XHRcdFx0aWYoICEgKGpzX2Vycm9yIGluc3RhbmNlb2YgUmVzcG9uc2UpIClcblx0XHRcdFx0XHRcdFx0anNfZXJyb3IgPSBuZXcgRXJyb3IoanNfZXJyb3IpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR0aHJvdyBqc19lcnJvcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRleHBvcnQgZGVmYXVsdCBmY3QyO1xuXHRcdFx0XHRgO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKCBuZXcgQmxvYihbY29kZV0sIHt0eXBlOiBcInRleHQvamF2YXNjcmlwdFwifSkpO1xuXG5cdFx0XHRtb2R1bGUgPSBhd2FpdCBpbXBvcnQoIHVybCApO1xuXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhhbmRsZXI6IEhhbmRsZXIgPSBtb2R1bGUuZGVmYXVsdDtcblxuXHRcdHJldHVybiBbcm91dGUsIGhhbmRsZXIsIGlzX2JyeXRob25dIGFzIGNvbnN0O1xuXHR9KSk7XG5cblx0cmV0dXJuIGhhbmRsZXJzO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBbGxSb3V0ZXMoY3VycmVudFBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcblxuXHRjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcblxuXHRmb3IgYXdhaXQgKGNvbnN0IGRpckVudHJ5IG9mIERlbm8ucmVhZERpcihjdXJyZW50UGF0aCkpIHtcblxuXHRcdGNvbnN0IGVudHJ5UGF0aCA9IGAke2N1cnJlbnRQYXRofS8ke2RpckVudHJ5Lm5hbWV9YDtcblxuXHRcdGlmICggISBkaXJFbnRyeS5pc0RpcmVjdG9yeSkge1xuXG5cdFx0XHRpZiggISBbXCJ0ZXN0LnRzXCIsIFwicmVxdWVzdC5icnlcIiwgXCJyZXF1ZXN0LmpzXCJdLmluY2x1ZGVzKGRpckVudHJ5Lm5hbWUpIClcblx0XHRcdFx0ZmlsZXMucHVzaCggZW50cnlQYXRoIClcblx0XHR9IGVsc2Vcblx0XHRcdGZpbGVzLnB1c2goLi4uIGF3YWl0IGdldEFsbFJvdXRlcyhlbnRyeVBhdGgpKTtcblxuXHR9XG5cblx0cmV0dXJuIGZpbGVzO1xufVxuXG50eXBlIFJFU1RfTWV0aG9kcyA9IFwiUE9TVFwifFwiR0VUXCJ8XCJERUxFVEVcInxcIlBVVFwifFwiUEFUQ0hcIjtcblxuY29uc3QgQ09SU19IRUFERVJTID0ge1xuXHRcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiIDogXCIqXCIsXG5cdFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiOiBcIipcIiwgLy8gUE9TVCwgR0VULCBQQVRDSCwgUFVULCBPUFRJT05TLCBERUxFVEVcblx0XCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCI6IFwiKlwiICAvLyBcInVzZS1icnl0aG9uXCJcbn07XG5cbmZ1bmN0aW9uIGJ1aWxkQW5zd2VyKHJlc3BvbnNlOiBSZXNwb25zZXxudWxsID0gbnVsbCkge1xuXG5cdGlmKCByZXNwb25zZSA9PT0gbnVsbCApXG5cdFx0cmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCk7XG5cblx0Ly8gUHJvYmFibHkgV2ViU29ja2V0IHVwZ3JhZGVcblx0aWYoIHJlc3BvbnNlLnN0YXR1cyA9PT0gMTAxKVxuXHRcdHJldHVybiByZXNwb25zZTtcblxuXHRpZiggISAocmVzcG9uc2UgaW5zdGFuY2VvZiBSZXNwb25zZSkgKSB7XG5cdFx0Y29uc29sZS53YXJuKHJlc3BvbnNlKTtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJSZXF1ZXN0IGhhbmRsZXIgcmV0dXJuZWQgc29tZXRoaW5nIGVsc2UgdGhhbiBhIFJlc3BvbnNlXCIpO1xuXHR9XG5cblx0Y29uc3QgcmVwX2hlYWRlcnMgPSBuZXcgSGVhZGVycyhyZXNwb25zZS5oZWFkZXJzKTtcblxuXHRmb3IobGV0IG5hbWUgaW4gQ09SU19IRUFERVJTKVxuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRyZXBfaGVhZGVycy5zZXQobmFtZSwgQ09SU19IRUFERVJTW25hbWVdKVxuXG5cdGNvbnN0IHJlcCA9IG5ldyBSZXNwb25zZSggcmVzcG9uc2UuYm9keSwge1xuXHRcdHN0YXR1cyAgICA6IHJlc3BvbnNlLnN0YXR1cyxcblx0XHRzdGF0dXNUZXh0OiByZXNwb25zZS5zdGF0dXNUZXh0LFxuXHRcdGhlYWRlcnMgICA6IHJlcF9oZWFkZXJzXG5cdH0gKTtcblxuXHRyZXR1cm4gcmVwO1xufVxuXG50eXBlIGJ1aWxkUmVxdWVzdEhhbmRsZXJPcHRzID0ge1xuXHRhc3NldHMgICAgICAgPzogc3RyaW5nLFxuXHRhc3NldHNfcHJlZml4Pzogc3RyaW5nLFxuXHRsb2dnZXI/OiBMb2dnZXIsXG5cdG5vdF9mb3VuZCAgICAgOiBzdHJpbmcsXG5cdGludGVybmFsX2Vycm9yOiBzdHJpbmdcbn1cblxudHlwZSBEZWZhdWx0Um91dGVPcHRzID0ge1xuXHRyb3V0ZSAgIDogUm91dGV8bnVsbCxcblx0ZXJyb3IgID86IEVycm9yLFxufSAmIFJvdXRlO1xuXG5cbmFzeW5jIGZ1bmN0aW9uIGJ1aWxkRGVmYXVsdFJvdXRlKGFzc2V0cz86IHN0cmluZywgYXNzZXRzX3ByZWZpeDogc3RyaW5nID0gXCJcIikge1xuXG5cblxuXHRhc3luYyBmdW5jdGlvbiBkZWZhdWx0X2hhbmRsZXIocmVxdWVzdDogUmVxdWVzdCwgb3B0czogRGVmYXVsdFJvdXRlT3B0cykge1xuXG5cdFx0aWYoIFwiZXJyb3JcIiBpbiBvcHRzIClcblx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2Uob3B0cy5lcnJvciEubWVzc2FnZSwge3N0YXR1czogNTAwfSk7XG5cblx0XHRsZXQgcGF0aG5hbWUgPSBuZXcgVVJMKHJlcXVlc3QudXJsKS5wYXRobmFtZTtcblx0XHRpZiggYXNzZXRzID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGxldCB1cmkgPSBwYXRobmFtZTtcblx0XHRcdGlmKCB1cmkuc3RhcnRzV2l0aChhc3NldHNfcHJlZml4KSApXG5cdFx0XHRcdHVyaSA9IHVyaS5zbGljZShhc3NldHNfcHJlZml4Lmxlbmd0aCk7XG5cdFx0XG5cdFx0XHRsZXQgZmlsZXBhdGggPSBgJHthc3NldHN9LyR7dXJpfWA7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGluZm8gPSBhd2FpdCBEZW5vLnN0YXQoZmlsZXBhdGgpO1xuXG5cdFx0XHRcdGlmKCBpbmZvLmlzRGlyZWN0b3J5IClcblx0XHRcdFx0XHRmaWxlcGF0aCA9IGAke2ZpbGVwYXRofS9pbmRleC5odG1sYDtcblxuXHRcdFx0XHRjb25zdCBbc3RyZWFtLCBtaW1lXSA9IGF3YWl0IFByb21pc2UuYWxsKFtWU0hTLmZldGNoQXNzZXQoZmlsZXBhdGgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAgVlNIUy5nZXRNaW1lKGZpbGVwYXRoKV0pO1xuXHRcdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKHN0cmVhbSwge2hlYWRlcnM6IHtcIkNvbnRlbnQtVHlwZVwiOiBtaW1lfX0pO1xuXG5cdFx0XHR9IGNhdGNoKGUpIHtcblxuXHRcdFx0XHRpZiggISAoZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSApIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiggZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLlBlcm1pc3Npb25EZW5pZWQgKVxuXHRcdFx0XHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZShgJHtwYXRobmFtZX0gYWNjZXNzIGRlbmllZGAsIHtzdGF0dXM6IDQwM30pO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHRocm93IGU7IC8vIHdpbGwgYmUgY2F1Z2h0IGFnYWluLlxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBSZXNwb25zZShgJHtwYXRobmFtZX0gbm90IGZvdW5kYCwge3N0YXR1czogNDA0fSk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGhhbmRsZXI6IGRlZmF1bHRfaGFuZGxlcixcblx0XHRwYXRoICAgOiBcIi9kZWZhdWx0XCIsXG5cdFx0dmFycyAgIDoge31cblx0fVxufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIGJ1aWxkUmVxdWVzdEhhbmRsZXIocm91dGVzOiBSb3V0ZXMsIHtcblx0YXNzZXRzLFxuXHRhc3NldHNfcHJlZml4LFxuXHRsb2dnZXIgLFxuXHRub3RfZm91bmQgICAgICA9IFwiL2RlZmF1bHQvR0VUXCIsXG5cdGludGVybmFsX2Vycm9yID0gXCIvZGVmYXVsdC9HRVRcIlxufTogUGFydGlhbDxidWlsZFJlcXVlc3RIYW5kbGVyT3B0cz4pIHtcblxuXHRjb25zdCByZWdleGVzID0gcm91dGVzLm1hcCggKFt1cmksIGhhbmRsZXIsIGlzX2JyeV0pID0+IFtwYXRoMnJlZ2V4KHVyaSksIGhhbmRsZXIsIHVyaSwgaXNfYnJ5XSBhcyBjb25zdCk7XG5cblx0Y29uc3QgZGVmYXVsdF9yb3V0ZSA9IGF3YWl0IGJ1aWxkRGVmYXVsdFJvdXRlKGFzc2V0cywgYXNzZXRzX3ByZWZpeCk7XG5cblx0Y29uc3Qgbm90X2ZvdW5kX3JvdXRlID0gW1xuXHRcdGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBub3RfZm91bmQsIGZhbHNlKSA/PyBkZWZhdWx0X3JvdXRlLFxuXHRcdGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBub3RfZm91bmQsIHRydWUpICA/PyBkZWZhdWx0X3JvdXRlXG5cdF0gYXMgRGVmYXVsdFJvdXRlT3B0c1tdO1xuXHRjb25zdCBpbnRlcm5hbF9lcnJvcl9yb3V0ZSA9IFtcblx0XHRnZXRSb3V0ZUhhbmRsZXIocmVnZXhlcywgXCJHRVRcIiwgaW50ZXJuYWxfZXJyb3IsIGZhbHNlKSA/PyBkZWZhdWx0X3JvdXRlLFxuXHRcdGdldFJvdXRlSGFuZGxlcihyZWdleGVzLCBcIkdFVFwiLCBpbnRlcm5hbF9lcnJvciwgdHJ1ZSkgID8/IGRlZmF1bHRfcm91dGVcblx0XSBhcyBEZWZhdWx0Um91dGVPcHRzW107XG5cblx0cmV0dXJuIGFzeW5jIGZ1bmN0aW9uKHJlcXVlc3Q6IFJlcXVlc3QsIGNvbm5JbmZvOiBhbnkpOiBQcm9taXNlPFJlc3BvbnNlPiB7XG5cblx0XHRjb25zdCBpcCA9IGNvbm5JbmZvLnJlbW90ZUFkZHIuaG9zdG5hbWU7XG5cblx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKHJlcXVlc3QudXJsKTtcblx0XHRsZXQgZXJyb3IgPSBudWxsO1xuXHRcdGNvbnN0IG1ldGhvZCA9IHJlcXVlc3QubWV0aG9kIGFzIFJFU1RfTWV0aG9kcyB8IFwiT1BUSU9OU1wiO1xuXG5cdFx0bGV0IGFuc3dlcjogUmVzcG9uc2V8dW5kZWZpbmVkO1xuXHRcdGxldCB1c2VfYnJ5dGhvbjogbnVsbHxib29sZWFuID0gbnVsbDtcblxuXHRcdGxldCByb3V0ZTogUm91dGV8bnVsbCA9IG51bGw7XG5cblx0XHR0cnkge1xuXG5cdFx0XHRpZihtZXRob2QgPT09IFwiT1BUSU9OU1wiKVxuXHRcdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtoZWFkZXJzOiBDT1JTX0hFQURFUlN9KTtcblxuXHRcdFx0aWYoIHJlcXVlc3QuaGVhZGVycy5oYXMoXCJ1c2UtYnJ5dGhvblwiKSApXG5cdFx0XHRcdHVzZV9icnl0aG9uID0gcmVxdWVzdC5oZWFkZXJzLmdldChcInVzZS1icnl0aG9uXCIpID09PSBcInRydWVcIjtcblxuXHRcdFx0cm91dGUgPSBnZXRSb3V0ZUhhbmRsZXIocmVnZXhlcywgbWV0aG9kLCB1cmwsIHVzZV9icnl0aG9uKTtcblxuXHRcdFx0aWYoIHJvdXRlICE9PSBudWxsKSB7XG5cdFx0XHRcdGFuc3dlciA9IGF3YWl0IHJvdXRlLmhhbmRsZXIocmVxdWVzdCwgcm91dGUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgX3JvdXRlID0gYXdhaXQgbm90X2ZvdW5kX3JvdXRlWyt1c2VfYnJ5dGhvbiFdO1xuXHRcdFx0XHRfcm91dGUucm91dGUgPSByb3V0ZTtcblx0XHRcdFx0YW5zd2VyID0gYXdhaXQgX3JvdXRlLmhhbmRsZXIocmVxdWVzdCwgX3JvdXRlKVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYnVpbGRBbnN3ZXIoYW5zd2VyKTtcblxuXHRcdH0gY2F0Y2goZSkge1xuXG5cdFx0XHRpZiggISAoZSBpbnN0YW5jZW9mIFJlc3BvbnNlKSApIHtcblx0XHRcdFx0Y29uc3QgX3JvdXRlID0gaW50ZXJuYWxfZXJyb3Jfcm91dGVbK3VzZV9icnl0aG9uIV07XG5cdFx0XHRcdF9yb3V0ZS5yb3V0ZSA9IHJvdXRlO1xuXHRcdFx0XHRlcnJvciA9IF9yb3V0ZS5lcnJvciA9IGUgYXMgRXJyb3I7XG5cdFx0XHRcdGUgPSBhd2FpdCBfcm91dGUuaGFuZGxlcihyZXF1ZXN0LCBfcm91dGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYnVpbGRBbnN3ZXIoZSBhcyBSZXNwb25zZSk7XG5cblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0aWYoIGxvZ2dlciAhPT0gdW5kZWZpbmVkIClcblx0XHRcdFx0bG9nZ2VyKGlwLCBtZXRob2QsIHVybCwgZXJyb3IpO1xuXHRcdH1cblx0fTtcbn1cblxuXG4vLyB0ZXN0c1xuXG5leHBvcnQgZnVuY3Rpb24gcGF0aDJyZWdleChwYXRoOiBzdHJpbmcpIHtcblxuXHQvLyBFc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzLlxuXHQvLyBjZiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zMTE1MTUwL2hvdy10by1lc2NhcGUtcmVndWxhci1leHByZXNzaW9uLXNwZWNpYWwtY2hhcmFjdGVycy11c2luZy1qYXZhc2NyaXB0XG5cdHBhdGggPSBwYXRoLnJlcGxhY2UoL1stW1xcXXt9KCkqKz8uLFxcXFxeJHwjXFxzXS9nLCAnXFxcXCQmJyk7XG5cblx0cmV0dXJuIG5ldyBSZWdFeHAoXCJeXCIgKyBwYXRoLnJlcGxhY2UoL1xcXFxcXHtbXlxcfV0rXFxcXFxcfS9nLCAoY2FwdHVyZWQpID0+IGAoPzwke2NhcHR1cmVkLnNsaWNlKDIsLTIpfT5bXi9dKylgKSArIFwiJFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoKHJlZ2V4OiBSZWdFeHAsIHVyaTogc3RyaW5nKSB7XG5cblx0bGV0IHJlc3VsdCA9IHJlZ2V4LmV4ZWModXJpKTtcblxuXHRpZihyZXN1bHQgPT09IG51bGwpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdHJldHVybiByZXN1bHQuZ3JvdXBzID8/IHt9O1xufVxuXG50eXBlIFJvdXRlID0ge1xuXHRoYW5kbGVyOiBIYW5kbGVyLFxuXHRwYXRoICAgOiBzdHJpbmcsXG5cdHZhcnMgICA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbn1cblxuZnVuY3Rpb24gZ2V0Um91dGVIYW5kbGVyKHJlZ2V4ZXM6IChyZWFkb25seSBbUmVnRXhwLCBIYW5kbGVyLCBzdHJpbmcsIGJvb2xlYW5dKVtdLFxuXHRcdFx0XHRcdFx0bWV0aG9kOiBSRVNUX01ldGhvZHMsXG5cdFx0XHRcdFx0XHR1cmw6IFVSTHxzdHJpbmcsXG5cdFx0XHRcdFx0XHR1c2VfYnJ5dGhvbjogYm9vbGVhbnxudWxsID0gbnVsbCk6IFJvdXRlfG51bGwge1xuXG5cdGxldCBjdXJSb3V0ZTogc3RyaW5nO1xuXHRpZiggdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIilcblx0XHRjdXJSb3V0ZSA9IGAke3VybH0vJHttZXRob2R9YDtcblx0ZWxzZVxuXHRcdGN1clJvdXRlID0gYCR7IGRlY29kZVVSSSh1cmwucGF0aG5hbWUpIH0vJHttZXRob2R9YDtcblxuXHRmb3IobGV0IHJvdXRlIG9mIHJlZ2V4ZXMpIHtcblxuXHRcdGlmKCB1c2VfYnJ5dGhvbiAhPT0gbnVsbCAmJiByb3V0ZVszXSAhPT0gdXNlX2JyeXRob24gKVxuXHRcdFx0Y29udGludWU7XG5cblx0XHR2YXIgdmFycyA9IG1hdGNoKHJvdXRlWzBdLCBjdXJSb3V0ZSk7XG5cblx0XHRpZih2YXJzICE9PSBmYWxzZSlcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGhhbmRsZXI6IHJvdXRlWzFdLFxuXHRcdFx0XHRwYXRoICAgOiByb3V0ZVsyXSxcblx0XHRcdFx0dmFyc1xuXHRcdFx0fTtcblx0fVxuXG5cdHJldHVybiBudWxsO1xufSIsImV4cG9ydCB7cGF0aDJyZWdleCwgbWF0Y2h9IGZyb20gXCIuLi9WU0hTXCI7IiwiZnVuY3Rpb24gd2VicGFja0VtcHR5QXN5bmNDb250ZXh0KHJlcSkge1xuXHQvLyBIZXJlIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKSBpcyB1c2VkIGluc3RlYWQgb2YgbmV3IFByb21pc2UoKSB0byBwcmV2ZW50XG5cdC8vIHVuY2F1Z2h0IGV4Y2VwdGlvbiBwb3BwaW5nIHVwIGluIGRldnRvb2xzXG5cdHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyByZXEgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH0pO1xufVxud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LmtleXMgPSAoKSA9PiAoW10pO1xud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LnJlc29sdmUgPSB3ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQ7XG53ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQuaWQgPSBcIi4vLiBsYXp5IHJlY3Vyc2l2ZVwiO1xubW9kdWxlLmV4cG9ydHMgPSB3ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQ7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4iLCJ2YXIgd2VicGFja1F1ZXVlcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgcXVldWVzXCIpIDogXCJfX3dlYnBhY2tfcXVldWVzX19cIjtcbnZhciB3ZWJwYWNrRXhwb3J0cyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgZXhwb3J0c1wiKSA6IFwiX193ZWJwYWNrX2V4cG9ydHNfX1wiO1xudmFyIHdlYnBhY2tFcnJvciA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbChcIndlYnBhY2sgZXJyb3JcIikgOiBcIl9fd2VicGFja19lcnJvcl9fXCI7XG52YXIgcmVzb2x2ZVF1ZXVlID0gKHF1ZXVlKSA9PiB7XG5cdGlmKHF1ZXVlICYmIHF1ZXVlLmQgPCAxKSB7XG5cdFx0cXVldWUuZCA9IDE7XG5cdFx0cXVldWUuZm9yRWFjaCgoZm4pID0+IChmbi5yLS0pKTtcblx0XHRxdWV1ZS5mb3JFYWNoKChmbikgPT4gKGZuLnItLSA/IGZuLnIrKyA6IGZuKCkpKTtcblx0fVxufVxudmFyIHdyYXBEZXBzID0gKGRlcHMpID0+IChkZXBzLm1hcCgoZGVwKSA9PiB7XG5cdGlmKGRlcCAhPT0gbnVsbCAmJiB0eXBlb2YgZGVwID09PSBcIm9iamVjdFwiKSB7XG5cdFx0aWYoZGVwW3dlYnBhY2tRdWV1ZXNdKSByZXR1cm4gZGVwO1xuXHRcdGlmKGRlcC50aGVuKSB7XG5cdFx0XHR2YXIgcXVldWUgPSBbXTtcblx0XHRcdHF1ZXVlLmQgPSAwO1xuXHRcdFx0ZGVwLnRoZW4oKHIpID0+IHtcblx0XHRcdFx0b2JqW3dlYnBhY2tFeHBvcnRzXSA9IHI7XG5cdFx0XHRcdHJlc29sdmVRdWV1ZShxdWV1ZSk7XG5cdFx0XHR9LCAoZSkgPT4ge1xuXHRcdFx0XHRvYmpbd2VicGFja0Vycm9yXSA9IGU7XG5cdFx0XHRcdHJlc29sdmVRdWV1ZShxdWV1ZSk7XG5cdFx0XHR9KTtcblx0XHRcdHZhciBvYmogPSB7fTtcblx0XHRcdG9ialt3ZWJwYWNrUXVldWVzXSA9IChmbikgPT4gKGZuKHF1ZXVlKSk7XG5cdFx0XHRyZXR1cm4gb2JqO1xuXHRcdH1cblx0fVxuXHR2YXIgcmV0ID0ge307XG5cdHJldFt3ZWJwYWNrUXVldWVzXSA9IHggPT4ge307XG5cdHJldFt3ZWJwYWNrRXhwb3J0c10gPSBkZXA7XG5cdHJldHVybiByZXQ7XG59KSk7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmEgPSAobW9kdWxlLCBib2R5LCBoYXNBd2FpdCkgPT4ge1xuXHR2YXIgcXVldWU7XG5cdGhhc0F3YWl0ICYmICgocXVldWUgPSBbXSkuZCA9IC0xKTtcblx0dmFyIGRlcFF1ZXVlcyA9IG5ldyBTZXQoKTtcblx0dmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cztcblx0dmFyIGN1cnJlbnREZXBzO1xuXHR2YXIgb3V0ZXJSZXNvbHZlO1xuXHR2YXIgcmVqZWN0O1xuXHR2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWopID0+IHtcblx0XHRyZWplY3QgPSByZWo7XG5cdFx0b3V0ZXJSZXNvbHZlID0gcmVzb2x2ZTtcblx0fSk7XG5cdHByb21pc2Vbd2VicGFja0V4cG9ydHNdID0gZXhwb3J0cztcblx0cHJvbWlzZVt3ZWJwYWNrUXVldWVzXSA9IChmbikgPT4gKHF1ZXVlICYmIGZuKHF1ZXVlKSwgZGVwUXVldWVzLmZvckVhY2goZm4pLCBwcm9taXNlW1wiY2F0Y2hcIl0oeCA9PiB7fSkpO1xuXHRtb2R1bGUuZXhwb3J0cyA9IHByb21pc2U7XG5cdGJvZHkoKGRlcHMpID0+IHtcblx0XHRjdXJyZW50RGVwcyA9IHdyYXBEZXBzKGRlcHMpO1xuXHRcdHZhciBmbjtcblx0XHR2YXIgZ2V0UmVzdWx0ID0gKCkgPT4gKGN1cnJlbnREZXBzLm1hcCgoZCkgPT4ge1xuXHRcdFx0aWYoZFt3ZWJwYWNrRXJyb3JdKSB0aHJvdyBkW3dlYnBhY2tFcnJvcl07XG5cdFx0XHRyZXR1cm4gZFt3ZWJwYWNrRXhwb3J0c107XG5cdFx0fSkpXG5cdFx0dmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Zm4gPSAoKSA9PiAocmVzb2x2ZShnZXRSZXN1bHQpKTtcblx0XHRcdGZuLnIgPSAwO1xuXHRcdFx0dmFyIGZuUXVldWUgPSAocSkgPT4gKHEgIT09IHF1ZXVlICYmICFkZXBRdWV1ZXMuaGFzKHEpICYmIChkZXBRdWV1ZXMuYWRkKHEpLCBxICYmICFxLmQgJiYgKGZuLnIrKywgcS5wdXNoKGZuKSkpKTtcblx0XHRcdGN1cnJlbnREZXBzLm1hcCgoZGVwKSA9PiAoZGVwW3dlYnBhY2tRdWV1ZXNdKGZuUXVldWUpKSk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZuLnIgPyBwcm9taXNlIDogZ2V0UmVzdWx0KCk7XG5cdH0sIChlcnIpID0+ICgoZXJyID8gcmVqZWN0KHByb21pc2Vbd2VicGFja0Vycm9yXSA9IGVycikgOiBvdXRlclJlc29sdmUoZXhwb3J0cykpLCByZXNvbHZlUXVldWUocXVldWUpKSk7XG5cdHF1ZXVlICYmIHF1ZXVlLmQgPCAwICYmIChxdWV1ZS5kID0gMCk7XG59OyIsInZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiA/IChvYmopID0+IChPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSkgOiAob2JqKSA9PiAob2JqLl9fcHJvdG9fXyk7XG52YXIgbGVhZlByb3RvdHlwZXM7XG4vLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3Rcbi8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuLy8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4vLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3Rcbi8vIG1vZGUgJiAxNjogcmV0dXJuIHZhbHVlIHdoZW4gaXQncyBQcm9taXNlLWxpa2Vcbi8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbl9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG5cdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IHRoaXModmFsdWUpO1xuXHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuXHRpZih0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSB7XG5cdFx0aWYoKG1vZGUgJiA0KSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG5cdFx0aWYoKG1vZGUgJiAxNikgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbicpIHJldHVybiB2YWx1ZTtcblx0fVxuXHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuXHR2YXIgZGVmID0ge307XG5cdGxlYWZQcm90b3R5cGVzID0gbGVhZlByb3RvdHlwZXMgfHwgW251bGwsIGdldFByb3RvKHt9KSwgZ2V0UHJvdG8oW10pLCBnZXRQcm90byhnZXRQcm90byldO1xuXHRmb3IodmFyIGN1cnJlbnQgPSBtb2RlICYgMiAmJiB2YWx1ZTsgdHlwZW9mIGN1cnJlbnQgPT0gJ29iamVjdCcgJiYgIX5sZWFmUHJvdG90eXBlcy5pbmRleE9mKGN1cnJlbnQpOyBjdXJyZW50ID0gZ2V0UHJvdG8oY3VycmVudCkpIHtcblx0XHRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjdXJyZW50KS5mb3JFYWNoKChrZXkpID0+IChkZWZba2V5XSA9ICgpID0+ICh2YWx1ZVtrZXldKSkpO1xuXHR9XG5cdGRlZlsnZGVmYXVsdCddID0gKCkgPT4gKHZhbHVlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBkZWYpO1xuXHRyZXR1cm4gbnM7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5tanNcIjtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm1pbmlDc3NGID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiB1bmRlZmluZWQ7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3Ncbi8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuLy8gW3Jlc29sdmUsIFByb21pc2VdID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJtYWluXCI6IDBcbn07XG5cbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIge2lkcywgbW9kdWxlcywgcnVudGltZX0gPSBkYXRhO1xuXHQvLyBhZGQgXCJtb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuXHQvLyB0aGVuIGZsYWcgYWxsIFwiaWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG5cdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDA7XG5cdGZvcihtb2R1bGVJZCBpbiBtb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHRmb3IoO2kgPCBpZHMubGVuZ3RoOyBpKyspIHtcblx0XHRjaHVua0lkID0gaWRzW2ldO1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhpbnN0YWxsZWRDaHVua3MsIGNodW5rSWQpICYmIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKCk7XG5cdFx0fVxuXHRcdGluc3RhbGxlZENodW5rc1tpZHNbaV1dID0gMDtcblx0fVxuXG59XG5cbl9fd2VicGFja19yZXF1aXJlX18uZi5qID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdFx0Ly8gaW1wb3J0KCkgY2h1bmsgbG9hZGluZyBmb3IgamF2YXNjcmlwdFxuXHRcdHZhciBpbnN0YWxsZWRDaHVua0RhdGEgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLm8oaW5zdGFsbGVkQ2h1bmtzLCBjaHVua0lkKSA/IGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA6IHVuZGVmaW5lZDtcblx0XHRpZihpbnN0YWxsZWRDaHVua0RhdGEgIT09IDApIHsgLy8gMCBtZWFucyBcImFscmVhZHkgaW5zdGFsbGVkXCIuXG5cblx0XHRcdC8vIGEgUHJvbWlzZSBtZWFucyBcImN1cnJlbnRseSBsb2FkaW5nXCIuXG5cdFx0XHRpZihpbnN0YWxsZWRDaHVua0RhdGEpIHtcblx0XHRcdFx0cHJvbWlzZXMucHVzaChpbnN0YWxsZWRDaHVua0RhdGFbMV0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdFx0XHQvLyBzZXR1cCBQcm9taXNlIGluIGNodW5rIGNhY2hlXG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSBpbXBvcnQoXCIuLi9cIiArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSkudGhlbihpbnN0YWxsQ2h1bmssIChlKSA9PiB7XG5cdFx0XHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gIT09IDApIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdHRocm93IGU7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSBQcm9taXNlLnJhY2UoW3Byb21pc2UsIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiAoaW5zdGFsbGVkQ2h1bmtEYXRhID0gaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gW3Jlc29sdmVdKSldKVxuXHRcdFx0XHRcdHByb21pc2VzLnB1c2goaW5zdGFsbGVkQ2h1bmtEYXRhWzFdID0gcHJvbWlzZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG59O1xuXG4vLyBubyBwcmVmZXRjaGluZ1xuXG4vLyBubyBwcmVsb2FkZWRcblxuLy8gbm8gZXh0ZXJuYWwgaW5zdGFsbCBjaHVua1xuXG4vLyBubyBvbiBjaHVua3MgbG9hZGVkIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSB1c2VkICdtb2R1bGUnIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LnRzXCIpO1xuIiwiIl0sIm5hbWVzIjpbImdsb2JhbFRoaXMiLCJEZW5vIiwiYXJncyIsImxlbmd0aCIsInBhcnNlQXJncyIsImhlbHAiLCJjb25zb2xlIiwibG9nIiwiZXhpdCIsInN0YXJ0SFRUUFNlcnZlciIsInBvcnQiLCJob3N0bmFtZSIsImhvc3QiLCJyb3V0ZXMiLCJfIiwiYXNzZXRzIiwiYXNzZXRzX3ByZWZpeCIsImRlZmF1bHQiLCJub3RfZm91bmQiLCJpbnRlcm5hbF9lcnJvciIsInRlc3QiLCJ0ZXN0X25hbWUiLCJyZXF1ZXN0IiwiZXhwZWN0ZWRfcmVzcG9uc2UiLCJSZXF1ZXN0IiwiZW5jb2RlVVJJIiwidXNlX2JyeXRob24iLCJsYW5nIiwic2FuaXRpemVSZXNvdXJjZXMiLCJyIiwiY2xvbmUiLCJoZWFkZXJzIiwic2V0IiwiYXNzZXJ0UmVzcG9uc2UiLCJmZXRjaCIsInVpbnRfZXF1YWxzIiwiYSIsImIiLCJieXRlTGVuZ3RoIiwiaSIsImF0IiwicmVzcG9uc2UiLCJzdGF0dXMiLCJib2R5IiwibWltZSIsInN0YXR1c1RleHQiLCJFcnJvciIsInJlcF9taW1lIiwiZ2V0IiwiVWludDhBcnJheSIsInJlcCIsImJ5dGVzIiwicmVwX3RleHQiLCJ0ZXh0Iiwicm9vdERpciIsImN3ZCIsIl9kZWZhdWx0IiwibG9nZ2VyIiwicm91dGVzSGFuZGxlcnMiLCJsb2FkQWxsUm91dGVzSGFuZGxlcnMiLCJyZXF1ZXN0SGFuZGxlciIsImJ1aWxkUmVxdWVzdEhhbmRsZXIiLCJzZXJ2ZSIsImZpbmlzaGVkIiwiU1NFV3JpdGVyIiwiY29uc3RydWN0b3IiLCJ3cml0ZXIiLCJzZW5kRXZlbnQiLCJkYXRhIiwibmFtZSIsIndyaXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsImNsb3NlZCIsImNsb3NlIiwiYWJvcnQiLCJWU0hTIiwiU1NFUmVzcG9uc2UiLCJjYWxsYmFjayIsIm9wdGlvbnMiLCJyZWFkYWJsZSIsIndyaXRhYmxlIiwiVHJhbnNmb3JtU3RyZWFtIiwiZ2V0V3JpdGVyIiwiY2F0Y2giLCJlIiwic3RyZWFtIiwicGlwZVRocm91Z2giLCJUZXh0RW5jb2RlclN0cmVhbSIsIkhlYWRlcnMiLCJoYXMiLCJSZXNwb25zZSIsImdldE1pbWUiLCJwYXRoIiwicG9zIiwibGFzdEluZGV4T2YiLCJleHQiLCJzbGljZSIsImxvYWRNaW1lIiwiZ2V0VHlwZSIsImZldGNoQXNzZXQiLCJvcGVuIiwibWltZWxpdGUiLCJicnl0aG9uX2xvYWRpbmciLCJicnl0aG9uX3Byb21pc2UiLCJQcm9taXNlIiwid2l0aFJlc29sdmVycyIsImxvYWRfYnJ5dGhvbiIsInByb21pc2UiLCJmaWxlIiwiZGlyIiwidXJsIiwiYnJ5dGhvbiIsInJlYWRUZXh0RmlsZSIsIiRCIiwiX19CUllUSE9OX18iLCJpbm5lciIsImdsb2JhbCIsIm1vZHVsZSIsImV2YWwiLCJ3YXJuIiwicmVzb2x2ZSIsIlJPT1QiLCJyb3V0ZXNfdXJpIiwiZ2V0QWxsUm91dGVzIiwiaGFuZGxlcnMiLCJhbGwiLCJtYXAiLCJ1cmkiLCJpc19icnl0aG9uIiwiZW5kc1dpdGgiLCJyb3V0ZSIsImNvZGUiLCJpbmRleE9mIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsInR5cGUiLCJlcnJvciIsImhhbmRsZXIiLCJjdXJyZW50UGF0aCIsImZpbGVzIiwiZGlyRW50cnkiLCJyZWFkRGlyIiwiZW50cnlQYXRoIiwiaXNEaXJlY3RvcnkiLCJpbmNsdWRlcyIsInB1c2giLCJDT1JTX0hFQURFUlMiLCJidWlsZEFuc3dlciIsInJlcF9oZWFkZXJzIiwiYnVpbGREZWZhdWx0Um91dGUiLCJkZWZhdWx0X2hhbmRsZXIiLCJvcHRzIiwibWVzc2FnZSIsInBhdGhuYW1lIiwidW5kZWZpbmVkIiwic3RhcnRzV2l0aCIsImZpbGVwYXRoIiwiaW5mbyIsInN0YXQiLCJlcnJvcnMiLCJOb3RGb3VuZCIsIlBlcm1pc3Npb25EZW5pZWQiLCJ2YXJzIiwicmVnZXhlcyIsImlzX2JyeSIsInBhdGgycmVnZXgiLCJkZWZhdWx0X3JvdXRlIiwibm90X2ZvdW5kX3JvdXRlIiwiZ2V0Um91dGVIYW5kbGVyIiwiaW50ZXJuYWxfZXJyb3Jfcm91dGUiLCJjb25uSW5mbyIsImlwIiwicmVtb3RlQWRkciIsIm1ldGhvZCIsImFuc3dlciIsIl9yb3V0ZSIsInJlcGxhY2UiLCJSZWdFeHAiLCJjYXB0dXJlZCIsIm1hdGNoIiwicmVnZXgiLCJyZXN1bHQiLCJleGVjIiwiZ3JvdXBzIiwiY3VyUm91dGUiLCJkZWNvZGVVUkkiXSwic291cmNlUm9vdCI6IiJ9