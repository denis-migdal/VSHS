// @ts-ignore
import {test} from "../../../../../tests_helper.ts";

test('GET root',
     new Request('http://localhost:8080', {
        method: "GET"
     }),
     {
        status: 200,
        body  : 'ok',
        mime  : "text/plain;charset=UTF-8"
     }
);