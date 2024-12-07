// @ts-ignore
import {test} from "VSHS";

test('Response (Blob)',
     'http://localhost:8080/response (Blob)',
     {
        status: 200,
        body  : "a,b",
        mime  : "text/csv"
     }
);