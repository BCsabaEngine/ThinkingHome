/* eslint-disable class-methods-use-this */
const EventEmitter = require('events')
const got = require('got')
const dayjs = require('dayjs')

const uvdanger = 7
const uvwarning = 5
const windlevel1 = 20
const windlevel2 = 40
const windlevel3 = 50
const forecasthours = 6

class OpenWeatherMap extends EventEmitter {
  weatherinfo = null;
  analyzedweather = null;

  static async check(latitude, longitude, apikey) {
    const url = `https://api.openweathermap.org/data/2.5/onecall?units=metric&lat=${latitude}&lon=${longitude}&appid=${apikey}`
    const response = await got(url)
    if (!response) { return null }

    const winfo = JSON.parse(response.body)

    return `${winfo.timezone} (${winfo.lat} / ${winfo.lon})`
  }

  timer = null;
  Start() {
    // eslint-disable-next-line no-magic-numbers
    const refreshtime = 10 * 60 * 1000
    this.timer = setInterval(function () { this.updateWeatherInfo() }.bind(this), refreshtime)
    this.updateWeatherInfo()
  }

  Stop() {
    if (this.timer) { clearInterval(this.timer) }
  }

  analyzeWeatherInfo(weatherinfo) {
    const ms2kmh = 3.6
    this.analyzedweather = {
      temp: Math.round(weatherinfo.current.temp),
      tempfeel: Math.round(weatherinfo.current.feels_like),
      pressure: Math.round(weatherinfo.current.pressure),
      humidity: Math.round(weatherinfo.current.humidity),
      uv: weatherinfo.current.uvi,
      uvlevel: 'info',
      cloudpercent: Math.round(weatherinfo.current.clouds),
      windspeed: Math.round(weatherinfo.current.wind_speed * ms2kmh),
      windspeedlevel: 0,
      rain: weatherinfo.current.rain ? weatherinfo.current.rain['1h'] : null,

      title: weatherinfo.current.weather[0].main,
      description: weatherinfo.current.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${weatherinfo.current.weather[0].icon}.png`,
      icon2x: `https://openweathermap.org/img/wn/${weatherinfo.current.weather[0].icon}@2x.png`
    }

    if (this.analyzedweather.uv >= uvdanger) {
      this.analyzedweather.uvlevel = 'danger'
    } else if (this.analyzedweather.uv >= uvwarning) {
      this.analyzedweather.uvlevel = 'warning'
    } else {
      this.analyzedweather.uvlevel = 'success'
    }

    if (this.analyzedweather.windspeed > windlevel1) this.analyzedweather.windspeedlevel = 1
    if (this.analyzedweather.windspeed > windlevel2) this.analyzedweather.windspeedlevel = 2
    if (this.analyzedweather.windspeed > windlevel3) this.analyzedweather.windspeedlevel = 3

    if (this.analyzedweather.rain !== null) this.analyzedweather.rain = 1
    this.analyzedweather.rain = Math.round(this.analyzedweather.rain)

    if (this.analyzedweather.rain) {
      // found rain stop
      for (let i = 1; i < weatherinfo.hourly.length; i++) {
        if (!weatherinfo.hourly[i].rain) {
          this.analyzedweather.rainstop = dayjs(weatherinfo.hourly[i].dt * 1000).format('HH:MM')
          break
        }
        if (i >= forecasthours) break
      }
    } else {
      // found rain start
      for (let i = 1; i < weatherinfo.hourly.length; i++) {
        if (weatherinfo.hourly[i].rain) {
          this.analyzedweather.rainstart = dayjs(weatherinfo.hourly[i].dt * 1000).format('HH:MM')
          this.analyzedweather.rainstart_mm = Math.round(weatherinfo.hourly[i].rain['1h'])
          if (this.analyzedweather.rainstart_mm < 1) this.analyzedweather.rainstart_mm = 1
          break
        }
        if (i >= forecasthours) break
      }
    }

    if (this.analyzedweather.windspeedlevel > 1) {
      // looking for wind stop
      for (let i = 1; i < weatherinfo.hourly.length; i++) {
        if (weatherinfo.hourly[i].wind_speed * ms2kmh < windlevel2) {
          this.analyzedweather.windstop = dayjs(weatherinfo.hourly[i].dt * 1000).format('HH:MM')
          break
        }
        if (i >= forecasthours) break
      }
    } else {
      // looking for wind start
      for (let i = 1; i < weatherinfo.hourly.length; i++) {
        if (weatherinfo.hourly[i].wind_speed * ms2kmh > windlevel2) {
          this.analyzedweather.windstart = dayjs(weatherinfo.hourly[i].dt * 1000).format('HH:MM')
          break
        }
        if (i >= forecasthours) break
      }
    }

    logger.debug('[OpeanWeatherMap] Analyzed: ' + JSON.stringify(this.analyzedweather))
  }

  async updateWeatherInfo() {
    const winfo = await this.getWeatherInfo()
    if (!winfo) { return }

    this.weatherinfo = winfo

    this.analyzeWeatherInfo(winfo)
    this.storeWeatherInfo(winfo)

    this.emit('update')
  }

  async getWeatherInfo() {
    if (!systemsettings.Latitude || !systemsettings.Longitude || !systemsettings.OpenweathermapApiKey) { return null }

    try {
      const url = `https://api.openweathermap.org/data/2.5/onecall?units=metric&lat=${systemsettings.Latitude}&lon=${systemsettings.Longitude}&appid=${systemsettings.OpenweathermapApiKey}`
      const response = await got(url)
      if (!response) { return null }

      const winfo = JSON.parse(response.body)

      logger.debug('[OpeanWeatherMap] ' + winfo.current.temp + '°C')

      return winfo
    } catch (err) { return null }
  }

  storeWeatherInfo(winfo) {
    const trunced = winfo.current

    if (trunced) {
      const WeatherModel = require('../models/Weather')
      WeatherModel.Insert(JSON.stringify(trunced))
    }
  }
}

module.exports = OpenWeatherMap
