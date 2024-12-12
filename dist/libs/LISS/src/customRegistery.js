import { _element2tagname } from "./utils";
// Go to state DEFINED
export function define(tagname, ComponentClass) {
    let Host = ComponentClass;
    // Brython class
    let bry_class = null;
    if ("$is_class" in ComponentClass) {
        bry_class = ComponentClass;
        ComponentClass = bry_class.__bases__.filter((e) => e.__name__ === "Wrapper")[0]._js_klass.$js_func;
        ComponentClass.Host.Base = class {
            #bry;
            constructor() {
                // @ts-ignore
                this.#bry = __BRYTHON__.$call(bry_class, [0, 0, 0])();
            }
            #call(name, args) {
                // @ts-ignore
                __BRYTHON__.$call(__BRYTHON__.$getattr_pep657(this.#bry, name, [0, 0, 0]), [0, 0, 0])(...args);
            }
            connectedCallback(...args) {
                return this.#call("connectedCallback", args);
            }
            disconnectedCallback(...args) {
                return this.#call("disconnectedCallback", args);
            }
        };
    }
    if ("Host" in ComponentClass)
        Host = ComponentClass.Host;
    const Class = Host.Cfg.host;
    let htmltag = _element2tagname(Class) ?? undefined;
    const opts = htmltag === undefined ? {}
        : { extends: htmltag };
    customElements.define(tagname, Host, opts);
}
;
export async function whenDefined(tagname) {
    return await customElements.whenDefined(tagname);
}
export async function whenAllDefined(tagnames) {
    await Promise.all(tagnames.map(t => customElements.whenDefined(t)));
}
export function isDefined(name) {
    return customElements.get(name) !== undefined;
}
export function getName(element) {
    if ("Host" in element.constructor)
        element = element.constructor.Host;
    if ("Host" in element)
        // @ts-ignore
        element = element.Host;
    if ("Base" in element.constructor)
        element = element.constructor;
    if ("Base" in element) {
        const name = customElements.getName(element);
        if (name === null)
            throw new Error("not defined!");
        return name;
    }
    if (!(element instanceof Element))
        throw new Error('???');
    const name = element.getAttribute('is') ?? element.tagName.toLowerCase();
    if (!name.includes('-'))
        throw new Error(`Element ${name} is not a WebComponent`);
    return name;
}
export function getHostCstr(name) {
    return customElements.get(name);
}
export function getBaseCstr(name) {
    return getHostCstr(name).Base;
}
//# sourceMappingURL=customRegistery.js.map