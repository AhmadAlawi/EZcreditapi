const { query } = require("express");
const client = require("../helpers/db_connect");
const axios = require("axios");
const bcrypt = require("bcrypt");
const standars = require("../helpers/standardResponse");
const utilsController = require("./utils_controllers");

const {
  multiLingMessages,
  metaSetter,
  allEnums,
} = require("../helpers/standardResponse");
const { options } = require("nodemon/lib/config");

const queries = {
  insertNotificationQuery:
    "insert into notifications (title_en , title_ar , body_en , body_ar , sent_for , type , payload) values ($1,$2,$3,$4,$5,$6,$7)",
  getallTestimonials: "select * from testimonials",
  addBankProfileQuery:
    "INSERT into bank_profiles (user_id , bankname_en , bankname_ar , address , contact_number , contact_email , bank_type ,logo_url ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (user_id) do UPDATE set" +
    " bankname_en = $2 , bankname_ar=$3, address = $4 , contact_number = $5 , contact_email=$6 , bank_type = $7 ,logo_url=$8",
  getBankBTypeQuery: "select bank_type from bank_profiles where user_id=$1",
  insertOfferQuery: `INSERT into service_offers (bank_id ,  request_id , note)
  select $1,$2,$3 where not EXISTS (SELECT id from service_offers where bank_id = $1 and request_id = $2 and now() < expiry_date and  offer_status = 'pending' ) and 
  exists (select id from orders where bank_id=$1 and request_id=$2) RETURNING id`,

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

  addLogQuery: `insert into history (subject , operation , op_id) values ($1,$2,$3)`,

  getLoanRequestMoreQuery: `select loan_fields.* from loan_fields INNER JOIN service_requests ON loan_fields.request_id = service_requests.id 
  where loan_fields.request_id = $1  ;`,
  getCarRequestMoreQuery: `select carleasing_fields.* from carleasing_fields INNER JOIN service_requests ON carleasing_fields.request_id = service_requests.id 
  where carleasing_fields.request_id = $1  ;`,
  getProfileReportQuery: `select total_liabilities , other_liabilities , loan , credit_card , total_monthly_installments from consumer_profiles
  INNER JOIN service_requests on service_requests.userid = consumer_profiles.user_id 
  INNER JOIN orders on service_requests.id = orders.request_id 
  WHERE orders.bank_id =$1 and service_requests.id =$2 `,
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
};

const pageLimit = 10;

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

  if (filter.gender && (filter.gender == "male" || filter.gender == "female")) {
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.gender='${filter.gender}' ) `;
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
  return dynamicQuery;
};
const filterOffersHandler = async (filter) => {
  var dynamicQuery = "";
  if (filter.service_type) {
    dynamicQuery =
      dynamicQuery +
      ` and (service_requests.service_type='${filter.service_type}' ) `;
  }
  if (filter.gender) {
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.gender='${filter.gender}' ) `;
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
  return dynamicQuery;
};
const filterAcceptedHandler = async (filter) => {
  var dynamicQuery = "";

  if (filter.gender) {
    dynamicQuery =
      dynamicQuery + ` and (consumer_profiles.gender='${filter.gender}' ) `;
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

  return dynamicQuery;
};

const getAllRequestsFilterController = async (vals) => {
  if (!vals.userid || !vals.bkid) throw multiLingMessages.missingPayload;

  const bnkType = await getBankBType(vals.bkid);
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);
  if (!vals.filter) throw multiLingMessages.missingPayload;

  const dynamicQuery = await utilsController.filterHandler(vals.filter);
  console.log(dynamicQuery);

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
    .query(lnQuery, [bnkType, vals.bkid])
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
    .query(customizedQuery, [bnkType, vals.bkid])
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
const getAllPurchasedFilterController = async (vals) => {
  if (!vals.userid || !vals.bkid) throw multiLingMessages.missingPayload;
  // const bnkType = await getBankBType(vals.userid);
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
   INNER JOIN orders on service_requests.id = orders.request_id
   INNER JOIN history on service_requests.id = history.op_id
   WHERE orders.bank_id = $1 and history.subject=$2 and
   service_requests.id not in (select service_offers.request_id from service_offers where service_offers.bank_id = $1 ) ${dynamicQuery}
   ORDER BY orders.id DESC`;

  // `SELECT loan_requests.id, gender ,loan_requests.created_at as request_date ,loan_requests.user_credit_score ,latest_salary,	num_loans,	type_loans,	total_balance,	total_installments,	total_credit_limit,	credit_monthly_installments ,birth_date ,employment_status,income,salary,type,amount,installments_number ,
  // cities.id as city , cities.name_en as city_en , cities.name_ar as city_ar , countries.id AS nationality ,countries.name_en AS nationality_en , countries.name_ar AS nationality_ar ,
  // orders.id as order_id,order_status , order_note
  //  from loan_requests
  //  INNER JOIN countries on countries.id = loan_requests.nationality
  //  INNER JOIN cities on cities.id = loan_requests.city
  //  INNER JOIN orders on loan_requests.id = orders.request_id
  //  INNER JOIN history on loan_requests.id = history.op_id
  //  WHERE orders.bank_id = $1 and history.subject=$2 and
  //  loan_requests.id not in (select loan_offers.request_id from loan_offers where loan_offers.bank_id = $1 ) ${dynamicQuery}
  //  ORDER BY orders.id DESC
  // `;

  const lnQuery = `SELECT count(*) from service_requests 
  INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid 
  INNER JOIN countries on countries.id = consumer_profiles.nationality 
  INNER JOIN cities on cities.id = consumer_profiles.city
  INNER JOIN orders on service_requests.id = orders.request_id
  INNER JOIN history on service_requests.id = history.op_id
  WHERE orders.bank_id = $1 and history.subject=$2 and
  service_requests.id not in (select service_offers.request_id from service_offers where service_offers.bank_id = $1 ) ${dynamicQuery}
  `;
  const totalItemsLength = await client
    .query(lnQuery, [vals.bkid, vals.userid])
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
  const resp = await client
    .query(customizedQuery, [vals.bkid, vals.userid])
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
const getInvoicesController = async (vals) => {
  const { userid, bkid } = vals;
  if (!userid || !bkid) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getSumInvoices, [bkid])
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
  respData.forEach((element) => {
    const time = new Date(element.month);
    const fdate = time.toLocaleDateString("default", timeOptions);

    element.fdate = fdate;
  });

  const query2 = await client
    .query(queries.getAllinvoices, [bkid])
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

  return { byMonth: respData, all: respData2 };
};
const getAllOffersFilterController = async (vals) => {
  //in this ticket git test
  if (!vals.userid || !vals.bkid) throw multiLingMessages.missingPayload;
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);

  const dynamicQuery = await utilsController.filterOffersHandler(vals.filter);

  const query = `select service_offers.id , service_offers.request_id , service_offers.offer_status , service_offers.note , service_offers.created_at as offer_date,
	consumer_profiles.gender , service_requests.service_type as request_type,service_requests.created_at as request_date  ,
  consumer_profiles.birth_date ,consumer_profiles.employment_status,consumer_profiles.income,consumer_profiles.salary,
  cities.id as city , cities.name_en as city_en , cities.name_ar as city_ar , countries.id AS nationality ,
  countries.name_en AS nationality_en , countries.name_ar AS nationality_ar 
	from service_offers 
  INNER JOIN service_requests on service_requests.id = service_offers.request_id 
  INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid
	INNER JOIN countries on countries.id = consumer_profiles.nationality 
  INNER JOIN cities on cities.id = consumer_profiles.city 
  INNER JOIN history on service_offers.id = history.op_id
	where history.subject=$2 and history.operation='send_offer' and service_offers.bank_id=$1 ${dynamicQuery} ORDER BY service_offers.id DESC `;

  const lnQuery = `select count(*)
	from service_offers 
  INNER JOIN service_requests on service_requests.id = service_offers.request_id 
  INNER JOIN consumer_profiles on consumer_profiles.user_id = service_requests.userid
	INNER JOIN countries on countries.id = consumer_profiles.nationality 
  INNER JOIN cities on cities.id = consumer_profiles.city 
  INNER JOIN history on service_offers.id = history.op_id
	where history.subject=$2 and history.operation='send_offer' and service_offers.bank_id=$1 ${dynamicQuery} `;
  const totalItemsLength = await client
    .query(lnQuery, [vals.bkid, vals.userid])
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
    .query(customizedQuery, [vals.bkid, vals.userid])
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
const getAllAcceptedFilterController = async (vals) => {
  //in this ticket git test
  if (!vals.userid || !vals.bkid) throw multiLingMessages.missingPayload;
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
   INNER JOIN history on service_offers.id = history.op_id
   where  history.subject=$2 and history.operation='send_offer' and  service_offers.bank_id=$1 and offer_status='accepted'  ${dynamicQuery} ORDER BY service_offers.action_time DESC`;
  const lnQuery = `select count(*)
  from service_offers 
   INNER JOIN service_requests on service_requests.id = service_offers.request_id 
   INNER JOIN consumer_profiles on service_requests.userid = consumer_profiles.user_id 
   INNER JOIN countries on countries.id = consumer_profiles.nationality 
   INNER JOIN cities on cities.id = consumer_profiles.city 
   INNER JOIN history on service_offers.id = history.op_id
   where  history.subject=$2 and history.operation='send_offer' and  service_offers.bank_id=$1 and offer_status='accepted'  ${dynamicQuery} `;

  const totalItemsLength = await client
    .query(lnQuery, [vals.bkid, vals.userid])
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
    .query(customizedQuery, [vals.bkid, vals.userid])
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
const logHistory = async ({ subjectid, operation, opid }) => {
  const values = [subjectid, operation, opid];
  const resp = await client.query(queries.addLogQuery, values).catch((e) => {
    if (e) {
      console.log(e);
      throw multiLingMessages.dbError;
    }
  });
  if (resp.rowCount != 1) throw multiLingMessages.alreadyOfferExist;

  return true;
};
const bankSendOfferController = async (vals) => {
  const {
    userid,
    bkid,
    request_id,
    offered_interest_rate,
    offered_amount,
    offered_installments,
    offered_loan_type,
    note,
  } = vals;
  if (
    !userid ||
    !bkid ||
    !request_id ||
    !offered_interest_rate ||
    !offered_amount ||
    !offered_installments ||
    !offered_loan_type ||
    !note
  )
    throw multiLingMessages.missingPayload;
  const values = [
    bkid,
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
    .query(queries.getOneOfferQuery, [offerid, bkid])
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
  await logHistory({
    subjectid: vals.userid,
    operation: "send_offer",
    opid: newOfferData.id,
  });
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
  const Serverkey =
    "key=AAAA8fSjCwQ:APA91bEATH9QqtUvFF621Bd4K2VyVXxIhJ0Ugr9JRPdoUJHPv1nb2D1Q_kHTTG08TENxNyva_4azBOMot0j6pXvLaLOsIiRCj6pecwmQwK9OieqmyB9ZJ0A6ur3D51ibDwiSMoq0jZ2O";
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
  const bankid = vals.bkid;
  const empid = vals.userid;
  const reqid = vals.request_id;
  if (!bankid || !reqid || !empid) throw multiLingMessages.missingPayload;

  await client.query("BEGIN");
  const resp = await client
    .query(queries.bankBuyQuery, [bankid, reqid])
    .catch(async (e) => {
      if (e) {
        console.log(e);
        await client.query("ROLLBACK");

        throw multiLingMessages.dbError;
      }
    });

  if (resp.rowCount != 1) throw multiLingMessages.dbError;
  else {
    //here offer is saved successfully
    //so send notifiction to the user
    const resp = await client
      .query(queries.getFCMForUserOfferQuery, [reqid])
      .catch(async (e) => {
        if (e) {
          console.log(e);
          await client.query("ROLLBACK");

          throw multiLingMessages.dbError;
        }
      });
    if (resp.rowCount != 1) throw multiLingMessages.dbError;
    const fcm = resp.rows[0].fcm_token;
    const uid = resp.rows[0].id;
    const lang = resp.rows[0].lang;
    console.log(resp.rows);
    await sendNotification(
      fcm,
      multiLingMessages.buyReq.title,
      multiLingMessages.buyReq.body,
      // "one bank is interested in you",
      // "stay tuned with us !",
      {},
      uid,
      "buy_request",
      lang
    );

    await logHistory({
      subjectid: empid,
      operation: "buy_req",
      opid: reqid,
    });

    await client.query("COMMIT");

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

  await logHistory({
    subjectid: userid,
    operation: "change_ps",
    opid: userid,
  });

  return true;
};
const addEditNotepurchasedController = async (vals) => {
  //payload has userid (bank), order_id , note
  const { userid, bkid, order_id, note } = vals;

  if (!(userid && order_id && bkid)) throw multiLingMessages.missingPayload;

  const query = await client
    .query(queries.orderNoteQuery, [note, order_id])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  await logHistory({
    subjectid: userid,
    operation: "note_purchased",
    opid: order_id,
  });

  return true;
};
const addEditStatuspurchasedController = async (vals) => {
  const { userid, order_id, status, bkid } = vals;
  if (!(userid && order_id && status && bkid))
    throw multiLingMessages.missingPayload;

  const query = await client
    .query(queries.orderStatusQuery, [status, order_id])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  await logHistory({
    subjectid: userid,
    operation: "status_purchased",
    opid: order_id,
  });

  return true;
};
const setOfferPrivateStatusController = async (vals) => {
  const { userid, offer_id, status, bkid } = vals;
  if (!(userid && offer_id && status && bkid))
    throw multiLingMessages.missingPayload;

  await client.query("BEGIN");

  const query = await client
    .query(queries.offerPrivateStateQuery, [status, offer_id, bkid])
    .catch(async (e) => {
      console.log(e);
      await client.query("ROLLBACK");

      if (e) throw multiLingMessages.dbError;
    });
  console.log(query);
  if (query.rowCount != 1) {
    await client.query("ROLLBACK");
    throw multiLingMessages.dbError;
  }

  await logHistory({
    subjectid: userid,
    operation: "status_accepted",
    opid: offer_id,
  });

  await client.query("COMMIT");

  return true;
};
const setOfferNoteController = async (vals) => {
  const { userid, offer_id, note, bkid } = vals;
  if (!(userid && offer_id && bkid)) throw multiLingMessages.missingPayload;

  await client.query("BEGIN");

  const query = await client
    .query(queries.offerNoteQuery, [note, offer_id, bkid])
    .catch(async (e) => {
      console.log(e);
      await client.query("ROLLBACK");

      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) {
    await client.query("ROLLBACK");
    throw multiLingMessages.dbError;
  }
  await logHistory({
    subjectid: userid,
    operation: "note_accepted",
    opid: offer_id,
  });

  await client.query("COMMIT");

  return true;
};
const getOneOfferHandler = async (vals) => {
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

const getOneOfferController = async (vals) => {
  const { userid, offer_id, service, bkid } = vals;
  if (!(userid && offer_id && service && bkid))
    throw multiLingMessages.missingPayload;
  var qq = "";
  if (service == "loan") {
    qq = queries.getOneLoanOfferQuery;
  } else if (service == "car_leasing") {
    qq = queries.getOneCarOfferQuery;
  } else {
    throw "no service type";
  }

  //get the new offer details
  const gettingOffer = await client.query(qq, [offer_id, bkid]).catch((e) => {
    if (e) {
      console.log(e);
      throw multiLingMessages.dbError;
    }
  });
  //if (gettingOffer.rowCount != 1) throw multiLingMessages.dbError;
  const newOfferData = gettingOffer.rows[0];
  console.log("offer data = ", gettingOffer.rows);
  return newOfferData;
};

const getProfileReportController = async (vals) => {
  const { userid, bkid, request_id } = vals;
  if (!(userid && request_id && bkid)) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getProfileReportQuery, [bkid, request_id])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;

  return query.rows;
};

const getRequestDetailsContoller = async (vals) => {
  //get one offer specefic data
  //request_type is mandatory
  const { request_type, request_id, userid, bkid } = vals;
  if (!(request_type && request_id && userid && bkid))
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

const sendGeneralOffer = async (vals) => {
  const { userid, bkid, request_id, note } = vals;
  if (!userid || !request_id || !note || !bkid)
    throw multiLingMessages.missingPayload;
  const values = [bkid, request_id, note];

  const resp = await client
    .query(queries.insertOfferQuery, values)
    .catch(async (e) => {
      if (e) {
        console.log(e);
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
    bkid,
    offered_interest_rate,
    offered_amount,
    offered_installments,
  } = vals;
  if (
    !(bkid && offered_amount && offered_installments && offered_interest_rate)
  )
    throw multiLingMessages.missingPayload;

  const q =
    "insert into fields_loan_offers (	offer_id,	offered_amount,	offered_installments,	offered_interest_rate ) values ($1,$2,$3,$4)";
  await client.query("BEGIN");
  const offerNewid = await sendGeneralOffer(vals);
  console.log("new offer id = ", offerNewid);
  const values = [
    offerNewid,
    offered_interest_rate,
    offered_amount,
    offered_installments,
  ];

  const resp = await client.query(q, values).catch(async (e) => {
    if (e) {
      console.log(e);
      await client.query("ROLLBACK");

      throw multiLingMessages.alreadyOfferExist;
    }
  });
  if (resp.rowCount != 1) throw multiLingMessages.alreadyOfferExist;

  //------------------------------------
  //get the new offer details
  const gettingOffer = await client
    .query(queries.getOneLoanOfferQuery, [offerNewid, bkid])
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
  await logHistory({
    subjectid: userid,
    operation: "send_offer",
    opid: newOfferData.offer_id,
  });
  await client.query("COMMIT");

  return true;
};

const sendCarOfferController = async (vals) => {
  const {
    userid,
    bkid,
    offered_monthly,
    offered_amount,
    offered_installments,
  } = vals;
  if (
    !(
      userid &&
      offered_amount &&
      offered_installments &&
      offered_monthly &&
      bkid
    )
  )
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
      console.log(e);
      await client.query("ROLLBACK");

      throw multiLingMessages.alreadyOfferExist;
    }
  });

  if (resp.rowCount != 1) throw multiLingMessages.alreadyOfferExist;
  //------------------------------------
  //get the new offer details
  const gettingOffer = await client
    .query(queries.getOneCarOfferQuery, [offerNewid, bkid])
    .catch(async (e) => {
      if (e) {
        await client.query("ROLLBACK");
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  console.log("resp ", queries.getOneCarOfferQuery);

  if (gettingOffer.rowCount != 1) throw multiLingMessages.dbError;
  const newOfferData = gettingOffer.rows[0];
  console.log("offer data = ", gettingOffer.rows);

  //------------------------------------
  //here offer is saved successfully
  //so send notifiction to the user
  const resp1 = await client
    .query(queries.getFCMForUserOfferQuery, [vals.request_id])
    .catch(async (e) => {
      if (e) {
        console.log(e);
        await client.query("ROLLBACK");
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
  await logHistory({
    subjectid: userid,
    operation: "send_offer",
    opid: newOfferData.offer_id,
  });
  await client.query("COMMIT");

  return true;
};

const readFiltersController = async (vals) => {
  const { userid, bkid } = vals;
  if (!userid) throw multiLingMessages.missingPayload;
  const q = await client.query(`select * from filters where bank=${bkid}`);
  const rows = q.rows;

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

module.exports = {
  readFiltersController,
  bankSendOfferController,
  bankBuyProfileController,
  changePasswordController,
  getAllRequestsFilterController,
  addEditNotepurchasedController,
  addEditStatuspurchasedController,
  getAllPurchasedFilterController,
  getAllOffersFilterController,
  getAllAcceptedFilterController,
  getInvoicesController,
  setOfferPrivateStatusController,
  setOfferNoteController,
  logHistory,
  getRequestDetailsContoller,
  getProfileReportController,
  sendCarOfferController,
  sendLoanOfferController,
  getOneOfferController,
};
