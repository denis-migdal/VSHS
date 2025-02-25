// @ts-ignore
import addTest from "TESTS";

addTest('Response (clone)',
         'http://localhost:8080/response (clone)',
         {
            status: 200,
            body  : "ok",
            mime  : "text/plain;charset=UTF-8"
         }
);