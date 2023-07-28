var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session =require('express-session')
const bodyParser=require('body-parser')
const hbs = require('express-handlebars')
const handlebars = require('handlebars');


const handlebarsHelpers = require("handlebars-helpers");


var mongoose = require("mongoose")
mongoose.connect("mongodb+srv://tomailabin:Xihh2Lxtk88c47Ab@cluster0.6rzwv9g.mongodb.net/",console.log("Connected To DB...."))
 
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');


var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.engine('hbs',hbs.engine({extname:'hbs',
defaultLayout:null,
helpers:handlebarsHelpers()}))
// hbs.registerHelper(handlebarsHelpers);

handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(helpers);



app.use(session({
  secret:"mysecretKey",
  resave:false,
  saveUninitialized:true,
  cookie:{maxAge:6000000000}
}))
app.use('/', usersRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;




 // "http-errors": "~1.6.3",