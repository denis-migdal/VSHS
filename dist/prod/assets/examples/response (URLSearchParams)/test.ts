// @ts-ignore
import addTest from "TESTS";

addTest('Response (URLSearchParams)',
         'http://localhost:8080/response (URLSearchParams)',
         {
            status: 200,
            body  : "a=42&b=1337",
            mime  : "application/x-www-form-urlencoded;charset=UTF-8"
         }
);