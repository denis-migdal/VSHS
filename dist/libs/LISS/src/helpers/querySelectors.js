import { initializeSync, whenInitialized } from "../state";
;
import LISS from "../extends";
function liss_selector(name) {
    if (name === undefined) // just an h4ck
        return "";
    return `:is(${name}, [is="${name}"])`;
}
function _buildQS(selector, tagname_or_parent, parent = document) {
    if (tagname_or_parent !== undefined && typeof tagname_or_parent !== 'string') {
        parent = tagname_or_parent;
        tagname_or_parent = undefined;
    }
    return [`${selector}${liss_selector(tagname_or_parent)}`, parent];
}
async function qs(selector, tagname_or_parent, parent = document) {
    [selector, parent] = _buildQS(selector, tagname_or_parent, parent);
    let result = await qso(selector, parent);
    if (result === null)
        throw new Error(`Element ${selector} not found`);
    return result;
}
async function qso(selector, tagname_or_parent, parent = document) {
    [selector, parent] = _buildQS(selector, tagname_or_parent, parent);
    const element = parent.querySelector(selector);
    if (element === null)
        return null;
    return await whenInitialized(element);
}
async function qsa(selector, tagname_or_parent, parent = document) {
    [selector, parent] = _buildQS(selector, tagname_or_parent, parent);
    const elements = parent.querySelectorAll(selector);
    let idx = 0;
    const promises = new Array(elements.length);
    for (let element of elements)
        promises[idx++] = whenInitialized(element);
    return await Promise.all(promises);
}
async function qsc(selector, tagname_or_parent, element) {
    const res = _buildQS(selector, tagname_or_parent, element);
    const result = res[1].closest(res[0]);
    if (result === null)
        return null;
    return await whenInitialized(result);
}
function qsSync(selector, tagname_or_parent, parent = document) {
    [selector, parent] = _buildQS(selector, tagname_or_parent, parent);
    const element = parent.querySelector(selector);
    if (element === null)
        throw new Error(`Element ${selector} not found`);
    return initializeSync(element);
}
function qsaSync(selector, tagname_or_parent, parent = document) {
    [selector, parent] = _buildQS(selector, tagname_or_parent, parent);
    const elements = parent.querySelectorAll(selector);
    let idx = 0;
    const result = new Array(elements.length);
    for (let element of elements)
        result[idx++] = initializeSync(element);
    return result;
}
function qscSync(selector, tagname_or_parent, element) {
    const res = _buildQS(selector, tagname_or_parent, element);
    const result = res[1].closest(res[0]);
    if (result === null)
        return null;
    return initializeSync(result);
}
// ==================
function closest(selector, element) {
    while (true) {
        var result = element.closest(selector);
        if (result !== null)
            return result;
        const root = element.getRootNode();
        if (!("host" in root))
            return null;
        element = root.host;
    }
}
// async
LISS.qs = qs;
LISS.qso = qso;
LISS.qsa = qsa;
LISS.qsc = qsc;
// sync
LISS.qsSync = qsSync;
LISS.qsaSync = qsaSync;
LISS.qscSync = qscSync;
LISS.closest = closest;
//# sourceMappingURL=querySelectors.js.map