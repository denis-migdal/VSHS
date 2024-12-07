// @ts-ignore
import {test} from "VSHS";

test('Response (status)',
     'http://localhost:8080/response (status)',
     {
        status: 501,
        statusText: "Not Implemented"
     }
);