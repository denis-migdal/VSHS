// @ts-ignore
import {test} from "../../../../tests_helper.ts";

test('Hello World',
     'http://localhost:8080/Hello World',
     {
        status: 200,
        body  : "Hello World ;)",
        mime  : "text/plain;charset=UTF-8"
     }
);