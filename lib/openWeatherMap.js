const got = require('got');

module.exports = {

  weatherinfo: null,

  init() {
    this.updateWeatherInfo();

    // Update in every 10 minutes
    setInterval(function () { this.updateWeatherInfo(); }, 10 * 60 * 1000);
  },

  async updateWeatherInfo() {
    const winfo = await this.getWeatherInfo();
    if (!winfo)
      return;

    this.weatherinfo = winfo;

    this.storeWeatherInfo(winfo);
  },

  async getWeatherInfo() {
    if (!systemsettings.Latitude || !systemsettings.Longitude || !systemsettings.OpenweathermapApiKey)
      return null;

    try {
      const url = `https://api.openweathermap.org/data/2.5/onecall?units=metric&lat=${systemsettings.Latitude}&lon=${systemsettings.Longitude}&appid=${systemsettings.OpenweathermapApiKey}`;
      const response = await got(url);
      if (!response)
        return null;

      const winfo = JSON.parse(response.body);

      logger.debug("[OpeanWeatherMap] " + winfo.current.temp + "°C");

      return winfo;
    }
    catch (err) { return null; }
  },

  async storeWeatherInfo(winfo) {
    const trunced = winfo.current;

    if (trunced)
      await require.main.require("./models/Weather").Insert(JSON.stringify(trunced));
  }

}