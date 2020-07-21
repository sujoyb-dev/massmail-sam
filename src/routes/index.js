var express = require("express");
var router = express.Router();
const auth = require("../middleware/authentication");
const MailJob = require("../models/mailjob");
const External = require("../models/external");

/* GET home page. */
router.get("/", function(req, res, next) {
  if (req.user) res.redirect("/home");
  res.render("index");
});

router.get("/home", auth.isLoggedIn, (req, res, next) => {
  let options = [];
  switch (req.user.role) {
    case "admin":
      options = [
        {
          title: "Recruiter Mail Posting",
          url: "/mail/requirement"
        },
        {
          title: "Bench Sales Posting",
          url: "/mail/vendor"
        },
        {
          title: "Check queue status",
          url: "/queuestatus"
        },
        {
          title: "See mail reports",
          url: "/admin/mailreports"
        },
        // {
        //   title: "Upload Data",
        //   url: "/admin/upload"
        // },
        {
          title: "Register a Client",
          url: "/admin/register"
        },
        {
          title: "List all Clients",
          url: "/admin/userlist"
        },
        {
          title: "List all uploaded vendors/recruiters",
          url: "/admin/externallist"
        }
      ];
      break;
    case "recruiter":
      options = [
        {
          title: "Recruiter Mail Posting",
          url: "/mail/requirement"
        },
        {
          title: "Upload Data",
          url: "/recruiter/upload"
        },
        {
          title: "Check queue status",
          url: "/queuestatus"
        },
        {
          title: "List uploads",
          url: "/listusers"
        }
      ];
      break;
    case "vendor":
      options = [
        {
          title: "Bench Sales Posting",
          url: "/mail/vendor"
        },
        {
          title: "Upload Data",
          url: "/vendor/upload"
        },
        {
          title: "Check queue status",
          url: "/queuestatus"
        },
        {
          title: "List uploads",
          url: "/listusers"
        }
      ];
      break;

    default:
      break;
  }
  return res.render("home", { options });
});

router.get("/logout", (req, res, next) => {
  req.logout();
  res.redirect("/");
});

/**
 * GET /queuestatus
 *
 * params = emails*
 */
router.get("/queuestatus", auth.isLoggedIn, async (req, res, next) => {
  try {
    let emailsToQuery;
    const jobs = await MailJob.find({ status: "stored" })
      .sort({ createdAt: 1 })
      .populate("sender", "email")
      .exec();
    const processedJobs = await MailJob.find({ status: "processed" })
      .sort({ createdAt: 1 })
      .populate("sender", "email")
      .exec();
    if (req.user.role === "admin") {
      emailsToQuery = req.query.emails;
      if (!emailsToQuery) {
        let emails = [];
        jobs.forEach((job, index) => {
          emails.push({
            mailDetails: job.mailDetails,
            position: index,
            createdAt: job.createdAt,
            senderEmail: job.sender.email,
            status: job.status
          });
        });
        processedJobs.forEach(job => {
          emails.push({
            mailDetails: job.mailDetails,
            position: "-",
            createdAt: job.createdAt,
            senderEmail: job.sender.email,
            status: job.status
          });
        });

        return res.render("queue", { emails });
        // return res.json({ success: true, emails });
      }
    }

    let emails = [];
    jobs.forEach((job, index) => {
      if (job.sender._id.toString() === req.user._id.toString()) {
        emails.push({
          mailDetails: job.mailDetails,
          position: index,
          createdAt: job.createdAt,
          senderEmail: job.sender.email,
          status: job.status
        });
      }
    });
    processedJobs.forEach(job => {
      if (job.sender._id.toString() === req.user._id.toString()) {
        emails.push({
          mailDetails: job.mailDetails,
          position: "-",
          createdAt: job.createdAt,
          senderEmail: job.sender.email,
          status: job.status
        });
      }
    });
    return res.render("queue", { emails });
  } catch (error) {
    return next(error);
  }
});

router.get("/listusers", auth.isLoggedIn, async (req, res, next) => {
  const users = await External.find(
    { owners: req.user._id },
    "email role flag"
  );
  return res.render("userlist", { users });
});

module.exports = router;
