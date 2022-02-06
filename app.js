let express = require('express');
let exP = express();
const fs = require("fs");
const body_parser = require('body-parser'); //парсить данные из формы

/* запуск сервера */
const port = process.env.PORT || 3000;
exP.listen(port,()=>{console.log(`server's listening on port ${port}`)});

// параметр безопасности, чтобы писать в базу ?!!
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

/* задаём папку со статикой */
exP.use(express.static('public'));

/* задаём метод чтения ответа ?!?!?! а-ля body parser */
exP.use(express.json());
exP.use(body_parser.urlencoded({extended:true})); //парсить данные из формы

/* задаём шаблонизатор */
exP.set('view engine','pug');

/* подключаем nodemailer */
const nodemailer = require('nodemailer');

/* my Sql */
const mysql2 = require('mysql2');
const mysql = require('mysql');

const conn = mysql2.createConnection({
    // host:"localhost",
    // user:"root",
    // password:"root",
    // database:"market"
    //----для БД на  REG.ru---------
    host:"server48.hosting.reg.ru",
    port:3306,
    user:"u1476436_root",
    password:"gambelpaddi",
    database:"u1476436_shop_reg"
});

exP.get("/",function (req,res){
    let cat = new Promise(function (resolve, reject) {
        conn.query(
            "select id,name, cost, image, category from (select id,name,cost,image,category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind   from goods, ( select @curr_category := '' ) v ) goods where ind < 3",
            function (error, result, field) {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
    let catDescription = new Promise(function (resolve, reject) {
        conn.query(
            "SELECT * FROM category",
            function (error, result, field) {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
    Promise.all([cat, catDescription]).then(function (value) {
        //console.log(value[1]);
        res.render('shop', {
            goods: JSON.parse(JSON.stringify(value[0])),
            cat: JSON.parse(JSON.stringify(value[1])),
        });
    });
});

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
});

exP.get('/item',function(request,response){
    let id = request.query.id || 1;
    conn.query("SELECT * FROM goods WHERE id="+id, function (err,result, fields) {
        if(err) throw err
        //console.log('result from axp get item',result);
        response.render('item',{
            item: JSON.parse(JSON.stringify(result)),
        })
    })
});

exP.get('/order', function (req, res) {
    res.render('order');
});

exP.post('/get-category-list',(request, response)=>{
    conn.query("SELECT id,category FROM category", (err,result,fields)=>{
        if (err) throw err;
        response.json(result)
    })
});

exP.post('/get-goods-info',(request, response)=>{
    let reqKeysArray = request.body.key; // ['4','5']
    if (reqKeysArray.length !== 0){
        let keysString = reqKeysArray.join(',')// 4,5
        conn.query('SELECT id,name,cost FROM goods WHERE id IN ('+keysString+')', function (error, result, fields) {
            if (error) throw error;
            // result - это неудобный массив: [ { id: 4,name, cost},{ id: 7,name, cost}]
            let goods = {};
            result.forEach((elem, index)=>{
                goods[elem.id] = elem;
            });
            // goods - это удобный (индексированный) массив: [ 4:{ id: 4,name, cost},7:{ id: 7,name, cost}]
            response.json(goods);
        });
    }
    else response.send('0')

});

exP.post('/finish-order',(request, response)=>{
    if (request.body.key.length !== 0){
        let key = Object.keys(request.body.key);
        conn.query(
            'SELECT id,name,cost FROM goods WHERE id IN (' + key.join(',') + ')',
            function (error, result, fields) {
                if (error) throw error;
                //console.log('result from finish-order = ', result);
                sendMail(request.body, result).catch(console.error);
                saveOrder(request.body, result);
                response.send('1');
            });
    }
    else response.send('0')
})

exP.get('/admin', function (req, res) {
    res.render('admin', {});
});

exP.get('/admin-order', function (req, res) {
    conn.query(`SELECT 
	shop_order.id as id,
	shop_order.user_id as user_id,
    shop_order.goods_id as goods_id,
    shop_order.goods_cost as goods_cost,
    shop_order.goods_amount as goods_amount,
    shop_order.total as total,
    from_unixtime(date,"%Y-%m-%d %h:%m") as human_date,
    user_info.user_name as user,
    user_info.user_phone as phone,
    user_info.address as address
FROM 
	shop_order
LEFT JOIN	
	user_info
ON shop_order.user_id = user_info.id ORDER BY id DESC`, function (error, result, fields) {
        if (error) throw error;
        console.log(result);
        res.render('admin-order', { order: JSON.parse(JSON.stringify(result)) });
    });
});

/**
 *  login form ==============================
 */
exP.get('/login', function (req, res) {
    res.render('login', {});
});

exP.post('/login', function (req, res) {
    console.log('=======================');
    console.log(req)
    console.log(req.body);
    console.log(req.body.login);
    console.log(req.body.password);
    console.log('=======================');
    conn.query(
        'SELECT * FROM user WHERE login="' + req.body.login + '" and password="' + req.body.password + '"',
        function (error, result) {
            if (error) throw (error);
            console.log('201 result = ',result);
            console.log('202 result.length = ',result.length);
            if (result.length === 0) {
                console.log('error user not found');
                res.redirect('/login');
            }
            else {
                result = JSON.parse(JSON.stringify(result));
                res.cookie('hash', 'blablabla');
                /**
                 * write hash to db
                 */
                let sql = "UPDATE user  SET hash='blablabla' WHERE id=" + result[0]['id'];
                conn.query(sql, function (error, resultQuery) {
                    if (error) throw error;
                    console.log('we reached this step')
                    res.redirect('/admin');
                });

            };
        });
});


//data = req.body = данные заказчика из формы + id/count из cart
//result / positionsList = ответ с базы данных по запросу = товары, найденные по id
function saveOrder(data, result) {
    //1 - в юзер-таблицу
    let {username,phone,address,email,key} = data;
    let usersQuery = "INSERT INTO user_info (user_name,user_phone,user_email,address) VALUES (" +
                    `"${username}", "${phone}", "${address}", "${email}"` + ")";
    conn.query(usersQuery, (err,result)=>{
        if(err) throw err;
        console.log('1 user wrote to DB : \n', result);
    });
    //2 - в гудс таблицу
    let date = new Date()/1000;
    result.forEach(item => {
      let shopOrderQuery =
        "INSERT INTO shop_order (date, user_id, goods_id, goods_cost, goods_amount, total) VALUES (" +
       `"${date}", "12", "${item.id}", "${item.cost}", "${key[item.id]}", "${key[item.id] * item.cost}"` + ")";

        conn.query(shopOrderQuery, (err,result)=>{
            if(err) throw err;
            console.log('--------- \n 1 order recorded to DB: \n',result);
        })
    })
}

//в sendMail передаются те же данные, что и в saveOrder
async function sendMail(data, result) {
    let res = '<h2>Order in lite shop</h2>';
    let total = 0;

    result.forEach(el => {
        res += `<p>${el['name']} - ${data.key[el['id']]} - ${el['cost'] * data.key[el['id']]} uah</p>`;
        total += el['cost'] * data.key[el['id']];
    })

    console.log(res);
    res += '<hr>';
    res += `Total ${total} uah`;
    res += `<hr>Phone: ${data.phone}`;
    res += `<hr>Username: ${data.username}`;
    res += `<hr>Address: ${data.address}`;
    res += `<hr>Email: ${data.email}`;

    let testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass // generated ethereal password
        }
    });

    let mailOption = {
        from: '<dimanvaz04@gmail.com>',
        to: "dimanvaz04@gmail.com," + data.email,
        subject: "Lite shop order",
        text: 'Hello world',
        html: res
    };

    let info = await transporter.sendMail(mailOption);
    console.log("MessageSent: %s", info.messageId);
    console.log("PreviewSent: %s", nodemailer.getTestMessageUrl(info));
    return true;
}



