const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const mailJobSchema = mongoose.Schema(
  {
    mailDetails: {
      toType: {
        type: String,
        enum: ["vendor", "recruiter"],
        required: true
      },
      from: { type: String, required: true },
      text: String,
      html: String,
      attachmentFiles: [
        {
          filepath: String,
          filename: String,
          filetype: String,
          disposition: { type: String, default: "attachment" }
        }
      ],
      isMultiple: { type: Boolean, default: false },
      cc: [{ type: String }],
      bcc: [{ type: String }],
      subject: String,
      replyTo: String
    },
    status: {
      type: String,
      enum: ["processed", "stored"],
      default: "stored"
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

mailJobSchema.plugin(encrypt, {
  encryptionKey: process.env.ENCRYPTION_KEY,
  signingKey: process.env.SIGNING_KEY,
  encryptedFields: ["mailDetails"]
});
module.exports = mongoose.model("MailJob", mailJobSchema);
