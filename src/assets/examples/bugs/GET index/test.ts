// @ts-ignore
import addTest from "TESTS";

addTest('GET index',
         new Request('http://localhost:8080/index', {
            method: "GET"
         }),
         {
            status: 200,
            body  : 'ok',
            mime  : "text/plain;charset=UTF-8"
         }
);