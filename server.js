'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
// const passport    = require('passport');
// const LocalStrategy= require('passport-local');
// const session= require('express-session');
// const bcrypt=require('bcryptjs');

//*! DATABASE
const ObjectID = require('mongodb').ObjectID;
const mongo    = require('mongodb').MongoClient;

const routes   =require('./routes');
const auth     =require('./auth');


    

const app = express();
app.set('view engine','pug')

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



mongo.connect("mongodb://localhost:27017/login",(err, client) => {
  if(err) {
      console.log('Database error: ' + err);
  } else {
      console.log('Successful database connection');
         
      var db = client.db('login');//*! VERY MUCH IMPORTANT FOR MONGO 3.X.X

     

       
      auth(app,db);
      routes(app,db);


      var port=process.env.PORT || 3000;
      app.listen(port, () => {
        console.log("Listening on port " + port);
      });  
}});