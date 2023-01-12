const { Router } = require("express");
const router = Router();
const db = require("../helpers/db_connect");
const { responseSetter } = require("../helpers/standardResponse");
const bankControllers = require("../controllers/bank_controllers");
const authControllers = require("../controllers/auth_controllers");

router.post("/bank_profile", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.addBankProfileController(vals);
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

router.post("/add_emp", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.signUpBankEmployeeController(vals);
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
router.post("/get_emps", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.getBankEmployeesController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl[0],
      httpstate: 200,
      page: vals.page,
      metaObj: ctrl[1],
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

router.post("/emp_status", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.changeEmpStatusController(vals);
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

router.post("/emp_profile", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.addEmpProfileController(vals);
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

router.post("/filter_requests", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.getAllRequestsFilterController2(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl[0],
      httpstate: 200,
      page: vals.page,
      metaObj: ctrl[1],
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

router.post("/send_loan_offer", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.sendLoanOfferController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      page: vals.page,
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

router.post("/send_car_offer", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.sendCarOfferController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      page: vals.page,
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

router.post("/filter_offers", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.getAllOffersFilterController2(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl[0],
      httpstate: 200,
      page: vals.page,
      metaObj: ctrl[1],
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
//deleted
router.post("/buy_request", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.bankBuyProfileController(vals);
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

router.post("/filter_purchased", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.getAllPurchasedFilterController2(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl[0],
      httpstate: 200,
      page: vals.page,
      metaObj: ctrl[1],
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

router.post("/filter_accepted", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await bankControllers.getAllAcceptedFilterController2(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl[0],
      httpstate: 200,
      page: vals.page,
      metaObj: ctrl[1],
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

router.post("/pc_cb", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await bankControllers.changePasswordController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "pc_cb success",
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

router.post("/order_note", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await bankControllers.addEditNotepurchasedController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "note added",
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
router.post("/order_status", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await bankControllers.addEditStatuspurchasedController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "status changed success",
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

router.get("/get_invoices", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.query;
  try {
    const ctrl = await bankControllers.getInvoicesController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "invoices gotten",
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

router.post("/offer_private_status", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await bankControllers.setOfferPrivateStatusController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "status changed success",
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

router.post("/offer_note", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await bankControllers.setOfferNoteController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "note changed success",
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
router.post("/add_new_emp", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await bankControllers.createNewEmpController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "emp addedd success",
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
router.get("/request_details", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.query;
  try {
    const ctrl = await bankControllers.getRequestDetailsContoller(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "details gotten",
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
router.get("/profile_report", async (req, res) => {
  const vals = req.query;
  try {
    const ctrl = await bankControllers.getProfileReportController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "report data",
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
    const ctrl = await bankControllers.getOneOfferController(vals);
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

router.get("/filters", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.query;
  try {
    const ctrl = await bankControllers.readFiltersController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "filters data",
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
router.post("/filters", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await bankControllers.editFiltersController(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "filters data",
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

router.post("/reset_filters", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await bankControllers.resetFilters(vals);
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "filters data",
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
