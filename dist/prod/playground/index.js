export const id = "playground";
export const ids = ["playground"];
export const modules = {

/***/ "./src/pages/playground/index.md":
/*!***************************************!*\
  !*** ./src/pages/playground/index.md ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "playground/index.html");

/***/ }),

/***/ "./src/pages/playground/index.ts":
/*!***************************************!*\
  !*** ./src/pages/playground/index.ts ***!
  \***************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _VSHS_pages_skeleton___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @VSHS/pages/skeleton/ */ "./src/pages/skeleton/index.ts");
/* harmony import */ var _VSHS_components_vshs_playground___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @VSHS/components/vshs-playground/ */ "./src/components/vshs-playground/index.ts");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_VSHS_pages_skeleton___WEBPACK_IMPORTED_MODULE_0__, _VSHS_components_vshs_playground___WEBPACK_IMPORTED_MODULE_1__]);
([_VSHS_pages_skeleton___WEBPACK_IMPORTED_MODULE_0__, _VSHS_components_vshs_playground___WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);


const examples = [
    "Hello World",
    "echo (url)",
    "echo (url search)",
    "echo (body)",
    "echo (json)",
    "echo (string)",
    "echo (URLSearchParams)",
    "echo (FormData)",
    "echo (Uint8Array)",
    "echo (Blob)",
    "echo (vars)",
    "response (json)",
    "response (string)",
    "response (URLSearchParams)",
    "response (FormData)",
    "response (Uint8Array)",
    "response (Blob)",
    "response (none)",
    "response (clone)",
    "response (redirect)",
    "response (status)",
    "response (throw response)",
    "response (error)",
    "response (stream)",
    "response (SSE)",
    "response (SSE Helper)",
    "response (WebSocket)",
    "response (headers)",
    "fetch (request)",
    "fetch (clone)",
    "fetch (read)",
    "fetch (SSE)"
];
// liss-playground
const playground = document.querySelector('vshs-playground');
function setExample(name) {
    selector.value = name;
    //playground.removeAttribute('show');
    playground.setAttribute('name', name);
}
// init server
const server = document.querySelector('input:not([type="checkbox"])');
const use_server = document.querySelector('input[type="checkbox"]');
function updateServer() {
    const use = use_server.checked;
    const value = server.value;
    if (!use || value === "") {
        playground.toggleAttribute('server', false);
        return;
    }
    playground.setAttribute('server', server.value);
}
server.addEventListener('change', updateServer);
use_server.addEventListener('change', updateServer);
updateServer();
// init select
const selector = document.querySelector('select');
//const webcomp_name = document.querySelector<HTMLInputElement>('input')!;
for (let example of examples)selector.append(new Option(example, example));
selector.addEventListener('change', ()=>{
    const url = new URL(location);
    url.searchParams.set("example", selector.value);
    history.pushState({}, "", url);
    setExample(selector.value);
});
// init current example
const searchParams = new URLSearchParams(location.search);
const example = searchParams.get('example');
setExample(example ?? selector.value);

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
;

// load runtime
import __webpack_require__ from "../skeleton/index.js";
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
import * as __webpack_chunk_0__ from "./index.js";
__webpack_require__.C(__webpack_chunk_0__);
__webpack_exec__("./src/pages/playground/index.ts");
var __webpack_exports__ = __webpack_exec__("./src/pages/playground/index.md");

//# sourceMappingURL=index.js.map