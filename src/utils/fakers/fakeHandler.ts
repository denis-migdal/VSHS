import execute from "@LISS/src/utils/execute";

export default async function fakeHandler(ctx: any, code: string, codeLang: string) {

    // @ts-ignore
    window.__BRYTHON__ = ctx.__BRYTHON__;

    // @ts-ignore
    const module = (await execute(code, codeLang)) as any;

    if( codeLang === "js" ) {
        ctx.handler = module.default
        return;
    }

    // @ts-ignore
    const fct =  window.__BRYTHON__.pyobj2jsobj(module.default);

    ctx.handler = async (...args: any[]) => {
        try {
            const r = await fct(...args);
            if( r?.__class__?.__qualname__ === "NoneType")
                return undefined;
            return r;
        } catch(e: any) {
            if( ! ("$py_error" in e) )
                throw e;
            let js_error = e.args[0];

            if( ! (js_error instanceof Response) )
                js_error = new Error(js_error);

            throw js_error;
        }
    }
}