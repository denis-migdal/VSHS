import {test} from "../../../../index.ts";

test('Hello World',
     'http://localhost:8080/Hello World',
     {
        status: 200,
        body  : "Hello World ;)",
        //mime  : "text/plain"
     }
);