import LISS from "../../../../../libs/LISS/src/";
import PlaygroundArea, { ASSETS } from "../../../../../libs/LISS/src/pages/docs/skeleton/code/playground-area/PlaygroundArea";

const resources = [{
        file : 'index.json',
        lang : 'json',
        title: 'Example Config'
    },{
        file : 'index.js',
        lang : 'js',
        title: 'Rule JS'
    },{
        file : 'index.bry',
        lang : 'python',
        title: 'Rule Bry'
    },
]

//TODO: move...
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

class VSHSPlayground extends LISS({extends: PlaygroundArea}) {

    constructor() {
        super(resources);
    }

    override async updateCodes() {

        this._inUpdate = true;

        const example = this.host.getAttribute('name')!;

        let promises: Promise<unknown>[] = [];

        let names = new Array<string>();


        console.warn(`${ASSETS}/${example}/index.json`);
        const config = await (await fetch(`${ASSETS}/${example}/index.json`)).text();
        ;
        const code_api = this.resources['index.json'].ctrler!.setCode(config);
        names.push('index.json');

        const method = JSON.parse(config).method;

        for(let file in this.resources) {

            if(file === "index.json")
                continue;

            if(file === "output")
                continue;

            const code_api = this.resources[file].ctrler!;

            const ext = file.split('.')[1];

            promises.push( (async() => {
                const resp = await fetch(`${ASSETS}/${example}/${method}.${ext}`);
                let text = "";
                if( resp.status === 200 ) {
                    text = await resp.text();
                    if(text !== "") {
                        names.push(file);
                    }
                }
                code_api.setCode( text );
            })() );
        }

        await Promise.all(promises);
        this.updateResult();

        this._inUpdate = false;

        if( ! this.host.hasAttribute("show") ) {
            names.push("output");
            this.host.setAttribute('show', names.join(','));
        }

        this.host.dispatchEvent(new Event("change") );
    }

    override async generateIFrameContent() {

        const codes = this.getAllCodes();

        if( codes["index.js"] === "") {

            let code = codes["index.bry"];

            codes["index.js"] = `const $B = globalThis.__BRYTHON__;
            
const result = $B.runPythonSource(\`${code}\`);
const imported = [...Object.values(__BRYTHON__.imported)];
const last = imported[imported.length-1];

export default last.Rule;
`;

        }


        const blob = new Blob([codes["index.js"]], {type: "application/javascript"});
        const rule = (await import( /* webpackIgnore: true */ URL.createObjectURL(blob) )).default;

        console.warn(codes["index.json"]);
        const config = JSON.parse(codes["index.json"]);

        const server = config.server ?? "http://fake.server/";

        const reg = path2regex(config.route);
        const vars = match(reg, config.query.url);

        console.log( config.query.url, config.route );
        
        let result = rule({
            body : config.query.body,
            url  : new URL( encodeURI(config.query.url), server),
            route: config.route,
            route_vars: vars
        }); //TODO: args

        if( typeof result !== "string") {

            if( result !== undefined && "$strings" in result)
                result = result.$strings;

            result = JSON.stringify(result, null, 4);
            result = new Blob([result], {type: "application/json"});
        }

        return result;
    }
}

LISS.define('vshs-playground', VSHSPlayground);