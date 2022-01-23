let express = require('express');
let exP = express();
const fs = require("fs");

/* запуск сервера */
const port = 3000;
exP.listen(port);

/* задаём папку со статикой */
exP.use(express.static('public'));

/* задаём шаблонизатор */
exP.set('view engine','pug');

/* my Sql */
const mysql2 = require('mysql2');
//const mysql = require('mysql'); - выдаёт эррор 1251 Client does not support authentication protocol
const conn = mysql2.createConnection({
    host:"localhost",
    user:"root",
    password:"root",
    database:"market"
});

exP.get("/shop",function (req,res){
    conn.query("SELECT * from goods",(err,result)=>{
        if(err){console.log('db query error:',err)}
        else {
                //console.log(result)
            let goods = {};
            result.forEach((elem, index)=>{
                goods[elem.id] = elem;
            });
                //console.log('goods-------\n',goods)
            res.render('main',{
                sample:'List of products',
                goods: JSON.parse(JSON.stringify(goods))
            })
        }
    })
})

exP.get("/cat",function (request,response){
    let id = request.query.id || 1;

    let cat = new Promise((resolve,reject)=>{
        conn.query("SELECT * FROM category WHERE id="+id, function (err,queryResult){
            if(err){
                reject(err)
            }
            resolve(queryResult)
        })
    });

    let goodsByCat = new Promise((resolve,reject)=>{
        conn.query("SELECT * FROM goods WHERE category="+id, function (err,queryResult){
            if(err){
                reject(err)
            }
            resolve(queryResult)
        })
    });

    Promise.all([cat, goodsByCat]).then(resultArray =>{
        response.render('cat',{
            categ:resultArray[0],
            goodsByCateg:resultArray[1]
        })
    })
})








