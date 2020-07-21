const User = require("../models/user");
require("dotenv").config();

module.exports.addUser = async userDetails => {
  let user = await User.findOne({ email: userDetails.email });
  if (user) {
    throw new Error("User already registered");
  }
  let newUser = new User(userDetails);
  if (userDetails.password === process.env.ADMIN_PASS) {
    newUser.role = "admin";
  }
  newUser.password = newUser.generateHash(userDetails.password);
  user = await newUser.save();
  return user;
};

module.exports.getAllUsers = filter => User.find(filter).exec();
module.exports.getUser = id => User.findById(id).exec();
