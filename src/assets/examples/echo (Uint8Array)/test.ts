// @ts-ignore
import {test} from "../../../../tests_helper.ts";

test('echo (Uint8Array)',
     new Request('http://localhost:8080/echo (Uint8Array)', {
        method: "POST",
        body  : new Uint8Array([65, 66, 67])
     }),
     {
        status: 200,
        body  : new Uint8Array([65, 66, 67]),
     }
);