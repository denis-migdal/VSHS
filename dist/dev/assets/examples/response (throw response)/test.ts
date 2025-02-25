// @ts-ignore
import {test} from "../../../../tests_helper.ts";

test('Response (throw response)',
     'http://localhost:8080/response (throw response)',
     {
        status: 501,
        statusText: "Not Implemented"
     }
);