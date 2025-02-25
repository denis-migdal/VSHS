// @ts-ignore
import addTest from "TESTS";

addTest('Response (redirect)',
         new Request('http://localhost:8080/response (redirect)'),
         {
            status: 200,
            body  : encodeURI('http://localhost:8080/echo (url)'),
            mime  : "text/plain;charset=UTF-8"
         }
);