import { getSharedCSS } from "./LISSHost";
import { ShadowCfg } from "./types";
import { _element2tagname, isDOMContentLoaded, isShadowSupported, waitDOMContentLoaded } from "./utils";
const alreadyDeclaredCSS = new Set();
const sharedCSS = getSharedCSS(); // from LISSHost...
export default class ContentGenerator {
    #stylesheets;
    #template;
    #shadow;
    data;
    constructor({ html, css = [], shadow = null, } = {}) {
        this.#shadow = shadow;
        this.#template = this.prepareHTML(html);
        this.#stylesheets = this.prepareCSS(css);
        this.#isReady = isDOMContentLoaded();
        this.#whenReady = waitDOMContentLoaded();
        //TODO: other deps...
    }
    setTemplate(template) {
        this.#template = template;
    }
    #whenReady;
    #isReady = false;
    get isReady() {
        return this.#isReady;
    }
    async whenReady() {
        if (this.#isReady)
            return;
        return await this.#whenReady;
        //TODO: deps.
        //TODO: CSS/HTML resources...
        // if( _content instanceof Response ) // from a fetch...
        // _content = await _content.text();
        // + cf at the end...
    }
    generate(host) {
        //TODO: wait parents/children depending on option...     
        const target = this.initShadow(host);
        this.injectCSS(target, this.#stylesheets);
        const content = this.#template.content.cloneNode(true);
        if (host.shadowMode !== ShadowCfg.NONE || target.childNodes.length === 0)
            target.replaceChildren(content);
        if (target instanceof ShadowRoot && target.childNodes.length === 0)
            target.append(document.createElement('slot'));
        customElements.upgrade(host);
        return target;
    }
    initShadow(host) {
        const canHaveShadow = isShadowSupported(host);
        if (this.#shadow !== null && this.#shadow !== ShadowCfg.NONE && !canHaveShadow)
            throw new Error(`Host element ${_element2tagname(host)} does not support ShadowRoot`);
        let mode = this.#shadow;
        if (mode === null)
            mode = canHaveShadow ? ShadowCfg.SEMIOPEN : ShadowCfg.NONE;
        host.shadowMode = mode;
        if (mode === ShadowCfg.SEMIOPEN)
            mode = ShadowCfg.OPEN; // TODO: set to X.
        let target = host;
        if (mode !== ShadowCfg.NONE)
            target = host.attachShadow({ mode });
        return target;
    }
    prepareCSS(css) {
        if (!Array.isArray(css))
            css = [css];
        return css.map(e => this.processCSS(e));
    }
    processCSS(css) {
        if (css instanceof CSSStyleSheet)
            return css;
        if (css instanceof HTMLStyleElement)
            return css.sheet;
        if (typeof css === "string") {
            let style = new CSSStyleSheet();
            style.replaceSync(css); // replace() if issues
            return style;
        }
        console.warn(css);
        throw new Error("Should not occur");
    }
    prepareHTML(html) {
        const template = document.createElement('template');
        if (html === undefined)
            return template;
        // str2html
        if (typeof html === 'string') {
            const str = html.trim();
            template.innerHTML = str;
            return template;
        }
        if (html instanceof HTMLElement)
            html = html.cloneNode(true);
        template.append(html);
        return template;
    }
    injectCSS(target, stylesheets) {
        if (target instanceof ShadowRoot) {
            target.adoptedStyleSheets.push(sharedCSS, ...stylesheets);
            return;
        }
        const cssselector = target.CSSSelector; //TODO...
        if (alreadyDeclaredCSS.has(cssselector))
            return;
        let style = document.createElement('style');
        style.setAttribute('for', cssselector);
        let html_stylesheets = "";
        for (let style of stylesheets)
            for (let rule of style.cssRules)
                html_stylesheets += rule.cssText + '\n';
        style.innerHTML = html_stylesheets.replace(':host', `:is(${cssselector})`);
        document.head.append(style);
        alreadyDeclaredCSS.add(cssselector);
    }
}
// idem HTML...
/* if( c instanceof Promise || c instanceof Response) {

        all_deps.push( (async () => {

            c = await c;
            if( c instanceof Response )
                c = await c.text();

            stylesheets[idx] = process_css(c);

        })());

        return null as unknown as CSSStyleSheet;
    }
*/ 
//# sourceMappingURL=ContentGenerator.js.map