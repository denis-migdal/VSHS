// @ts-ignore
import addTest from "TESTS";

addTest('Response (throw response)',
         'http://localhost:8080/response (throw response)',
         {
            status: 501,
            statusText: "Not Implemented"
         }
);