import { buildLISSHost, setCstrBase } from "./LISSHost";
import ContentGenerator from "./ContentGenerator";
let __cstr_host = null;
export function setCstrHost(_) {
    __cstr_host = _;
}
export function LISS(args = {}) {
    let { 
    /* extends is a JS reserved keyword. */
    extends: _extends = Object, host = HTMLElement, content_generator = ContentGenerator, } = args;
    class LISSBase extends _extends {
        constructor(...args) {
            super(...args);
            // h4ck, okay because JS is monothreaded.
            if (__cstr_host === null) {
                setCstrBase(this);
                __cstr_host = new this.constructor.Host(...args);
            }
            this.#host = __cstr_host;
            __cstr_host = null;
        }
        //TODO: do I really need to expose such structure here ?
        static get state() {
            return this.Host.state;
        }
        get state() {
            return this.#host.state;
        }
        //TODO: get the real type ?
        get content() {
            try {
                this.#host.content;
            }
            catch (e) {
                console.warn(e);
            }
            return this.#host.content;
        }
        static observedAttributes = [];
        attributeChangedCallback(name, oldValue, newValue) { }
        connectedCallback() { }
        disconnectedCallback() { }
        get isConnected() {
            return this.host.isConnected;
        }
        #host;
        get host() {
            return this.#host;
        }
        static _Host;
        static get Host() {
            if (this._Host === undefined) {
                // @ts-ignore: fuck off.
                this._Host = buildLISSHost(this, host, content_generator, args);
            }
            return this._Host;
        }
    }
    return LISSBase;
}
//# sourceMappingURL=LISSBase.js.map