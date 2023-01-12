const { query } = require("express");
const client = require("../helpers/db_connect");
const axios = require("axios");
const bcrypt = require("bcrypt");
const standars = require("../helpers/standardResponse");

const {
  multiLingMessages,
  metaSetter,
  allEnums,
} = require("../helpers/standardResponse");
const { options } = require("nodemon/lib/config");
const utilsController = require("./utils_controllers");
const authController = require("./auth_controllers");

const queries = {
  addBankEmpProfileQuery: `INSERT into bank_employee_profiles (user_id , bank_id , name_en , name_ar , role, civil_id , phone) VALUES ($1 , $2 , $3 , $4 , $5 , $6 , $7) ON CONFLICT (user_id) do UPDATE set
  name_en = $3 , name_ar=$4 , role = $5 , civil_id=$6 , phone=$7 `,
  insertNotificationQuery:
    "insert into notifications (title_en , title_ar , body_en , body_ar , sent_for , type , payload) values ($1,$2,$3,$4,$5,$6,$7)",
  getallTestimonials: "select * from testimonials",
  addBankProfileQuery:
    "INSERT into bank_profiles (user_id , bankname_en , bankname_ar , address , contact_number , contact_email , bank_type ,logo_url ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (user_id) do UPDATE set" +
    " bankname_en = $2 , bankname_ar=$3, address = $4 , contact_number = $5 , contact_email=$6 , bank_type = $7 ,logo_url=$8",
  getBankBTypeQuery: "select bank_type from bank_profiles where user_id=$1",

  insertOfferQuery: `INSERT into service_offers (bank_id ,  request_id , note)
  select $1,$2,$3 where not EXISTS (SELECT id from service_offers where bank_id = $1 and request_id = $2 and now() < expiry_date and  offer_status = 'pending' )
  and exists (select id from orders where bank_id=$1 and request_id=$2)
  RETURNING id`,

  bankBuyQuery: `INSERT into orders (bank_id,request_id) SELECT $1,$2 WHERE NOT EXISTS (
    SELECT id FROM orders WHERE bank_id=$1 and request_id=$2)`,
  getFCMForUserOfferQuery:
    "select users.fcm_token , users.id , users.lang from users INNER JOIN service_requests on service_requests.userid = users.id where service_requests.id = $1",

  getOneLoanOfferQuery: `select service_offers.id as offer_id ,service_offers.note as offer_note , service_offers.offer_status, service_offers.created_at as offer_date , 
  service_offers.action_time as offer_action_date ,
  fields_loan_offers.offered_amount ,  fields_loan_offers.offered_installments ,fields_loan_offers.offered_interest_rate ,
  service_requests.id as request_id 
  from service_offers 
    INNER JOIN bank_profiles ON service_offers.bank_id = bank_profiles.user_id
		INNER JOIN fields_loan_offers on fields_loan_offers.offer_id = service_offers.id
    INNER JOIN service_requests on service_requests.id = service_offers.request_id 
	where service_offers.id = $1 and service_offers.bank_id=$2`,
  getOneCarOfferQuery: `select service_offers.id as offer_id ,service_offers.note ,service_offers.bank_id , service_offers.offer_status, service_offers.created_at  , 
  fields_car_offers.offered_amount , fields_car_offers.offered_installments ,fields_car_offers.offered_monthly ,
  service_requests.id as request_id ,
  carleasing_fields.*,
  bank_profiles.bankname_en , bank_profiles.bankname_ar , bank_profiles.logo_url from service_offers 
  INNER JOIN service_requests on service_requests.id = service_offers.request_id 
  INNER JOIN bank_profiles ON service_offers.bank_id = bank_profiles.user_id
  INNER JOIN fields_car_offers on fields_car_offers.offer_id = service_offers.id
  INNER JOIN carleasing_fields on carleasing_fields.request_id  = service_offers.request_id
	where service_offers.id = $1 and service_offers.bank_id=$2`,
  getUserByIdQuery: "select * from users where id=$1",
  changePasswordQuery: "update users set password=$1 where id=$2",
  orderNoteQuery: "update orders set order_note=$1 where id = $2",
  orderStatusQuery: "update orders set order_status=$1 where id = $2",
  getAllinvoices:
    "select id , request_id , created_at from orders where bank_id=$1",
  getSumInvoices: `SELECT DATE_TRUNC('month',created_at) AS  month, COUNT(id) AS count , sum(price + 0) as total
  FROM orders where bank_id=$1
  GROUP BY DATE_TRUNC('month',created_at);`,
  offerPrivateStateQuery:
    "update service_offers set private_status=$1 where id = $2 and bank_id=$3",
  offerNoteQuery:
    "update service_offers set note=$1 where id =$2 and bank_id=$3",
  addBankEmpQuery:
    "insert into users (email , password , fcm_token , user_type ,user_device_info ,verified_at) values ($1,$2,$3,$4,$5, now()) RETURNING id , email",
  getSpeceficLoanOffer: `select service_offers.id ,service_offers.note ,service_offers.bank_id , service_offers.offer_status, service_offers.created_at  , 
  fields_loan_offers.offered_amount ,  fields_loan_offers.offered_installments ,fields_loan_offers.offered_interest_rate ,
  service_requests.id as request_id , loan_fields.type as requested_loan_type , loan_fields.amount as requested_amount ,
  loan_fields.installments_number as requested_installments_number ,
  bank_profiles.bankname_en , bank_profiles.bankname_ar , bank_profiles.logo_url from service_offers 
    INNER JOIN bank_profiles ON service_offers.bank_id = bank_profiles.user_id
		INNER JOIN fields_loan_offers on fields_loan_offers.offer_id = service_offers.id
    INNER JOIN service_requests on service_requests.id = service_offers.request_id 
		INNER JOIN loan_fields on loan_fields.request_id  = service_requests.id 
     where service_requests.userid = $1 and  service_offers.id = $2
  `,

  getSpeceficCarOffer: `select service_offers.id as offer_id ,service_offers.note ,service_offers.bank_id , service_offers.offer_status, service_offers.created_at  , 
  fields_car_offers.offered_amount , fields_car_offers.offered_installments ,
  service_requests.id as request_id ,
  vbrand,vmode,vcolor,model_year,condition,est_price,vlicense,vin_no,plate_no,
  bank_profiles.bankname_en , bank_profiles.bankname_ar , bank_profiles.logo_url from service_offers 
    INNER JOIN bank_profiles ON service_offers.bank_id = bank_profiles.user_id
		INNER JOIN fields_car_offers on fields_car_offers.offer_id = service_offers.id
    INNER JOIN service_requests on service_requests.id = service_offers.request_id 
		INNER JOIN carleasing_fields on carleasing_fields.request_id  = service_requests.id 
     where service_requests.userid = $1 and  service_offers.id = $2
  `,

  getLoanRequestMoreQuery: `select loan_fields.* from loan_fields INNER JOIN service_requests ON loan_fields.request_id = service_requests.id 
  where loan_fields.request_id = $1  ;`,
  getCarRequestMoreQuery: `select carleasing_fields.* from carleasing_fields INNER JOIN service_requests ON carleasing_fields.request_id = service_requests.id 
  where carleasing_fields.request_id = $1  ;`,
  getProfileReportQuery: `select total_liabilities , other_liabilities , loan , credit_card , total_monthly_installments from consumer_profiles
  INNER JOIN service_requests on service_requests.userid = consumer_profiles.user_id 
  INNER JOIN orders on service_requests.id = orders.request_id 
  WHERE orders.bank_id =$1 and service_requests.id =$2 `,

  getEmpsInvoices: `select sum(ps+0),CASE WHEN (emp_name IS NULL OR emp_name = '') THEN 'ADMIN' ELSE emp_name
   END as emp_name from 
   (select bank_employee_profiles.bank_id, history.id as orderID ,history.created_at , 2 as ps, history.subject , bank_employee_profiles.name_en as emp_name
    from history 
  INNER JOIN  bank_employee_profiles on history.subject = bank_employee_profiles.user_id 
  where history."operation"='buy_req' and bank_employee_profiles.bank_id = $1  ) as qq GROUP BY emp_name `,
};

const pageLimit = 10;

const signUpBankEmployeeController = async ({
  email,
  password,
  dos,
  dm,
  fcm,
}) => {
  console.log("SIGNING UP bank emp USER ");

  utilsController.formValidator(email, password);

  //encrypt password by bycrypt
  //insert data into users table + usertype
  //generate salt to hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);
  const deviceInfo = { os_version: dos, device_model: dm };

  const values = [email, hashedPass, fcm, "bank_employee", deviceInfo];
  const queryResult = await client
    .query(queries.addBankEmpQuery, values)
    .catch((e) => {
      console.log("db error = ", e);
      if (e.code == 23505) throw multiLingMessages.emailExist; //email already exist
    });
  if (queryResult.rowCount != 1) throw multiLingMessages.emailExist;

  const newUserId = queryResult.rows[0].id;
  const newUserEmail = queryResult.rows[0].email;

  const jwt = await utilsController.jwtGenerator(newUserId, "bank_employee");
  await authController.authTableHandler({ userId: newUserId, jwt: jwt });

  return { id: newUserId, email: newUserEmail };
};
const addEmpProfileController = async (vals) => {
  const { userid, empid, name_en, name_ar, role, civil_id, phone } = vals;
  if (
    !(
      userid &&
      empid &&
      name_en &&
      name_ar &&
      role &&
      civil_id.length == 12 &&
      phone.length == 8
    )
  )
    throw multiLingMessages.missingPayload;
  const values = [empid, userid, name_en, name_ar, role, civil_id, phone];

  const resp = await client
    .query(queries.addBankEmpProfileQuery, values)
    .catch((e) => {
      if (e) {
        console.log("error ", e);
        throw multiLingMessages.dbError;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};
const createNewEmpController = async (vals) => {
  const {
    userid,
    name_en,
    name_ar,
    role,
    civil_id,
    phone,
    email,
    dos,
    dm,
    fcm,
  } = vals;
  if (
    !(
      userid &&
      name_en &&
      name_ar &&
      role &&
      civil_id.length == 12 &&
      phone.length == 8 &&
      email &&
      dos &&
      dm &&
      fcm
    )
  )
    throw multiLingMessages.missingPayload;

  var newinfo = [];

  try {
    var newPass = Math.random().toString(36).slice(-10);
    await client.query("BEGIN;");
    const resp = await signUpBankEmployeeController({
      email: email,
      password: newPass,
      dos: dos,
      dm: dm,
      fcm: fcm,
    });
    const newEmail = resp.email;
    const newId = resp.id;
    newinfo.push(newId);
    newinfo.push(newEmail);
    await addEmpProfileController({
      userid: userid,
      empid: newId,
      name_en: name_en,
      name_ar: name_ar,
      role: role,
      civil_id: civil_id,
      phone: phone,
    });
    //send email to the new emp with the new password and welecom message
    const emimg = process.env.DOMAIN + "/assets/img/favez.png";
    const urlref = process.env.BANKDOMAIN + "/login";
    await utilsController.sendEmail({
      to: newEmail,
      subject: "Welcome to EzCredit system",
      text: "EzCredit Bank portal system",
      html: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Document</title>
          <style>
            @import url("https://fonts.googleapis.com/css2?family=Fredoka+One&family=Fredoka:wght@300;400;500&family=Glory:ital,wght@0,200;0,300;0,400;0,500;0,600;1,200;1,300;1,400;1,500;1,600&display=swap");
            a {
              font-weight: 500 !important;
              font-size: 14px !important;
              line-height: 17px !important;
              color: #ffffff !important;
              text-decoration: none !important;
            }
            body {
              background: #fff;
              font-family: "Fredoka";
              margin: auto auto;
            }
            .title {
              font-size: 30px;
              font-weight: 500;
              padding-bottom: 35px;
              border-bottom: 2px solid #7f9746;
            }
            .allPage {
              display: grid;
              justify-items: center;
              justify-items: center;
              margin-left: auto;
              margin-right: auto;
              text-align: center;
            }
            .button {
              padding: 10px;
              height: 36px;
              background: #7f9746;
              border-radius: 8px;
              border: 1px solid #fff;
              margin: auto;
              width: 12rem;
              cursor: pointer;
            }
            .logoImg {
              margin-top: 2rem;
              margin-bottom: auto;
            }
            .con1 {
              margin: 1rem;
              text-align: center;
            }
            .con2 {
              max-width: 60%;
              margin: auto;
            }
            .team {
              font-size: 20px;
              font-weight: 500;
            }
            img {
              width: 30px !important;
              height: 60px !important;
              margin-top: 5px;
              margin-bottom: 1px;
            }
          </style>
        </head>
        <body>
          <div class="allPage">
            <div class="logoImg">
              <a target="_blank" href=${urlref}>
                <img
                  class="img"
                  src="${emimg}"
                  alt="logo-EZ-credit"
                />
              </a>
            </div>
            <div class="con1">
              <p class="title">EZ credit welcomes you</p>
              <p>Hey there,</p>
              <p>
             Welcome to EzCredit bank portal system , you have been added as a employee successfully ,
             <br />
             We would like to take this chance to welcome you personally mr.${name_en} ,
             <br />
            <h4> Your new password is : ${newPass} </h4>
              </p>
              <br />
              <a class="button" href='${urlref}'>
             Login Now
              </a>
              Login Now
              </button>
              <br />
              <br />
              <div class="con2">
                <p></p>
              </div>
              <br />
              <p class="team">EZ credit Team</p>
            </div>
          </div>
        </body>
      </html>`,
    });

    //--------------------------------------

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  return {
    empid: newinfo[0],
    emp_email: newinfo[1],
    nmaeen: name_en,
    namear: name_ar,
    civil_id: civil_id,
    phone: phone,
    role: role,
    created_at: new Date(),
    status: "active",
  };
};
const addBankProfileController = async (vals) => {
  const {
    userid,
    bankname_ar,
    bankname_en,
    address,
    contact_number,
    contact_email,
    bank_type,
    logo_url,
  } = vals;
  const values = [
    userid,
    bankname_en,
    bankname_ar,
    address,
    contact_number,
    contact_email,
    bank_type,
    logo_url,
  ];

  if (
    !userid ||
    !bankname_en ||
    !bankname_ar ||
    !address ||
    !contact_number ||
    !contact_email ||
    !bank_type ||
    !logo_url
  )
    throw multiLingMessages.missingPayload;
  const resp = await client
    .query(queries.addBankProfileQuery, values)
    .catch((e) => {
      if (e) {
        console.log("error ", e);
        throw multiLingMessages.dbError;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};
const getBankBType = async (userid) => {
  const resp = await client
    .query(queries.getBankBTypeQuery, [userid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;

  return resp.rows[0].bank_type;
};
const sendGeneralOffer = async (vals) => {
  const { userid, request_id, note } = vals;
  if (!userid || !request_id || !note) throw multiLingMessages.missingPayload;
  const values = [userid, request_id, note];

  const resp = await client
    .query(queries.insertOfferQuery, values)
    .catch(async (e) => {
      if (e) {
        console.log("222 ", e);
        await client.query("ROLLBACK");

        throw multiLingMessages.alreadyOfferExist;
      }
    });
  console.log("general = ", resp.rowCount);
  if (resp.rowCount != 1) throw multiLingMessages.alreadyOfferExist;
  const offerid = resp.rows[0].id;

  return offerid;
};
const sendLoanOfferController = async (vals) => {
  const {
    userid,
    offered_interest_rate,
    offered_amount,
    offered_installments,
  } = vals;
  if (
    !(userid && offered_amount && offered_installments && offered_interest_rate)
  )
    throw multiLingMessages.missingPayload;

  const q =
    "insert into fields_loan_offers (	offer_id,	offered_amount,	offered_installments,	offered_interest_rate ) values ($1,$2,$3,$4)";
  await client.query("BEGIN");
  const offerNewid = await sendGeneralOffer(vals);
  const values = [
    offerNewid,
    offered_amount,
    offered_installments,
    offered_interest_rate,
  ];

  const resp = await client.query(q, values).catch(async (e) => {
    if (e) {
      console.log("Asdasd", e);
      await client.query("ROLLBACK");

      throw multiLingMessages.alreadyOfferExist;
    }
  });
  if (resp.rowCount != 1) throw multiLingMessages.alreadyOfferExist;

  //------------------------------------
  //get the new offer details
  const gettingOffer = await client
    .query(queries.getOneLoanOfferQuery, [offerNewid, userid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  if (gettingOffer.rowCount != 1) throw multiLingMessages.dbError;
  const newOfferData = gettingOffer.rows[0];
  console.log("offer data = ", newOfferData);

  //------------------------------------
  //here offer is saved successfully
  //so send notifiction to the user
  const resp1 = await client
    .query(queries.getFCMForUserOfferQuery, [vals.request_id])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;
  const fcm = resp1.rows[0].fcm_token;
  const uid = resp1.rows[0].id;
  const lang = resp1.rows[0].lang;
  console.log("data ", resp1.rows);
  await sendNotification(
    fcm,
    multiLingMessages.offerReq.title,
    multiLingMessages.offerReq.body,
    newOfferData,
    uid,
    "offer",
    lang
  );
  await client.query("COMMIT");

  return true;
};
const sendCarOfferController = async (vals) => {
  const { userid, offered_monthly, offered_amount, offered_installments } =
    vals;
  if (!(userid && offered_amount && offered_installments && offered_monthly))
    throw multiLingMessages.missingPayload;

  const q =
    "insert into fields_car_offers (	offer_id,	offered_amount,	offered_installments,	offered_monthly ) values ($1,$2,$3,$4)";
  await client.query("BEGIN");
  const offerNewid = await sendGeneralOffer(vals);
  console.log("data ", offerNewid);

  const values = [
    offerNewid,
    offered_amount,
    offered_installments,
    offered_monthly,
  ];

  const resp = await client.query(q, values).catch(async (e) => {
    if (e) {
      console.log("ss", e);
      await client.query("ROLLBACK");

      throw multiLingMessages.alreadyOfferExist;
    }
  });

  if (resp.rowCount != 1) throw multiLingMessages.alreadyOfferExist;
  //------------------------------------
  //get the new offer details
  const gettingOffer = await client
    .query(queries.getOneCarOfferQuery, [offerNewid, userid])
    .catch((e) => {
      if (e) {
        console.log("aa", e);
        throw multiLingMessages.dbError;
      }
    });
  if (gettingOffer.rowCount != 1) throw multiLingMessages.dbError;
  const newOfferData = gettingOffer.rows[0];
  console.log("offer data = ", gettingOffer.rows);

  //------------------------------------
  //here offer is saved successfully
  //so send notifiction to the user
  const resp1 = await client
    .query(queries.getFCMForUserOfferQuery, [vals.request_id])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;
  const fcm = resp1.rows[0].fcm_token;
  const uid = resp1.rows[0].id;
  const lang = resp1.rows[0].lang;
  console.log("data ", resp1.rows);
  await sendNotification(
    fcm,
    multiLingMessages.offerReq.title,
    multiLingMessages.offerReq.body,
    newOfferData,
    uid,
    "offer",
    lang
  );
  await client.query("COMMIT");

  return true;
};
const bankSendOfferController = async (vals) => {
  const {
    userid,
    request_id,
    offered_interest_rate,
    offered_amount,
    offered_installments,
    offered_loan_type,
    note,
  } = vals;
  if (
    !userid ||
    !request_id ||
    !offered_interest_rate ||
    !offered_amount ||
    !offered_installments ||
    !offered_loan_type ||
    !note
  )
    throw multiLingMessages.missingPayload;
  const values = [
    userid,
    request_id,
    offered_interest_rate,
    offered_amount,
    offered_installments,
    offered_loan_type,
    note,
  ];

  const resp = await client
    .query(queries.insertOfferQuery, values)
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.alreadyOfferExist;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.alreadyOfferExist;
  const offerid = resp.rows[0].id;

  //------------------------------------
  //get the new offer details
  const gettingOffer = await client
    .query(queries.getOneLoanOfferQuery, [offerid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  if (gettingOffer.rowCount != 1) throw multiLingMessages.dbError;
  const newOfferData = gettingOffer.rows[0];

  //------------------------------------
  //here offer is saved successfully
  //so send notifiction to the user
  const resp1 = await client
    .query(queries.getFCMForUserOfferQuery, [request_id])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;
  const fcm = resp1.rows[0].fcm_token;
  const uid = resp1.rows[0].id;
  const lang = resp1.rows[0].lang;
  console.log(resp1.rows);
  await sendNotification(
    fcm,
    multiLingMessages.offerReq.title,
    multiLingMessages.offerReq.body,
    // "one bank sent you offer !",
    // "check the new offer now ",
    newOfferData,
    uid,
    "offer",
    lang
  );
  return true;
};
const sendNotification = async (
  toUser,
  myTitle,
  myBody,
  dataPayLoad,
  toUserId,
  type,
  lang
) => {
  const url = "https://fcm.googleapis.com/fcm/send";
  const Serverkey = `key=${process.env.SERVERKEY}`;
  const body = {
    notification: {
      body: lang == "ar" ? myBody.ar : myBody.en,
      OrganizationId: "2",
      content_available: true,
      priority: "high",
      title: lang == "ar" ? myTitle.ar : myTitle.en,
      sound: "app_sound.wav",
    },
    data: dataPayLoad,
    to: toUser,
  };
  const headers = {
    "Content-Type": "application/json",
    Authorization: Serverkey,
  };
  //-------------------------------------
  //add notification to the database notification table
  //insert into notifications (title , body , sent_for , type , payload) values ($1,$2,$3,$4,$5)",
  const values = [
    myTitle.en,
    myTitle.ar,
    myBody.en,
    myBody.ar,
    toUserId,
    type,
    JSON.stringify(dataPayLoad),
  ];

  const resp = await client
    .query(queries.insertNotificationQuery, values)
    .catch((e) => {
      if (e) {
        console.log("error ", e);
        throw multiLingMessages.dbError;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;

  //-------------------------------------
  //notification sending via firebase

  var req = "";
  try {
    req = await axios.post(url, body, { headers });
    console.log(req.data);
    if (req.status == 200 && req.data.success == 1) {
      console.debug("message notification was sent");
      return true;
    } else {
      return false;
    }
  } catch (er) {
    console.log("error in axios ," + er);
    return false;
  }
};
const bankBuyProfileController = async (vals) => {
  const bankid = vals.userid;
  const reqid = vals.request_id;
  if (!bankid || !reqid) throw multiLingMessages.missingPayload;
  const resp = await client
    .query(queries.bankBuyQuery, [bankid, reqid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;
  else {
    //here offer is saved successfully
    //so send notifiction to the user
    const resp = await client
      .query(queries.getFCMForUserOfferQuery, [reqid])
      .catch((e) => {
        if (e) {
          console.log(e);
          throw multiLingMessages.dbError;
        }
      });
    if (resp.rowCount != 1) throw multiLingMessages.dbError;
    const fcm = resp.rows[0].fcm_token;
    const uid = resp.rows[0].id;
    const lang = resp.rows[0].lang;
    console.log("user lang = " + lang);
    console.log(resp.rows);
    await sendNotification(
      fcm,
      multiLingMessages.buyReq.title,
      multiLingMessages.buyReq.body,
      {},
      uid,
      "buy_request",
      lang
    );
    return true;
  }
};
const changePasswordController = async (vals) => {
  //payload has userid , currentPassword , newPassword
  const { userid, current_ps, new_ps } = vals;

  if (!(userid && current_ps && new_ps)) throw multiLingMessages.missingPayload;
  if (new_ps.length < 6 || current_ps == new_ps)
    throw multiLingMessages.loginPassWrong;

  const query = await client
    .query(queries.getUserByIdQuery, [userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  const userdata = query.rows[0];
  const hashedPassword = userdata.password;
  const comparePass = await bcrypt.compare(current_ps, hashedPassword);
  if (comparePass == false) throw multiLingMessages.loginPassWrong;

  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(new_ps, salt);

  //send email that content has been changed and change password
  const query1 = await client
    .query(queries.changePasswordQuery, [hashedPass, userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query1.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};
const addEditNotepurchasedController = async (vals) => {
  //payload has userid (bank), order_id , note
  const { userid, order_id, note } = vals;

  if (!(userid && order_id)) throw multiLingMessages.missingPayload;

  const query = await client
    .query(queries.orderNoteQuery, [note, order_id])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};
const addEditStatuspurchasedController = async (vals) => {
  const { userid, order_id, status } = vals;
  if (!(userid && order_id && status)) throw multiLingMessages.missingPayload;

  const query = await client
    .query(queries.orderStatusQuery, [status, order_id])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};
const getInvoicesController = async (vals) => {
  const { userid } = vals;
  if (!userid) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getSumInvoices, [userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  const respData = query.rows;

  const timeOptions = {
    month: "long",
    // day: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
    year: "numeric",
  };
  var totals = 0;
  respData.forEach((element) => {
    totals += parseInt(element.total);
    const time = new Date(element.month);
    const fdate = time.toLocaleDateString("default", timeOptions);

    element.fdate = fdate;
  });

  const query2 = await client
    .query(queries.getAllinvoices, [userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });

  // const time = new Date(query.rows[0].created_at);

  const timeOptions2 = {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
  };
  const respData2 = query2.rows;
  respData2.forEach((element) => {
    const time = new Date(element.created_at);
    const fdate = time.toLocaleDateString("default", timeOptions2);
    element.fdate = fdate;
  });

  const q3 = await client
    .query(queries.getEmpsInvoices, [userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  var adminTotal = totals;
  q3.rows.map((e) => {
    adminTotal -= parseInt(e.sum);
  });
  q3.rows.push({ sum: adminTotal, emp_name: "Bank Admin" });

  return {
    byPerson: q3.rows,
    total: totals,
    byMonth: respData,
    all: respData2,
  };
};
const setOfferPrivateStatusController = async (vals) => {
  const { userid, offer_id, status } = vals;
  if (!(userid && offer_id && status)) throw multiLingMessages.missingPayload;

  const query = await client
    .query(queries.offerPrivateStateQuery, [status, offer_id, userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};
const setOfferNoteController = async (vals) => {
  const { userid, offer_id, note } = vals;
  if (!(userid && offer_id)) throw multiLingMessages.missingPayload;

  const query = await client
    .query(queries.offerNoteQuery, [note, offer_id, userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};
const getBankEmployeesController = async (vals) => {
  //in this ticket git test
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);

  //const dynamicQuery = await filterEmployeesHandler(vals.filter);

  const query = `
  select bank_employee_profiles.user_id , bank_employee_profiles.name_en , bank_employee_profiles.name_ar , bank_employee_profiles.role , 
  bank_employee_profiles.civil_id ,  bank_employee_profiles.phone ,  bank_employee_profiles.status , 
  users.email , users.created_at from bank_employee_profiles
  INNER JOIN users on users.id = bank_employee_profiles.user_id where bank_employee_profiles.bank_id = $1
   ORDER BY users.created_at DESC `;

  const lnQuery = `select count(*)
	from bank_employee_profiles
  INNER JOIN users on users.id = bank_employee_profiles.user_id
  where bank_employee_profiles.bank_id = $1 `;

  const totalItemsLength = await client
    .query(lnQuery, [vals.userid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  console.log("limit " + pageLimit + "  offset " + Math.abs(page - 1) * 10);

  const customizedQuery =
    query + " limit " + pageLimit + "offset " + Math.abs(page - 1) * 10;
  const resp = await client.query(customizedQuery, [vals.userid]).catch((e) => {
    if (e) {
      console.log(e);
      throw multiLingMessages.dbError;
    }
  });

  const meta = metaSetter(
    page,
    totalItemsLength.rows[0].count,
    resp.rows.length
  );

  return [resp.rows, meta];
};
const changeEmpStatusController = async (vals) => {
  //change status from users table as well
  const { userid, empid, status } = vals;
  if (!(userid && empid && status)) throw multiLingMessages.missingPayload;
  var userState = status == "inactive" ? "blocked" : status;
  const q1 =
    "UPDATE bank_employee_profiles SET status = $1 WHERE user_id = $2 and bank_id = $3";
  const q2 =
    "UPDATE auth SET status = $1  , auth_token = 'blocked_auth' WHERE user_id = $2  ";

  await client.query("BEGIN");
  const query1 = await client
    .query(q1, [status, empid, userid])
    .catch(async (e) => {
      console.log(e);
      await client.query("ROLLBACK");
      throw multiLingMessages.dbError;
    });
  if (query1.rowCount != 1) {
    await client.query("ROLLBACK");
    throw multiLingMessages.dbError;
  }
  const query2 = await client.query(q2, [userState, empid]).catch(async (e) => {
    console.log(e);
    await client.query("ROLLBACK");
    throw multiLingMessages.dbError;
  });
  if (query2.rowCount != 1) {
    await client.query("ROLLBACK");
    throw multiLingMessages.dbError;
  }

  await client.query("COMMIT");
  //await client.end();

  return true;
};
const getAllRequestsFilterController2 = async (vals) => {
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const bnkType = await getBankBType(vals.userid);
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);
  if (!vals.filter) throw multiLingMessages.missingPayload;
  const dynamicQuery = await utilsController.filterHandler(vals.filter);

  const query = `SELECT service_requests.id,gender ,service_requests.created_at as request_date ,service_requests.service_type as request_type ,
  consumer_profiles.birth_date ,consumer_profiles.employment_status,consumer_profiles.income,consumer_profiles.salary,
  cities.id as city , cities.name_en as city_en , cities.name_ar as city_ar , nationality ,countries.id AS country ,
  countries.name_en AS nationality_en , countries.name_ar AS nationality_ar
  from service_requests 
  INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid
   INNER JOIN countries on countries.id = consumer_profiles.nationality 
   INNER JOIN cities on cities.id = consumer_profiles.city 
	 where service_requests.preferred_business_type in ($1 , 'any') and service_requests.id not in (select orders.request_id from orders where bank_id = $2) 
   ${dynamicQuery}
   ORDER BY service_requests.id DESC 
   `;

  const lnQuery = `SELECT count(*) from service_requests 
   INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid
   INNER JOIN countries on countries.id = consumer_profiles.nationality 
   INNER JOIN cities on cities.id = consumer_profiles.city 
	 where service_requests.preferred_business_type in ($1 , 'any') and service_requests.id not in (select orders.request_id from orders where bank_id = $2)  ${dynamicQuery}`;

  const totalItemsLength = await client
    .query(lnQuery, [bnkType, vals.userid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  console.log("limit " + pageLimit + "  offset " + Math.abs(page - 1) * 10);

  const customizedQuery =
    query + " limit " + pageLimit + "offset " + Math.abs(page - 1) * 10;
  const resp = await client
    .query(customizedQuery, [bnkType, vals.userid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });

  const meta = metaSetter(
    page,
    totalItemsLength.rows[0].count,
    resp.rows.length
  );

  return [resp.rows, meta];
};

const getRequestDetailsContoller = async (vals) => {
  //get one offer specefic data
  //request_type is mandatory
  const { request_type, request_id, userid } = vals;
  if (!(request_type && request_id && userid))
    throw multiLingMessages.missingPayload;
  var query = "";
  if (request_type == "loan") query = queries.getLoanRequestMoreQuery;
  else if (request_type == "car_leasing")
    query = queries.getCarRequestMoreQuery;
  else throw multiLingMessages.missingPayload;
  const goffers = await client.query(query, [request_id]);
  if (goffers.rowCount != 1) throw multiLingMessages.dbError;

  return goffers.rows;
};

const getAllPurchasedFilterController2 = async (vals) => {
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const bnkType = await getBankBType(vals.userid);
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);
  if (!vals.filter) throw multiLingMessages.missingPayload;
  const dynamicQuery = await utilsController.filterHandler(vals.filter);

  const query = `SELECT service_requests.id,gender ,service_requests.created_at as request_date ,service_requests.service_type as request_type ,
  consumer_profiles.birth_date ,consumer_profiles.employment_status,consumer_profiles.income,consumer_profiles.salary,
  cities.id as city , cities.name_en as city_en , cities.name_ar as city_ar , nationality ,countries.id AS country ,
  countries.name_en AS nationality_en , countries.name_ar AS nationality_ar ,
  orders.id as order_id,order_status , order_note
   from service_requests 
   INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid 
   INNER JOIN countries on countries.id = consumer_profiles.nationality 
   INNER JOIN cities on cities.id = consumer_profiles.city
   INNER JOIN orders on service_requests.id = orders.request_id WHERE orders.bank_id = $1 and
   service_requests.id not in (select service_offers.request_id from service_offers where service_offers.bank_id = $1 ) ${dynamicQuery}
   ORDER BY orders.id DESC
  `;

  const lnQuery = `SELECT count(*) from service_requests 
  INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid 
  INNER JOIN countries on countries.id = consumer_profiles.nationality 
  INNER JOIN cities on cities.id = consumer_profiles.city
  INNER JOIN orders on service_requests.id = orders.request_id WHERE orders.bank_id = $1 and
  service_requests.id not in (select service_offers.request_id from service_offers where service_offers.bank_id = $1 ) ${dynamicQuery} `;
  const totalItemsLength = await client
    .query(lnQuery, [vals.userid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  console.log("query = ", lnQuery);
  console.log("limit " + pageLimit + "  offset " + Math.abs(page - 1) * 10);

  const customizedQuery =
    query + " limit " + pageLimit + "offset " + Math.abs(page - 1) * 10;
  const resp = await client.query(customizedQuery, [vals.userid]).catch((e) => {
    if (e) {
      console.log(e);
      throw multiLingMessages.dbError;
    }
  });

  const meta = metaSetter(
    page,
    totalItemsLength.rows[0].count,
    resp.rows.length
  );

  return [resp.rows, meta];
};

const getProfileReportController = async (vals) => {
  const { userid, request_id } = vals;
  if (!(userid && request_id)) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getProfileReportQuery, [userid, request_id])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  return query.rows;
};

const getAllOffersFilterController2 = async (vals) => {
  //in this ticket git test
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);

  const dynamicQuery = await utilsController.filterOffersHandler(vals.filter);

  const query = `select service_offers.id , service_offers.request_id , service_offers.offer_status , service_offers.note , service_offers.created_at as offer_date,
	consumer_profiles.gender , service_requests.service_type as request_type ,service_requests.created_at as request_date  ,
  consumer_profiles.birth_date ,consumer_profiles.employment_status,consumer_profiles.income,consumer_profiles.salary,
  cities.id as city , cities.name_en as city_en , cities.name_ar as city_ar , countries.id AS nationality ,
  countries.name_en AS nationality_en , countries.name_ar AS nationality_ar 
	from service_offers 
  INNER JOIN service_requests on service_requests.id = service_offers.request_id 
  INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid
	INNER JOIN countries on countries.id = consumer_profiles.nationality 
  INNER JOIN cities on cities.id = consumer_profiles.city 
	where service_offers.bank_id=$1 ${dynamicQuery} ORDER BY service_offers.id DESC `;

  const lnQuery = `select count(*)
	from service_offers 
  INNER JOIN service_requests on service_requests.id = service_offers.request_id 
  INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid
	INNER JOIN countries on countries.id = consumer_profiles.nationality 
  INNER JOIN cities on cities.id = consumer_profiles.city 
	where service_offers.bank_id=$1 ${dynamicQuery}`;

  const totalItemsLength = await client
    .query(lnQuery, [vals.userid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  console.log("limit " + pageLimit + "  offset " + Math.abs(page - 1) * 10);

  const customizedQuery =
    query + " limit " + pageLimit + "offset " + Math.abs(page - 1) * 10;
  const resp = await client.query(customizedQuery, [vals.userid]).catch((e) => {
    if (e) {
      console.log(e);
      throw multiLingMessages.dbError;
    }
  });

  const meta = metaSetter(
    page,
    totalItemsLength.rows[0].count,
    resp.rows.length
  );

  return [resp.rows, meta];
};

const getAllAcceptedFilterController2 = async (vals) => {
  //in this ticket git test
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);

  const dynamicQuery = await utilsController.filterAcceptedHandler(vals.filter);

  const query = `select service_offers.id , service_requests.id as request_id , service_requests.service_type ,
  consumer_profiles.fullname_en , consumer_profiles.fullname_ar , consumer_profiles.civil_id , consumer_profiles.phone ,
  countries.id AS nationality , countries.name_en AS nationality_en , countries.name_ar AS nationality_ar ,
  cities.id as city , cities.name_en as city_en , cities.name_ar as city_ar ,
  service_offers.id as offer_id , service_offers.action_time , service_offers.private_status  ,service_offers.note

   from service_offers 
   INNER JOIN service_requests on service_requests.id = service_offers.request_id 
   INNER JOIN consumer_profiles on service_requests.userid = consumer_profiles.user_id 
   INNER JOIN countries on countries.id = consumer_profiles.nationality 
   INNER JOIN cities on cities.id = consumer_profiles.city 
   where service_offers.bank_id=$1 and offer_status='accepted'  ${dynamicQuery} ORDER BY service_offers.action_time DESC`;
  const lnQuery = `select count(*)
  from service_offers 
  INNER JOIN service_requests on service_requests.id = service_offers.request_id 
  INNER JOIN consumer_profiles on service_requests.userid = consumer_profiles.user_id 
  INNER JOIN countries on countries.id = consumer_profiles.nationality 
  INNER JOIN cities on cities.id = consumer_profiles.city 
   where service_offers.bank_id=$1 and offer_status='accepted'  ${dynamicQuery}`;

  const totalItemsLength = await client
    .query(lnQuery, [vals.userid])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  console.log("limit " + pageLimit + "  offset " + Math.abs(page - 1) * 10);

  const customizedQuery =
    query + " limit " + pageLimit + "offset " + Math.abs(page - 1) * 10;
  const resp = await client.query(customizedQuery, [vals.userid]).catch((e) => {
    if (e) {
      console.log(e);
      throw multiLingMessages.dbError;
    }
  });

  const meta = metaSetter(
    page,
    totalItemsLength.rows[0].count,
    resp.rows.length
  );

  return [resp.rows, meta];
};

const getOneOfferController = async (vals) => {
  const { userid, offer_id, service } = vals;
  if (!(userid && offer_id && service)) throw multiLingMessages.missingPayload;
  var qq = "";
  if (service == "loan") {
    qq = queries.getOneLoanOfferQuery;
  } else if (service == "car_leasing") {
    qq = queries.getOneCarOfferQuery;
  } else {
    throw "no service type";
  }

  //get the new offer details
  const gettingOffer = await client.query(qq, [offer_id, userid]).catch((e) => {
    if (e) {
      console.log(e);
      throw multiLingMessages.dbError;
    }
  });
  console.log("offer data = ", gettingOffer);
  //if (gettingOffer.rowCount != 1) throw multiLingMessages.dbError;
  const newOfferData = gettingOffer.rows[0];
  console.log("offer data = ", gettingOffer.rows);
  return newOfferData;
};

const readFiltersController = async (vals) => {
  const { userid } = vals;
  if (!userid) throw multiLingMessages.missingPayload;
  const q = await client.query(`select * from filters where bank=${userid}`);
  const rows = q.rows;
  console.log(rows);
  const defaultRows = {
    gender: ["male", "female"],
    employment_status: [
      "employed",
      "unemployed",
      "retired",
      "student",
      "business_owner",
    ],
    income: [
      [100, 500],
      [500, 1000],
      [1000, 4000],
    ],
    salary: [
      [100, 500],
      [500, 1000],
      [1000, 4000],
    ],
    nationality: ["any"],
    city: [1, 2],
    request_time: ["any", "any"],
    offer_time: ["any", "any"],
    offer_action_time: ["any", "any"],
    service_type: ["car_leasing", "loan"],
    offer_status: [
      "pending",
      "accepted",
      "rejected",
      "completed",
      "incompleted",
    ],
    private_status: ["no_response", "respond", "granted", "default"],
  };
  return {
    current: rows,
    default: defaultRows,
    translations: standars.mulitLangFilters,
  };
};
const editFiltersController = async (vals) => {
  const {
    userid,
    gender,
    nationality,
    city,
    employment_status,
    income,
    salary,
    request_time,
    offer_time,
    service_type,
    offer_status,
    private_status,
  } = vals;
  if (
    !userid ||
    !gender ||
    !nationality ||
    !city ||
    !employment_status ||
    !income ||
    !salary ||
    !request_time ||
    !offer_time ||
    !service_type ||
    !offer_status ||
    !private_status
  )
    throw multiLingMessages.missingPayload;
  if (salary) {
    salary.map((e) => {
      if (!Array.isArray(e)) throw multiLingMessages.missingPayload;
    });
  }
  if (income) {
    income.map((e) => {
      if (!Array.isArray(e)) throw multiLingMessages.missingPayload;
    });
  }
  const q = await client
    .query(
      `update filters set gender=$1,nationality=$2,city=$3,employment_status=$4,income=$5,salary=$6,request_time=$7,offer_time=$8,service_type=$9,
  offer_status=$10,private_status=$11 where bank=$12`,
      [
        gender,
        nationality,
        city,
        employment_status,
        income,
        salary,
        request_time,
        offer_time,
        service_type,
        offer_status,
        private_status,
        userid,
      ]
    )
    .catch((e) => {
      console.log(e);
      throw multiLingMessages.dbError;
    });
  return true;
};
const resetFilters = async (vals) => {
  console.log("reseting filters ", vals);
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const gender = ["male", "female"];
  const employment_status = [
    "employed",
    "unemployed",
    "retired",
    "student",
    "business_owner",
  ];
  const income = [
    [0, 500],
    [500, 1000],
    [1000, 10000000],
  ];
  const salary = [
    [0, 500],
    [500, 1000],
    [1000, 10000000],
  ];
  const nationality = ["any"];
  const city = ["any"];
  const request_time = ["any", "any"];
  const offer_time = ["any", "any"];
  const service_type = ["car_leasing", "loan"];
  const offer_status = [
    "pending",
    "accepted",
    "rejected",
    "completed",
    "incompleted",
  ];
  const private_status = ["no_response", "respond", "granted", "default"];

  const q = await client
    .query(
      `update filters set gender=$1,nationality=$2,city=$3,employment_status=$4,income=$5,salary=$6,request_time=$7,offer_time=$8,service_type=$9,
offer_status=$10,private_status=$11 where bank=$12`,
      [
        gender,
        nationality,
        city,
        employment_status,
        income,
        salary,
        request_time,
        offer_time,
        service_type,
        offer_status,
        private_status,
        vals.userid,
      ]
    )
    .catch((e) => {
      console.log(e);
      throw multiLingMessages.dbError;
    });
  return true;
};

module.exports = {
  resetFilters,
  editFiltersController,
  signUpBankEmployeeController,
  addBankProfileController,
  bankSendOfferController,
  bankBuyProfileController,
  changePasswordController,
  addEditNotepurchasedController,
  addEditStatuspurchasedController,
  getInvoicesController,
  setOfferPrivateStatusController,
  setOfferNoteController,
  addEmpProfileController,
  getBankEmployeesController,
  changeEmpStatusController,
  createNewEmpController,
  sendLoanOfferController,
  getAllRequestsFilterController2,
  getRequestDetailsContoller,
  getAllPurchasedFilterController2,
  getProfileReportController,
  sendCarOfferController,
  getAllOffersFilterController2,
  getAllAcceptedFilterController2,
  getOneOfferController,
  readFiltersController,
};
