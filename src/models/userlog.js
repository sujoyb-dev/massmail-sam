const mongoose = require("mongoose");

const userlogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User"
    },
    count: {
      type: Number,
      default: 0
    },
    timestamp: { type: Number, default: new Date().getTime() }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Userlog", userlogSchema);
