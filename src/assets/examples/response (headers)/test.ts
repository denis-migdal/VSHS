// @ts-ignore
import addTest from "TESTS";

addTest('Response (headers)',
         'http://localhost:8080/response (headers)',
         {
            status: 200,
            mime  : "foo"
         }
);