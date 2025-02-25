// @ts-ignore
import addTest from "TESTS";

addTest('echo (string)',
         new Request('http://localhost:8080/echo (URLSearchParams)', {
            method: "POST",
            body  : new URLSearchParams({a:"42", b:"1337"})
         }),
         {
            status: 200,
            body  : "a=42&b=1337",
            mime  : "application/x-www-form-urlencoded;charset=UTF-8"
         }
);