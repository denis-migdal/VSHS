import { LISS as _LISS } from "./LISSBase";
import { buildLISSHost } from "./LISSHost";
// used for plugins.
export class ILISS {
}
export default LISS;
export function LISS(opts = {}) {
    if (opts.extends !== undefined && "Host" in opts.extends) // we assume this is a LISSBaseCstr
        return _extends(opts);
    return _LISS(opts);
}
export function _extends(opts) {
    if (opts.extends === undefined) // h4ck
        throw new Error('please provide a LISSBase!');
    const cfg = opts.extends.Host.Cfg;
    opts = Object.assign({}, opts, cfg, cfg.args);
    class ExtendedLISS extends opts.extends {
        constructor(...args) {
            super(...args);
        }
        static _Host;
        // TS is stupid, requires explicit return type
        static get Host() {
            if (this._Host === undefined)
                // @ts-ignore fuck off
                this._Host = buildLISSHost(this, opts.host, opts.content_generator, 
                // @ts-ignore
                opts);
            return this._Host;
        }
    }
    return ExtendedLISS;
}
//# sourceMappingURL=extends.js.map