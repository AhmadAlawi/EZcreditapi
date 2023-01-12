const CronJob = require("node-cron");
const client = require("../helpers/db_connect");
const bempControllers = require("../controllers/bank_emp_controller");

exports.initScheduledJobs = () => {
  console.log("cron is initiated");
  const scheduledJobFunction = CronJob.schedule("0 0 0 * * *", async () => {
    console.log("I'm executed on a schedule!");
    try {
      await checkExpiredOffersJob();
      await deleteFakeUsers();

      console.log("CRON JOB WORKED COMPLETELY ", new Date());
    } catch (error) {
      console.log("cron job error ", error);
      scheduledJobFunction.stop();
      console.log("stopped crons job cause of error");
    }
  });

  scheduledJobFunction.start();
};

async function checkExpiredOffersJob() {
  await client.query("BEGIN");
  const queryTxt =
    "update loan_requests set status='expired' where now() > expiry_date and status!= 'expired' ";
  const query = await client.query(queryTxt).catch((e) => {
    if (e) console.log(e);
  });
  console.log(
    query,
    "loan_requests expiry has been cleaned and organized rows affectd = ",
    query.rowCount
  );
  await logger({ operation: "cron_expiry", other_data: query.rowCount });

  await client.query("COMMIT");
}
async function deleteFakeUsers() {
  await client.query("BEGIN");
  const queryTxt =
    "delete from users where  verified_at is NULL and now() - created_at >= INTERVAL '30 days'";
  const query = await client.query(queryTxt).catch((e) => {
    if (e) console.log(e);
  });
  console.log("old and inactive users has been cleared ", query.rowCount);
  //cron_delete
  await logger({ operation: "cron_delete", other_data: query.rowCount });

  await client.query("COMMIT");
}

async function logger({ operation, other_data }) {
  const addLogQuery = `insert into history (operation , other_data) values ($1,$2)`;

  const resp = await client
    .query(addLogQuery, [operation, other_data])
    .catch((e) => {
      if (e) {
        console.log(e);
        throw multiLingMessages.dbError;
      }
    });
}
