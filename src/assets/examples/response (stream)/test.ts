// @ts-ignore
import addTest from "TESTS";

addTest('Response (stream)',
         'http://localhost:8080/response (stream)',
         {
            status: 200,
            body  : "0\n1\n2\n"
         }
);