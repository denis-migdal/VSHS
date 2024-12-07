// @ts-ignore
import {test} from "VSHS";

test('Response (string)',
     'http://localhost:8080/response (string)',
     {
        status: 200,
        body  : "Hello World ;)",
        mime  : "text/plain;charset=UTF-8"
     }
);