const { Router } = require("express");
const { addListener } = require("nodemon");
const router = Router();
const authControllers = require("../controllers/auth_controllers");
const path = require("path");

const {
  responseSetter,
  response,
  multiLingMessages,
} = require("../helpers/standardResponse");

router.post("/signup", async (req, res) => {
  try {
    const vals = req.body;
    const uid = await authControllers.signUpUser(vals);
    const myResp = responseSetter({
      result: true,
      data: { userid: uid },
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    const ln = req.get("language");
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.post("/add_bank", async (req, res) => {
  try {
    const vals = req.body;
    const uid = await authControllers.signUpBank(vals);
    const myResp = responseSetter({
      result: true,
      data: { bankid: uid },
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    const ln = req.get("language");
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.post("/check_otp", async (req, res) => {
  try {
    const vals = req.body;
    const uid = await authControllers.checkOtp(vals);
    const myResp = responseSetter({
      result: true,
      data: [],
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

router.post("/login", async (req, res) => {
  console.log("data entering sign up route aasdasdasd");

  try {
    const vals = req.body;
    const ctrl = await authControllers.loginUser(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
    });
    myResp.login_state = 100;
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error.err ? error.err : error,
    });

    myResp.login_state = error.login_state;
    res.status(400).send(myResp);
  }
});
router.post("/forget_pass", async (req, res) => {
  try {
    const vals = req.body;
    const ctrl = await authControllers.resetChangePasswordController(
      vals,
      req.hostname
    );
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

router.get("/reset_check", async (req, res) => {
  try {
    const vals = req.query;
    const ctrl = await authControllers.resetOpenLinkController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
    });
    res.sendFile(path.resolve("reset_password/index.html"));

    //res.status(200).sendFile(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    // res.status(400).send(myResp);
    res.sendFile(path.resolve("reset_password/not_valid.html"));
  }
});

router.post("/change_pass", async (req, res) => {
  try {
    const vals = req.body;
    const ctrl = await authControllers.resetPerformChangeController(vals);
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

router.post("/login_provider", async (req, res) => {
  try {
    const auth = req.headers.auth;
    const vals = req.body;
    vals.client_token = auth;
    const ctrl = await authControllers.loginUserBy3dPartyController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
    });

    res.status(200).send(myResp);
  } catch (error) {
    console.log("3dparty -= ", error);
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});
router.get("/user_check", async (req, res) => {
  try {
    const auth = req.headers.auth;
    const vals = req.query.userid;
    if (!auth || !vals) throw multiLingMessages.missingPayload;
    const ctrl = await authControllers.singleLoginCheck(vals, auth);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "user auth found",
    });

    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: error == 101 ? 401 : 400,
      errors: error,
      message: "user auth not found",
    });
    res.status(error == 101 ? 401 : 400).send(myResp);
  }
});
module.exports = router;
