// @ts-ignore
import {test} from "VSHS";

test('Response (throw response)',
     'http://localhost:8080/response (throw response)',
     {
        status: 501,
        statusText: "Not Implemented"
     }
);