const client = require("../helpers/db_connect");
const currentBuildNumber = process.env.BUILDNUM; // parseFloat
const { multiLingMessages } = require("../helpers/standardResponse");
const utils = require("./utils_controllers");

const queries = {
  configQuery: "select * from config ORDER BY id DESC LIMIT 1",
  getCountriesQuery: "select * from countries",
  getCitiesQuery: "select * from cities where country=$1",
  getGNotifications: "select * from notifications where type='generic'",
  getTutorialsQuery: "select * from tutorials where target=$1",
  addTutorialsQuery:
    "INSERT INTO tutorials (title_en , title_ar , desc_en , desc_ar , vid_url , target ) VALUES ($1, $2, $3, $4, $5, $6)",
};

const handleConfig = async ({ mobileBuildNum }) => {
  if (!mobileBuildNum) throw multiLingMessages.missingPayload;
  var find = "\\.";
  var re = new RegExp(find, "g");

  var resMap = {};
  const dbb = await client.query(queries.configQuery).catch((e) => {
    console.log(e);
    if (e) throw multiLingMessages.dbError;
  });
  console.log(dbb);
  if (dbb.rows.length == 0) throw multiLingMessages.dbError;
  dbResult = dbb.rows[0];

  //this fx mainly take the build num as string for ex : 1.0.0.1 ,
  //and convert it to be able to efficiently compare between build num in database and the current mobile build version

  resMap.maintenance = dbResult.maintenance;
  resMap.current_app_build = dbResult.current_app_build;

  var removedDots = dbResult.current_app_build.replace(re, "");
  var mobileRemovedDots = mobileBuildNum.replace(re, "");
  const diff = Math.abs(removedDots.length - mobileRemovedDots.length);
  const diff0s = "0".repeat(diff);

  if (!(removedDots.length == mobileRemovedDots)) {
    console.log("build strings are not similar length ");
    if (removedDots.length > mobileRemovedDots.length) {
      console.log("db bigger length = ", removedDots.length);
      mobileRemovedDots = mobileRemovedDots + diff0s;
    } else if (removedDots.length < mobileRemovedDots.length) {
      console.log("mobile bigger length = ", mobileRemovedDots.length);
      removedDots = removedDots + diff0s;
    }
  }

  const buildint = parseInt(removedDots);
  const mobileBuildint = parseInt(mobileRemovedDots);

  const comparison = buildint > mobileBuildint;
  resMap.optional_update = comparison;

  return resMap;
};

const getAllCountries = async () => {
  const query = await client.query(queries.getCountriesQuery).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  return query.rows;
};
const getAllCities = async (vals) => {
  if (!vals.country) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getCitiesQuery, [vals.country])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });

  return query.rows;
};
const getGenericNotifications = async () => {
  const query = await client.query(queries.getGNotifications).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });

  return query.rows;
};

const addContactUsMessage = async (vals) => {
  const { userid, name, contact, msg } = vals;
  if (!(name.length >= 3 && msg.length >= 3 && contact))
    throw multiLingMessages.missingPayload;
  const type = await utils.emailValidation(contact);
  var query = `insert into inbox ( name , message , ${
    userid ? "uid , " : ""
  }  ${type ? "email" : "phone"}) values ($1 , $2 , ${
    userid ? "$3 , $4" : "$3"
  })`;
  var values = [name, msg];
  if (userid) values.push(userid);
  values.push(contact);
  if (type) {
    //its email
  } else {
    //its a phone
    if (contact.length < 8) throw multiLingMessages.phone_numberInvalidError;
  }
  console.log("my query = ", query);

  const resp = await client.query(query, values).catch((e) => {
    console.log(e);
    if (e) throw multiLingMessages.dbError;
  });

  return true;
};
const getTutorialsController = async (vals) => {
  const { target } = vals;
  if (!target || (target != "web" && target != "app"))
    throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.getTutorialsQuery, [target])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  return query.rows;
};

const addTutorialController = async (vals) => {
  // (title_en , title_ar , desc_en , desc_ar , vid_url , target ) VALUES ($1, $2, $3, $4, $5, $6)
  const { ten, tar, den, dar, url, target } = vals;
  if (!(target && ten && tar && den && dar && url))
    throw multiLingMessages.missingPayload;

  const values = [ten, tar, den, dar, url, target];
  const query = await client
    .query(queries.addTutorialsQuery, values)
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  return true;
};

module.exports = {
  handleConfig,
  getAllCountries,
  getAllCities,
  getGenericNotifications,
  addContactUsMessage,
  getTutorialsController,
  addTutorialController,
};
