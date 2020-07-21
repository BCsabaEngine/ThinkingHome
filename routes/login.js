const User = require.main.require('./models/User');
const UserPermission = require.main.require('./models/UserPermission');

function SessionUserHasPermission(user, permissionneeded) {

  if (!UserPermissions.isDefined(permissionneeded))
    throw new Error("Checking for invalid permission");

  if (user.isadmin)
    return true;

  const key = UserPermissions.get(permissionneeded).key;
  return user.permissions.includes(key);
}

module.exports = (app) => {

  // detect session in all request
  app.all('/*', function (req, res, next) {

    req.RequirePermission = (permission) => {
      if (req.session.loggedin)
        if (req.session.user)
          if (SessionUserHasPermission(req.session.user, permission))
            return;

      throw new Error("Not enought permission");
    }

    res.locals.HasPermission = (permission) => {
      if (req.session.loggedin)
        if (req.session.user)
          return SessionUserHasPermission(req.session.user, permission);

      return false;
    }

    // logged in
    if (req.session.loggedin)
      return next();

    // bypass login request
    if (req.method == "POST" && req.path == "/login")
      return next();

    // must login
    if (req.method == "GET")
      if (req.path != "/")
        return res.redirect('/');
      else
        return res.render('login', { title: "Login" });

    res.status(403).end();
  });

  app.post('/login', function (req, res) {
    User.FindByEmailPassword(req.body.username, req.body.password)
      .then(user => {
        if (user) {
          const sessionuser = {};
          sessionuser.id = user.Id;
          sessionuser.isadmin = user.IsAdmin;
          sessionuser.permissions = [];
          UserPermission.GetByUser(user.Id)
            .then(permissions => {
              permissions.forEach(perm => sessionuser.permissions.push(perm.Permission));

              req.session.user = sessionuser;
              req.session.loggedin = true;

              res.end();
            });
        }
        else {
          res.status(403).end();
        }
      });
  })

  app.get('/logout', function (req, res) {
    delete req.session.user;

    req.session.loggedin = false;

    res.redirect('/');
  })
}
