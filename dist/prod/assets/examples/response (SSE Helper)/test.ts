// @ts-ignore
import addTest from "TESTS";

addTest('Response (SSE)',
     'http://localhost:8080/response (SSE)',
     {
        status: 200,
        mime  : "text/event-stream",
        body  : `event: message
data: {"i":0}

event: message
data: {"i":1}

event: message
data: {"i":2}

`
     }
);