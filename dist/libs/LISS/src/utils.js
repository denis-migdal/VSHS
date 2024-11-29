// functions required by LISS.
// from https://stackoverflow.com/questions/51000461/html-element-tag-name-from-constructor
const elementNameLookupTable = {
    'UList': 'ul',
    'TableCaption': 'caption',
    'TableCell': 'td', // th
    'TableCol': 'col', //'colgroup',
    'TableRow': 'tr',
    'TableSection': 'tbody', //['thead', 'tbody', 'tfoot'],
    'Quote': 'q',
    'Paragraph': 'p',
    'OList': 'ol',
    'Mod': 'ins', //, 'del'],
    'Media': 'video', // 'audio'],
    'Image': 'img',
    'Heading': 'h1', //, 'h2', 'h3', 'h4', 'h5', 'h6'],
    'Directory': 'dir',
    'DList': 'dl',
    'Anchor': 'a'
};
export function _element2tagname(Class) {
    if (Class instanceof HTMLElement)
        Class = Class.constructor;
    if (Class === HTMLElement)
        return null;
    let cursor = Class;
    // @ts-ignore
    while (cursor.__proto__ !== HTMLElement)
        // @ts-ignore
        cursor = cursor.__proto__;
    // directly inherit HTMLElement
    if (!cursor.name.startsWith('HTML') && !cursor.name.endsWith('Element'))
        return null;
    const htmltag = cursor.name.slice(4, -7);
    return elementNameLookupTable[htmltag] ?? htmltag.toLowerCase();
}
// https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
const CAN_HAVE_SHADOW = [
    null, 'article', 'aside', 'blockquote', 'body', 'div',
    'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'main',
    'nav', 'p', 'section', 'span'
];
export function isShadowSupported(tag) {
    return CAN_HAVE_SHADOW.includes(_element2tagname(tag));
}
export function isDOMContentLoaded() {
    return document.readyState === "interactive" || document.readyState === "complete";
}
export const whenDOMContentLoaded = waitDOMContentLoaded();
export async function waitDOMContentLoaded() {
    if (isDOMContentLoaded())
        return;
    const { promise, resolve } = Promise.withResolvers();
    document.addEventListener('DOMContentLoaded', () => {
        resolve();
    }, true);
    await promise;
}
// for mixins.
/*
export type ComposeConstructor<T, U> =
    [T, U] extends [new (a: infer O1) => infer R1,new (a: infer O2) => infer R2] ? {
        new (o: O1 & O2): R1 & R2
    } & Pick<T, keyof T> & Pick<U, keyof U> : never
*/
// moved here instead of build to prevent circular deps.
export function html(str, ...args) {
    let string = str[0];
    for (let i = 0; i < args.length; ++i) {
        string += `${args[i]}`;
        string += `${str[i + 1]}`;
        //TODO: more pre-processes
    }
    // using template prevents CustomElements upgrade...
    let template = document.createElement('template');
    // Never return a text node of whitespace as the result
    template.innerHTML = string.trim();
    if (template.content.childNodes.length === 1 && template.content.firstChild.nodeType !== Node.TEXT_NODE)
        return template.content.firstChild;
    return template.content;
}
//# sourceMappingURL=utils.js.map