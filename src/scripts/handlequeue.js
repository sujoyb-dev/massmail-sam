require("dotenv").config();
const mongoose = require("mongoose");
const MailJob = require("../models/mailjob");
const External = require("../models/external");
const User = require("../models/user");
const UserLog = require("../models/userlog");
const Log = require("../models/log");
const mailer = require("../services/mail");
const fs = require("fs");
const path = require("path");
mongoose
  .connect(process.env.MONGO_URI_DEV, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true
  })
  .then(async () => {
    const response = await popAndSendMails();

    if (!response.success) {
      console.log(response.message);
      process.exit(1);
    }
    console.log("success");
    process.exit(0);
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });

const IP_WARMING_SCHEDULE = {
  0: 50,
  1: 50,
  2: 100,
  3: 500,
  4: 1000,
  5: 5000,
  6: 10000,
  7: 20000,
  8: 40000,
  9: 70000,
  10: 100000,
  11: 150000,
  12: 250000,
  13: 400000,
  14: 600000,
  15: 1000000,
  16: 2000000,
  17: 4000000
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

/**
 * @function popAndSendMails
 *
 * Pops mails from the queue and sends them.
 * To be periodically called
 */
const popAndSendMails = async () => {
  try {
    const datesPassed = Math.ceil(
      (new Date().getTime() - new Date(process.env.START_DATE).getTime()) /
        (1000 * 3600 * 24)
    );
    let today = new Date();
    today =
      today.getDate() +
      " " +
      months[today.getMonth()] +
      " " +
      today.getFullYear();
    today = new Date(today).getTime();

    let log = await Log.findOne({
      timestamp: {
        $lte: today + 24 * 60 * 60 * 1000,
        $gte: today
      }
    });

    if (log == null) log = new Log();

    let maxEmailLimit;
    if (datesPassed > 17 && datesPassed < 30) {
      maxEmailLimit = IP_WARMING_SCHEDULE[17] * Math.pow(2, datesPassed - 17);
    } else if (datesPassed <= 17) {
      maxEmailLimit = IP_WARMING_SCHEDULE[datesPassed];
    } else {
      maxEmailLimit = IP_WARMING_SCHEDULE[17] * Math.pow(2, 13); // pretty huge number
    }
    console.log(log.emailCount, maxEmailLimit);
    if (log.emailCount >= maxEmailLimit) {
      return { success: false, message: "Daily limit reached" };
    }
    const numOfEmails =
      Math.min(maxEmailLimit, process.env.MAX_BATCH_LIMIT_PER_CALL) -
      log.emailCount;

    const emails = await MailJob.find({ status: "stored" })
      .populate("sender", "role")
      .sort({ createdAt: 1 })
      .limit(numOfEmails);
    // .lean();
    console.log("TCL: popAndSendMails -> emails", emails);

    if (emails.length === 0) {
      // no emails to send
      return { success: false, message: "No emails to send" };
    }
    let cleanedEmails = [];
    await Promise.all(
      emails.map(async email => {
        console.log("TCL: popAndSendMails -> email", email);
        let attachments = [];
        let attachmentDetails = email.mailDetails.attachmentFiles;
        if (attachmentDetails.length !== 0) {
          attachmentDetails.forEach(file => {
            console.log(file);
            attachments.push({
              content: fs
                .readFileSync(
                  file.filepath
                  // path.join(
                  //   __dirname,
                  //   "..",
                  //   "..",
                  //   "uploads",
                  //   file.filepath.split("uploads/")[1]
                  // )
                )
                .toString("base64"),
              filename: file.filename,
              type: file.mimetype,
              disposition: file.disposition
            });
            // caching?
            fs.unlinkSync(file.filepath);
          });
        }
        console.log("1");

        // batching recipients into limits
        let batches = [];
        const { toType, ...others } = email.toJSON().mailDetails;
        console.log(email.toJSON().mailDetails);

        let to;
        if (email.sender.role === "admin") {
          to = await External.find({ role: toType, flag: "allowed" }, "email");
          console.log(to);
        } else {
          console.log("3");

          to = await External.find(
            { role: toType, owners: email.sender._id, flag: "allowed" },
            "email"
          );

          console.log("4");
        }
        console.log("5");

        to = to.map(e => e.email);
        console.log("TCL: popAndSendMails -> to", to);

        while (to.length) {
          batches.push(to.splice(0, process.env.MAX_TO_LIMIT));
        }
        batches.forEach(batch => {
          let finalMail = { mailDetails: { to: batch, ...others } };
          finalMail.mailDetails.personalizations = batch.map(recipient => {
            return {
              to: recipient
            };
          });
          finalMail.mailDetails.attachments = attachments;
          delete finalMail.mailDetails.to;
          delete finalMail.attachmentFiles;
          cleanedEmails.push(finalMail);
        });
        console.log("processed email to ", to);

        email.status = "processed";
        await email.save();
        let userLog = await UserLog.findOne({
          timestamp: {
            $lte: today + 24 * 60 * 60 * 1000,
            $gte: today
          },
          user: email.sender._id
        });
        if (!userLog) {
          userLog = new UserLog();
          userLog.user = email.sender._id;
        }
        userLog.count += 1;
        await userLog.save();
        console.log("updated user log");
        return Promise.resolve();
      })
    );

    console.log("TCL: popAndSendMails -> cleanedEmails", cleanedEmails);

    if (process.env.MAIL_ENV === "prod") {
      const response = await mailer.sendBulk(cleanedEmails);
      console.log(response);
    }
    const response = await mailer.sendBulk(cleanedEmails);
      console.log(response);

    log.emailCount += cleanedEmails.length;
    const logEmails = cleanedEmails.map(email => {
      return {
        to: email.mailDetails.personalizations.map(recipient => recipient.to),
        from: email.mailDetails.from
      };
    });
    if (log.emails && log.emails.length === 0) {
      log.emails = logEmails;
    } else {
      log.emails = log.emails.concat(logEmails);
    }
    await log.save();
    return { success: true };
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
