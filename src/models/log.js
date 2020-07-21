const mongoose = require("mongoose");
const logSchema = mongoose.Schema(
  {
    timestamp: { type: Number, default: new Date().getTime() },
    emailCount: { type: Number, default: 0 },
    emails: [{ type: mongoose.Schema.Types.Mixed }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Log", logSchema);
