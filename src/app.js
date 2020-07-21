require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport = require("passport");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const vendorRouter = require("./routes/vendor");
const recruiterRouter = require("./routes/recruiter");
const mailRouter = require("./routes/mail");

const auth = require("./middleware/authentication");
const mongoose = require("mongoose");
const session = require("cookie-session");
const flash = require("connect-flash");
const mail = require("./services/mail");
mail.sendSingle({});

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(process.env.MONGO_URI_DEV, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true
  })
  .then(() => {
    console.log("Connection successful");
  })
  .catch(err => {
    console.log(err);
  });

const keys = ["Ron", "Swanson"];
const expiryDate = new Date(5 * Date.now() + 60 * 60 * 1000);
app.use(
  session({
    secret: "mustache",
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: true,
      expires: expiryDate
    },
    keys: keys
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.all("/admin*", auth.isAdmin);
app.all("/vendor*", auth.isVendor);
app.all("/recruiter*", auth.isRecruiter);

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/recruiter", recruiterRouter);
app.use("/vendor", vendorRouter);
app.use("/mail", mailRouter);

require("./config/passport")(passport);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
