const bcrypt = require('bcrypt');
module.exports = function (req, res, conn, next) {
    // ПЕРЕДЕЛАНО "ПОД СЕССИИ" (уникальный UUID)
    //console.log('req cookies = ',req.cookies);

    //1. Если login или UUID не определены - кидаем на страницу login-a:
    if (req.cookies.UUID === undefined || req.cookies.login === undefined) {
        res.redirect('/login');
        return false;
    }

    //1. Если login или UUID определены - ищем по базе
    conn.query(
        //`SELECT * FROM user WHERE login= "${req.cookies.login}" and UUID="${req.cookies.UUID}"`,
        `SELECT UUID FROM user WHERE login= "${req.cookies.login}"`,
        function (error, result) {
            if (error) throw (error);
                // result - это массив с объектом ответа SQL [{UUID:'$2b$10$HR...'}]
                // если совпало - в лоб - пропускаем
            if(result[0]?.UUID === req.cookies.UUID) {
                //console.log(`${result[0]?.UUID} === ${req.cookies.UUID}`)
                next();
            }
                // в иных случаях кидаем на логин
            else {
                console.log('error user not found');
                res.redirect('/login');
            }
        });
}