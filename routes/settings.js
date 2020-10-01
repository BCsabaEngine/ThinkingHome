const YAML = require('yaml');
const passwordStrength = require('pwd-strength');
const OpenWeatherMap = require('../lib/openWeatherMap');
const BoardBuilder = require('../lib/boardBuilder');
const UserModel = require('../models/User');
const BoardModel = require('../models/Board');

module.exports = (app) => {

  app.get('/settings', async function (req, res, next) {
    try {
      // await req.RequirePermission(UserPermissions.RuleCode);

      const boards = await BoardModel.GetAllSync();
      const users = await UserModel.GetAllSync();

      res.render('settings', {
        title: "System settings",
        settings: global.systemsettings,
        boards: boards,
        users: users,
      });
    }
    catch (err) { next(err); }
  })

  app.post('/settings/update', async function (req, res, next) {
    try {
      global.systemsettings.AdaptFromObject(req.body);

      res.send("OK");
    }
    catch (err) {
      res.status(500).send(err.message);
    }
  })

  app.post('/settings/checkopenweatherapikey', async function (req, res, next) {
    try {
      const latitude = req.body.latitude;
      const longitude = req.body.longitude;
      const apikey = req.body.apikey;

      const checkres = await OpenWeatherMap.check(latitude, longitude, apikey);
      res.send(checkres);
    }
    catch (err) {
      res.status(403).send(err.message);
    }
  })

  app.post('/settings/user/add', async function (req, res, next) {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const validemail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const pwdtest = passwordStrength(password, { minPasswordLength: 8, minUpperChars: 1, minLowerChars: 1, minSpecialChars: 0 });

      if (email.length > 100)
        return res.status(403).send(`Too long email: max 100 characters`);
      if (!validemail)
        return res.status(403).send(`Not a valid email: ${email}`);
      if (await UserModel.ExistsSync(email))
        return res.status(403).send(`Email already exists: ${email}`);
      if (!pwdtest.success)
        return res.status(403).send(`Not enought strong password: minimum 8 characters, lower and uppercase letters`);

      const insertres = await UserModel.Insert(email, password);

      // autologin first user
      if (insertres.isadmin)
        req.session.user = { id: insertres.insertid, isadmin: true, email: email, name: insertres.name, };

      res.send("OK");
    }
    catch (err) { next(err); }
  })

  app.post('/settings/user/update', async function (req, res, next) {
    try {
      const name = req.body.name;
      const email = req.body.email;

      if (name.length > 100)
        return res.status(403).send(`Too long name: max 100 characters`);

      await UserModel.UpdateSync(name, email);
      res.send("OK");
    }
    catch (err) { next(err); }
  })

  app.post('/settings/user/delete', async function (req, res, next) {
    try {
      const email = req.body.email;

      await UserModel.DeleteSync(email);

      res.send("OK");
    }
    catch (err) { next(err); }
  })

  app.post('/settings/board/add', async function (req, res, next) {
    try {
      const name = req.body.name;

      if (name.length > 100)
        return res.status(403).send(`Too long name: max 100 characters`);

      const insertres = await BoardModel.InsertSync(name, '');
      res.send("OK");
    }
    catch (err) { next(err); }
  })

  app.post('/settings/board/setprimary', async function (req, res, next) {
    try {
      const id = req.body.id;
      await BoardModel.SetPrimarySync(id);
      res.send("OK");
    }
    catch (err) { next(err); }
  })

  app.post('/settings/board/updatename', async function (req, res, next) {
    try {
      const id = req.body.id;
      const name = req.body.name;

      if (name.length > 100)
        return res.status(403).send(`Too long name: max 100 characters`);

      await BoardModel.UpdateNameSync(id, name);
      res.send("OK");
    }
    catch (err) { next(err); }
  })

  app.get('/settings/board/edit/:id', async function (req, res, next) {
    try {
      const id = req.params.id;
      const board = await BoardModel.GetByIdSync(id);

      if (!board)
        return Page404(req, res, next);

      let yamllinecount = (board.Yaml || "").split(/\r\n|\r|\n/).length;
      yamllinecount += 5;
      if (yamllinecount < 30)
        yamllinecount = 30;

      res.render('boardeditor', {
        title: "Board editor",
        board: board,
        yamllinecount: yamllinecount,
        devices: global.runningContext.GetDevices(),
      });
    }
    catch (err) { next(err); }
  })

  app.post('/settings/board/updateyaml', async function (req, res, next) {
    try {
      const id = req.body.id;
      const yaml = req.body.yaml;

      if (!yaml)
        return res.status(411).send("Empty content");

      try { YAML.parse(yaml); }
      catch (err) { return res.status(403).send(err.message); }

      await BoardModel.UpdateYamlSync(id, yaml);
      res.send("OK");
    }
    catch (err) { next(err); }
  })

  app.post('/settings/board/formatyaml', async function (req, res, next) {
    try {
      const yaml = req.body.yaml;

      if (!yaml)
        return res.status(411).send("Empty content");

      try {
        const parsed = YAML.parse(yaml);
        const formatted = YAML.stringify(parsed);
        return res.send(formatted);
      }
      catch (err) {
        console.log(err);
        return res.status(500).send(err.message);
      }
    }
    catch (err) { next(err); }
  })

  app.post('/settings/board/checkyaml', async function (req, res, next) {
    try {
      const yaml = req.body.yaml;

      if (!yaml)
        return res.status(411).send("Empty content");

      try {
        bbuilder = new BoardBuilder(yaml);
        return res.send(bbuilder.Build());
      }
      catch (err) {
        console.log(err);
        return res.status(500).send(err.message);
      }
    }
    catch (err) { next(err); }
  })

  app.post('/settings/board/delete', async function (req, res, next) {
    try {
      const id = req.body.id;

      await BoardModel.DeleteSync(id);

      res.send("OK");
    }
    catch (err) { next(err); }
  })

  app.post('/settings/restart', async function (req, res, next) {
    try {
      res.send("OK");

      setTimeout(() => {
        process.exit();
      }, 500);
    }
    catch (err) { next(err); }
  })

}
