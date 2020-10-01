const UserModel = require('../models/User');

module.exports = (app) => {

  // detect session in all request
  app.all('/*', async function (req, res, next) {

    if (req.session.user)
      return next();

    if (!(await UserModel.AnySync()))
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
    UserModel.FindByEmailPassword(req.body.email, req.body.password)
      .then(user => {
        if (user) {
          req.session.user = { id: user.Id, isadmin: user.IsAdmin, email: user.Email, name: user.Name, };
          res.send("OK");
        }
        else {
          setTimeout(() => {
            res.status(403).end();
          }, 750);
        }
      });
  })

  app.get('/logout', function (req, res) {
    delete req.session.user;

    res.redirect('/');
  })
}
