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
/* empty/unused harmony star reexport */
/* empty/unused harmony star reexport */
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getFakeEventSource: () => (/* reexport safe */ _Fake_EventSource__WEBPACK_IMPORTED_MODULE_1__.getFakeEventSource),
/* harmony export */   getFakeWebSocket: () => (/* reexport safe */ _Fake_WebSocket__WEBPACK_IMPORTED_MODULE_2__.getFakeWebSocket)
/* harmony export */ });
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../VSHS'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
/* harmony import */ var _Fake_EventSource__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Fake/EventSource */ "./src/Fake/EventSource.ts");
/* harmony import */ var _Fake_WebSocket__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Fake/WebSocket */ "./src/Fake/WebSocket.ts");




})();

var __webpack_exports__getFakeEventSource = __webpack_exports__.getFakeEventSource;
var __webpack_exports__getFakeWebSocket = __webpack_exports__.getFakeWebSocket;
export { __webpack_exports__getFakeEventSource as getFakeEventSource, __webpack_exports__getFakeWebSocket as getFakeWebSocket };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QyxXQUF5QixHQUFHO0FBQ2hDOzs7Ozs7O1NDM0ZBO1NBQ0E7O1NBRUE7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7O1NBRUE7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7Ozs7O1VDdEJBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EseUNBQXlDLHdDQUF3QztVQUNqRjtVQUNBO1VBQ0E7Ozs7O1VDUEE7Ozs7O1VDQUE7VUFDQTtVQUNBO1VBQ0EsdURBQXVELGlCQUFpQjtVQUN4RTtVQUNBLGdEQUFnRCxhQUFhO1VBQzdEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ04wQztBQUNZO0FBQ0oiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9WU0hTLy4vc3JjL0Zha2UvRXZlbnRTb3VyY2UudHMiLCJ3ZWJwYWNrOi8vVlNIUy8uL3NyYy9GYWtlL1dlYlNvY2tldC50cyIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL1ZTSFMvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9WU0hTL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vVlNIUy8uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBFdmVudFNvdXJjZSA9IGdsb2JhbFRoaXMuRXZlbnRTb3VyY2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWtlRXZlbnRTb3VyY2UodXNlX3NlcnZlcjogc3RyaW5nfG51bGwpIHtcblxuICAgIGlmKCB1c2Vfc2VydmVyIClcbiAgICAgICAgcmV0dXJuIGNsYXNzIEV2ZW50U291cmNlU2VydmVyIGV4dGVuZHMgRXZlbnRTb3VyY2Uge1xuICAgICAgICAgICAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBzdXBlcihgJHt1c2Vfc2VydmVyfSR7dXJsfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICByZXR1cm4gRXZlbnRTb3VyY2VGYWtlO1xufVxuXG4vLyBAdHMtaWdub3JlXG5jbGFzcyBFdmVudFNvdXJjZUZha2UgZXh0ZW5kcyBFdmVudFRhcmdldCBpbXBsZW1lbnRzIEV2ZW50U291cmNlIHtcbiAgICBjb25zdHJ1Y3Rvcih1cmw6IHN0cmluZykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcblxuICAgICAgICBnbG9iYWxUaGlzLmZldGNoKHVybCkudGhlbiggYXN5bmMgKHJlc3BvbnNlKSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IHRoaXMuT1BFTjtcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCggbmV3IEV2ZW50KFwib3BlblwiKSApO1xuXG4gICAgICAgICAgICBjb25zdCByZWFkZXIgPSByZXNwb25zZS5ib2R5IS5waXBlVGhyb3VnaChuZXcgVGV4dERlY29kZXJTdHJlYW0pLmdldFJlYWRlcigpO1xuXG4gICAgICAgICAgICBsZXQgYnVmZmVyID0gXCJcIjtcbiAgICAgICAgICAgIGxldCBjaHVuayA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG5cbiAgICAgICAgICAgIHdoaWxlKCAhIGNodW5rLmRvbmUgKSB7XG5cbiAgICAgICAgICAgICAgICBidWZmZXIgKz0gY2h1bmsudmFsdWUhO1xuXG4gICAgICAgICAgICAgICAgbGV0IHBvcyA9IGJ1ZmZlci5pbmRleE9mKFwiXFxuXFxuXCIpO1xuICAgICAgICAgICAgICAgIHdoaWxlKCBwb3MgIT09IC0xKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IGV2ZW50ID0gYnVmZmVyLnNsaWNlKDAsIHBvcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IE9iamVjdC5mcm9tRW50cmllcyggZXZlbnQuc3BsaXQoXCJcXG5cIikubWFwKCBsID0+IGwuc3BsaXQoXCI6IFwiKSApICk7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YS5ldmVudCA/Pz0gXCJtZXNzYWdlXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCBuZXcgTWVzc2FnZUV2ZW50KGRhdGEuZXZlbnQsIHtkYXRhOiBkYXRhLmRhdGF9KSApXG5cbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gYnVmZmVyLnNsaWNlKHBvcyArIDIpO1xuICAgICAgICAgICAgICAgICAgICBwb3MgPSBidWZmZXIuaW5kZXhPZihcIlxcblxcblwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjaHVuayA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBvbmVycm9yICA6ICgodGhpczogRXZlbnRTb3VyY2UsIGV2OiBFdmVudCAgICAgICApID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgICBvbm1lc3NhZ2U6ICgodGhpczogRXZlbnRTb3VyY2UsIGV2OiBNZXNzYWdlRXZlbnQpID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgICBvbm9wZW4gICA6ICgodGhpczogRXZlbnRTb3VyY2UsIGV2OiBFdmVudCAgICAgICApID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgICBjbG9zZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gdGhpcy5DTE9TRUQ7XG4gICAgfVxuXG4gICAgcmVhZHlTdGF0ZTogbnVtYmVyID0gMDtcblxuICAgIHJlYWRvbmx5IENPTk5FQ1RJTkcgPSAwO1xuICAgIHJlYWRvbmx5IE9QRU4gPSAxO1xuICAgIHJlYWRvbmx5IENMT1NFRCA9IDI7XG5cbiAgICAvLyBub3QgaW1wbGVtZW50ZWRcbiAgICB1cmw6IHN0cmluZztcbiAgICB3aXRoQ3JlZGVudGlhbHM6IGJvb2xlYW4gPSBmYWxzZTtcbn0iLCJjb25zdCBXZWJTb2NrZXQgPSBnbG9iYWxUaGlzLldlYlNvY2tldDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZha2VXZWJTb2NrZXQodXNlX3NlcnZlcjogc3RyaW5nfG51bGwpIHtcblxuICAgIGlmKCB1c2Vfc2VydmVyIClcbiAgICAgICAgcmV0dXJuIGNsYXNzIFdlYlNvY2tldFNlcnZlciBleHRlbmRzIFdlYlNvY2tldCB7XG4gICAgICAgICAgICBjb25zdHJ1Y3Rvcih1cmw6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHN1cGVyKGAke3VzZV9zZXJ2ZXJ9JHt1cmx9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIHJldHVybiBXZWJTb2NrZXRGYWtlO1xufVxuXG5nbG9iYWxUaGlzLkRlbm8gPSB7XG4gICAgdXBncmFkZVdlYlNvY2tldDogZnVuY3Rpb24ocmVxdWVzdDogUmVxdWVzdCkge1xuXG4gICAgICAgIGNvbnN0IHNvY2tldCAgID0gbmV3IFdlYlNvY2tldEZha2UobnVsbCk7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKCk7XG5cbiAgICAgICAgKHJlc3BvbnNlIGFzIGFueSkud2Vic29ja2V0ID0gc29ja2V0O1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzb2NrZXQsXG4gICAgICAgICAgICByZXNwb25zZVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vL1RPRE8gaW1wbGVtZW50ZSBEZW5vLnVwZ3JhZGUgPT4gcmV0dXJuIGZha2UgUmVzcG9uc2UgKyBTZXJ2ZXJXZWJTb2NrZXQuLi5cblxuY2xhc3MgV2ViU29ja2V0RmFrZSBleHRlbmRzIEV2ZW50VGFyZ2V0IGltcGxlbWVudHMgV2ViU29ja2V0IHtcblxuICAgIG90aGVyOiBXZWJTb2NrZXRGYWtlfG51bGwgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IodXJsOiBzdHJpbmd8bnVsbCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGlmKCB1cmwgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG5cbiAgICAgICAgZ2xvYmFsVGhpcy5mZXRjaCh1cmwpLnRoZW4oIGFzeW5jIChyZXNwb25zZSkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLm90aGVyID0gKHJlc3BvbnNlIGFzIGFueSkud2Vic29ja2V0O1xuICAgICAgICAgICAgdGhpcy5vdGhlciEub3RoZXIgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSB0aGlzLk9QRU47XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoIG5ldyBFdmVudChcIm9wZW5cIikgKTtcbiAgICAgICAgICAgIHRoaXMub3RoZXIhLmRpc3BhdGNoRXZlbnQoIG5ldyBFdmVudChcIm9wZW5cIikgKTtcblxuICAgICAgICB9KTtcblxuXG4gICAgfVxuXG4gICAgY2xvc2UoY29kZT86IG51bWJlciwgcmVhc29uPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IHRoaXMuQ0xPU0VEO1xuICAgICAgICBsZXQgZXZlbnQ6IENsb3NlRXZlbnRJbml0ID0ge307XG4gICAgICAgIGlmKCBjb2RlICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBldmVudC5jb2RlID0gY29kZTtcbiAgICAgICAgaWYoIHJlYXNvbiAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgZXZlbnQucmVhc29uID0gcmVhc29uO1xuXG4gICAgICAgIHRoaXMub3RoZXIhLmRpc3BhdGNoRXZlbnQoIG5ldyBDbG9zZUV2ZW50KFwiY2xvc2VcIiwgZXZlbnQpICk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCggbmV3IENsb3NlRXZlbnQoXCJjbG9zZVwiLCBldmVudCkgKTtcbiAgICB9XG4gICAgc2VuZChkYXRhOiBzdHJpbmcgfCBBcnJheUJ1ZmZlckxpa2UgfCBCbG9iIHwgQXJyYXlCdWZmZXJWaWV3KTogdm9pZCB7XG4gICAgICAgIHRoaXMub3RoZXIhLmRpc3BhdGNoRXZlbnQobmV3IE1lc3NhZ2VFdmVudChcIm1lc3NhZ2VcIiwge2RhdGF9KSk7XG4gICAgfVxuXG4gICAgdXJsOiBzdHJpbmcgPSBcIlwiO1xuICAgIFxuICAgIG9uY2xvc2UgIDogKCh0aGlzOiBXZWJTb2NrZXQsIGV2OiBDbG9zZUV2ZW50ICApID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgICBvbmVycm9yICA6ICgodGhpczogV2ViU29ja2V0LCBldjogRXZlbnQgICAgICAgKSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG4gICAgb25tZXNzYWdlOiAoKHRoaXM6IFdlYlNvY2tldCwgZXY6IE1lc3NhZ2VFdmVudCkgPT4gYW55KSB8IG51bGwgPSBudWxsO1xuICAgIG9ub3BlbiAgIDogKCh0aGlzOiBXZWJTb2NrZXQsIGV2OiBFdmVudCAgICAgICApID0+IGFueSkgfCBudWxsID0gbnVsbDtcblxuICAgIHJlYWR5U3RhdGU6IG51bWJlciA9IDA7XG5cbiAgICByZWFkb25seSBDT05ORUNUSU5HID0gMDtcbiAgICByZWFkb25seSBPUEVOICAgICAgID0gMTtcbiAgICByZWFkb25seSBDTE9TSU5HICAgID0gMjtcbiAgICByZWFkb25seSBDTE9TRUQgICAgID0gMztcblxuICAgIC8vIG5vdCBpbXBsZW1lbnRlZFxuICAgIGJpbmFyeVR5cGU6IEJpbmFyeVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4gICAgYnVmZmVyZWRBbW91bnQ6IG51bWJlciA9IDA7XG4gICAgZXh0ZW5zaW9uczogc3RyaW5nICAgICA9IFwiXCI7XG4gICAgcHJvdG9jb2w6IHN0cmluZyAgICAgICA9IFwiXCI7XG59IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJleHBvcnQge3BhdGgycmVnZXgsIG1hdGNofSBmcm9tIFwiLi4vVlNIU1wiO1xuZXhwb3J0IHtnZXRGYWtlRXZlbnRTb3VyY2V9IGZyb20gXCIuL0Zha2UvRXZlbnRTb3VyY2VcIjtcbmV4cG9ydCB7Z2V0RmFrZVdlYlNvY2tldH0gZnJvbSBcIi4vRmFrZS9XZWJTb2NrZXRcIjsiXSwibmFtZXMiOlsiRXZlbnRTb3VyY2UiLCJnbG9iYWxUaGlzIiwiZ2V0RmFrZUV2ZW50U291cmNlIiwidXNlX3NlcnZlciIsIkV2ZW50U291cmNlU2VydmVyIiwiY29uc3RydWN0b3IiLCJ1cmwiLCJFdmVudFNvdXJjZUZha2UiLCJFdmVudFRhcmdldCIsImZldGNoIiwidGhlbiIsInJlc3BvbnNlIiwicmVhZHlTdGF0ZSIsIk9QRU4iLCJkaXNwYXRjaEV2ZW50IiwiRXZlbnQiLCJyZWFkZXIiLCJib2R5IiwicGlwZVRocm91Z2giLCJUZXh0RGVjb2RlclN0cmVhbSIsImdldFJlYWRlciIsImJ1ZmZlciIsImNodW5rIiwicmVhZCIsImRvbmUiLCJ2YWx1ZSIsInBvcyIsImluZGV4T2YiLCJldmVudCIsInNsaWNlIiwiZGF0YSIsIk9iamVjdCIsImZyb21FbnRyaWVzIiwic3BsaXQiLCJtYXAiLCJsIiwiTWVzc2FnZUV2ZW50Iiwib25lcnJvciIsIm9ubWVzc2FnZSIsIm9ub3BlbiIsImNsb3NlIiwiQ0xPU0VEIiwiQ09OTkVDVElORyIsIndpdGhDcmVkZW50aWFscyIsIldlYlNvY2tldCIsImdldEZha2VXZWJTb2NrZXQiLCJXZWJTb2NrZXRTZXJ2ZXIiLCJXZWJTb2NrZXRGYWtlIiwiRGVubyIsInVwZ3JhZGVXZWJTb2NrZXQiLCJyZXF1ZXN0Iiwic29ja2V0IiwiUmVzcG9uc2UiLCJ3ZWJzb2NrZXQiLCJvdGhlciIsImNvZGUiLCJyZWFzb24iLCJ1bmRlZmluZWQiLCJDbG9zZUV2ZW50Iiwic2VuZCIsIm9uY2xvc2UiLCJDTE9TSU5HIiwiYmluYXJ5VHlwZSIsImJ1ZmZlcmVkQW1vdW50IiwiZXh0ZW5zaW9ucyIsInByb3RvY29sIiwicGF0aDJyZWdleCIsIm1hdGNoIl0sInNvdXJjZVJvb3QiOiIifQ==