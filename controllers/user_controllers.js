const client = require("../helpers/db_connect");
const bcrypt = require("bcrypt");
const { query } = require("express");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { multiLingMessages } = require("../helpers/standardResponse");
const utils = require("./utils_controllers");

const queries = {
  editVerifyQuery: "update users set verified_at=$1 where id=$2",
  checkOtpQuery:
    "select * from users_otp where user_id=$1 and otp_code=$2 and now() - expiry  <= interval '10 minutes'",
  insertOtp:
    "INSERT into users_otp (user_id , otp_code) VALUES ($1,$2) ON CONFLICT (user_id) do UPDATE set otp_code=$2",

  loginGetUserByEmail: "select * from users where email=$1 ",
  checkIfUserHasAuth: "select * from auth where user_id=$1",
  insertUserAuth:
    "insert into auth (auth_token , status , user_id) values ($1,$2,$3)",
  updateUserAuth: "update auth set auth_token=$1 where user_id=$2",
  updateUserInfo:
    "update users set user_device_info=$1 , fcm_token=$2 where id=$3",
  getUserBlocked: "select * from auth where user_id=$1",
  getProfileInfo: `SELECT fullname_en, fullname_ar, gender, birth_date  , civil_id , phone ,nationality, countries.name_en AS country_en , countries.name_ar AS country_ar ,
  cities.id as city_id , cities.name_en as city_en , cities.name_ar as city_ar
  FROM consumer_profiles 
  inner join countries on consumer_profiles.nationality = countries.id 
  inner join cities on consumer_profiles.city = cities.id
  WHERE consumer_profiles.user_id=$1`,
  // "SELECT fullname_en, fullname_ar, gender, nationality, birth_date  , civil_id , phone ,countries.id AS country_id , name_en AS country_en , name_ar AS country_ar FROM consumer_profiles inner join countries on consumer_profiles.country = countries.id WHERE consumer_profiles.user_id=$1",
  insertProfileInfo:
    "insert into consumer_profiles (user_id , fullname_en, fullname_ar, gender, nationality ,birth_date , country , civil_id , phone) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (user_id) do UPDATE set fullname_en=$2, fullname_ar=$3, gender=$4, nationality=$5, birth_date=$6 , civil_id=$8 , phone=$9",
  updateProfileInfo:
    "update consumer_profiles set fullname_en=$1, fullname_ar=$2, gender=$3, nationality=$4, birth_date=$5 where user_id=$6",
  getResInfo:
    "select address , street_name , building_number , cities.id as city_id, cities.name_en as city_en , cities.name_ar as city_ar , countries.id AS country_id , countries.name_en AS country_en , countries.name_ar AS country_ar from consumer_profiles INNER JOIN countries on consumer_profiles.country = countries.id INNER JOIN cities on consumer_profiles.city=cities.id  where consumer_profiles.user_id=$1",
  putResInfo:
    "insert into consumer_profiles (user_id , country , city , address , street_name , building_number) values ($1,$2,$3,$4,$5,$6) ON CONFLICT (user_id) do UPDATE set country=$2 , city=$3 , address=$4 , street_name=$5 , building_number=$6 where consumer_profiles.user_id=$1",
  //// "update consumer_profiles set country=$1 , city=$2 , address=$3 , street_name=$4 , building_number=$5 where user_id=$6 ",
  getEmpInfoQuery:
    "select employment_status , employer , currency , income , salary from consumer_profiles where user_id = $1",
  putEmpInfoQuery:
    "insert into consumer_profiles (employment_status , currency, income , employer,user_id , salary) values ($1,$2,$3,$4,$5,$6) ON CONFLICT (user_id) do UPDATE set employment_status=$1 , currency=$2 , income=$3 , employer=$4 , salary=$6 where consumer_profiles.user_id=$5",
  getFinInfoQuery:
    "select total_liabilities , loan , other_liabilities , credit_card , total_monthly_installments from consumer_profiles where user_id = $1",
  putFinInfoQuery:
    "insert into consumer_profiles (total_liabilities , loan , other_liabilities , credit_card , total_monthly_installments , user_id) values ($1,$2,$3,$4,$5,$6) ON CONFLICT (user_id) do UPDATE set total_liabilities=$1 , loan=$2 , other_liabilities=$3 , credit_card=$4 , total_monthly_installments=$5 where consumer_profiles.user_id=$6", // "update consumer_profiles set total_liabilities=$1 , loan=$2 , other_liabilities=$3 , credit_card=$4 , total_monthly_installments=$5 where user_id=$6",
  // total_liabilities,
  // loan,
  // other_liabilities,
  // credit_card,
  // total_monthly_installment,

  updateUserQuery: `insert into consumer_profiles (
    fullname_en, fullname_ar, gender, nationality ,birth_date , civil_id , phone , city ,
    employment_status , currency, income , employer , salary , user_id)

   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) 
   ON CONFLICT (user_id) do UPDATE set

   fullname_en=$1, fullname_ar=$2, gender=$3, nationality=$4 ,birth_date=$5 , civil_id=$6 , phone=$7 , city=$8 ,
   employment_status=$9 , currency=$10, income=$11 , employer=$12 , salary=$13 ;`,
  getSNotifications: "select * from notifications where sent_for=$1",

  getIfThereIsActiveLoanQuery:
    "select exists(select id from service_requests where userid=$1 and service_type=$2 and now() < expiry_date)",
  getAllOffersQuery: `select service_offers.id ,service_offers.note ,service_offers.bank_id , service_offers.offer_status, service_offers.created_at  , 
  fields_loan_offers.offered_amount ,  fields_loan_offers.offered_installments ,fields_loan_offers.offered_interest_rate ,
  service_requests.id as request_id , loan_fields.type as requested_loan_type , loan_fields.amount as requested_amount ,
  loan_fields.installments_number as requested_installments_number ,
  bank_profiles.bankname_en , bank_profiles.bankname_ar , bank_profiles.logo_url from service_offers 
    INNER JOIN bank_profiles ON service_offers.bank_id = bank_profiles.user_id
		INNER JOIN fields_loan_offers on fields_loan_offers.offer_id = service_offers.id
    INNER JOIN service_requests on service_requests.id = service_offers.request_id 
		INNER JOIN loan_fields on loan_fields.request_id  = service_requests.id 
	where service_requests.userid = $1`,

  getAllOffersQuery2: `select service_offers.id ,service_offers.note ,service_offers.bank_id , service_offers.offer_status, service_offers.created_at  , 
  service_requests.id as request_id ,  service_requests.service_type as service_type ,
  bank_profiles.bankname_en , bank_profiles.bankname_ar , bank_profiles.logo_url from service_offers 
    INNER JOIN bank_profiles ON service_offers.bank_id = bank_profiles.user_id
    INNER JOIN service_requests on service_requests.id = service_offers.request_id 
	where service_requests.userid = $1`,

  getGeneralOffersQuery: `select service_offers.id ,service_offers.note ,service_offers.bank_id , service_offers.offer_status, service_offers.created_at  , service_requests.service_type as request_type  ,
  service_requests.id as request_id, bank_profiles.bankname_en , bank_profiles.bankname_ar , bank_profiles.logo_url from service_offers
    INNER JOIN bank_profiles ON service_offers.bank_id = bank_profiles.user_id
    INNER JOIN service_requests on service_requests.id = service_offers.request_id 
	where service_requests.userid = $1 ORDER BY id DESC`,

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

  getSpeceficCarOffer: `select service_offers.id ,service_offers.note ,service_offers.bank_id , service_offers.offer_status, service_offers.created_at  , 
  fields_car_offers.offered_amount , fields_car_offers.offered_installments ,fields_car_offers.offered_monthly ,
  service_requests.id as request_id ,
  carleasing_fields.*,
  bank_profiles.bankname_en , bank_profiles.bankname_ar , bank_profiles.logo_url from service_offers 
    INNER JOIN bank_profiles ON service_offers.bank_id = bank_profiles.user_id
		INNER JOIN fields_car_offers on fields_car_offers.offer_id = service_offers.id
    INNER JOIN service_requests on service_requests.id = service_offers.request_id 
		INNER JOIN carleasing_fields on carleasing_fields.request_id  = service_requests.id 
     where service_requests.userid = $1 and  service_offers.id = $2
  `,

  homeScreenQueryRequests: `
  select * from service_requests  where service_requests.userid = $1 and now() < expiry_date ORDER BY id DESC limit 2  `,
  takeActionLoanQuery:
    "update service_offers set offer_status=$1 , action_time=now() where id=$2 and  EXISTS ( select 1 from service_requests where userid = $3 and service_requests.id= $4)",
  getUserByIdQuery: "select * from users where id=$1",
  changePasswordQuery: "update users set password=$1 where id=$2",
  getOfferedBankEmailQuery:
    "SELECT users.email from users where users.id= (SELECT bank_id from service_offers where service_offers.id=$1)",
};

const getProfileInfo = async (vals) => {
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getProfileInfo, [vals.userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  console.log(query);

  if (query.rows.length != 1) throw multiLingMessages.dbError;

  return query.rows[0];
};
const addProfileInfo = async (vals) => {
  //"insert into consumer_profiles (for_user , fullname_en, fullname_ar, gender, nationality, birth_date) values ($1,$2,$3,$4,$5,$6)",

  const {
    userid,
    fullname_ar,
    fullname_en,
    gender,
    nationality,
    birth_date,
    civil_id,
    phone,
    city,
  } = vals;
  const values = [
    userid,
    fullname_en,
    fullname_ar,
    gender,
    nationality,
    birth_date,
    nationality,
    civil_id,
    phone,
  ];

  if (
    !(
      userid &&
      fullname_ar &&
      fullname_en &&
      gender &&
      birth_date &&
      nationality &&
      civil_id &&
      phone
    )
  )
    throw multiLingMessages.missingPayload;

  if (city) values.push(city);

  const withCityQuery = `insert into consumer_profiles (user_id , fullname_en, fullname_ar, gender, nationality ,birth_date , country , civil_id , phone , city) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (user_id) do UPDATE set fullname_en=$2, fullname_ar=$3, gender=$4, nationality=$5, birth_date=$6 , civil_id=$8 , phone=$9 , city=$10`;
  const query = await client
    .query(city ? withCityQuery : queries.insertProfileInfo, values)
    .catch((e) => {
      console.log("user info ", e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};

const editProfileInfo = async (vals) => {
  const { userid, fullname_ar, fullname_en, gender, nationality, birth_date } =
    vals;
  const values = [
    fullname_en,
    fullname_ar,
    gender,
    nationality,
    birth_date,
    userid,
  ];
  console.log("birth date = ", vals);

  if (
    !(
      userid &&
      fullname_ar &&
      fullname_en &&
      gender &&
      birth_date &&
      nationality
    )
  )
    throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.updateProfileInfo, values)
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  console.log("user info added");

  return true;
};

const getResidentialInfo = async (vals) => {
  if (!vals.userid) throw multiLingMessages.missingPayload;
  console.log("user id = ", vals);
  const query = await client
    .query(queries.getResInfo, [vals.userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });

  if (query.rows.length != 1) {
    console.log("spec error  " + query.rows.length);
    throw multiLingMessages.dbError;
  }

  return query.rows[0];
};

const editAndAddResInfo = async (vals) => {
  const { userid, country, city, address, stname, bldnum } = vals;
  const values = [userid, country, city, address, stname, bldnum];

  if (!(userid && country && city && stname && bldnum && address))
    throw multiLingMessages.missingPayload;
  const query = await client.query(queries.putResInfo, values).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};

const getEmploymentInfo = async (vals) => {
  if (!vals.userid) throw "no user id found to get emp info";
  const query = await client.query(queries.getEmpInfoQuery, [vals.userid]);
  if (query.rows.length != 1) throw multiLingMessages.dbError;
  return query.rows[0];
};

const editAndAddEmpInfo = async (vals) => {
  // "insert into consumer_profiles (employment_status , currency, income , employer,user_id) values ($1,$2,$3,$4,$5) ON CONFLICT (user_id) do UPDATE set employment_status=$1 , currency=$2 , income=$3 , employer=$4 where user_id=$5",

  const { userid, status, employer, currency, income, salary } = vals;
  const values = [status, currency, income, employer, userid, salary];

  if (!(userid && status && employer && currency && income && salary))
    throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.putEmpInfoQuery, values)
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  console.log("user info added");

  return true;
};

const getFinancialInfo = async (vals) => {
  if (!vals.userid) throw multiLingMessages.missingPayload;
  console.log("user id = ", vals);
  const query = await client
    .query(queries.getFinInfoQuery, [vals.userid])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  console.log("user data = ", query.rows);
  if (query.rows.length != 1) throw multiLingMessages.dbError;
  return query.rows[0];
};

const editAndAddFinancialInfo = async (vals) => {
  const {
    userid,
    total_liabilities,
    loan,
    other_liabilities,
    credit_card,
    total_monthly_installment,
  } = vals;
  const values = [
    total_liabilities,
    loan,
    other_liabilities,
    credit_card,
    total_monthly_installment,
    userid,
  ];

  if (
    !(
      userid &&
      total_liabilities &&
      loan &&
      other_liabilities &&
      credit_card &&
      total_monthly_installment
    )
  )
    throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.putFinInfoQuery, values)
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  console.log("user info added");

  return true;
};

const getSpeceficNotifications = async (vals) => {
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getSNotifications, [vals.userid])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  return query.rows;
};

const loanDataValidator = (vals) => {
  const {
    userid,
    preferred_organization_type,
    preferred_business_type,
    type,
    amount,
    installments_number,
    fullname_ar,
    fullname_en,
    civil_id,
    nationality,
    country,
    city,
    currency,
    phone_number,
    gender,
    birth_date,
    employment_status,
    employer,
    income,
    salary,
  } = vals;

  if (
    !userid ||
    !preferred_organization_type ||
    !preferred_business_type ||
    !type ||
    !amount ||
    !installments_number ||
    !fullname_ar ||
    !fullname_en ||
    !civil_id ||
    !nationality ||
    !country ||
    !city ||
    !currency ||
    !phone_number ||
    !gender ||
    !birth_date ||
    !employment_status ||
    !employer ||
    !income ||
    !salary
  )
    throw multiLingMessages.missingPayload;
  return;
};
const carLeasingValidator = (vals) => {
  const { vbrand, vmodel, vcolor, model_year, condition, est_price } = vals;

  if (!(vbrand && vmodel && vcolor && model_year && condition && est_price))
    throw multiLingMessages.missingPayload;

  return;
};

const loanValidationStep1 = (vals) => {
  const {
    fullname_ar,
    fullname_en,
    civil_id,
    nationality,
    country,
    city,
    currency,
    phone_number,
    gender,
    birth_date,
  } = vals;

  if (!fullname_en) throw multiLingMessages.nameEnError;
  if (!fullname_ar) throw multiLingMessages.nameArError;
  if (!civil_id) throw multiLingMessages.civilIdError;
  if (civil_id.length < 10) throw multiLingMessages.civilIdInvalidError;
  if (!nationality) throw multiLingMessages.nationalityError;
  if (!country) throw multiLingMessages.countryError;
  if (!city) throw multiLingMessages.cityError;
  if (!phone_number) throw multiLingMessages.phone_numberError;
  if (phone_number.length < 10)
    throw multiLingMessages.phone_numberInvalidError;
  if (!gender) throw multiLingMessages.genderError;
  if (!birth_date) throw multiLingMessages.birth_dateError;

  return true;
};
const loanValidationStep2 = (vals) => {
  const { currency, employment_status, employer, income, salary } = vals;

  if (!currency) throw multiLingMessages.currencyError;
  if (!employment_status) throw multiLingMessages.employment_statusError;
  if (!employer) throw multiLingMessages.employerError;
  if (!income) throw multiLingMessages.incomeError;
  if (!salary) throw multiLingMessages.salaryError;

  return true;
};
const loanValidationStep3 = (vals) => {
  const {
    preferred_organization_type,
    preferred_business_type,
    type,
    amount,
    installments_number,
  } = vals;

  if (!preferred_business_type)
    throw multiLingMessages.preferred_business_typeError;
  if (!preferred_organization_type)
    throw multiLingMessages.preferred_organization_typeError;
  if (!type) throw multiLingMessages.typeError;
  if (!amount) throw multiLingMessages.amountError;
  if (!installments_number) throw multiLingMessages.installments_numberError;
  return true;
};
const loanApplyingValidation = async (step, vals) => {
  if (!vals) throw multiLingMessages.missingPayload;
  if (!vals.userid) throw "missing userid";
  delete vals.userid;
  switch (step) {
    case "1": {
      loanValidationStep1(vals);
      break;
    }
    case "2": {
      loanValidationStep2(vals);
      break;
    }
    case "3": {
      loanValidationStep3(vals);
      break;
    }
    default: {
      throw multiLingMessages.stepError;
    }
  }
  return true;
};
const isThereRunningLoan = async (userid, reqType) => {
  if (!userid) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getIfThereIsActiveLoanQuery, [userid, reqType])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  console.log(
    "is there running loan comparing to now ? ",
    query.rows[0].exists
  );
  if (query.rows[0].exists) throw multiLingMessages.alreadyActiveLoan;

  return query.rows[0].exists;
};
const xmlExtractor = async () => {
  const xmll = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
  <GetConsumerDetailsResponse xmlns="http://tempuri.org/">
  <GetConsumerDetailsResult><?xml version="1.0"?><ArrayOfCinetresponsewithscore xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><cinetresponsewithscore><LatestSalary>1172</LatestSalary><NumberOfLoans>2</NumberOfLoans><TypeOfLoans>Housing Finance,Consumer Finance</TypeOfLoans><totaloutstandingbalance>19985</totaloutstandingbalance><TotalInstallmentAmount>305</TotalInstallmentAmount><TotalCreditLimit>0</TotalCreditLimit><CreditCardMonthlyInstallment>0</CreditCardMonthlyInstallment><EntityScore>748</EntityScore></cinetresponsewithscore></ArrayOfCinetresponsewithscore></GetConsumerDetailsResult>
  </GetConsumerDetailsResponse>
  </soap:Body>
  </soap:Envelope>`;
  var parseString = require("xml2js").parseString;
  var xml = xmll;
  var data = {};
  var finalData = {};

  parseString(xml, function (err, result) {
    if (err) throw "xml handling error";
    const arrayData =
      result["soap:Envelope"]["soap:Body"][0].GetConsumerDetailsResponse[0]
        .GetConsumerDetailsResult[0].ArrayOfCinetresponsewithscore[0]
        .cinetresponsewithscore[0];
    data = arrayData;
    Object.keys(data).map((name) => {
      finalData[name.toLowerCase()] = data[name][0];
    });
    console.log(finalData);
  });
  return finalData;
};
const serviceRequestValidator = (vals) => {
  const {
    userid,
    preferred_organization_type,
    preferred_business_type,
    fullname_ar,
    fullname_en,
    civil_id,
    nationality,
    city,
    currency,
    phone_number,
    gender,
    birth_date,
    employment_status,
    employer,
    income,
    salary,
    // total_liabilities,
    // loan,
    // other_liabilities,
    // credit_card,
    // total_monthly_installment,
  } = vals;

  if (
    !userid ||
    !preferred_organization_type ||
    !preferred_business_type ||
    !fullname_ar ||
    !fullname_en ||
    !civil_id ||
    !nationality ||
    !city ||
    !currency ||
    !phone_number ||
    !gender ||
    !birth_date ||
    !employment_status ||
    !employer ||
    !income ||
    !salary
    // !total_liabilities ||
    // !loan ||
    // !other_liabilities ||
    // !credit_card ||
    // !total_monthly_installment
  )
    throw multiLingMessages.missingPayload;
  return;
};
const applyLoanController = async (vals) => {
  loanDataValidator(vals);
  await isThereRunningLoan(vals.userid, "loan");
  const addingFieldsQuery =
    "INSERT INTO loan_fields (request_id , type , amount , installments_number) values ($1,$2,$3,$4)";

  await client.query("BEGIN");
  const newReqId = await addAnyRequest(
    vals.userid,
    vals.preferred_organization_type,
    vals.preferred_business_type,
    "loan"
  );

  const query2 = await client
    .query(addingFieldsQuery, [
      newReqId,
      vals.type,
      vals.amount,
      vals.installments_number,
    ])
    .catch(async (e) => {
      if (e) {
        console.log("databse error after query : ", e);
        await client.query("ROLLBACK");
        throw multiLingMessages.dbError;
      }
    });

  await userProfileService(vals);

  await client.query("COMMIT");

  return true;
};

const applyCarLeaseController = async (vals) => {
  carLeasingValidator(vals);
  serviceRequestValidator(vals);

  await isThereRunningLoan(vals.userid, "car_leasing");
  const addingFieldsQuery =
    "INSERT INTO carleasing_fields ( request_id,	vbrand,	vmodel,	vcolor,	model_year,	condition,	est_price,	vlicense,	vin_no,	plate_no) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)";

  await client.query("BEGIN");
  const newReqId = await addAnyRequest(
    vals.userid,
    vals.preferred_organization_type,
    vals.preferred_business_type,
    "car_leasing"
  );

  const query2 = await client
    .query(addingFieldsQuery, [
      newReqId,
      vals.vbrand,
      vals.vmodel,
      vals.vcolor,
      vals.model_year,
      vals.condition,
      vals.est_price,
      vals.vlicense,
      vals.vin_no,
      vals.plate_no,
    ])
    .catch(async (e) => {
      if (e) {
        console.log("databse error after query : ", e);
        await client.query("ROLLBACK");
        throw multiLingMessages.dbError;
      }
    });

  await userProfileService(vals);

  await client.query("COMMIT");

  return true;
};

const addAnyRequest = async (
  userid,
  preferred_organization_type,
  preferred_business_type,
  service_type
) => {
  const creatingRequestQuery =
    "INSERT INTO service_requests (userid , preferred_organization_type , preferred_business_type , service_type ,status) VALUES ($1,$2,$3,$4,'active') RETURNING id";

  const query1 = await client
    .query(creatingRequestQuery, [
      userid,
      preferred_organization_type,
      preferred_business_type,
      service_type,
    ])
    .catch(async (e) => {
      if (e) {
        console.log("databse error after query : ", e);
        await client.query("ROLLBACK");
        throw multiLingMessages.dbError;
      }
    });
  return query1.rows[0].id;
};

const userProfileService = async ({
  fullname_en,
  fullname_ar,
  gender,
  nationality,
  birth_date,
  civil_id,
  phone_number,
  city,
  employment_status,
  currency,
  income,
  employer,
  salary,
  // total_liabilities,
  // loan,
  // other_liabilities,
  // credit_card,
  // total_monthly_installment,
  userid,
}) => {
  const values = [
    fullname_en,
    fullname_ar,
    gender,
    nationality,
    birth_date,
    civil_id,
    phone_number,
    city,
    employment_status,
    currency,
    income,
    employer,
    salary,
    // total_liabilities,
    // loan,
    // other_liabilities,
    // credit_card,
    // total_monthly_installment,
    userid,
  ];

  console.log(values);
  const query1 = await client
    .query(queries.updateUserQuery, values)
    .catch(async (e) => {
      if (e) {
        console.log("databse error after query 22: ", e);
        throw multiLingMessages.dbError;
      }
    });
  if (query1.rowCount != 1) throw multiLingMessages.dbError;
  return true;
};
const getOffersController = async (vals) => {
  //get all offers then assigned the more
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const userid = vals.userid;
  const allOffers = "select * from fields_loan_offers";
  const goffers = await client.query(queries.getSpeceficLoanOffer, [userid]);
  return goffers.rows;
};

const getHomeScreenDataController = async (vals) => {
  //home screen api is done
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const userid = vals.userid;
  const query = await client
    .query(
      queries.getAllOffersQuery2 +
        " and now() < service_offers.expiry_date ORDER BY id DESC limit 3",
      [userid]
    )
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });

  const query1 = await client
    .query(queries.homeScreenQueryRequests, [userid])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  const offers3 = query.rows;
  const request1 = query1.rows;

  return { offers: offers3, requests: request1 };
};
const takeActionForLoanController = async (vals) => {
  //payload has userid , offer id , action (true:accept , false:reject )
  const { userid, request_id, offer_id, action } = vals;

  if (!(userid && request_id && offer_id && action))
    throw multiLingMessages.missingPayload;

  var myAction = "";
  if (action == 1) myAction = "accepted";
  else if (action == 0) myAction = "rejected";
  else {
    throw multiLingMessages.missingPayload;
  }

  const query = await client
    .query(queries.takeActionLoanQuery, [
      myAction,
      offer_id,
      userid,
      request_id,
    ])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  await sendEmailForOfferedBank(offer_id);

  return true;
};
const sendEmailForOfferedBank = async (offerid) => {
  const query = await client
    .query(queries.getOfferedBankEmailQuery, [offerid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  const email = query.rows[0].email;
  const emimg = process.env.DOMAIN + "/assets/img/favez.png";
  const urlref = process.env.BANKDOMAIN + "/special-offers";

  await utils.sendEmail({
    to: email,
    subject: "User has taken an action",
    text: "new action",
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
            <p class="title">EZ credit Notification</p>
            <p>Hey there,</p>
            <p>
            An applicant has responded to your offer. Login to your account on EZ Credit to check the updates.
              ! !
            </p>
            <br />
            <a class="button" href='${urlref}'>
              Check Now
              </a>
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
const getProposalsController = async (vals) => {
  //get all offers with bank name and image
  if (!vals.userid) throw multiLingMessages.missingPayload;
  const userid = vals.userid;
  const goffers = await client.query(queries.getGeneralOffersQuery, [userid]);
  return goffers.rows;
};

const getOfferDetailsController = async (vals) => {
  //get one offer specefic data
  //request_type is mandatory

  if (!vals.userid || !vals.request_type)
    throw multiLingMessages.missingPayload;
  const { request_type, offer_id, userid } = vals;
  var query = "";
  if (request_type == "loan") query = queries.getSpeceficLoanOffer;
  else if (request_type == "car_leasing") query = queries.getSpeceficCarOffer;
  else throw "no request found";
  const goffers = await client.query(query, [userid, offer_id]);
  return goffers.rows;
};
module.exports = {
  getProfileInfo,
  addProfileInfo,
  editProfileInfo,
  getResidentialInfo,
  editAndAddResInfo,
  getEmploymentInfo,
  editAndAddEmpInfo,
  getFinancialInfo,
  editAndAddFinancialInfo,
  getSpeceficNotifications,
  applyLoanController,
  getOffersController,
  loanApplyingValidation,
  getHomeScreenDataController,
  xmlExtractor,
  takeActionForLoanController,
  changePasswordController,
  isThereRunningLoan,
  applyCarLeaseController,
  getProposalsController,
  getOfferDetailsController,
};
