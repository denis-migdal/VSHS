import LISS from "../../../../../index";
import CodeBlock from "../code-block/CodeBlock";
export const rootdir = location.host === "denis-migdal.github.io" ? `/${location.pathname.split("/")[1]}` : "";
//TODO : path
export const ASSETS = `${rootdir}/dist/dev/assets/examples`;
// @ts-ignore
import css from "!!raw-loader!./PlaygroundArea.css";
export default class PlaygroundArea extends LISS({
    css
}) {
    resources = {};
    constructor(resources = []) {
        super();
        document.body.addEventListener('code_changed', () => {
            this.switchJSBry();
        });
        const output = this.#iframe = document.createElement('iframe');
        let card = document.createElement('div');
        card.classList.add('card');
        const header = document.createElement('div');
        header.classList.add('header');
        const name = document.createElement('strong');
        name.textContent = "Result";
        header.append(name);
        card.append(header);
        card.append(output);
        this.resources['output'] = { html: card, ctrler: null };
        for (const { lang, file, title } of resources) {
            //TODO lang
            const code_api = new CodeBlock({ lang });
            const card = document.createElement('div');
            card.classList.add('card');
            const header = document.createElement('div');
            header.classList.add('header');
            const name = document.createElement('strong');
            name.textContent = title;
            header.append(name);
            card.append(header);
            card.append(code_api.host);
            this.resources[file] = {
                html: card,
                ctrler: code_api
            };
            code_api.host.addEventListener('change', () => {
                if (!this._inUpdate)
                    this.updateResult();
            });
        }
        this.switchJSBry();
        if (this.host.hasAttribute('name'))
            this.updateCodes();
    }
    switchJSBry() {
        const is_bry = document.body.classList.contains('code_bry');
        const keys = Object.keys(this.resources).filter(n => n.endsWith('.bry'));
        const ext = is_bry ? ".bry" : ".js";
        for (let key of keys) {
            const file = key.slice(0, -'.bry'.length);
            this.resources[`${file}.code`] = this.resources[`${file}${ext}`];
        }
        this.host.toggleAttribute('brython', is_bry);
        this.updateLayout();
    }
    _inUpdate = false;
    setGrid(codes) {
        if (codes.length == 1)
            this.host.style.setProperty('grid', '1fr / 1fr');
        if (codes.length == 2)
            this.host.style.setProperty('grid', '1fr / 1fr 1fr');
        if (codes.length == 3)
            this.host.style.setProperty('grid', '1fr / 1fr 1fr 1fr');
        if (codes.length === 4)
            this.host.style.setProperty('grid', 'auto / 1fr 1fr');
        if (codes.length > 4)
            this.host.style.setProperty('grid', 'auto / 1fr 1fr 1fr');
    }
    updateLayout() {
        const show = this.host.getAttribute('show');
        let codes = [];
        if (show === null)
            codes = Object.keys(this.resources);
        else
            codes = show.split(',');
        this.content.replaceChildren(...codes.map(e => this.resources[e].html));
        this.setGrid(codes);
        // h4ck
        this.updateResult();
    }
    #iframe;
    async generateIFrameContent() {
        return "";
    }
    async updateCodes() {
        this._inUpdate = true;
        const example = this.host.getAttribute('name');
        let promises = [];
        let names = new Array();
        for (let file in this.resources) {
            if (file === "output")
                continue;
            if (file.endsWith('.code'))
                continue;
            const code_api = this.resources[file].ctrler;
            promises.push((async () => {
                const resp = await fetch(`${ASSETS}/${example}/${file}`);
                let text = "";
                if (resp.status === 200) {
                    text = await resp.text();
                    if (text !== "") {
                        names.push(file);
                    }
                }
                code_api.setCode(text);
            })());
        }
        await Promise.all(promises);
        this.updateResult();
        this._inUpdate = false;
        if (!this.host.hasAttribute("show")) {
            names.push("output");
            this.host.setAttribute('show', names.join(','));
        }
        this.host.dispatchEvent(new Event("change"));
    }
    getAllCodes() {
        let result = {};
        for (let key in this.resources) {
            if (key === "output")
                continue;
            result[key] = this.resources[key].ctrler.getCode();
        }
        return result;
    }
    #lastURL = null;
    async updateResult() {
        const iframe = document.createElement('iframe');
        this.#iframe.replaceWith(iframe);
        this.#iframe = iframe;
        let content = await this.generateIFrameContent();
        /* doesn't work
        if( ! (content instanceof Blob) ) {
            content = new Blob([content], {type: "text/html"});
        }
        */
        if (content instanceof Blob) {
            if (this.#lastURL !== null)
                URL.revokeObjectURL(this.#lastURL);
            this.#lastURL = iframe.src = URL.createObjectURL(content);
            return;
        }
        /**/
        iframe.src = "about:blank";
        // iframe.srcdoc also possible
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(content);
        iframe.contentWindow.document.close();
        /**/
    }
    attributeChangedCallback(name) {
        if (name === "show") {
            this.updateLayout();
            return;
        }
        if (name === "name") {
            this.updateCodes();
            return;
        }
        this.updateResult();
    }
    static observedAttributes = ["show", "name"];
}
LISS.define('playground-area', PlaygroundArea);
//# sourceMappingURL=PlaygroundArea.js.map