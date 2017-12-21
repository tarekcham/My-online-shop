const express = require('express');
const fs = require('fs');
const path = require('path');
const Router = express.Router;
const app = express();
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const frontendDirectoryPath = path.resolve(__dirname, './../static');

console.log('static resource at: ' + frontendDirectoryPath);

const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'fjfjfj',
  database: 'online_shop'
});


app.use(express.static(frontendDirectoryPath));
app.use(cors());
app.use(bodyParser());

// we always want to have /api in the beginning

const apiRouter = new Router();
app.use('/api', apiRouter);

apiRouter.get('/', (req, res) => {
  res.send({'shop-api': '1.0'});
});

apiRouter.get('/products', (req, res) => {
  con.query( "select * from products" , function(err, rows){
    if(err)
      throw res.json( err );

    //console.log(rows);
    res.json(rows);

   })
});

apiRouter.get('/categories', (req, res) => {
  con.query( "select * from product_categories" , function(err, rows){
  if(err)
    throw res.json( err );

  //console.log(rows);
  res.json(rows);
 })
});

apiRouter.get('/customers', function(req, res){
 con.query( "select * from customers" , function(err, rows){
  if(err)
    throw res.json( err );

  //console.log(rows);
  res.json(rows);
 });
});

apiRouter.get('/payment_methods', function(req, res){
 con.query( "select * from payment_method" , function(err, rows){
  if(err)
    throw res.json( err );

  //console.log(rows);
  res.json(rows);
 });
});

apiRouter.post('/order', function(req, res){
  
  /* 
  con.query('insert into orders (customer_id, created, paid, payment_id) values (2, now(), NULL, 1)', function(err, rows){
    if(err)
    throw res.json( err );

  console.log(rows);
  res.json(rows);
  }); 
  */

  fs.writeFile(path.resolve(__dirname, './../../orders/order'+Date.now()+'.txt'), JSON.stringify(req.body),
    (err) => {
      if (err)
        res.json({error: err})
      res.json({success:'order saved!'})
    });
});

apiRouter.post('/order', function(req, res){
  con.query('insert into orders (customer_id, created, paid, payment_id) values (2, now(), NULL, 1)', function(err, rows){
    if(err)
    throw res.json( err );

  console.log(rows);
  res.json(rows);
  });
});


app.listen( 9090, (err) => {
  if(err) throw err;
  console.log('Server started on port 9090');
});

/*
apiRouter.put('/activate/:userid', function(req, res){
  con.query('update customers set active = ? where id = ?',
    [req.body.status, req.params.userid],
    function(err, rows){
      if (err) 
        throw res.json( err );
      console.log(rows);

    });
});

apiRouter.put('/userdata', function(req, res){
   con.query( "insert into customers (firstname, lastname, birthdate, city, street ,email)" +
            "values (?,?,?,?,?,?)",[req.body.firstname,
                                    req.body.lastname, 
                                    req.body.birthdate,
                                    req.body.city,
                                    req.body.street,
                                    req.body.email],
            function(err, rows) {
              if(err)
                throw res.json(err);

              
             });
});

apiRouter.put('/user/:userid', function(req, res){

  console.log(req.body);
  console.log('userid: ' + req.params.userid);

  var sql = 'update customers set ';
  var i = 1;
  var bodyLength = Object.keys(req.body).length;
  var values = [];

  for(var field in req.body) {
    sql += field + '= ?';
    if(i < bodyLength)
      sql += ',';
    i++;
    values.push( req.body[field] );
  }

  sql += ' where id = ?';
  values.push( req.params.userid );

  console.log(sql);
  console.log(values);

  con.query(sql, 
    values, 
      function(err, rows) {
        if (err)
          throw res.json(err);

      console.log( rows );
      res.json(req.body);
      });
});

apiRouter.delete('/deleted/:userid', function(req,res){

  var sql = 'update customers set deleted = now() where id = ?';
  var values = [req.params.userid];

  console.log(sql + '...' + values);

  con.query(sql,
    values,
    function(err, rows) {
      if(err)
        throw res.json(err);
      console.log(rows);
    });
}); */