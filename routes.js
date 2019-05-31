const passport=require('passport');
const bcrypt=require('bcryptjs');
 
module.exports=function(app,db){


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
      // *! HOME ROUTE
      app.route('/')
        .get((req, res) => {
          if(req.user){
            res.redirect('/profile');
          }
          else{
          res.render(process.cwd() + '/views/pug/index', {
            title: 'Hello',
             message: 'login', 
              showLogin: true,
              showRegistration:true
            });
          }
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
}