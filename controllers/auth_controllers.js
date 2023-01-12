"use strict";
const {
  multiLingMessages,
  responseSetter,
} = require("../helpers/standardResponse");
const { body, validationResult } = require("express-validator");

const client = require("../helpers/db_connect");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
// const db = require("../helpers/db_connect");
const nodemailer = require("nodemailer");

const queries = {
  getUserBlocked: "select * from auth where user_id=$1",
  addBankQuery:
    "insert into users (email , password , fcm_token , user_type ,user_device_info ,verified_at) values ($1,$2,$3,$4,$5, now()) RETURNING id , email",

  insertNewUser:
    "insert into users (email , password , fcm_token , user_type ,user_device_info) values ($1,$2,$3,$4,$5) RETURNING id , email",
  editVerifyQuery: "update users set verified_at=$1 where id=$2",
  checkOtpQuery:
    "select * from users_otp where user_id=$1 and otp_code=$2 and now() - expiry  <= interval '10 minutes'",
  insertOtp: `INSERT into users_otp (user_id , otp_code , created_at , expiry) VALUES ($1,$2 , now() , now() + interval '10 minutes' ) ON CONFLICT 
  (user_id) do UPDATE set otp_code=$2 , created_at=now() , expiry=(now() + interval '10 minutes') `,

  loginGetUserByEmail: "select * from users where email=$1 and user_type=$2",
  checkIfUserHasAuth: "select * from auth where user_id=$1",
  singleLoginQuery:
    "select exists(select 1 from auth where user_id=$1 and auth_token=$2)",
  insertUserAuth:
    "insert into auth (auth_token , status , user_id) values ($1,$2,$3)  on conflict (user_id) do update set auth_token=$1 where auth.status != 'blocked' ",
  updateUserAuth: "update auth set auth_token=$1 where user_id=$2",
  updateUserInfo:
    "update users set user_device_info=$1 , fcm_token=$2  , login_method='classic' , oauth_id = null , lang=$4 where id=$3",

  checkEmailQuery: "select * from users where email =$1 and user_type=$2",
  checkEmailbyIdQuery: "select * from users where id =$1",
  setNewPassQuery: "update users set password=$1 where id=$2",

  //   loginByProviderQuery: `insert into users
  // (email , password , fcm_token , user_type ,user_device_info ,verified_at , login_method , oauth_id )
  // values ($1,$2,$3,$4,$5,now(),$6,$7) ON CONFLICT (oauth_id) do UPDATE SET
  //   fcm_token = $3 , user_device_info = $5  , login_method=$6 RETURNING id`,

  //   loginByProviderGoogleQuery: `insert into users
  // (email , password , fcm_token , user_type ,user_device_info ,verified_at , login_method , oauth_id )
  // values ($1,$2,$3,$4,$5,now(),$6,$7) ON CONFLICT (email) do UPDATE SET
  //   fcm_token = $3 , user_device_info = $5  , login_method=$6  , oauth_id=$7 RETURNING id`,

  loginByProviderQuery: `UPDATE users SET fcm_token = $1 , user_device_info = $2  , login_method=$3  , oauth_id=$4 , lang=$6 where email=$5 OR oauth_id=$4 RETURNING id`,
  getBankEmpQuery: `select bank_id from bank_employee_profiles WHERE user_id = $1  `,
  logoutQuery: "update auth set auth_token='logged_out' where user_id=$1",
};

const adminAuthController = async (key) => {
  try {
    if (!key) throw "no token";
    const resp = await isValidToken(key);
    console.log("resp = ", resp);
    return resp;
  } catch (error) {
    return false;
  }
};
const emailValidation = (em) => {
  if (!em) return;
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
const authMiddleWare = async (req, res, next) => {
  // add db auth check if system only allow one login at a time
  if (
    req.url.includes("login") ||
    req.url.includes("logout") ||
    req.url.includes("check_otp") ||
    req.url.includes("config") ||
    req.url.includes("get_testimonials") ||
    req.url.includes("add_bank") ||
    req.url.includes("reset") ||
    req.url.includes("forget_pass") ||
    req.url.includes("change_pass") ||
    req.url.includes("signup") ||
    req.url.includes("get_lenders") ||
    req.url.includes("login_provider") ||
    req.path.includes("/index.html") ||
    req.path == "/usersandbanks.html" ||
    req.path == "/notific.html" ||
    req.path == "/"
  ) {
    console.log(
      "middle ware passed as its out of scope of middleware for this host "
    );

    next();
  } else {
    const tokenInAuth = req.get("auth");
    if (tokenInAuth) {
      //token is exist , check if its valid
      const isValid = await isValidToken(tokenInAuth);
      if (isValid) {
        next();
      } else {
        const myResp = responseSetter({
          result: false,
          data: {},
          httpstate: 401,
          errors: multiLingMessages.noAuth,
        });
        console.log("token not valid after check");
        res.status(401).send(myResp);
      }
      //res.redirect("LOGIN PAGE FOR EXAMPLE");
    } else {
      //token is not exist , reject request
      const myResp = responseSetter({
        result: false,
        data: {},
        httpstate: 401,
        errors: multiLingMessages.noAuth,
      });
      console.log("token not exist not found  ");
      res.status(401).send(myResp);
    }
  }
};
const singleLoginCheck = async (userid, token) => {
  const isExistAuth = await client
    .query(queries.singleLoginQuery, [userid, token])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  console.log("user exist = ", isExistAuth.rows[0].exists);

  if (isExistAuth.rows[0].exists == false) throw 101;
  else return true;
};
const isValidToken = async (token) => {
  const secret = process.env.SECRETJWT;
  try {
    jwt.verify(token, secret);
    return true;
  } catch (error) {
    console.log("error in token = ", error);
    return false;
  }
};
const userAuthMiddleware = async (req, res, next) => {
  try {
    const secret = process.env.SECRETJWT;
    var reqUid = null;
    const token = req.get("auth");
    const type = await jwt.verify(token, secret).role;
    if (type != "customer") {
      throw "not a user its a bank";
    }
    var authId = await jwt.verify(token, secret).user;

    if (req.method == "GET") {
      reqUid = req.query.userid;
    } else if (req.method == "POST") {
      reqUid = req.body.userid;
    }
    if (!reqUid) throw "userid not found neither in query or body";

    if (authId == reqUid) {
      //check if the token user sent is exist in DB to ensure , single login only at a time
      await singleLoginCheck(authId, token);
      next();
    } else throw "not valid token out of privilage";
  } catch (error) {
    console.log(error);
    const myResp = responseSetter({
      result: false,
      data: {},
      httpstate: 401,
      errors:
        error == 101
          ? multiLingMessages.logoutneeded
          : multiLingMessages.noAuth,
    });
    res.status(401).send(myResp);
  }
};
const bankAuthMiddleware = async (req, res, next) => {
  try {
    const secret = process.env.SECRETJWT;
    var reqUid = null;
    const token = req.get("auth");
    const type = await jwt.verify(token, secret).role;
    if (type != "bank") {
      throw "not a bank its a user";
    }
    var authId = await jwt.verify(token, secret).user;

    if (req.method == "GET") {
      reqUid = req.query.userid;
    } else if (req.method == "POST") {
      reqUid = req.body.userid;
    }
    if (!reqUid) throw "userid not found neither in query or body";

    if (authId == reqUid) {
      //check if the token user sent is exist in DB to ensure , single login only at a time
      await singleLoginCheck(authId, token);
      next();
    } else throw "not valid token out of privilage";
  } catch (error) {
    console.log(error);
    const myResp = responseSetter({
      result: false,
      data: {},
      httpstate: 401,
      errors:
        error == 101
          ? multiLingMessages.logoutneeded
          : multiLingMessages.noAuth,
    });
    res.status(401).send(myResp);
  }
};
const signUpUser = async ({ email, password, dos, dm, fcm, usertype }) => {
  console.log("SIGNING UP USER ");

  formValidator(email, password);

  //encrypt password by bycrypt
  //insert data into users table + usertype
  //generate salt to hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);
  const deviceInfo = { os_version: dos, device_model: dm };

  const values = [email, hashedPass, fcm, usertype, deviceInfo];
  const queryResult = await client
    .query(queries.insertNewUser, values)
    .catch((e) => {
      console.log("db error = ", e);
      if (e.code == 23505) throw multiLingMessages.emailExist; //email already exist
    });
  if (queryResult.rowCount != 1) throw multiLingMessages.emailExist;

  //"insert into users_otp (user_id  , otp_code) values ($1,$2)",

  var otpCode = Math.floor(Math.random() * 90000) + 10000;
  const newUserId = queryResult.rows[0].id;
  const newUserEmail = queryResult.rows[0].email;

  // if (!(newUserId && newUserEmail))
  //   throw "not successfully added to db sign up";

  await addOtpToDb(otpCode, newUserId);

  await sendOtp(newUserEmail, otpCode);
  //add otp to the database users_otp

  //generate otp of 5 digits ,

  return newUserId;
};
const bankEmpAuthMiddleware = async (req, res, next) => {
  try {
    const secret = process.env.SECRETJWT;
    var reqUid = null;
    const token = req.get("auth");
    const type = await jwt.verify(token, secret).role;
    if (type != "bank_employee") {
      throw "not a emp its a other acc";
    }
    var authId = await jwt.verify(token, secret).user;

    if (req.method == "GET") {
      reqUid = req.query.userid;
    } else if (req.method == "POST") {
      reqUid = req.body.userid;
    }
    if (!reqUid) throw "userid not found neither in query or body";

    if (authId == reqUid) {
      //check if the token user sent is exist in DB to ensure , single login only at a time
      await singleLoginCheck(authId, token);
      next();
    } else throw "not valid token out of privilage";
  } catch (error) {
    console.log(error);
    const myResp = responseSetter({
      result: false,
      data: {},
      httpstate: 401,
      errors:
        error == 101
          ? multiLingMessages.logoutneeded
          : multiLingMessages.noAuth,
    });
    res.status(401).send(myResp);
  }
};
const signUpBank = async ({ email, password, dos, dm, fcm, usertype }) => {
  console.log("SIGNING UP BANK ");

  formValidator(email, password);

  //encrypt password by bycrypt
  //insert data into users table + usertype
  //generate salt to hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);
  const deviceInfo = { os_version: dos, device_model: dm };

  const values = [email, hashedPass, fcm, "bank", deviceInfo];
  await client.query("BEGIN");
  const queryResult = await client
    .query(queries.addBankQuery, values)
    .catch((e) => {
      console.log("db error = ", e);
      if (e.code == 23505) throw multiLingMessages.emailExist; //email already exist
    });
  if (queryResult.rowCount != 1) throw multiLingMessages.emailExist;

  const newUserId = queryResult.rows[0].id;
  const newUserEmail = queryResult.rows[0].email;

  const jwt = await jwtGenerator(newUserId, "bank");
  await authTableHandler({ userId: newUserId, jwt: jwt });

  const addingToFilters = await client
    .query(`INSERT INTO filters (bank) VALUES ($1)`, [newUserId])
    .catch((e) => {
      console.log("db error = ", e);
    });
  if (addingToFilters.rowCount != 1) throw multiLingMessages.dbError;
  await client.query("COMMIT");

  return newUserId;
};
const addOtpToDb = async (otpCode, userid) => {
  console.log("ADDING OTP CODE TO USERS-OTP TABLE OR UPDATING IT");

  const query = await client
    .query(queries.insertOtp, [userid, otpCode])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError; //otpdb
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  return true;
};
const checkOtp = async (vals) => {
  const { userotp, userid } = vals;
  if (!(userotp && userid)) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.checkOtpQuery, [userid, userotp])
    .catch((e) => {
      if (e) throw multiLingMessages.otpCheck;
    });
  if (query.rowCount != 1) throw multiLingMessages.otpCheck;

  const timeNow = new Date();
  const changeVerfiedStatus = await client
    .query(queries.editVerifyQuery, [timeNow, userid])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  if (changeVerfiedStatus.rowCount != 1) throw multiLingMessages.dbError;

  return true;
};
const sendOtp = async (userEmail, otpCode) => {
  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EM,
      pass: process.env.EMPS,
    },
  });
  const emimg = process.env.DOMAIN + "/assets/img/favez.png";
  //const urlref = process.env.BANKDOMAIN + "/special-offers";
  var mailOptions = {
    from: process.env.EM,
    to: userEmail,
    subject: "EzCredit OTP service",
    text: "OTP verfication",
    html:
      // "<h2> Welcome to EZCREDIT </h2></br></br></br><h1>Your otp code : " +
      // otpCode +
      // "</h1>",
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Document</title>
          <style>
            @import url("https://fonts.googleapis.com/css2?family=Fredoka+One&family=Fredoka:wght@300;400;500&family=Glory:ital,wght@0,200;0,300;0,400;0,500;0,600;1,200;1,300;1,400;1,500;1,600&display=swap");
            a {
              font-weight: 500;
              font-size: 14px;
              line-height: 17px;
              color: #ffffff;
              text-decoration: none;
            }
            body {
              background: #fff;
              font-family: "Fredoka";
              margin: auto auto;
            }
            .title {
              font-size: 30px;
              font-weight: 500;
            }
            .allPage {
              display: grid;
              justify-items: center;
              justify-items: center;
              margin-left: auto;
              margin-right: auto;
              text-align: center;
            }
            .logoImg {
              margin-top: 1.5rem;
            }
            .con1 {
              margin: 1rem;
              text-align: center;
            }
            .con2 {
              margin: auto;
            }
            .number {
              font-size: 30px;
              font-weight: 400;
            }
            .sm{
              font-size:10px;
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
          <a target="_blank" href="">
            <img
              class="img"
              src="${emimg}"
              alt="logo-EZ-credit"
            />
          </a>
          </div>
            <div class="con1">
              <p class="title">Verification Code</p>
              <p class="number">${otpCode}</p>
              <div class="con2">
                <p>Here is your Verification code.</p>
                <p>It will expire in 10 minutes.</p>
                <p class="sm">no:${Date.now()}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
      `,
  };
  const info = await transporter.sendMail(mailOptions, (info, error) => {
    if (error) throw multiLingMessages.otpSendEmail;
  });
  console.log("SENT OTP TO THE USER EMAIL ", userEmail);

  return true;
};
const loginUser = async ({ email, password, dos, dm, fcm, lang, type }) => {
  console.log("LOGGING USER IN");
  if (!(email && password && dos && dm && fcm && type))
    throw multiLingMessages.missingPayload;
  formValidator(email, password);

  // 1 = decrypt and compare hashed password with the user input plain password,
  //check if email and password exist ,
  const qry = whichQuery(type);
  console.log("my qry ", qry);
  const dbQuery = await client.query(qry, [email]).catch((e) => {
    console.log("e ", e);
    if (e) throw { login_state: 0, err: multiLingMessages.loginEmailNotFound };
  });

  if (dbQuery.rows.length != 1)
    throw { login_state: 0, err: multiLingMessages.loginEmailNotFound };

  // return { login_state: 0, message: "email or password is incorrect" };
  const userResult = dbQuery.rows[0];

  const hashedPassword = userResult.password;
  const comparePass = await bcrypt.compare(password, hashedPassword);
  if (comparePass == false)
    throw { login_state: 50, err: multiLingMessages.loginPassWrong };

  if (!userResult.verified_at) {
    var otpCode = Math.floor(Math.random() * 90000) + 10000;
    await addOtpToDb(otpCode, userResult.id);
    await sendOtp(email, otpCode);
    throw { login_state: 75, err: multiLingMessages.loginEmailNotVerfied };
  }

  //-------------d-------------------------------------------------------------//
  const role = userResult.user_type;
  if (!role) throw multiLingMessages.dbError;

  // 2 = check if user has auth token , if yes update the token ,
  //if no auth already exist then add new row in auth for the user who is logging in
  const jwt = await jwtGenerator(userResult.id, role);
  await authTableHandler({ userId: userResult.id, jwt: jwt });
  //--------------------------------------------------------------------------//
  // 3 = update user info in users table
  const deviceInfo = { os_version: dos, device_model: dm };
  await updateUserAfterLogin({
    userid: userResult.id,
    device: JSON.stringify(deviceInfo),
    fcm: fcm,
    lang: lang,
  });
  //--------------------------------------------------------------------------//

  // 4 = get the latest updated data from auth table for the regarding table
  const userFromAuth = await getAuthStatus(userResult.id);
  //--------------------------------------------------------------------------//
  //if user is a bank emp then get the emps bank id and send it with the response,
  var bnkid;
  if (userResult.user_type == "bank_employee")
    bnkid = await getEmpBank(userResult.id);

  // 5 = send back the following =>  user id , is banned , email  , authtoken
  const responseData = {
    login_state: 100,
    userid: userResult.id,
    authToken: userFromAuth.auth_token,
    email: userResult.email,
    status: userFromAuth.status,
    role: role == "bank_employee" ? "bemp" : role,
    bkid: bnkid,
  };
  //--------------------------------------------------------------------------//

  return responseData;
};

const getEmpBank = async (empid) => {
  const query = await client
    .query(queries.getBankEmpQuery, [empid])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  console.log(query.rows[0].bank_id);

  return query.rows[0].bank_id;
};

/*
1. check if authid sent from user is correct with the verifiying a jwt token while its password is the client_id
2. get the client_id and email from request data and save it to database if exist then update data,
3. send back the user-id to the client side 

*/

const loginUserBy3dPartyController = async ({
  email,
  authid,
  dos,
  dm,
  fcm,
  provider, //google , facebook , apple
  client_token,
  lang,
}) => {
  console.log("LOGGING USER IN");

  if (!(email && authid && dos && dm && fcm && provider && client_token))
    throw multiLingMessages.missingPayload;

  //1 = check token coming from client side ,  why ? to avoid anyone has the api-link to access this route
  const isTokenValid = await checkGeneralToken(client_token, authid);
  if (isTokenValid == false) throw "error in token for 3dparty login";

  const password = email + "2020and2021";
  provider = provider.toLowerCase();

  const deviceInfo = JSON.stringify({ os_version: dos, device_model: dm });

  formValidator(email, password);
  const values = [fcm, deviceInfo, provider, authid, email, lang ? lang : "en"];

  // check if google or apple , then google = check email exist , apple check auth id and email exist
  var userid = null;

  const dbQuery = await client
    .query(queries.loginByProviderQuery, values)
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });

  if (dbQuery.rowCount != 1) throw multiLingMessages.login3d;
  userid = dbQuery.rows[0].id;

  // 2 = enter user or update it if user email is not exist the database if validated gave a true value ,

  //--------------------------------------------------------------------------//

  //3 = check if user has auth token , if yes update the token ,
  // if no auth already exist then add new auth for the user who is logging in for first time
  const jwt = await jwtGenerator(userid, "customer");
  await authTableHandler({ userId: userid, jwt: jwt });

  //--------------------------------------------------------------------------//

  // 4 = get the latest updated data from auth table for the regarding table to know if user blocked or active
  const userFromAuth = await getAuthStatus(userid);
  //--------------------------------------------------------------------------//

  // 5 = send back the following =>  user id , is banned , email  , authtoken
  const responseData = {
    login_state: 100,
    userid: userid,
    authToken:
      userFromAuth.status != "active"
        ? "blocked user no token"
        : userFromAuth.auth_token,
    email: email,
    status: userFromAuth.status,
    login_provider: provider,
  };
  //--------------------------------------------------------------------------//

  return responseData;
};
const updateUserAfterLogin = async ({ userid, device, fcm, lang }) => {
  const query = await client
    .query(queries.updateUserInfo, [device, fcm, userid, lang ? lang : "en"])
    .catch((e) => {
      if (e) throw multiLingMessages.dbError;
    });
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  return true;
};

const authTableHandler = async ({ userId, jwt }) => {
  const isExistAuth = await client
    .query(queries.insertUserAuth, [jwt, "active", userId])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  if (isExistAuth.rowCount != 1) throw multiLingMessages.BlockedError;

  return true;
};
const getAuthStatus = async (userid) => {
  const query = await client
    .query(queries.getUserBlocked, [userid])
    .catch((e) => {
      if (e) throw multiLingMessages.authHandlerError;
    });
  if (query.rowCount != 1) throw multiLingMessages.authHandlerError;
  console.log("got latest auth info for the user");

  return query.rows[0];
};

const jwtGenerator = async (id, role) => {
  const secret = process.env.SECRETJWT;
  var token = jwt.sign({ user: id, role: role }, secret, { expiresIn: "365d" });
  console.log("jwt created successfully = ", token);
  return token;
};

const whichQuery = (type) => {
  const webLoginQuery =
    "select * from users where users.email=$1 and users.user_type IN ('bank','bank_employee')";
  const adminloginQuery =
    "select * from users where email=$1 and users.user_type='admin'";
  const customerloginQuery =
    "select * from users where email=$1 and users.user_type='customer'";
  var dbQuery = null;
  if (type == "customer") {
    return customerloginQuery;
  } else if (type == "web") {
    return webLoginQuery;
  } else if (type == "admin") {
    return adminloginQuery;
  } else throw multiLingMessages.missingPayload;
};

//1.user send request for forgetPassword with his email --DONE
//2.server check if email exist , true? get userid , get email , get current password --DONE
//3.server make jwt token expiry 30 mins, including userid , email PLUS signed with the hashed old password,--DONE
//4.this will be added to the link and sent to the user email plus the userid in the get params,--DONE
//5.when user open link , server will get userid and get the hashed old password from the database  and try to decrypt the jwt, if true -> allow user to go to the page reset password,
//6.if not valid token go to not_valid.html, --DONE
//7. user will send url with same token and new hashed password and  user id , send request with that link to the server,
//8. server will get user id and hashed password and change the password ,

const resetChangePasswordController = async (vals, hostname) => {
  const taregtAcc = vals.type;
  if (!(vals.email && taregtAcc)) throw multiLingMessages.missingPayload;

  const userData = await resetCheckEmail(vals.email, taregtAcc);
  const resetToken = await jwtForReset(
    userData.userid,
    userData.email,
    userData.pass
  );
  const generatedLink = linkMaker(resetToken, userData.userid, hostname);
  const sendingEmail = await sendEmail(userData.email, generatedLink);

  return true;
};

const linkMaker = (token, userid, hostname) => {
  const link = `https://${hostname}/api/auth/reset_check?token=${token}&id=${userid}`;
  console.log("generatedLink = ", link);
  return link;
};
const resetCheckEmail = async (email, type) => {
  if (!email || !type) throw multiLingMessages.missingPayload;
  const qry = whichQuery(type);
  const query = await client.query(qry, [email]).catch((e) => {
    console.log(e);
    if (e) throw multiLingMessages.dbError;
  });
  console.log("data = ", query);
  if (query.rowCount != 1) throw multiLingMessages.loginEmailNotFound;

  return {
    userid: query.rows[0].id,
    email: query.rows[0].email,
    pass: query.rows[0].password,
  };
};

const resetCheckEmailbyId = async (userid) => {
  if (!userid) throw multiLingMessages.missingPayload;
  const query = await client
    .query(queries.checkEmailbyIdQuery, [userid])
    .catch((e) => {
      console.log(e);
      if (e) throw multiLingMessages.dbError;
    });
  console.log("user , ", query.rows);
  if (query.rowCount != 1) throw multiLingMessages.dbError;
  console.log("data = ", query.rows);
  return {
    userid: query.rows[0].id,
    email: query.rows[0].email,
    pass: query.rows[0].password,
  };
};

const jwtForReset = async (id, email, password) => {
  const secret = password;
  var token = jwt.sign({ user: id, email: email }, secret, {
    expiresIn: "5m",
  });
  console.log("jwt created successfully = ", token);
  return token;
};

const sendEmail = async (userEmail, data) => {
  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EM,
      pass: process.env.EMPS,
    },
  });
  const emimg = process.env.DOMAIN + "/assets/img/favez.png";
  var mailOptions = {
    from: process.env.EM,
    to: userEmail,
    subject: "EzCredit service",
    text: "ForgetPassword Resetting process ezcredit",
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
              font-weight: 500;
              font-size: 14px;
              line-height: 17px;
              color: #ffffff !important;
              text-decoration: none;
            }
            body {
              background: #fff;
              font-family: "Fredoka";
              margin: auto auto;
            }
            .title {
              font-size: 30px;
              font-weight: 500;
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
            .sm{
              font-size : 10px
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
          <a target="_blank" href="">
            <img
              class="img"
              src="${emimg}"
              alt="logo-EZ-credit"
            />
          </a>
          </div>
            <div class="con1">
              <p class="title">We got your request</p>
              <p>You can now reset your password!</p>
              <br />
              <a class="button" href='${data}'>
              Check Now
              </a>
              <br />
              <br />
              <div class="con2">
                <p>
                  Just so you know: You have 30 minutes to pick your password. After
                  that, you will have to ask for a new one.
                </p>
                <p>Did not ask for a new password? You can ignore this email.</p>
                <p class="sm">no:${Date.now()}</p>
                
              </div>
            </div>
          </div>
        </body>
      </html>`,
  };
  const info = await transporter.sendMail(mailOptions, (info, error) => {
    if (error) throw multiLingMessages.otpSendEmail;
  });
  console.log("SENT OTP TO THE USER EMAIL ", userEmail);

  return true;
};
const resetOpenLinkController = async (vals) => {
  const { id, token } = vals;
  if (!(id && token)) throw multiLingMessages.missingPayload;

  const userData = await resetCheckEmailbyId(id);
  const isValidTk = await checkIfValidJwt(token, userData.pass, id);
  if (isValidTk) {
    //user is correct
    return true;
  } else {
    throw "is invalid token";
  }
};

const resetPerformChangeController = async (vals) => {
  const { id, token, newps } = vals;
  if (!(id && token && newps)) throw multiLingMessages.missingPayload;
  console.log("my id ", id);

  const userData = await resetCheckEmailbyId(id);
  const isValidTk = await checkIfValidJwt(token, userData.pass, id);

  if (isValidTk) {
    //user is correct and its token correct, perform change pass
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(newps, salt);
    const query = await client
      .query(queries.setNewPassQuery, [hashedPass, id])
      .catch((e) => {
        if (e) throw multiLingMessages.dbError;
      });
    if (query.rowCount != 1) throw multiLingMessages.dbError;

    return true;
  } else {
    throw "is invalid token";
  }
};
const checkIfValidJwt = async (token, password, id) => {
  const secret = password;
  try {
    const tokId = await jwt.verify(token, secret).user;
    console.log(id);
    if (tokId != id) {
      throw "token id is not same as sent id";
    }
    return true;
  } catch (error) {
    console.log("error in token for reset= ", error);
    return false;
  }
};

const checkGeneralToken = async (token, password) => {
  const secret = password;
  try {
    await jwt.verify(token, secret);
    console.log("done check correct");
    return true;
  } catch (error) {
    console.log("error in token for reset= ", error);
    return false;
  }
};
const logoutController = async (userid) => {
  if (!userid) throw multiLingMessages.missingPayload;
  const query = await client.query(queries.logoutQuery, [userid]).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  console.log("user logged out success", query.rows);
  if (query.rowCount != 1) throw multiLingMessages.alreadyActiveLoan;

  return true;
};

const checkUserAuthController = async (userid) => {
  if (!userid) throw multiLingMessages.missingPayload;
  const query = await client.query(queries.logoutQuery, [userid]).catch((e) => {
    if (e) throw multiLingMessages.dbError;
  });
  console.log("user logged out success", query.rows);
  if (query.rowCount != 1) throw multiLingMessages.alreadyActiveLoan;

  return true;
};

module.exports = {
  authMiddleWare,
  sendOtp,
  userAuthMiddleware,
  signUpUser,
  loginUser,
  checkOtp,
  signUpBank,
  resetChangePasswordController,
  resetOpenLinkController,
  resetPerformChangeController,
  loginUserBy3dPartyController,
  bankAuthMiddleware,
  adminAuthController,
  authTableHandler,
  bankEmpAuthMiddleware,
  logoutController,
  singleLoginCheck,
};
