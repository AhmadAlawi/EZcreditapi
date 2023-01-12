const express = require("express");
const cors = require("cors");
require("dotenv").config();
var bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const path = require("path");

const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const scheduledFunctions = require("./jobs/cron");
// ADD CALL HERE
scheduledFunctions.initScheduledJobs();

app.use(limiter);

const port = process.env.PORT || 8081;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ type: "application/*+json" }));
app.use(bodyParser.urlencoded({ extended: true }));
const authControllers = require("./controllers/auth_controllers");

// global middle ware
// app.use(async (req, res, next) => {
//   await authControllers.authMiddleWare(req, res, next);
// });

app.use(async (req, res, next) => {
  if (
    req.path.includes("/index.html") ||
    req.path == "/usersandbanks.html" ||
    req.path == "/notific.html" ||
    req.path == "/"
  ) {
    const dd = await authControllers.adminAuthController(req.query.a_k);
    if (dd) {
      next();
    } else {
      res.redirect("/login.html");
      // res.send(401);
    }
  } else {
    next();
  }
}, express.static(path.join(__dirname, "/public")));

const userRoute = require("./routes/user_route");
const adminRoute = require("./routes/admin_route");
const bankRoute = require("./routes/bank_route");
const systemRoute = require("./routes/system_route");
const authRoute = require("./routes/auth_route");
const dashboardRoute = require("./routes/dashboard_route");
const bankEmpRoute = require("./routes/bank_emp_route");

// app.listen(port, () => {
//   console.log("working server");
// });
http.listen(port, function () {
  console.log("listening on : ", port);
});

app.use("/api/sys/", systemRoute);
app.use(
  "/api/user",
  (req, res, next) => {
    authControllers.userAuthMiddleware(req, res, next);
  },
  userRoute
);
app.use(adminRoute);
app.use("/api/auth/", authRoute);
app.use(
  "/api/bank",
  (req, res, next) => {
    authControllers.bankAuthMiddleware(req, res, next);
  },
  bankRoute
);

app.use(
  "/api/bemp",
  (req, res, next) => {
    authControllers.bankEmpAuthMiddleware(req, res, next);
  },
  bankEmpRoute
);

app.use(
  "/api/dashboard/",
  async (req, res, next) => {
    if (req.path.includes("login_admin")) next();
    const auth = req.headers.auth;
    const dd = await authControllers.adminAuthController(auth);
    if (dd) next();
    else {
      res.status(401).send();
    }
  },
  dashboardRoute
);
