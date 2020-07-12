const EventEmitter = require('events');
const got = require('got');

class OpenWeatherMap extends EventEmitter {
  weatherinfo = null;
  analyzedweather = null;

  constructor() {
    super();

    this.updateWeatherInfo();

    // Update in every 10 minutes
    setInterval(function () { this.updateWeatherInfo(); }.bind(this), 10 * 60 * 1000);
  }

  async check(latitude, longitude, apikey) {
    const url = `https://api.openweathermap.org/data/2.5/onecall?units=metric&lat=${latitude}&lon=${longitude}&appid=${apikey}`;
    const response = await got(url);
    if (!response)
      return null;

    const winfo = JSON.parse(response.body);

    return `${winfo.timezone} (${winfo.lat} / ${winfo.lon})`;
  }

  analyzeWeatherInfo(weatherinfo) {
    this.analyzedweather = {
      temp: Math.round(weatherinfo.current.temp),
      tempfeel: Math.round(weatherinfo.current.feels_like),
      pressure: Math.round(weatherinfo.current.pressure),
      humidity: Math.round(weatherinfo.current.humidity),
      uv: weatherinfo.current.uvi,
      uvlevel: 'info',
      cloudpercent: Math.round(weatherinfo.current.clouds),
      windspeed: Math.round(weatherinfo.current.wind_speed * 3.6),
      windspeedlevel: 0,
      rain: weatherinfo.current.rain ? weatherinfo.current.rain['1h'] : null,

      title: weatherinfo.current.weather[0].main,
      description: weatherinfo.current.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${weatherinfo.current.weather[0].icon}.png`,
      icon2x: `https://openweathermap.org/img/wn/${weatherinfo.current.weather[0].icon}@2x.png`,
    };

    if (this.analyzedweather.uv >= 8)
      this.analyzedweather.uvlevel = 'danger';
    else if (this.analyzedweather.uv >= 7)
      this.analyzedweather.uvlevel = 'danger';
    else if (this.analyzedweather.uv >= 5)
      this.analyzedweather.uvlevel = 'warning';
    else if (this.analyzedweather.uv >= 3)
      this.analyzedweather.uvlevel = 'success';

    if (this.analyzedweather.windspeed > 20) this.analyzedweather.windspeedlevel = 1;
    if (this.analyzedweather.windspeed > 40) this.analyzedweather.windspeedlevel = 2;
    if (this.analyzedweather.windspeed > 50) this.analyzedweather.windspeedlevel = 3;

    if (this.analyzedweather.rain != null) this.analyzedweather.rain = 1;
    this.analyzedweather.rain = Math.round(this.analyzedweather.rain);

    const maxhour = 12;
    if (this.analyzedweather.rain) {
      // found rain stop
      for (var i = 1; i < weatherinfo.hourly.length; i++) {
        if (!weatherinfo.hourly[i].rain) {
          const dt = new Date(weatherinfo.hourly[i].dt * 1000);
          this.analyzedweather.rainstop = `${dt.getHours()}:${dt.getMinutes().toString().padStart(2, '0')}`;
          break;
        }
        if (i >= maxhour) break;
      }
    }
    else {
      // found rain start
      for (var i = 1; i < weatherinfo.hourly.length; i++) {
        if (weatherinfo.hourly[i].rain) {
          const dt = new Date(weatherinfo.hourly[i].dt * 1000);
          this.analyzedweather.rainstart = `${dt.getHours()}:${dt.getMinutes().toString().padStart(2, '0')}`;
          this.analyzedweather.rainstart_mm = Math.round(weatherinfo.hourly[i].rain['1h']);
          if (this.analyzedweather.rainstart_mm < 1) this.analyzedweather.rainstart_mm = 1;
          break;
        }
        if (i >= maxhour) break;
      }
    }

    if (this.analyzedweather.windspeedlevel >= 2) {
      // found wind stop
      for (var i = 1; i < weatherinfo.hourly.length; i++) {
        if (weatherinfo.hourly[i].wind_speed * 3.6 < 40) {
          const dt = new Date(weatherinfo.hourly[i].dt * 1000);
          this.analyzedweather.windstop = `${dt.getHours()}:${dt.getMinutes().toString().padStart(2, '0')}`;
          break;
        }
        if (i >= maxhour) break;
      }
    }
    else {
      // found wind start
      for (var i = 1; i < weatherinfo.hourly.length; i++) {
        if (weatherinfo.hourly[i].wind_speed * 3.6 > 40) {
          const dt = new Date(weatherinfo.hourly[i].dt * 1000);
          this.analyzedweather.windstart = `${dt.getHours()}:${dt.getMinutes().toString().padStart(2, '0')}`;
          break;
        }
        if (i >= maxhour) break;
      }
    }

    logger.debug("[OpeanWeatherMap] Analyzed: " + JSON.stringify(this.analyzedweather));
  }

  async updateWeatherInfo() {
    const winfo = await this.getWeatherInfo();
    if (!winfo)
      return;

    this.weatherinfo = winfo;

    this.analyzeWeatherInfo(winfo);
    this.storeWeatherInfo(winfo);

    this.emit('update');
  }

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
  }

  async storeWeatherInfo(winfo) {
    const trunced = winfo.current;

    if (trunced)
      await require.main.require("./models/Weather").Insert(JSON.stringify(trunced));
  }

}

module.exports = OpenWeatherMap;