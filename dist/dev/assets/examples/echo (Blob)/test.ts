// @ts-ignore
import {test} from "VSHS";

test('echo (Blob)',
     new Request('http://localhost:8080/echo (Blob)', {
        method: "POST",
        body  : new Blob(["a,b"], {
                     type: "text/csv"
               })
     }),
     {
        status: 200,
        body  : 'a,b',
        mime  : "text/csv"
     }
);