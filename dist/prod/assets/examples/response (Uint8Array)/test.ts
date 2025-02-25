// @ts-ignore
import addTest from "TESTS";

addTest('Response (Uint8Array)',
         'http://localhost:8080/response (Uint8Array)',
         {
            status: 200,
            body  : "Hello"
         }
);