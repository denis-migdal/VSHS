// @ts-ignore
import {test} from "VSHS";

test('echo (vars)/1',
     'http://localhost:8080/echo (vars)/1',
     {
        status: 200,
        body  : '{"P":"1"}',
        mime  : "application/json"
     }
);