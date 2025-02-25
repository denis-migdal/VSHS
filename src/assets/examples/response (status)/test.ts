// @ts-ignore
import addTest from "TESTS";

addTest('Response (status)',
     'http://localhost:8080/response (status)',
     {
        status: 501,
        statusText: "Not Implemented"
     }
);