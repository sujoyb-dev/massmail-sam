require("dotenv").config();
const mongoose = require("mongoose");
const External = require("../models/external");
const mailer = require("../services/mail");
mongoose
  .connect(process.env.MONGO_URI_DEV, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true
  })
  .then(async () => {
    const response = await flagBounces();
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

const flagBounces = async () => {
  const bounces = await mailer.getBounced({
    start_time: Date.now() - 3600 /* hourly limit */,
    end_time: Date.now()
  });

  if (bounces.response.length === 0) {
    return { success: false, message: "No emails to flag" };
  }

  bounces.response.forEach(async e => {
    await External.findOneAndUpdate({ email: e.email }, { flag: "blocked" });
  });
  return { success: true };
};
