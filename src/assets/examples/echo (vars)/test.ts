// @ts-ignore
import addTest from "TESTS";

addTest('echo (vars)/1',
         'http://localhost:8080/echo (vars)/1',
         {
            status: 200,
            body  : '{"P":"1"}',
            mime  : "application/json"
         }
);