const { Router } = require("express");
const router = Router();
const db = require("../helpers/db_connect");
const {
  multiLingMessages,
  responseSetter,
} = require("../helpers/standardResponse");

const userControllers = require("../controllers/user_controllers");
const authControllers = require("../controllers/auth_controllers");

router.get("/get_profile_info", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await userControllers.getProfileInfo(vals);
    //const response = { result: true, data: ctrl };
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

router.post("/add_profile_info", async (req, res) => {
  try {
    const ctrl = await userControllers.addProfileInfo(req.body);
    //const response = { result: true, data: ctrl };
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
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});

router.post("/update_profile_info", async (req, res) => {
  try {
    const ctrl = await userControllers.editProfileInfo(req.body);
    const response = { result: true, data: ctrl };
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
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});

router.get("/get_res_info", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await userControllers.getResidentialInfo(vals);
    const response = { result: true, data: ctrl };
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
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});

router.post("/edit_res_info", async (req, res) => {
  try {
    const ctrl = await userControllers.editAndAddResInfo(req.body);
    const response = { result: true, data: ctrl };
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
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});
router.get("/get_emp_info", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await userControllers.getEmploymentInfo(vals);
    const response = { result: true, data: ctrl };
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
router.post("/edit_emp_info", async (req, res) => {
  try {
    const ctrl = await userControllers.editAndAddEmpInfo(req.body);
    const response = { result: true, data: ctrl };
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
    });
    res.status(200).send(myResp);
  } catch (error) {
    console.log(error);
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    res.status(400).send(myResp);
  }
});

router.get("/get_financial_info", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await userControllers.getFinancialInfo(vals);
    const response = { result: true, data: ctrl };
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
    console.log("error ", error + " ...");
    res.status(400).send(myResp);
  }
});
router.post("/edit_financial_info", async (req, res) => {
  try {
    const ctrl = await userControllers.editAndAddFinancialInfo(req.body);
    const response = { result: true };
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

router.get("/user_notifications", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await userControllers.getSpeceficNotifications(vals);
    const response = { result: true, data: ctrl };
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

router.post("/apply_loan", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await userControllers.applyLoanController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "loan addedd successfully",
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log(error);
    res.status(400).send(myResp);
  }
});

router.post("/apply_cleasing", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await userControllers.applyCarLeaseController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "car leasing request addedd successfully",
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log(error);
    res.status(400).send(myResp);
  }
});

router.get("/get_offers", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await userControllers.getProposalsController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "offers loaded successfully",
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
router.get("/home_screen", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await userControllers.getHomeScreenDataController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "home screen data is done",
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
router.post("/loan_validation", async (req, res) => {
  try {
    //userid must be sent in the body
    //step number must be sent in the query inside the link
    const step = req.query.step;
    const vals = req.body;
    const ctrl = await userControllers.loanApplyingValidation(step, vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: `loan validation for step = ${step} is correct`,
    });
    res.status(200).send(myResp);
  } catch (error) {
    const myResp = responseSetter({
      result: false,
      data: [],
      httpstate: 400,
      errors: error,
    });
    console.log("error :", error);
    res.status(400).send(myResp);
  }
});

router.post("/loan_action", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await userControllers.takeActionForLoanController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "loan action has been taken",
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

router.post("/pc_c", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await userControllers.changePasswordController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "pc_c success",
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

router.get("/check_running_loan", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await userControllers.isThereRunningLoan(vals.userid);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "there is no running loan",
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

router.get("/logout", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await authControllers.logoutController(vals.userid);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "logged out",
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

router.get("/offer_details", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.query;
  try {
    const ctrl = await userControllers.getOfferDetailsController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "loan action has been taken",
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
