const client = require("../helpers/db_connect");
const axios = require("axios");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
var jwt = require("jsonwebtoken");

const {
  multiLingMessages,
  metaSetter,
  allEnums,
} = require("../helpers/standardResponse");

const sendEmail = async ({ to, subject, text, html }) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EM,
      pass: process.env.EMPS,
    },
  });
  var mailOptions = {
    from: process.env.EM,
    to: to,
    subject: subject,
    text: text,
    html: html,
  };
  const info = await transporter.sendMail(mailOptions, (info, error) => {
    if (error) throw multiLingMessages.dbError;
  });
  return true;
};

const emailValidation = (em) => {
  if (!em) return false;
  return em
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
const passwordValidation = (ps) => {
  if (!ps) return false;

  console.log(ps.length);
  return ps.length >= 6;
};

const formValidator = (email, password) => {
  var validations = {};

  if (!emailValidation(email)) validations.email = multiLingMessages.formEmail;
  if (!passwordValidation(password))
    validations.password = multiLingMessages.formPass;

  //if (validations.length > 0) throw { ...validations };
  if (validations.email || validations.password) throw validations;
};

const jwtGenerator = async (id, role) => {
  const secret = process.env.SECRETJWT;
  var token = jwt.sign({ user: id, role: role }, secret, { expiresIn: "365d" });
  console.log("jwt created successfully = ", token);
  return token;
};

const filterHandler = async (filter) => {
  var dynamicQuery = "";

  if (filter.service_type) {
    var ls = [];
    filter.service_type.forEach((e) => {
      ls.push(` '${e}'`);
    });
    dynamicQuery =
      dynamicQuery + ` and (service_requests.service_type in (${ls}) ) `;
  }

  if (filter.gender) {
    var genderList = [];
    filter.gender.forEach((element) => {
      genderList.push(` '${element}'`);
    });
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.gender in (${genderList}) ) `;
  }
  if (filter.nationality) {
    const natList = [...filter.nationality];
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.nationality in (${natList}) ) `;
  }
  if (filter.city) {
    const natList = [...filter.city];
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.city in (${natList}) ) `;
  }
  if (filter.employment_status) {
    var natList = [];
    filter.employment_status.forEach((element) => {
      natList.push(` '${element}'`);
    });
    dynamicQuery =
      dynamicQuery +
      ` and (consumer_profiles.employment_status in (${natList}) ) `;
  }
  if (filter.income) {
    const range = `${filter.income[0]} and ${filter.income[1]}`;
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.income between ${range} ) `;
  }
  if (filter.salary) {
    const range = `${filter.salary[0]} and ${filter.salary[1]}`;
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.salary between ${range} ) `;
  }
  if (filter.request_time) {
    const range = `'${filter.request_time[0]}' and '${filter.request_time[1]}'`;
    dynamicQuery =
      dynamicQuery + ` and (service_requests.created_at between ${range} ) `;
  }
  console.log(dynamicQuery);
  return dynamicQuery;
};
const filterOffersHandler = async (filter) => {
  var dynamicQuery = "";
  if (filter.service_type) {
    var ls = [];
    filter.service_type.forEach((e) => {
      ls.push(` '${e}'`);
    });
    dynamicQuery =
      dynamicQuery + ` and (service_requests.service_type in (${ls}) ) `;
  }
  if (filter.gender) {
    var genderList = [];
    filter.gender.forEach((element) => {
      genderList.push(` '${element}'`);
    });
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.gender in (${genderList}) ) `;
  }
  if (filter.nationality) {
    const natList = [...filter.nationality];
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.nationality in (${natList}) ) `;
  }
  if (filter.city) {
    const natList = [...filter.city];
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.city in (${natList}) ) `;
  }
  if (filter.employment_status) {
    var natList = [];
    filter.employment_status.forEach((element) => {
      natList.push(` '${element}'`);
    });
    dynamicQuery =
      dynamicQuery +
      ` and (consumer_profiles.employment_status in (${natList}) ) `;
  }

  if (filter.income) {
    const range = `${filter.income[0]} and ${filter.income[1]}`;
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.income between ${range} ) `;
  }
  if (filter.salary) {
    const range = `${filter.salary[0]} and ${filter.salary[1]}`;
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.salary between ${range} ) `;
  }
  if (filter.offer_time) {
    const range = `'${filter.offer_time[0]}' and '${filter.offer_time[1]}'`;
    dynamicQuery =
      dynamicQuery + ` and (service_offers.created_at between ${range} ) `;
  }
  if (filter.offer_status) {
    var natList = [];
    filter.offer_status.forEach((element) => {
      natList.push(` '${element}'`);
    });
    dynamicQuery =
      dynamicQuery + ` and (service_offers.offer_status in (${natList}) ) `;
  }
  console.log(dynamicQuery);
  return dynamicQuery;
};
const filterAcceptedHandler = async (filter) => {
  var dynamicQuery = "";

  if (filter.service_type) {
    var ls = [];
    filter.service_type.forEach((e) => {
      ls.push(` '${e}'`);
    });
    dynamicQuery =
      dynamicQuery + ` and (service_requests.service_type in (${ls}) ) `;
  }
  if (filter.gender) {
    var genderList = [];
    filter.gender.forEach((element) => {
      genderList.push(` '${element}'`);
    });
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.gender in (${genderList}) ) `;
  }

  if (filter.employment_status) {
    var natList = [];
    filter.employment_status.forEach((element) => {
      natList.push(` '${element}'`);
    });
    dynamicQuery =
      dynamicQuery +
      ` and (consumer_profiles.employment_status in (${natList}) ) `;
  }

  if (filter.income) {
    const range = `${filter.income[0]} and ${filter.income[1]}`;
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.income between ${range} ) `;
  }
  if (filter.salary) {
    const range = `${filter.salary[0]} and ${filter.salary[1]}`;
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.salary between ${range} ) `;
  }

  if (filter.name_or_civil_key) {
    const qq = filter.name_or_civil_key;
    //	civil_id LIKE lower('%' || 89 || '%' )

    dynamicQuery =
      dynamicQuery +
      ` and ( consumer_profiles.fullname_en LIKE lower('%' || '${qq}' || '%') OR consumer_profiles.fullname_ar LIKE lower('%' || '${qq}' || '%') OR consumer_profiles.civil_id LIKE lower('%' || '${qq}' || '%') ) `;
  }

  if (filter.nationality) {
    const natList = [...filter.nationality];
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.nationality in (${natList}) ) `;
  }
  if (filter.city) {
    const natList = [...filter.city];
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.city in (${natList}) ) `;
  }

  if (filter.offer_action_time) {
    const range = `'${filter.offer_action_time[0]}' and '${filter.offer_action_time[1]}'`;
    dynamicQuery =
      dynamicQuery + ` and (service_offers.action_time between ${range} ) `;
  }

  if (filter.private_status) {
    var natList = [];
    filter.private_status.forEach((element) => {
      natList.push(` '${element}'`);
    });
    dynamicQuery =
      dynamicQuery + ` and (service_offers.private_status in (${natList}) ) `;
  }

  //------------
  console.log(dynamicQuery);

  return dynamicQuery;
};
module.exports = {
  formValidator,
  sendEmail,
  jwtGenerator,
  emailValidation,
  filterHandler,
  filterOffersHandler,
  filterAcceptedHandler,
};
