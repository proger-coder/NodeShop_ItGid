module.exports = function (req, res, conn, next) {
    console.log('-------------------------------req = ----------------------\n',req);
    console.log('req cookies = ',req.cookies);
    console.log(req.cookies.hash);
    console.log(req.cookies.id);
    if (req.cookies.hash === undefined || req.cookies.id === undefined) {
        res.redirect('/login');
        return false;
    }
    conn.query(
        'SELECT * FROM user WHERE id=' + req.cookies.id + ' and hash="' + req.cookies.hash + '"',
        function (error, result) {
            if (error) reject(error);
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