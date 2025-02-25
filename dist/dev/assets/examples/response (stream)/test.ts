// @ts-ignore
import {test} from "../../../../tests_helper.ts";

test('Response (stream)',
     'http://localhost:8080/response (stream)',
     {
        status: 200,
        body  : "0\n1\n2\n"
     }
);