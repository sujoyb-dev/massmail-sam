var express = require("express");
var router = express.Router();
const MailJob = require("../models/mailjob");
const External = require("../models/external");

const csv = require("csvtojson");
const multer = require("multer");

const upload = multer({
  dest: "uploads/"
});

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Vendor" });
});

router.get("/upload", function(req, res, next) {
  res.render("upload", { role: "vendor", message: "" });
});

// form fieldname should be uploadcsv
// assumed tags are seperated by '+'
router.post("/upload", upload.single("uploadcsv"), async (req, res, next) => {
  try {
    const csvFilePath = req.file.path;
    const records = await csv().fromFile(csvFilePath);
    let externals = [];
    const existingExternals = await External.find({});

    records.forEach(async record => {
      let { Email = "", tags = "", ...others } = record;
      const existingExternal = existingExternals.find(
        e => e.email === Email && e.role === "recruiter"
      );

      if (existingExternal && existingExternal.role === "recruiter") {
        if (
          existingExternal.owners.findIndex(
            e => e._id.toString() === req.user._id.toString()
          ) === -1
        ) {
          existingExternal.owners.push(req.user._id);
          await existingExternal.save();
          return;
        } else {
          return;
        }
      }
      let external = new External();
      external.email = Email;
      external.tags = tags.split("+");
      external.role = "recruiter";
      external.owners = [req.user._id];
      external.otherAttributes = {
        ...others
      };
      externals.push(external);
    });
    let batches = [];
    // split documents to insert in batches of 200
    while (externals.length) {
      batches.push(externals.splice(0, 200));
    }

    await Promise.all(batches.map(batch => External.insertMany(batch)));
    return res.render("upload", {
      message: "Successfully Uploaded",
      role: "vendor"
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/queuestatus", async (req, res, next) => {
  try {
    // inefficient AF. Will refactor with auto-incrementing indexes
    // after research
    const jobs = await MailJob.find()
      .sort({ createdAt: 1 })
      .exec();
    let emails = [];
    jobs.forEach((job, index) => {
      if (job.sender.equals(req.user._id))
        emails.push({
          mailDetails: job.mailDetails,
          position: index,
          createdAt: job.createdAt
        });
    });
    return res.json({ success: true, emails });
  } catch (error) {
    return next(error);
  }
});

router.get("/usersbytags", async (req, res, next) => {
  try {
    const { tags } = req.query;
    if (!tags) {
      throw new Error("No tags specified");
    }
    // all tags that match or any one match?
    const users = await External.find(
      { tags: { $all: tags }, role: "vendor" },
      "email tags"
    );
    return res.json({ success: true, users });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
