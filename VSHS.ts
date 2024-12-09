#!/usr/bin/env -S deno run --allow-all --watch --check --unstable-sloppy-imports

if( "Deno" in globalThis && Deno.args.length ) {

	const {parseArgs} = await import("jsr:@std/cli/parse-args");

	const args = parseArgs(Deno.args)

	/* --default	default
Route non trouvée	--not-found	not_found
Erreur non-capturée	--internal-error*/

	if( args.help ) {
		console.log(`./VSHS.ts $ROUTES
	--host          : (default locahost)
	--port          : (default 8080)
	--default       : (default /default)
	--not_found     : (default --default)
	--internal_error: (default --default)
	`)
		Deno.exit(0);
	}

	startHTTPServer({
		port    : args.port ?? 8080,
		hostname: args.host ?? "localhost",
		routes  : args._[0] as string,
		default       : args.default,
		not_found     : args.not_found,
		internal_error: args.internal_error,
	})

}

/*******************************/

type Logger = (ip: string, method: string, url: URL, error: null|HTTPError|Error) => void;

export async function test(
	test_name  : string,
	request    : Request|string,
	expected_response: Partial<ExpectedAnswer>
) {

	if(typeof request === "string")
		request = new Request(encodeURI(request));

	for(let use_brython of ["true", "false"]) {
		const lang = use_brython === "true" ? "bry" : "js";
		Deno.test(`${test_name} (${lang})`, {sanitizeResources: false}, async() => {

			const r = request.clone();
			r.headers.set("use-brython", use_brython);
			await assertResponse(await fetch(r), expected_response);
		});
	}
}

function uint_equals(a: Uint8Array, b: Uint8Array) {

	if(b.byteLength !== b.byteLength)
		return false;

	for(let i = 0; i < a.byteLength; ++i)
		if(a.at(i) !== b.at(i))
			return false;
	return true;
}

type ExpectedAnswer = {
	status    : number,
	statusText: string,
	body  : string|Uint8Array|null,
	mime  : string|null,
};

export async function assertResponse(response: Response, {
	status = 200,
	body   = null,
	mime   = null,
	statusText = "OK"

}: Partial<ExpectedAnswer>) {

	if(response.status !== status) {
		throw new Error(`\x1b[1;31mWrong status code:\x1b[0m
\x1b[1;31m- ${response.status}\x1b[0m
\x1b[1;32m+ ${status}\x1b[0m`);
	}

	if(response.statusText !== statusText) {
		throw new Error(`\x1b[1;31mWrong status text:\x1b[0m
\x1b[1;31m- ${response.statusText}\x1b[0m
\x1b[1;32m+ ${statusText}\x1b[0m`);
	}

	let rep_mime = response.headers.get('Content-Type');
	if( mime === null && rep_mime === "application/octet-stream")
		rep_mime = null;
	if( rep_mime !== mime ) {
		throw new Error(`\x1b[1;31mWrong mime-type:\x1b[0m
\x1b[1;31m- ${rep_mime}\x1b[0m
\x1b[1;32m+ ${mime}\x1b[0m`);
		}

	if( body instanceof Uint8Array ) {
		const rep = new Uint8Array(await response.bytes());
		if( ! uint_equals(body, rep) )
			throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
	} else {

		const rep_text = await response.text();
		if( rep_text !== body && (body !== null || rep_text !== "") )
			throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep_text}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
	}
}

type HTTPServerOpts = {
	port    : number,
	hostname: string,
	routes         : string|Routes,
	default        : string,
	not_found      : string,
	internal_error : string,

	static?: string,
	logger?: Logger // not documented
};


export function rootDir() {
	return Deno.cwd();
}

export default async function startHTTPServer({ port = 8080,
												hostname = "localhost",
												routes = "/routes",
												default: _default = "/default/GET",
												not_found      = _default,
												internal_error = _default,
												static: _static,
												logger = () => {}
											}: HTTPServerOpts) {

	let routesHandlers: Routes = routes as any;
	if( typeof routes === "string" ) {
		if(routes[0] === "/")
			routes = rootDir() + routes;
			
		routesHandlers = await loadAllRoutesHandlers(routes);
	}
	
	if(_static?.[0] === "/")
		_static = rootDir() + _static;
	
	const requestHandler = buildRequestHandler(routesHandlers, {
		_static,
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


//TODO: remove
class HTTPError extends Error {

	#error_code:number;

	constructor(http_error_code: number, message: string) {
		super(message);
		this.name = "HTTPError";
		this.#error_code = http_error_code;
	}

	get error_code() {
		return this.#error_code;
	}
}

export class SSEWriter {
    #writer: WritableStreamDefaultWriter;
    constructor(writer: WritableStreamDefaultWriter) {
        this.#writer = writer;
    }

    sendEvent(data: any, name = 'message') {
        return this.#writer.write(
`event: ${name}
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
	SSEResponse: function<T extends any[]>(callback: (writer: SSEWriter, ...args: T) => Promise<void>,
										   options: ResponseInit,
										   ...args: T) {
		const {readable, writable} = new TransformStream();

		const writer = new SSEWriter(writable.getWriter());
		callback( writer, ...args ).catch( (e) => {
			writer.abort();
			throw e;
		})
	
		const stream = readable.pipeThrough( new TextEncoderStream() );

		options??= {};
		options.headers??={};
		if( options.headers instanceof Headers) {
			if( ! options.headers.has("Content-Type") )
				options.headers.set("Content-Type", "text/event-stream");
		} else
			(options.headers as Record<string, string>)["Content-Type"] ??= "text/event-stream";


		return new Response(stream, options);

	}
};
// @ts-ignore
globalThis.VSHS = VSHS;

export type HandlerParams = [
	Request, {
		path: string,
		vars: Record<string, string>
	}
];

type Handler = (...args: HandlerParams) => Promise<any>;
type Routes  = (readonly [string, Handler, boolean])[];

let brython_loading  = false;
let brython_promise = Promise.withResolvers<void>();

async function load_brython() {
	if( brython_loading ) {
		await brython_promise.promise
		return;
	}

	brython_loading = true;

	//brython = await (await fetch( "https://cdnjs.cloudflare.com/ajax/libs/brython/3.13.0/brython.min.js" )).text();
	const file = "brython(1)";
	const dir = import.meta.url.slice(6, import.meta.url.lastIndexOf('/') );
	const brython = await Deno.readTextFile(dir + `/${file}.js`);

	// @ts-ignore
	globalThis.$B  = globalThis.__BRYTHON__ = {}; // why is it required ???
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

async function loadAllRoutesHandlers(routes: string): Promise<Routes> {

	const ROOT = rootDir();
	let routes_uri = await getAllRoutes(routes);

	type Module = {default: Handler};
	const handlers   = await Promise.all( routes_uri.map( async (uri) => {

		// only with imports map, but bugged
		// https://github.com/denoland/deno/issues/22237
		//if( uri.startsWith(ROOT) )
		//	uri = uri.slice(ROOT.length)

		/*if( uri[1] === ':' ) // windows drive
			uri = `file://${uri}`;*/

		const is_brython = uri.endsWith('.bry');
		let ext = is_brython ? ".bry" : ".ts"
		let route = uri.slice(routes.length, - ext.length);

		let module!: Module;
		try{

			let code = await Deno.readTextFile(uri);

			if( route.endsWith('index') )
				route = code.slice(3, code.indexOf('\n') - ext.length );

			if( is_brython ) {

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

			const url = URL.createObjectURL( new Blob([code], {type: "text/javascript"}));

			module = await import( url );

		} catch(e) {
			console.error(e);
		}

		const handler: Handler = module.default;

		return [route, handler, is_brython] as const;
	}));

	return handlers;
}

async function getAllRoutes(currentPath: string): Promise<string[]> {

	const files: string[] = [];

	for await (const dirEntry of Deno.readDir(currentPath)) {

		const entryPath = `${currentPath}/${dirEntry.name}`;

		if ( ! dirEntry.isDirectory) {

			if( ! ["test.ts", "request.bry", "request.js"].includes(dirEntry.name) )
				files.push( entryPath )
		} else
			files.push(... await getAllRoutes(entryPath));

	}

	return files;
}

type REST_Methods = "POST"|"GET"|"DELETE"|"PUT"|"PATCH";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "*", // POST, GET, PATCH, PUT, OPTIONS, DELETE
	"Access-Control-Allow-Headers": "*"  // "use-brython"
};

function buildAnswer(response: Response|null = null) {

	if( response === null )
		response = new Response(null);

	// Probably WebSocket upgrade
	if( response.status === 101)
		return response;

	if( ! (response instanceof Response) ) {
		console.warn(response);
		throw new Error("Request handler returned something else than a Response");
	}

	const rep_headers = new Headers(response.headers);

	for(let name in CORS_HEADERS)
		// @ts-ignore
		rep_headers.set(name, CORS_HEADERS[name])

	const rep = new Response( response.body, {
		status    : response.status,
		statusText: response.statusText,
		headers   : rep_headers
	} );

	return rep;
}

type buildRequestHandlerOpts = {
	_static?: string,
	logger?: Logger,
	not_found     : string,
	internal_error: string
}

type DefaultRouteOpts = {
	route   : Route|null,
	error  ?: Error,
} & Route;

async function default_handler(request: Request, opts: DefaultRouteOpts) {

	console.warn("called", opts, opts.error);

	if( "error" in opts )
		return new Response(opts.error!.message, {status: 500});

	//TODO assets

	return new Response(`${request.url} not found`, {status: 404});

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
	*/
}

const default_route = {
	handler: default_handler,
	path   : "/default",
	vars   : {}
}

function buildRequestHandler(routes: Routes, {
	_static,
	logger ,
	not_found      = "/default/GET",
	internal_error = "/default/GET"
}: Partial<buildRequestHandlerOpts>) {

	const regexes = routes.map( ([uri, handler, is_bry]) => [path2regex(uri), handler, uri, is_bry] as const);

	const not_found_route = [
		getRouteHandler(regexes, "GET", not_found, false) ?? default_route,
		getRouteHandler(regexes, "GET", not_found, true)  ?? default_route
	] as DefaultRouteOpts[];
	const internal_error_route = [
		getRouteHandler(regexes, "GET", internal_error, false) ?? default_route,
		getRouteHandler(regexes, "GET", internal_error, true)  ?? default_route
	] as DefaultRouteOpts[];

	return async function(request: Request, connInfo: any): Promise<Response> {

		const ip = connInfo.remoteAddr.hostname;

		const url = new URL(request.url);
		let error = null;
		const method = request.method as REST_Methods | "OPTIONS";

		let answer: Response|undefined;
		let use_brython: null|boolean = null;

		let route: Route|null = null;

		try {

			if(method === "OPTIONS")
				return new Response(null, {headers: CORS_HEADERS});

			if( request.headers.has("use-brython") )
				use_brython = request.headers.get("use-brython") === "true";

			route = getRouteHandler(regexes, method, url, use_brython);

			if( route !== null) {
				answer = await route.handler(request, route);
			} else {
				const _route = await not_found_route[+use_brython!];
				_route.route = route;
				answer = await _route.handler(request, _route)
			}

			return buildAnswer(answer);

		} catch(e) {

			if( ! (e instanceof Response) ) {
				const _route = internal_error_route[+use_brython!];
				_route.route = route;
				_route.error = e as Error;
				e = await _route.handler(request, _route);
			}

			return buildAnswer(e as Response);

		} finally {
			if( logger !== undefined )
				logger(ip, method, url, error);
		}
	};
}


// tests

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

type Route = {
	handler: Handler,
	path   : string,
	vars   : Record<string, string>
}

function getRouteHandler(regexes: (readonly [RegExp, Handler, string, boolean])[],
						method: REST_Methods,
						url: URL|string,
						use_brython: boolean|null = null): Route|null {

	let curRoute: string;
	if( typeof url === "string")
		curRoute = `${url}/${method}`;
	else
		curRoute = `${ decodeURI(url.pathname) }/${method}`;

	for(let route of regexes) {

		if( use_brython !== null && route[3] !== use_brython )
			continue;

		var vars = match(route[0], curRoute);

		if(vars !== false)
			return {
				handler: route[1],
				path   : route[2],
				vars
			};
	}

	return null;
}