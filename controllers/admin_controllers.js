const { query } = require("express");
const client = require("../helpers/db_connect");
const {
  multiLingMessages,
  metaSetter,
  allEnums,
} = require("../helpers/standardResponse");
const axios = require("axios");
var jwt = require("jsonwebtoken");
const authControllers = require("../controllers/auth_controllers");

const queries = {
  getallTestimonials: "select * from testimonials",
  addNewQuery: "INSERT INTO TESTIMONIALS (NAME, BODY) VALUES ($1, $2) ",
  lendersQuery: "select * from bank_profiles",
  getBanksCount: "select count(*) from users where user_type='bank'",
  getUsersCount: "select count(*) from users where user_type='customer'",
  getRevenuesTotal: `SELECT DATE_TRUNC('month',created_at) AS  month, COUNT(id) AS count , sum(price + 0) as total FROM orders GROUP BY DATE_TRUNC('month',created_at);`,
  getLatestBanks: `select users.id , email , bankname_en , bank_type , logo_url ,created_at  from users 
  inner join bank_profiles on users.id = bank_profiles.user_id where user_type='bank' 
  ORDER BY users.id desc limit 10`,
  getNots: "select * from notifications order by id desc limit 30",
  insertNotificationQuery:
    "insert into notifications (title_en , title_ar , body_en , body_ar , type ) values ($1,$2,$3,$4,$5)",
  getFcms: "select fcm_token from users ",

  getUsersLength:
    "select count(*) from users inner join consumer_profiles on users.id = consumer_profiles.user_id where users.user_type='customer'",
  getUsersQuery: `select users.id , consumer_profiles.fullname_en , consumer_profiles.gender ,users.email , 
  users.created_at from users inner join consumer_profiles on users.id = consumer_profiles.user_id where users.user_type='customer'  
  ORDER BY users.id DESC`,

  getBanksLength: `select count(*)  from users 
  inner join bank_profiles on users.id = bank_profiles.user_id where user_type='bank' 
  `,

  getBanksQuery: `select users.id , email , bankname_en , bank_type , logo_url ,created_at  from users 
  inner join bank_profiles on users.id = bank_profiles.user_id where user_type='bank' 
  ORDER BY users.id desc`,
};

const getTestimonials = async () => {
  const resp = await client.query(queries.getallTestimonials).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  return resp.rows;
};
const addNewTestimonial = async (vals) => {
  const { name, body } = vals;
  if (!(name && body)) throw multiLingMessages.missingPayload;
  const resp = await client
    .query(queries.addNewQuery, [name, body])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  if (resp.rowCount != 1) throw multiLingMessages.dbError;
  return true;
};
const getLendersController = async (vals) => {
  const query1 = await client.query(queries.lendersQuery).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  const lenders = query1.rows;

  return lenders;
};

module.exports = {
  getTestimonials,
  addNewTestimonial,
  getLendersController,
};
