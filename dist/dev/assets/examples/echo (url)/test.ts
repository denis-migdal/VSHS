// @ts-ignore
import {test} from "VSHS";

test('echo (url)',
     'http://localhost:8080/echo (url)',
     {
        status: 200,
        body  : encodeURI('http://localhost:8080/echo (url)'),
        mime  : "text/plain;charset=UTF-8"
     }
);