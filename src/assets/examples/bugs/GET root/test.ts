// @ts-ignore
import addTest from "TESTS";

addTest('GET root',
         new Request('http://localhost:8080', {
            method: "GET"
         }),
         {
            status: 200,
            body  : 'ok',
            mime  : "text/plain;charset=UTF-8"
         }
);