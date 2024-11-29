import { ShadowCfg } from "./types";
import { LISSState } from "./state";
import { setCstrHost } from "./LISSBase";
// LISSHost must be build in define as it need to be able to build
// the defined subclass.
let id = 0;
const sharedCSS = new CSSStyleSheet();
export function getSharedCSS() {
    return sharedCSS;
}
let __cstr_base = null;
export function setCstrBase(_) {
    __cstr_base = _;
}
export function buildLISSHost(Liss, 
// can't deduce : cause type deduction issues...
hostCstr, content_generator_cstr, args) {
    const content_generator = new content_generator_cstr(args);
    class LISSHost extends hostCstr {
        static Cfg = {
            host: hostCstr,
            content_generator: content_generator_cstr,
            args
        };
        // adopt state if already created.
        state = this.state ?? new LISSState(this);
        // ============ DEPENDENCIES ==================================
        static whenDepsResolved = content_generator.whenReady();
        static get isDepsResolved() {
            return content_generator.isReady;
        }
        // ============ INITIALIZATION ==================================
        static Base = Liss;
        #base = null;
        get base() {
            return this.#base;
        }
        get isInitialized() {
            return this.#base !== null;
        }
        whenInitialized;
        #whenInitialized_resolver;
        #params;
        initialize(...params) {
            if (this.isInitialized)
                throw new Error('Element already initialized!');
            if (!this.constructor.isDepsResolved)
                throw new Error("Dependencies hasn't been loaded !");
            if (params.length !== 0) {
                if (this.#params.length !== 0)
                    throw new Error('Cstr params has already been provided !');
                this.#params = params;
            }
            this.#base = this.init();
            if (this.isConnected)
                this.#base.connectedCallback();
            return this.#base;
        }
        // ============== Content ===================
        #content = this;
        get content() {
            return this.#content;
        }
        getPart(name) {
            return this.hasShadow
                ? this.#content?.querySelector(`::part(${name})`)
                : this.#content?.querySelector(`[part="${name}"]`);
        }
        getParts(name) {
            return this.hasShadow
                ? this.#content?.querySelectorAll(`::part(${name})`)
                : this.#content?.querySelectorAll(`[part="${name}"]`);
        }
        attachShadow(init) {
            const shadow = super.attachShadow(init);
            // @ts-ignore closed IS assignable to shadowMode...
            this.shadowMode = init.mode;
            this.#content = shadow;
            return shadow;
        }
        get hasShadow() {
            return this.shadowMode !== 'none';
        }
        /*** CSS ***/
        get CSSSelector() {
            if (this.hasShadow || !this.hasAttribute("is"))
                return this.tagName;
            return `${this.tagName}[is="${this.getAttribute("is")}"]`;
        }
        // ============== Impl ===================
        constructor(...params) {
            super();
            this.#params = params;
            let { promise, resolve } = Promise.withResolvers();
            this.whenInitialized = promise;
            this.#whenInitialized_resolver = resolve;
            const base = __cstr_base;
            __cstr_base = null;
            if (base !== null) {
                this.#base = base;
                this.init(); // call the resolver
            }
            if ("_whenUpgradedResolve" in this)
                this._whenUpgradedResolve();
        }
        // ====================== DOM ===========================		
        disconnectedCallback() {
            if (this.base !== null)
                this.base.disconnectedCallback();
        }
        connectedCallback() {
            // TODO: life cycle options
            if (this.isInitialized) {
                this.base.connectedCallback();
                return;
            }
            // TODO: life cycle options
            if (this.state.isReady) {
                this.initialize(); // automatically calls onDOMConnected
                return;
            }
            (async () => {
                await this.state.isReady;
                if (!this.isInitialized)
                    this.initialize();
            })();
        }
        static observedAttributes = Liss.observedAttributes;
        attributeChangedCallback(name, oldValue, newValue) {
            if (this.#base)
                this.#base.attributeChangedCallback(name, oldValue, newValue);
        }
        shadowMode = null;
        get shadowRoot() {
            if (this.shadowMode === ShadowCfg.SEMIOPEN)
                return null;
            return super.shadowRoot;
        }
        init() {
            // no needs to set this.#content (already host or set when attachShadow)
            content_generator.generate(this);
            //@ts-ignore
            //this.#content.addEventListener('click', onClickEvent);
            //@ts-ignore
            //this.#content.addEventListener('dblclick', onClickEvent);
            if (this.#base === null) {
                // h4ck, okay because JS is monothreaded.
                setCstrHost(this);
                this.#base = new LISSHost.Base(...this.#params);
            }
            this.#whenInitialized_resolver(this.base);
            return this.base;
        }
    }
    ;
    return LISSHost;
}
//# sourceMappingURL=LISSHost.js.map