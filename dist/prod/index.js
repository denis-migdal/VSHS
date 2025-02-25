/******/ var __webpack_modules__ = ({

/***/ "./src/Fake/EventSource.ts":
/*!*********************************!*\
  !*** ./src/Fake/EventSource.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getFakeEventSource: () => (/* binding */ getFakeEventSource)
/* harmony export */ });
const EventSource = globalThis.EventSource;
function getFakeEventSource(use_server) {
    if (use_server) return class EventSourceServer extends EventSource {
        constructor(url){
            super(`${use_server}${url}`);
        }
    };
    return EventSourceFake;
}
// @ts-ignore
class EventSourceFake extends EventTarget {
    constructor(url){
        super();
        this.url = url;
        globalThis.fetch(url).then(async (response)=>{
            this.readyState = this.OPEN;
            this.dispatchEvent(new Event("open"));
            const reader = response.body.pipeThrough(new TextDecoderStream).getReader();
            let buffer = "";
            let chunk = await reader.read();
            while(!chunk.done){
                buffer += chunk.value;
                let pos = buffer.indexOf("\n\n");
                while(pos !== -1){
                    let event = buffer.slice(0, pos);
                    const data = Object.fromEntries(event.split("\n").map((l)=>l.split(": ")));
                    data.event ??= "message";
                    this.dispatchEvent(new MessageEvent(data.event, {
                        data: data.data
                    }));
                    buffer = buffer.slice(pos + 2);
                    pos = buffer.indexOf("\n\n");
                }
                chunk = await reader.read();
            }
        });
    }
    onerror = null;
    onmessage = null;
    onopen = null;
    close() {
        this.readyState = this.CLOSED;
    }
    readyState = 0;
    CONNECTING = 0;
    OPEN = 1;
    CLOSED = 2;
    // not implemented
    url;
    withCredentials = false;
}


/***/ }),

/***/ "./src/Fake/WebSocket.ts":
/*!*******************************!*\
  !*** ./src/Fake/WebSocket.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getFakeWebSocket: () => (/* binding */ getFakeWebSocket)
/* harmony export */ });
const WebSocket = globalThis.WebSocket;
function getFakeWebSocket(use_server) {
    if (use_server) return class WebSocketServer extends WebSocket {
        constructor(url){
            super(`${use_server}${url}`);
        }
    };
    return WebSocketFake;
}
// @ts-ignore
globalThis.Deno = {
    upgradeWebSocket: function(request) {
        const socket = new WebSocketFake(null);
        const response = new Response();
        response.websocket = socket;
        return {
            socket,
            response
        };
    }
};
//TODO implemente Deno.upgrade => return fake Response + ServerWebSocket...
class WebSocketFake extends EventTarget {
    other = null;
    constructor(url){
        super();
        if (url === null) return;
        this.url = url;
        globalThis.fetch(url).then(async (response)=>{
            this.other = response.websocket;
            this.other.other = this;
            this.readyState = this.OPEN;
            this.dispatchEvent(new Event("open"));
            this.other.dispatchEvent(new Event("open"));
        });
    }
    close(code, reason) {
        this.readyState = this.CLOSED;
        let event = {};
        if (code !== undefined) event.code = code;
        if (reason !== undefined) event.reason = reason;
        this.other.dispatchEvent(new CloseEvent("close", event));
        this.dispatchEvent(new CloseEvent("close", event));
    }
    send(data) {
        this.other.dispatchEvent(new MessageEvent("message", {
            data
        }));
    }
    url = "";
    onclose = null;
    onerror = null;
    onmessage = null;
    onopen = null;
    readyState = 0;
    CONNECTING = 0;
    OPEN = 1;
    CLOSING = 2;
    CLOSED = 3;
    // not implemented
    binaryType = "arraybuffer";
    bufferedAmount = 0;
    extensions = "";
    protocol = "";
}


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getFakeEventSource: () => (/* reexport safe */ _Fake_EventSource__WEBPACK_IMPORTED_MODULE_0__.getFakeEventSource),
/* harmony export */   getFakeWebSocket: () => (/* reexport safe */ _Fake_WebSocket__WEBPACK_IMPORTED_MODULE_1__.getFakeWebSocket)
/* harmony export */ });
/* harmony import */ var _Fake_EventSource__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Fake/EventSource */ "./src/Fake/EventSource.ts");
/* harmony import */ var _Fake_WebSocket__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Fake/WebSocket */ "./src/Fake/WebSocket.ts");



})();


//# sourceMappingURL=index.js.map