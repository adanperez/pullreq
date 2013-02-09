
module.exports = function(db) {
    var db = db;

    function authenticate(email, password, callback) {
        var UserModel = db.model('User');
        UserModel.findOne({ email: email }, function(err, user) {
            if (user && user.authenticate(password)) {
                callback(null, user);
            } else {
                callback(new Error('User not found.'), null);
            }
        });
    }

    return {
        authenticate: authenticate
    }
}