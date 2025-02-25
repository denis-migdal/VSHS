// @ts-ignore
import addTest from "TESTS";

addTest('echo (url)',
         'http://localhost:8080/echo (url)',
         {
            status: 200,
            body  : encodeURI('http://localhost:8080/echo (url)'),
            mime  : "text/plain;charset=UTF-8"
         }
);