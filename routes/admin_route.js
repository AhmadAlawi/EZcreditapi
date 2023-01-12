const { Router } = require("express");
const router = Router();
const adminControllers = require("../controllers/admin_controllers");
const authControllers = require("../controllers/auth_controllers");
const { responseSetter } = require("../helpers/standardResponse");

router.get("/api/admin/get_testimonials", async (req, res) => {
  const vals = req.query;
  try {
    const dataList = await adminControllers.getTestimonials(vals);
    const myResp = responseSetter({
      result: true,
      data: dataList,
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
router.post("/api/admin/add_testimonial", async (req, res) => {
  try {
    const query = await adminControllers.addNewTestimonial(req.body);
    const response = { result: true, message: "item added successfully" };
    const myResp = responseSetter({
      result: true,
      data: query,
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
router.get("/api/admin/otp", async (req, res) => {
  try {
    const query = await authControllers.sendOtp(req.body.email);
    const myResp = responseSetter({
      result: true,
      data: query,
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

router.get("/api/admin/get_lenders", async (req, res) => {
  // const vals = req.query;
  try {
    const ctrl = await adminControllers.getLendersController();
    const myResp = responseSetter({
      result: true,
      data: ctrl,
      httpstate: 200,
      message: "lenders loaded successfully",
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
