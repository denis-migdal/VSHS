// @ts-ignore
import {test} from "../../../../tests_helper.ts";

test('echo (string)',
     new Request('http://localhost:8080/echo (string)', {
        method: "POST",
        body  : 'foo'
     }),
     {
        status: 200,
        body  : 'foo',
        mime  : "text/plain;charset=UTF-8"
     }
);