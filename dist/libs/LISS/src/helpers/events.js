export class EventTarget2 extends EventTarget {
    addEventListener(type, callback, options) {
        //@ts-ignore
        return super.addEventListener(type, callback, options);
    }
    dispatchEvent(event) {
        return super.dispatchEvent(event);
    }
    removeEventListener(type, listener, options) {
        //@ts-ignore
        super.removeEventListener(type, listener, options);
    }
}
export class CustomEvent2 extends CustomEvent {
    constructor(type, args) {
        super(type, { detail: args });
    }
    get type() { return super.type; }
}
export function WithEvents(ev, _events) {
    if (!(ev instanceof EventTarget))
        return ev;
    // is also a mixin
    // @ts-ignore
    class EventTargetMixins extends ev {
        #ev = new EventTarget2();
        addEventListener(...args) {
            // @ts-ignore
            return this.#ev.addEventListener(...args);
        }
        removeEventListener(...args) {
            // @ts-ignore
            return this.#ev.removeEventListener(...args);
        }
        dispatchEvent(...args) {
            // @ts-ignore
            return this.#ev.dispatchEvent(...args);
        }
    }
    return EventTargetMixins;
}
// ================================================
// =============== LISS ShadowRoot tools ==========
// ================================================
export function eventMatches(ev, selector) {
    let elements = ev.composedPath().slice(0, -2).filter(e => !(e instanceof ShadowRoot)).reverse();
    for (let elem of elements)
        if (elem.matches(selector))
            return elem;
    return null;
}
//# sourceMappingURL=events.js.map