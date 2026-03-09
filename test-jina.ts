import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log("Simulating Jina fetch to cafehetpaardje.nl");
fetch('https://r.jina.ai/https://cafehetpaardje.nl').then(res => console.log(res.status === 200 ? "JINA SUCCESS" : "JINA FAIL"));
