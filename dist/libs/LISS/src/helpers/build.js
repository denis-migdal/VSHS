import { initialize, initializeSync } from "../state";
import { html } from "../utils";
export async function liss(str, ...args) {
    const elem = html(str, ...args);
    if (elem instanceof DocumentFragment)
        throw new Error(`Multiple HTMLElement given!`);
    return await initialize(elem);
}
export function lissSync(str, ...args) {
    const elem = html(str, ...args);
    if (elem instanceof DocumentFragment)
        throw new Error(`Multiple HTMLElement given!`);
    return initializeSync(elem);
}
//# sourceMappingURL=build.js.map