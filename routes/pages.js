module.exports = (app) => {

  app.get('/', function (req, res) {
    let tilehtml = "";

    res.render('main', { title: "Dashboard", content: tilehtml, /*menuItems: getMenuItems(),*/ });
  })

}
