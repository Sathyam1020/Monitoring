// index.js

const express = require("express");
const client = require("prom-client"); //Metric collection...
const responseTime = require("response-time"); 
const { doSomeHeavyTask } = require("./utils");
const app = express();
const PORT = 3001;

const collectMetrics = client.collectDefaultMetrics; 

collectMetrics({ register: client.register }); 

const reqResTime = new client.Histogram({
    name: 'http_express_req_res_time', 
    help: 'This tells how much time is taken by req and res.',
    labelNames : ['method', 'route', 'status_code'], 
    buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000], 
})

const totalReqCounter = new client.Counter({
    name: 'total_req', 
    help: 'Tells total req', 
})

app.use(responseTime((req, res, time) => {
    totalReqCounter.inc();
    reqResTime.labels({ 
        method: req.method, 
        route: req.url, 
        status_code: res.statusCode, 
    })
    .observe(time); 
})); 

app.get("/", (req, res) => {
  return res.json({
    message: "Hello from the other side of the world.",
  });
});

app.get("/metrics", async (req, res) => {
    res.setHeader("Content-Type", client.register.contentType)
    const metrics = await client.register.metrics(); 
    res.send(metrics); 
}); 

app.get("/slow", async (req, res) => {
  try {
    const timeTaken = await doSomeHeavyTask();
    return res.json({
      message: "Success",
      message2: `Heavy task successful in ${timeTaken}ms`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      status: "Error",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is successfully running in port ${PORT}`);
});
