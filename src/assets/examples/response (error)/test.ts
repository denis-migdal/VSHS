// @ts-ignore
import addTest from "TESTS";

addTest('Response (error)',
         'http://localhost:8080/response (error)',
         {
            status: 500,
            statusText: "Internal Server Error",
            body: ":'(",
            mime: "text/plain;charset=UTF-8"
         }
);