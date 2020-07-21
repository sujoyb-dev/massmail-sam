require("dotenv").config();
const mongoose = require("mongoose");
const MailJob = require("../models/mailjob");

mongoose
  .connect(process.env.MONGO_URI_DEV, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true
  })
  .then(async () => {
    const response = await cleanProcessed();
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

/**
 * @function cleanProcessed
 *
 * Pops processed mails from the queue and sends them.
 * To be periodically called
 */
const cleanProcessed = async () => {
  await MailJob.deleteMany({ status: "processed" });
  return { success: true };
};
