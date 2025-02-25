// @ts-ignore
import addTest from "TESTS";

addTest('echo (json)',
         new Request('http://localhost:8080/echo (json)', {
            method: "POST",
            body  : '{"a":42}',
            headers: {
               "Content-Type": "application/json"
            }
         }),
         {
            status: 200,
            body  : '{"a":42}',
            mime  : "application/json"
         }
);