import {path2regex, match}  from "@VSHS/../VSHS";

function fakeFetchServer(ctx: any, server: string, codeLang: string) {

    const _fetch = ctx.fetch;        
    
    ctx.fetch = function (url: string, args:RequestInit = {}) {
        const headers = args.headers ?? {};
        args.headers = {...headers, "use-brython": `${codeLang === "bry"}`};
        return _fetch(server + url, args );
    }
}

function fakeFetchNoServer(ctx: any, path: string) {

    ctx.fetch = async function( target: string|Request, args: RequestInit ) {
        
        const request = target instanceof Request ? target
                                                  : new Request(target, args);

        const reg  = path2regex(path);

        const url = new URL(request.url);
        const uri = `${ decodeURI(url.pathname) }/${request.method}`;
        const vars = match(reg, uri);

        const route = {
            url,
            vars,
            path
        };

        let response;
        try {
            response = await ctx.handler( request, route );
        } catch(e) {
            if( e instanceof Response )
                return e;

            return new Response( (e as Error).message, {status: 500});
        }

        if( response === undefined)
            response = new Response();

        console.warn(response);

        if( !response.ok && response.headers.has("location") )
            response = new Response("Redirections not supported (use server in playground).", {status: 500, statusText: "Redirections not supported"})

        return response;
    }
}

export default function fakeFetch(ctx: any, server: string|null, codeLang: string, path: string) {

    if( server !== null )
        fakeFetchServer(ctx, server, codeLang);
    else
        fakeFetchNoServer(ctx, path);
}