const { Router } = require("express");
const router = Router();
const sysControllers = require("../controllers/system_controllers");
const { responseSetter } = require("../helpers/standardResponse");

router.post("/config", async (req, res) => {
  const mobileAppBuildNum = req.body.appbuildversion;
  console.log(mobileAppBuildNum);

  try {
    const resp = await sysControllers.handleConfig({
      mobileBuildNum: mobileAppBuildNum,
    });
    const myResp = responseSetter({
      result: true,
      data: resp,
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.get("/countries", async (req, res) => {
  try {
    const ctrl = await sysControllers.getAllCountries();
    //    const response = { result: true, data: ctrl };
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.get("/cities", async (req, res) => {
  const vals = req.query;

  try {
    const ctrl = await sysControllers.getAllCities(vals);
    //const response = { result: true, data: ctrl };
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    console.log("error ", error + " ...");
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.get("/all_notifications", async (req, res) => {
  try {
    const ctrl = await sysControllers.getGenericNotifications();
    // const response = { result: true, data: ctrl };
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    console.log("error ", error + " ...");
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.post("/contact_us", async (req, res) => {
  try {
    const resp = await sysControllers.addContactUsMessage(req.body);
    const myResp = responseSetter({
      result: true,
      data: resp,
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.get("/tutorials", async (req, res) => {
  try {
    const ctrl = await sysControllers.getTutorialsController(req.query);
    // const response = { result: true, data: ctrl };
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    console.log("error ", error + " ...");
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.post("/add_tutorial", async (req, res) => {
  try {
    const resp = await sysControllers.addTutorialController(req.body);
    const myResp = responseSetter({
      result: true,
      data: resp,
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
module.exports = router;
