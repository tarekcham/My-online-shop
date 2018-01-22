const express = require('express');
const fs = require('fs');
const path = require('path');
const Router = express.Router;
const app = express();
const cors = require('cors');
const mysql = require('mysql');
const mailnotifier = require('./mailnotifier');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const randomstring = require('randomstring');

const frontendDirectoryPath = path.resolve(__dirname, './../static');
const serverSignature = 'my_secret_signature';

console.log('static resource at: ' + frontendDirectoryPath);
app.use(express.static(frontendDirectoryPath));
app.use(cors());
app.use(express.json());

// avoid hardcoded DB connection information at ALL COSTS!
// use the following command to start your server:
// MYSQL_PASSWORD=P455w0rd MYSQL_USER=root MYSQL_DB=x_shop npm run start-express-dev

let shopConfigPath = process.env.HOME + '/.online-shop.json';
let shopConfig = null;

console.log(shopConfigPath);

if(!fs.existsSync(shopConfigPath)) {
  console.log('Online-Shop config file was not found. Server stops.');
  process.exit();
} else {
  shopConfig = require(shopConfigPath);
}

console.info('MYSQL: user "%s", db "%s", pass length %s', shopConfig.mysql_usr, shopConfig.mysql_db, shopConfig.mysql_pwd.length);
var con = mysql.createConnection({
  host: 'localhost',
  user: shopConfig.mysql_usr,
  password: shopConfig.mysql_pwd,
  database: shopConfig.mysql_db
});


// always want to have /api in the beginning
const apiRouter = new Router();
app.use('/api', apiRouter);

apiRouter.get('/', (req, res) => {
  res.send({'shop-api': '1.0'});
});

apiRouter.get('/products', (req, res, next) => {
  con.query('select * from products', function(err, rows) {
    if (err) return next(err);

    console.log( rows );
    res.json( rows );
  });
});

apiRouter.get('/products', (req, res, next) => {
  con.query('select * from products', function(err, rows) {
    if (err) return next(err);

    console.log( rows );
    res.json( rows );
  });
});

apiRouter.get('/categories', (req, res, next) => {
  con.query('select * from product_categories', function(err, rows) {
    if (err) return next(err);

    console.log( rows );
    res.json( rows );
  });
});

apiRouter.get('/customers', function(req, res, next) {
  con.query('select * from customers where active = 1', function(err, rows) {
    if (err) return next(err);

    console.log( rows );
    res.json( rows );
  });
});

apiRouter.get('/payment_methods', function(req, res, next) {
  con.query('select * from payment_method', function(err, rows) {
    if (err) return next(err);

    console.log( rows );
    res.json( rows );
  });
});

apiRouter.put('/activate/:activationcode', function(req, res, next) {
  con.query('update customers set active = 1 where activationcode = ?',
    [req.params.activationcode],
    function(err, rows) {
      if (err) 
        return next(err);

      console.log(rows);      
      if(rows.affectedRows > 0) {
        return res.json({ error: 0 });
      }
      else {
        return res.json({ error: 1 });  
      }
  });
});

function ensureToken(req, res, next) {
  console.log('arrived at middleware ensureToken for /protected');
  const bearerHeader = req.headers['authorization'];
  if(typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}

function isAuthorized(req, res, next) {
  jwt.verify(req.token, serverSignature, function(err, data) {
    if(err)
      res.send(403);
    else {
      next();
    }
  });
}

/*
apiRouter.post('/user', function(req, res, next) {
  con.query('select * from customers where email = ?',
    [req.body.email],
    function(err, rows) {
      if (err) return next(err);
      if( rows.length > 0 ) {
        res.json({error: 'Email already exists.'});
      }
      else {
        con.query(`insert into customers (firstname, lastname, birthdate, phone, city, street, email)
          values (?, ?, ?, ?, ?, ?, ?)`,
          [
            req.body.firstname,
            req.body.lastname,
            req.body.birthdate,
            req.body.phone,
            req.body.city,
            req.body.street,
            req.body.email
          ],
          function(err, rows) {
            if (err) return next(err);
            res.json( rows );
          }
        );
      }
    });
});
*/ 
apiRouter.post('/login', function(req, res) {
  console.log(req.body);
  if(!req.body.email || !req.body.password)
    return res.json({ err: 'username and password required'});

  con.query('select * from customers where email = ?', 
    [req.body.email], function(err, rows) {
    if (err) return res.json( {err: 'Internal error happened'} );
    if(rows.length > 0) {
        bcrypt.compare(req.body.password, rows[0].pwd, function(err, hashRes) {
          if(hashRes) {
            const token = jwt.sign({email: rows[0].email, pwd: rows[0].pwd}, serverSignature);    
            const user = rows[0];
            user.token = token;
            delete user.pwd;  // do not send back the password
            return res.json(user);
        }
        else {
          return res.json({ err: 'password incorrect' });
        }
      });
    } 
    else {
      console.log("ERROR: password don't match");
      return res.json( {err: 'Username does not exist'});
    }
  }); 
});

apiRouter.post('/register', function(req, res) {
  console.log(req.body);
  if(!req.body.email || !req.body.password)
    return res.json({ err: 'username and password required'});

  con.query('select * from customers where email = ?',
    [req.body.email],
    function(err, rows, next) {
      if (err) return next(err);

      if( rows.length > 0 ) {
        return res.json({err: 'User with this email already exists.'});
      }
      else {
        const activationCode = randomstring.generate(20);
    bcrypt.hash(req.body.password, 0, function(err, pwdHash) {
          con.query(`insert into customers (firstname, lastname, birthdate, city, street, postal, email, phone, pwd, active, activationcode)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, '0', ?)`,
          [
            req.body.firstname,
            req.body.lastname,
            req.body.birthdate,
            req.body.city,
            req.body.street,
            req.body.postal,
            req.body.email,
            req.body.phone,
            pwdHash,
            activationCode
          ],
          function(err, rows) {
            if (err){
              res.json({err: 'Error creating user. '+err}) 
            } 
            else {
            console.log('sending email to: ' + req.body.email);
            if(shopConfig.mailnotifications === "1") {
              mailnotifier.sendMail(
                  req.body.email, 
                  'Your Registration at Devugees-Shop', 
                  'Hallo ' + req.body.firstname + ', '
                  + 'in order to complete your registration, please follow'
                  + 'this link here: http://localhost:5000/activate=' + activationCode
                );
          }

          res.json({ error: 0 });
        }

              /*
              const token = jwt.sign({email: req.body.email, pwd: req.body.pwd}, serverSignature);    
              req.body.token = token;
              delete req.body.pwd;  // do not send back the password
              return res.json(req.body);
              res.json( req.body );
              */
          });
    });
      }
    });
});

apiRouter.post('/updateinfo', function(req, res) {
  console.log(req.body);
 let sqlUpdate = 'update customers set ';
  let e = 1;
  let Length = Object.keys(req.body).length;
  let updatevalues = [];
  for(let updatefields in req.body) {
    sqlUpdate += updatefields + ' = ?';
    if(e < Length)
      sqlUpdate += ',';
    e++;
    updatevalues.push( req.body[updatefields] );
  }
  sqlUpdate += ' where id = ?';
  updatevalues.push( req.body.id );
  con.query(sqlUpdate,
    updatevalues,
    function(err, rows) {
    if (err) return next(err);
    console.log( rows );
    res.json(req.body);
  });
});


apiRouter.post('/order', ensureToken, isAuthorized, function(req, res, next) {   
  console.log('RECEIVING: ' + JSON.stringify(req.body));
  con.query('insert into orders (customer_id, payment_id, created, paid) values (?, ?, now(), NULL)', [req.body.user.id, req.body.payment_method], function(err, rows) {
      if(err) {
        return res.json({err: err});
      }

      const newOrderId = rows.insertId;
      let sql = "insert into order_details (order_id, product_id, price) values ";

      let orderValue = 0;
      for(let i=0; i<req.body.products.length; i++) {
        const p = req.body.products[i];
        let values = "("+newOrderId+", "+p.id+", "+p.price+")";
        sql += values;
        if(i < req.body.products.length - 1) {
          sql += ','
        }

        orderValue += parseInt(p.price) * parseInt(p.quantity);
      }


      con.query(sql, function(err, rows) {
        if(err) {
          return res.json({err: err});
        } 
        
        // here sendMail
        let text = `Dear ${req.body.user.name},
              Thank you for your order of ${orderValue}.
              We which you a nice day.
              Your Devugees-Shop Team.`;

        if(shopConfig.mailnotifications === "1") {
        mailnotifier.sendMail(req.body.user.email, 'Your Order at Devugees-Shop', text);
        }
        return res.json({success: rows})    
      });

    });
  /*
  fs.writeFile(path.resolve(__dirname, './../orders/orders'+Date.now()+'.txt'), JSON.stringify(req.body),
    (err) => {
      if (err) return next(err);
      res.json({success:'order saved'});
    });
  */
});

apiRouter.put('/user/:userid', function(req, res, next) {
  console.log('userid: ' + req.params.userid);
  var sql = 'update customers set ';
  var i = 1;
  var bodyLength = Object.keys(req.body).length;
  var values = [];
  for(var field in req.body) {
    sql += field + ' = ?';
    if(i < bodyLength)
      sql += ',';
    i++;
    values.push( req.body[field] );
  }

  sql += ' where id = ?';
  values.push( req.params.userid );
  con.query(sql,
    values,
    function(err, rows) {
    if (err) return next(err);

    console.log( rows );
    res.json( rows );
  });
});

apiRouter.post('/resetpassword', function(req, res) {
  if(!req.body.email)
    return res.json( {error: 'Email required'} );

  const resetCode = randomstring.generate(20);
    con.query('select * from customers where email = ?', [req.body.email],
    function(err, rows) {
      if (err) return res.json({err: err});

      if(rows.length > 0) {
      con.query('insert into passwordreset (email, resetcode) values (?, ?)', 
        [req.body.email, resetCode],
        function(err, rows) {       
          if(err) return res.json({err:err});

          return res.json( {err: 0} );
        });

      mailnotifier.sendMail(req.body.email, 'Your Password Reset',
        'In order to reset your password, please follow this link: http://localhost:5000/resetpassword=' + resetCode);

      }
  }); 

});

apiRouter.delete('/user/:userid', function(req, res, next) {
  con.query('update customers set deleted = now() where id = ?', [req.params.userid],
    function(err, rows) {
    if (err) return next(err);

    console.log( rows );
    res.json( rows );
  });
});

apiRouter.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.code = 404;
  next(err);
});

apiRouter.use(function (err, req, res, next) {
  console.warn('Error occured for "%s":\n%s', req.url, err.stack);
  res.json(err);
});

// avoid starting server if the connection to the DB cannot be established
con.connect(function (err) {
  if (err) throw err;

  app.listen( 9090, (err) => {
    if(err) throw err;
    console.log('Server started on port 9090');
  });
});