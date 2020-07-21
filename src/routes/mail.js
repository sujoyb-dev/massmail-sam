var express = require("express");
var router = express.Router();
const auth = require("../middleware/authentication");
// const mailer = require("../services/mail");
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 1024 * process.env.MAX_ATTACHMENT_SIZE_KB }
});

const MailJob = require("../models/mailjob");

router.get("/requirement", auth.isRecruiterOrAdmin, function(req, res, next) {
  res.render("mail", { vendor: false, message: "" });
});

router.get("/vendor", auth.isVendorOrAdmin, function(req, res, next) {
  res.render("mail", { vendor: true, message: "" });
});

/**
 * POST /requirement
 * args: to, from, subject, html/text
 */
router.post(
  "/requirement",
  auth.isRecruiterOrAdmin,
  upload.none(),
  async (req, res, next) => {
    try {
      let { mailcontent = "", subject = "Recruiter Mail Posting" } = req.body;
      let mailJob = new MailJob({
        mailDetails: {
          toType: "vendor",
          from: req.user.email,
          replyTo: req.user.email,
          html: mailcontent,
          subject
        }
      });
      mailJob.status = "stored";
      mailJob.sender = req.user._id;
      await mailJob.save();
      return res.render("mail", {
        vendor: false,
        message: "Mail successfully added to queue"
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * POST /vendor
 * args: to, from, subject, html/text
 * name property in form is attachments
 */
router.post(
  "/vendor",
  auth.isVendorOrAdmin,
  upload.array("attachments", process.env.MAX_NUM_ATTACHMENTS), // max limit of attachments in a single mail
  async (req, res, next) => {
    try {
      let attachmentFiles = [];
      let mimetypesToAllow = [
        "application/vnd.oasis.opendocument.text",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      for (let file of req.files) {
        if (mimetypesToAllow.indexOf(file.mimetype) === -1) {
          throw new Error("Incorrect mime type, use word/pdf");
        }
        console.log(file.originalname);

        attachmentFiles.push({
          filepath: file.path,
          filename: file.originalname,
          filetype: file.mimetype
        });
      }

      let { mailcontent = "", subject = "Bench Sales Posting" } = req.body;

      let mailJob = new MailJob({
        mailDetails: {
          toType: "recruiter",
          from: req.user.email,
          replyTo: req.user.email,
          html: mailcontent,
          subject,
          attachmentFiles
        }
      });
      mailJob.status = "stored";
      mailJob.sender = req.user._id;
      await mailJob.save();

      return res.render("mail", {
        vendor: true,
        message: "Mail successfully added to queue"
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
