// @ts-ignore
import addTest from "TESTS";

addTest('echo (body)',
         new Request('http://localhost:8080/echo (body)', {
            method: "POST"
         }),
         {
            status: 200,
            body  : null
         }
);

addTest('echo (body) - str',
         new Request('http://localhost:8080/echo (body)', {
            method: "POST",
            body  : "foo",
         }),
         {
            status: 200,
            body  : "foo",
            mime  : "text/plain;charset=UTF-8"
         }
);