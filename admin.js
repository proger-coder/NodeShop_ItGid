const bcrypt = require('bcrypt');
module.exports = function (req, res, conn, next) {
    // ПЕРЕДЕЛАНО "ПОД СЕССИИ" (уникальный UUID)
    console.log('-------------------------------req = ----------------------\n',req);
    console.log('req cookies = ',req.cookies);
    console.log(req.cookies.UUID);
    console.log(req.cookies.login);
    if (req.cookies.UUID === undefined || req.cookies.login === undefined) {
        res.redirect('/login');
        return false;
    }
    conn.query(
        `SELECT * FROM user WHERE login= "${req.cookies.login}" and UUID="${req.cookies.UUID}"`,
        function (error, result) {
            if (error) throw (error);
            console.log(result);
            if (result.length === 0) {
                console.log('error user not found');
                res.redirect('/login');
            }
            else {
                next();
            }
        });
}