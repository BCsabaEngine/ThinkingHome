const config = requireRoot('/lib/config');

module.exports = (app) => {

  // detect session in all request
  app.all('/*', function (req, res, next) {

    // logged in
    if (req.session.loggedin) {
      next();
      return;
    }

    // must login
    if (req.method == "GET") {
      if (req.path != "/")
        res.redirect('/');
      else
        res.render('login', { title: "Login" });
    }
    // bypass login request
    else if (req.method == "POST" && req.path == "/login")
      next();
    else
      res.status(403).end();
  });

  app.post('/login', function (req, res) {
    if (req.body.password == config.portal.password) {
      req.session.loggedin = true;
      res.end();
    }
    else
      res.status(403).end();
  })

  app.get('/logout', function (req, res) {
    req.session.loggedin = false;
    res.redirect('/');
  })
}
