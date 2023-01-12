const { Router } = require("express");
const router = Router();
const dashboardControllers = require("../controllers/dashboard_controllers");
const authControllers = require("../controllers/auth_controllers");
const { responseSetter } = require("../helpers/standardResponse");

router.get("/get_admin_home", async (req, res) => {
  try {
    const ctrl = await dashboardControllers.getHomeScreenDataController();
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "data loaded successfully",
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});
router.get("/get_nots", async (req, res) => {
  try {
    const ctrl = await dashboardControllers.getAllNotificationsController();
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "nots loaded successfully",
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});
router.post("/send_not", async (req, res) => {
  try {
    const ctrl = await dashboardControllers.sendNotificationController(
      req.body
    );
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "nots sent successfully",
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});

router.get("/get_us", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await dashboardControllers.getAllUsersController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl[0],
      httpstate: 200,
      message: "users loaded successfully",
      metaObj: ctrl[1],
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});

router.get("/get_bs", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await dashboardControllers.getAllBanksController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl[0],
      httpstate: 200,
      message: "banks loaded successfully",
      metaObj: ctrl[1],
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});

router.get("/login_admin", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await dashboardControllers.loginController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "login loaded successfully",
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});

module.exports = router;
