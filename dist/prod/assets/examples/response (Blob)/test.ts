// @ts-ignore
import addTest from "TESTS";

addTest('Response (Blob)',
         'http://localhost:8080/response (Blob)',
         {
            status: 200,
            body  : "a,b",
            mime  : "text/csv"
         }
);