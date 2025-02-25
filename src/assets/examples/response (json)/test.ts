// @ts-ignore
import addTest from "TESTS";

addTest('Response (json)',
         'http://localhost:8080/response (json)',
         {
            status: 200,
            body  : '{"a":42}',
            mime  : 'application/json'
         }
);