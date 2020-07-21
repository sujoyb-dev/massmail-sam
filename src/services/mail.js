const sgMail = require("@sendgrid/mail");
const sgClient = require("@sendgrid/client");

module.exports.sendSingle = async details => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log(details);
    await sgMail.send(details);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};


// gets bounced mails
// start_time, UNIX timestamp
// end_time, UNIX timestamp
// limit, Number
// offset, Number
module.exports.getBounced = async options => {
  try {
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
    const response = await sgClient.request({
      method: "GET",
      url: "/v3/suppression/bounces",
      ...options
    });
    return { success: true, response: response[1] };
  } catch (error) {
    return { success: false, error };
  }
};

// gets bounced mails
// start_time, UNIX timestamp
// end_time, UNIX timestamp
// limit, Number
// offset, Number
module.exports.getSpamReports = async options => {
  try {
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
    const response = await sgClient.request({
      method: "GET",
      url: "/v3/suppression/spam_reports",
      ...options
    });
    return { success: true, response: response[1] };
  } catch (error) {
    return { success: false, error };
  }
};

// gets bounced mails
// start_time, UNIX timestamp
// end_time, UNIX timestamp
// limit, Number
// offset, Number
module.exports.getInvalidEmails = async options => {
  try {
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
    const response = await sgClient.request({
      method: "GET",
      url: "/v3/suppression/invalid_emails",
      ...options
    });
    return { success: true, response: response[1] };
  } catch (error) {
    return { success: false, error };
  }
};

// start_date, end_date, aggregated_by
module.exports.getGlobalStats = async () => {
  try {
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
    const response = await sgClient.request({
      method: "GET",
      url: "/v3/stats?start_date=2018-04-01&aggregated_by=month"
    });
    return { success: true, response: response[1] };
  } catch (error) {
    return { success: false, error };
  }
};

module.exports.sendBulk = async emailList => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    emailList = emailList.map(mail => mail.mailDetails);
    await sgMail.sendMultiple(emailList);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};
