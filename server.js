'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const passport    = require('passport');
const LocalStrategy= require('passport-local');
const session= require('express-session');
const bcrypt=require('bcryptjs');
//*! DATABASE
const ObjectID = require('mongodb').ObjectID;
const mongo       = require('mongodb').MongoClient;


    

const app = express();
app.set('view engine','pug')

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret:'MySecret', //process.env.SESSION_SECRET,==this is for production
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongo.connect("mongodb://localhost:27017/login",(err, client) => {
  if(err) {
      console.log('Database error: ' + err);
  } else {
      console.log('Successful database connection');
         
      var db = client.db('login');//*! VERY MUCH IMPORTANT FOR MONGO 3.X.X

      // *!SERIALIZE AND DESIRIALIZE USER       
      passport.serializeUser((user, done) => {
        done(null, user._id);
      });

      passport.deserializeUser( (id, done) => {
          db.collection('users').findOne(
              {_id: new ObjectID(id)},
              (err, doc) => {
                  done(null, doc);
              }
          );
      });

      // *! PASSPORT STRATEGY LOCAL   
      passport.use(new LocalStrategy(
        function(username, password, done) {
          db.collection('users').findOne({ username: username }, function (err, user) {
            console.log('User '+ username +' attempted to log in.');
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            // if (password !== user.password) { return done(null, false); }//** */!REPLACED BCOZ OF HASHING 
            if(!bcrypt.compareSync(password,user.password)){return done(null,false);}
            return done(null, user);
          });
        }
      ));

      // *! HOME ROUTE
      app.route('/')
        .get((req, res) => {
          res.render(process.cwd() + '/views/pug/index', {
            title: 'Hello',
             message: 'login', 
              showLogin: true,
              showRegistration:true
            });
        });

      // *! LOGIN ROUTE
      app.route('/login')
        .post(passport.authenticate('local', { failureRedirect: '/' }),(req,res) => {
             res.redirect('/profile');
        });
      // *!LOGOUT ROUTE       
      app.route('/logout').get((req,res)=>{
      req.logout();
      res.redirect('/');

      });

      // *!REGISTRATION ROUTE       
      app.route('/register').post((req,res,next)=>{
      //    var username=req.body.username;
      // const password=req.body.password;
      // res.send(req.body);
        db.collection('users').findOne({username:req.body.username},(err,user)=>{
           if(err){
             next(err);
           }
           else if(user){
            res.redirect('/');
           }
           else{
       var hash = bcrypt.hashSync(req.body.password, 12);
             db.collection('users').insertOne(
               {username:req.body.username,
                password:hash},
                  (err,doc)=>{
               if(err){
                 res.redirect('/');
               }
               else{
                 next(null,user)
               }
             }
            )
           }
        }
      )
      },
      passport.authenticate('local', { failureRedirect: '/' }),(req,res,next) => {
        res.redirect('/profile'); 
      }
    
      );
       
        // *! ENSURE AUTHENTICATION READ BELOW
      //** The challenge here is creating the middleware function 
      //** ensureAuthenticated(req, res, next), which will check 
      //** if a user is authenticated by calling passports isAuthenticated 
      //** on the request which in turn checks for req.user is to be defined. 
      //** If it is then next() should be called, otherwise we can just respond
      //**  to the request with a redirect to our homepage to login.
      //**  An implementation of this middleware is:

         const ensureAuthenticated=(req, res, next)=>{
          if (req.isAuthenticated()) {
              return next();
          }
          res.redirect('/');
        };

      // *!PROFILE ROUTE       
      app.route('/profile')
        .get(ensureAuthenticated,(req,res) => {
             res.render(process.cwd() + '/views/pug/profile',{
                         username:`${req.user.username}`
             });
        });

        

        // *!HANDLING MISSING PAGES (404)       
        app.use((req, res, next) => {
          res.status(404)
            .type('text')
            .send('Not Found');
        });


      var port=process.env.PORT || 3000;
      app.listen(port, () => {
        console.log("Listening on port " + port);
      });  
}});