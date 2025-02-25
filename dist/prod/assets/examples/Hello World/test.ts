// @ts-ignore
import test from "TESTS";

test('Hello World',
     'http://localhost:8080/Hello World',
     {
        status: 200,
        body  : "Hello World ;)",
        mime  : "text/plain;charset=UTF-8"
     }
);