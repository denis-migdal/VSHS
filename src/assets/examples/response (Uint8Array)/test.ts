// @ts-ignore
import {test} from "VSHS";

test('Response (Uint8Array)',
     'http://localhost:8080/response (Uint8Array)',
     {
        status: 200,
        body  : "Hello"
     }
);