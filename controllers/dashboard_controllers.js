const { query } = require("express");
const client = require("../helpers/db_connect");
const {
  multiLingMessages,
  metaSetter,
  allEnums,
} = require("../helpers/standardResponse");
const axios = require("axios");
var jwt = require("jsonwebtoken");

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
  getFcms: "select fcm_token , lang from users ",

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

const getHomeScreenDataController = async (vals) => {
  //total users , total banks , total revenues , newest 10 banks
  const bnkcount = await client.query(queries.getBanksCount).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  const usersCount = await client.query(queries.getUsersCount).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  const revenues = await client.query(queries.getRevenuesTotal).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  const lbanks = await client.query(queries.getLatestBanks).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });

  var totalrev = 0;
  var totalOrders = 0;
  console.log(revenues.rows);
  revenues.rows.forEach((element) => {
    totalrev = totalrev + parseInt(element.total);
    totalOrders = totalOrders + parseInt(element.count);
  });
  const resp = {
    total_banks: bnkcount.rows,
    total_users: usersCount.rows,
    total_revenues: totalrev,
    total_orders: totalOrders,
    banks: lbanks.rows,
  };
  return resp;
};

const getAllNotificationsController = async () => {
  const query1 = await client.query(queries.getNots).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  const nots = query1.rows;
  return nots;
};

const sendNotificationController = async (vals) => {
  const { ben, bar, ten, tar } = vals;
  if (!ben || !bar || !ten || !tar) throw "error data";
  //get all users fcms
  const users = await client.query(queries.getFcms).catch((e) => {
    if (e) {
      console.log("error ", e);
      throw multiLingMessages.dbError;
    }
  });
  var fcms = [];
  const tokens = users.rows;
  console.log(tokens);

  tokens.forEach((element) => {
    fcms.push(element.fcm_token);
  });

  const url = "https://fcm.googleapis.com/fcm/send";
  const Serverkey =
    "key=AAAA8fSjCwQ:APA91bEATH9QqtUvFF621Bd4K2VyVXxIhJ0Ugr9JRPdoUJHPv1nb2D1Q_kHTTG08TENxNyva_4azBOMot0j6pXvLaLOsIiRCj6pecwmQwK9OieqmyB9ZJ0A6ur3D51ibDwiSMoq0jZ2O";
  const body = {
    notification: {
      body: ben,
      OrganizationId: "2",
      content_available: true,
      priority: "high",
      title: ten,
      sound: "app_sound.wav",
    },
    data: { priority: "high", content_available: true },
    to: "",
  };
  const headers = {
    "Content-Type": "application/json",
    Authorization: Serverkey,
  };
  //-------------------------------------
  //add notification to the database notification table
  const values = [ten, tar, ben, bar, "generic"];

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
  var count = 0;
  tokens.forEach(async (element) => {
    body.to = element.fcm_token;
    body.notification.title = element.lang == "ar" ? tar : ten;
    body.notification.body = element.lang == "ar" ? bar : ben;
    try {
      req = await axios.post(url, body, { headers }).catch((er) => {
        console.log("message fcm wrong");
      });
      if (req.status == 200 && req.data.success == 1) {
        console.debug(
          "message notification was sent",
          ++count + "|   ",
          fcms.length
        );
        return true;
      } else {
        return false;
      }
    } catch (er) {
      console.log("notifications not sent ," + er);
      return false;
    }
  });
};

const pageLimit = 10;

const getAllUsersController = async (vals) => {
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);

  console.log(queries.getUsersLength);

  const totalItemsLength = await client
    .query(queries.getUsersLength)
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  console.log("limit " + pageLimit + "  offset " + Math.abs(page - 1) * 10);

  const customizedQuery =
    queries.getUsersQuery +
    " limit " +
    pageLimit +
    "offset " +
    Math.abs(page - 1) * 10;
  const resp = await client.query(customizedQuery).catch((e) => {
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

const getAllBanksController = async (vals) => {
  const isnum = parseInt(vals.page);
  const page =
    !vals.page || vals.page == 0 || isNaN(isnum) ? 1 : parseInt(vals.page);

  const totalItemsLength = await client
    .query(queries.getBanksLength)
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
  console.log("limit " + pageLimit + "  offset " + Math.abs(page - 1) * 10);

  const customizedQuery =
    queries.getBanksQuery +
    " limit " +
    pageLimit +
    "offset " +
    Math.abs(page - 1) * 10;
  const resp = await client.query(customizedQuery).catch((e) => {
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

const loginController = (vals) => {
  const { em, ps } = vals;
  console.log("data ", em, ps);
  if (!em || !ps) throw "data error";
  if (process.env.ADMINEMAIL == em && process.env.ADMINPS == ps) {
    //get jwt
    const secret = process.env.SECRETJWT;
    var token = jwt.sign({ role: "admin" }, secret, {
      expiresIn: "30m",
    });
    return token;
  } else throw "login failed";
};

module.exports = {
  getHomeScreenDataController,
  sendNotificationController,
  getAllNotificationsController,
  getAllUsersController,
  getAllBanksController,
  loginController,
};
