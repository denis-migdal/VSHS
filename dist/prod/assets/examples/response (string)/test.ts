// @ts-ignore
import addTest from "TESTS";

addTest('Response (string)',
         'http://localhost:8080/response (string)',
         {
            status: 200,
            body  : "Hello World ;)",
            mime  : "text/plain;charset=UTF-8"
         }
);