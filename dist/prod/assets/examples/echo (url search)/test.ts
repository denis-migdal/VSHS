// @ts-ignore
import addTest from "TESTS";

addTest('echo (url)',
         'http://localhost:8080/echo (url search)?a=42&b=1337',
         {
            status: 200,
            body  : "a=42&b=1337",
            mime  : "application/x-www-form-urlencoded;charset=UTF-8"
         }
);