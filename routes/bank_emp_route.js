const { Router } = require("express");
const router = Router();
const db = require("../helpers/db_connect");
const { responseSetter } = require("../helpers/standardResponse");
const bankControllers = require("../controllers/bank_controllers");
const empControllers = require("../controllers/bank_emp_controller");
const authControllers = require("../controllers/auth_controllers");

router.post("/b_emp", async (req, res) => {
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

router.post("/filter_requests", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await empControllers.getAllRequestsFilterController(vals);
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

router.post("/filter_offers", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await empControllers.getAllOffersFilterController(vals);
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
router.post("/filter_purchased", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await empControllers.getAllPurchasedFilterController(vals);
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
    const ctrl = await empControllers.getAllAcceptedFilterController(vals);
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

router.get("/get_invoices", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.query;
  try {
    const ctrl = await empControllers.getInvoicesController(vals);
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
router.post("/send_offer", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await empControllers.bankSendOfferController(vals);
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

router.post("/buy_request", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await empControllers.bankBuyProfileController(vals);
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

router.post("/pc_cb", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await empControllers.changePasswordController(vals);
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
    const ctrl = await empControllers.addEditNotepurchasedController(vals);
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
    const ctrl = await empControllers.addEditStatuspurchasedController(vals);
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

router.post("/offer_private_status", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.body;
  try {
    const ctrl = await empControllers.setOfferPrivateStatusController(vals);
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
    const ctrl = await empControllers.setOfferNoteController(vals);
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
    const ctrl = await empControllers.getRequestDetailsContoller(vals);
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
    const ctrl = await empControllers.getProfileReportController(vals);
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
    const ctrl = await empControllers.getOneOfferController(vals);
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
router.post("/send_loan_offer", async (req, res) => {
  const vals = req.body;
  try {
    const ctrl = await empControllers.sendLoanOfferController(vals);
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
    const ctrl = await empControllers.sendCarOfferController(vals);
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

router.get("/filters", async (req, res) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const vals = req.query;
  try {
    const ctrl = await empControllers.readFiltersController(vals);
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
