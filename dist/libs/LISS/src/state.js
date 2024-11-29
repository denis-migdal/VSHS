import { getHostCstr, getName } from "./customRegistery";
import { isDOMContentLoaded, whenDOMContentLoaded } from "./utils";
var State;
(function (State) {
    State[State["NONE"] = 0] = "NONE";
    // class
    State[State["DEFINED"] = 1] = "DEFINED";
    State[State["READY"] = 2] = "READY";
    // instance
    State[State["UPGRADED"] = 4] = "UPGRADED";
    State[State["INITIALIZED"] = 8] = "INITIALIZED";
})(State || (State = {}));
export const DEFINED = State.DEFINED;
export const READY = State.READY;
export const UPGRADED = State.UPGRADED;
export const INITIALIZED = State.INITIALIZED;
export class LISSState {
    #elem;
    // if null : class state, else instance state
    constructor(elem = null) {
        this.#elem = elem;
    }
    static DEFINED = DEFINED;
    static READY = READY;
    static UPGRADED = UPGRADED;
    static INITIALIZED = INITIALIZED;
    is(state) {
        if (this.#elem === null)
            throw new Error("not supported yet");
        const elem = this.#elem;
        if (state & DEFINED && !this.isDefined)
            return false;
        if (state & READY && !this.isReady)
            return false;
        if (state & UPGRADED && !this.isUpgraded)
            return false;
        if (state & INITIALIZED && !this.isInitialized)
            return false;
        return true;
    }
    async when(state) {
        if (this.#elem === null)
            throw new Error("not supported yet");
        const elem = this.#elem;
        let promises = new Array();
        if (state & DEFINED)
            promises.push(this.whenDefined());
        if (state & READY)
            promises.push(this.whenReady());
        if (state & UPGRADED)
            promises.push(this.whenUpgraded());
        if (state & INITIALIZED)
            promises.push(this.whenInitialized());
        await Promise.all(promises);
    }
    // ================== DEFINED ==============================
    get isDefined() {
        if (this.#elem === null)
            throw new Error('not implemented');
        return customElements.get(getName(this.#elem)) !== undefined;
    }
    async whenDefined() {
        if (this.#elem === null)
            throw new Error('not implemented');
        return await customElements.whenDefined(getName(this.#elem));
    }
    // ================== READY ==============================
    get isReady() {
        if (this.#elem === null)
            throw new Error('not implemented');
        const elem = this.#elem;
        if (!this.isDefined)
            return false;
        const Host = getHostCstr(getName(elem));
        if (!isDOMContentLoaded())
            return false;
        return Host.isDepsResolved;
    }
    async whenReady() {
        if (this.#elem === null)
            throw new Error('not implemented');
        const elem = this.#elem;
        const host = await this.whenDefined(); // could be ready before defined, but well...
        await whenDOMContentLoaded;
        await host.whenDepsResolved;
    }
    // ================== UPGRADED ==============================
    get isUpgraded() {
        if (this.#elem === null)
            throw new Error("not supported yet");
        const elem = this.#elem;
        if (!this.isDefined)
            return false;
        const host = getHostCstr(getName(elem));
        return elem instanceof host;
    }
    async whenUpgraded() {
        if (this.#elem === null)
            throw new Error("not supported yet");
        const elem = this.#elem;
        const host = await this.whenDefined();
        if (elem instanceof host)
            return elem;
        // h4ck
        if ("_whenUpgraded" in elem) {
            await elem._whenUpgraded;
            return elem;
        }
        const { promise, resolve } = Promise.withResolvers();
        elem._whenUpgraded = promise;
        elem._whenUpgradedResolve = resolve;
        await promise;
        return elem;
    }
    // ================== INITIALIZED ==============================
    get isInitialized() {
        if (this.#elem === null)
            throw new Error("not supported yet");
        const elem = this.#elem;
        if (!this.isUpgraded)
            return false;
        return "isInitialized" in elem && elem.isInitialized;
    }
    async whenInitialized() {
        if (this.#elem === null)
            throw new Error("not supported yet");
        const elem = this.#elem;
        const host = await this.whenUpgraded();
        await host.whenInitialized;
        return elem.base;
    }
    // ================== CONVERSIONS ==============================
    valueOf() {
        if (this.#elem === null)
            throw new Error("not supported yet");
        let state = 0;
        if (this.isDefined)
            state |= DEFINED;
        if (this.isReady)
            state |= READY;
        if (this.isUpgraded)
            state |= UPGRADED;
        if (this.isInitialized)
            state |= INITIALIZED;
        return state;
    }
    toString() {
        const state = this.valueOf();
        let is = new Array();
        if (state & DEFINED)
            is.push("DEFINED");
        if (state & READY)
            is.push("READY");
        if (state & UPGRADED)
            is.push("UPGRADED");
        if (state & INITIALIZED)
            is.push("INITIALIZED");
        return is.join('|');
    }
}
export function getState(elem) {
    if ("state" in elem)
        return elem.state;
    return elem.state = new LISSState(elem);
}
// ================== State modifiers (move?) ==============================
// Go to state UPGRADED
export async function upgrade(elem, strict = false) {
    const state = getState(elem);
    if (state.isUpgraded && strict)
        throw new Error(`Already upgraded!`);
    await state.whenDefined();
    return upgradeSync(elem);
}
export function upgradeSync(elem, strict = false) {
    const state = getState(elem);
    if (state.isUpgraded && strict)
        throw new Error(`Already upgraded!`);
    if (!state.isDefined)
        throw new Error('Element not defined!');
    if (elem.ownerDocument !== document)
        document.adoptNode(elem);
    customElements.upgrade(elem);
    const Host = getHostCstr(getName(elem));
    if (!(elem instanceof Host))
        throw new Error(`Element didn't upgrade!`);
    return elem;
}
// Go to state INITIALIZED
export async function initialize(elem, strict = false) {
    const state = getState(elem);
    if (state.isInitialized) {
        if (strict === false)
            return elem.base;
        throw new Error(`Already initialized!`);
    }
    const host = await upgrade(elem);
    await state.whenReady();
    let params = typeof strict === "boolean" ? [] : strict;
    host.initialize(...params);
    return host.base;
}
export function initializeSync(elem, strict = false) {
    const state = getState(elem);
    if (state.isInitialized) {
        if (strict === false)
            return elem.base;
        throw new Error(`Already initialized!`);
    }
    const host = upgradeSync(elem);
    if (!state.isReady)
        throw new Error("Element not ready !");
    let params = typeof strict === "boolean" ? [] : strict;
    host.initialize(...params);
    return host.base;
}
// ====================== external WHEN ======================================
export async function whenUpgraded(elem, force = false, strict = false) {
    const state = getState(elem);
    if (force)
        return await upgrade(elem, strict);
    return await state.whenUpgraded();
}
export async function whenInitialized(elem, force = false, strict = false) {
    const state = getState(elem);
    if (force)
        return await initialize(elem, strict);
    return await state.whenInitialized();
}
//# sourceMappingURL=state.js.map