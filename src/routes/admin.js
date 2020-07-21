var express = require("express");
var router = express.Router();
const uDB = require("../services/user");
const External = require("../models/external");
const mail = require("../services/mail");
const UserLog = require("../models/userlog");

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "admin" });
});

router.get("/register", function(req, res, next) {
  res.render("register", { message: "" });
});

router.post("/register", async (req, res, next) => {
  try {
    await uDB.addUser(req.body);
    // sending email to a new user
    if (process.env.MAIL_ENV !== "dev") {
      await mail.sendSingle({
        to: req.body.email,
        from: "admin@" + process.env.DOMAIN,
        subject: "Credentials for " + process.env.DOMAIN,
        text:
          "You have been registered with " +
          process.env.DOMAIN +
          ". \nEmail:" +
          req.body.email +
          " \nPassword:" +
          req.body.password
      });
    }
    res.render("register", { message: "Successfully Registered User" });
  } catch (error) {
    return next(error);
  }
});

router.get("/userlist", async (req, res, next) => {
  try {
    let users = await uDB.getAllUsers({ role: { $ne: "admin" } });
    users = await Promise.all(
      users.map(async u => {
        const uLog = await UserLog.find({ user: u._id });
        u.emailHistory = [];
        if (!uLog) {
          u.emailHistory.push({
            count: 0,
            date: new Date().toDateString()
          });
          return u;
        }
        u.emailHistory = uLog.map(ul => {
          return {
            count: ul.count,
            date: new Date(ul.timestamp).toDateString()
          };
        });
        return u;
      })
    );
    return res.render("adminuserlist", { users, message: "" });
  } catch (error) {
    return next(error);
  }
});
router.get("/externallist", async (req, res, next) => {
  try {
    const users = await External.find().populate(
      "owners",
      "name email role status"
    );
    return res.render("externallist", { users, message: "" });
  } catch (error) {
    return next(error);
  }
});

router.post("/updateuser", async (req, res, next) => {
  try {
    if (req.body.status !== "blocked" && req.body.status !== "allowed") {
      throw new Error("Incorrect status update");
    }
    let user = await uDB.getUser(req.body.id);
    user.status = req.body.status;
    await user.save();
    return res.redirect("/admin/userlist")
  } catch (error) {
    return next(error);
  }
});

router.get("/mailreports", async (req, res, next) => {
  try {
    if (req.query.type && req.query.type === "bounces") {
      const response = await mail.getBounced({
        start_time: req.query.start_time,
        end_time: req.query.end_time
      });

      return res.render("report-detail-spam", { emails: response.response });
    } else if (req.query.type && req.query.type === "spamreports") {
      const response = await mail.getSpamReports({
        start_time: req.query.start_time,
        end_time: req.query.end_time
      });

      return res.render("report-detail", { emails: response.response });
    } else if (req.query.type && req.query.type === "invalidemails") {
      const response = await mail.getInvalidEmails({
        start_time: req.query.start_time,
        end_time: req.query.end_time
      });

      return res.render("report-detail", { emails: response.response });
    }
    const stats = await mail.getGlobalStats();

    res.render("stats", { allstats: stats.response });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
