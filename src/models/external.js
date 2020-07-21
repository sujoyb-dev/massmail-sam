const mongoose = require("mongoose");

const externalSchema = mongoose.Schema({
  name: String,
  email: {
    type: String,
    // unique: true,
    required: true
  },
  owners: [
    {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User"
    }
  ],
  tags: [String],
  role: {
    type: String,
    enum: ["recruiter", "vendor", "uncategorized"],
    default: "uncategorized"
  },
  flag: {
    type: String,
    enum: ["blocked", "allowed"],
    default: "allowed"
  },
  otherAttributes: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model("External", externalSchema);
