const net = require('net')
const EventEmitter = require('events')

const Color = require('color')
const colorTemp = require('color-temp')
const ssdp = require('node-ssdp')

const SOCKET_TIMEOUT = 5000
const REQUEST_TIMEOUT = 5000

const YEELIGHT_SSDP_PORT = 1982
const YEELIGHT_PORT = 55443

// specs: http://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf

class YeelightScanner {
    ssdp = null;

    Scan(targetobj) {
        this.Stop()

        this.ssdp = new ssdp.Client({ ssdpPort: YEELIGHT_SSDP_PORT })
        this.ssdp.on('response', function (data) {
            const newlight = new Yeelight(data)
            if (targetobj) targetobj[newlight.host] = { type: newlight.type, model: newlight.model }
        })
        this.ssdp.search('wifi_bulb')

        clearTimeout(this.closetimer)
        this.closetimer = setTimeout(function () { this.Stop() }.bind(this), 10 * 1000)
    }

    Stop() {
        if (this.ssdp) this.ssdp.stop()
        this.ssdp = null
    }
}

class Yeelight extends EventEmitter {
    constructor(ssdpMessage) {
        super()

        this.connected = false
        this.socket = null

        this.messageId = 1
        this.messages = {}

        this.power = false

        this.id = ''
        this.name = ''

        this.host = ''
        this.port = ''

        this.type = 'unknown'

        this.firmware = ''
        this.support = ''

        this.bright = 0
        this.rgb = { r: 0, g: 0, b: 0 }
        this.hsb = { h: 0, s: 0, b: 0 }

        if (ssdpMessage) this.updateBySSDPMessage(ssdpMessage)
    }

    getState() {
        const state =
        {
            type: this.type,
            power: this.power,
            bright: this.bright,
            rgb: this.rgb,
            hsb: this.hsb
        }

        return state
    }

    init(host, port = YEELIGHT_PORT) {
        this.host = host
        this.port = port

        this.updateState().then(() => { }).catch(error => { throw error })
    }

    updateBySSDPMessage(ssdpMessage) {
        this.id = ssdpMessage.ID
        this.name = ssdpMessage.NAME || ''

        this.model = ssdpMessage.MODEL
        this.firmware = ssdpMessage.FW_VER
        this.support = ssdpMessage.SUPPORT

        // get hostname and port
        const location = ssdpMessage.LOCATION
        const regex = /\/\/(.*):(.*)/g
        const matches = regex.exec(location)

        if (matches && matches.length >= 3) {
            this.host = matches[1]
            this.port = parseInt(matches[2])
        }

        // detect type
        if (this.support) {
            const supported = this.support.split(' ')

            if (supported.indexOf('set_ct_abx') !== -1) this.type = 'white'
            if (supported.indexOf('set_rgb') !== -1 || supported.indexOf('set_hsv') !== -1) this.type = 'color'
        }

        this.updatePower(ssdpMessage.POWER)

        this.updateColorbySSDPMessage(ssdpMessage)
    }

    updateColorbySSDPMessage(ssdpMessage) {
        // 1 means color mode, 2 means color temperature mode, 3 means HSV mode.
        const colorMode = parseInt(ssdpMessage.COLOR_MODE)

        // value from rgb
        if (colorMode === 1) this.updateByRGB(ssdpMessage.RGB, ssdpMessage.BRIGHT)
        // value from color temperature
        else if (colorMode === 2) this.updateCT(ssdpMessage.CT, ssdpMessage.BRIGHT)
        // value from HSV
        else if (colorMode === 3) this.updateHSV(ssdpMessage.HUE, ssdpMessage.SAT, ssdpMessage.BRIGHT)
    }

    updateByRGB(rgb, bright) {
        // rgb values: 0 to 16777215
        const color = Color(parseInt(rgb))
        const hsv = color.hsv()

        this.rgb.r = color.color[0]
        this.rgb.g = color.color[1]
        this.rgb.b = color.color[2]

        if (typeof bright !== 'undefined' && bright !== '') this.bright = parseInt(bright)

        this.hsb.h = hsv.color[0]
        this.hsb.s = hsv.color[1]
        this.hsb.b = this.bright

        // console.log("updateByRGB => new rgb: ",this.rgb);
        this.emit('stateUpdate', this)
    }

    updateCT(ct, bright) {
        // ct values: 1700 to 6500
        const rgb = colorTemp.temp2rgb(parseInt(ct))
        const hsv = Color.rgb(rgb).hsv()

        this.rgb.r = rgb[0]
        this.rgb.g = rgb[1]
        this.rgb.b = rgb[2]

        if (typeof bright !== 'undefined' && bright !== '') this.bright = parseInt(bright)

        this.hsb.h = hsv.color[0]
        this.hsb.s = hsv.color[1]
        this.hsb.b = this.bright

        // console.log("updateCT => new rgb: ",this.rgb);
        this.emit('stateUpdate', this)
    }

    updateHSV(hue, sat, val) {
        if (typeof val !== 'undefined' && val !== '') this.bright = parseInt(val)

        this.hsb.h = parseInt(hue)
        this.hsb.s = parseInt(sat)
        this.hsb.b = this.bright

        const rgb = Color.hsv([this.hsb.h, this.hsb.s, this.hsb.b]).rgb()

        this.rgb.r = rgb.color[0]
        this.rgb.g = rgb.color[1]
        this.rgb.b = rgb.color[2]

        // console.log("updateByRGB => new rgb: ",this.rgb);
        this.emit('stateUpdate', this)
    }

    updateBright(bright) {
        this.bright = parseInt(bright)
        this.hsb.b = this.bright

        // console.log("updateBright => new rgb: ",this.rgb);
        this.emit('stateUpdate', this)
    }

    updatePower(power) {
        this.power = (power && ('' + power).toLowerCase() !== 'off' && ('' + power).toLowerCase() !== 'false' && power !== '0')

        this.emit('stateUpdate', this)
    }

    connectiontimer = null;
    connectioncount = 0;
    connect() {
        if (this.socket) this.disconnect()

        this.emit('connect')

        // create socket
        this.socket = new net.Socket()
        this.socket.setTimeout(SOCKET_TIMEOUT)

        // data response
        this.socket.on('data', this.parseResponse.bind(this))

        this.socket.on('end', (data) => {
            this.parseResponse.bind(data)

            this.emit('disconnected')
            this.disconnect()
        })

        this.socket.connect(this.port, this.host, () => {
            this.emit('connected')
            this.connected = true
            this.connectioncount++
        })

        this.socket.on('close', (data) => {
            this.emit('disconnected')
            this.disconnect()
        })

        this.socket.on('error', (err) => { this.emit('failed', { reason: 'socket error', response: err }) })

        this.connectiontimer = setInterval(this.connect.bind(this), 60 * 1000)
    }

    disconnect() {
        if (this.socket) { try { this.destroy() } catch (e) { } }

        this.emit('disconnect')

        this.socket = null
        this.connected = false

        if (this.connectiontimer) clearInterval(this.connectiontimer)
    }

    isConnected() { return (this.socket && this.connected) }

    parseResponse(res) {
        const responses = res.toString('utf8')

        // console.log(" ==== res =====");
        // console.log(responses);

        // sometimes there are multiple messages in one message
        const splits = responses.split('\r\n')

        splits.forEach((response) => {
            // skip empty
            if (!response || response === '') return

            // parse json
            let json = null
            try { json = JSON.parse(response) } catch (e) {
                // console.error(e)
                // console.log(response)
                this.emit('failed', { reason: 'response is not parsable', response: response })
            }

            if (json) {
                const id = json.id
                const method = json.method
                const params = json.params
                const result = json.result

                // ******************** notofication message ********************
                if (method === 'props') {
                    if ('power' in params) this.updatePower(params.power)

                    if ('rgb' in params) this.updateByRGB(params.rgb)

                    if ('bright' in params) this.updateBright(params.bright)

                    if ('ct' in params) this.updateCT(params.ct)

                    if ('hue' in params && 'sat' in params) this.updateHSV(params.hue, params.sat)

                    if ('name' in params) this.name = params.name

                    this.emit('update', { response: json })
                }

                // ******************** get_prop result ********************
                if (result && id && this.messages[id] && this.messages[id].method === 'get_prop') {
                    const params = this.messages[id].params
                    const values = result

                    if (params.length === values.length) {
                        // generate object out of params and result-values
                        const obj = {}
                        for (let i = 0; i < params.length; ++i) {
                            const key = params[i]
                            const value = values[i]

                            obj[key] = value
                        }

                        // detect type (if Yeelight instance was created by host and port only - without ssdp)
                        // if the result of rgb is "" --> this means that rgb value is not supported (otherweise it will be "0" -> "16777215")
                        if (obj.rgb === '') this.type = 'white'
                        else this.type = 'color'

                        if ('power' in obj) this.updatePower(obj.power)

                        if ('color_mode' in obj) {
                            if (obj.color_mode === 1 && 'rgb' in obj) this.updateByRGB(obj.rgb, obj.bright)
                            else if (obj.color_mode === 2 && 'ct' in obj) this.updateCT(obj.ct, obj.bright)
                            else if (obj.color_mode === 3 && 'hue' in obj && 'sat' in obj) this.updateHSV(obj.hue, obj.sat, obj.bright)

                            this.colorMode = obj.color_mode
                        } else {
                            if ('bright' in obj) this.updateBright(obj.bright)
                        }
                    } else {
                        this.emit('failed', { reason: 'error on parsing get_prop result --> params length != values length', response: response })
                        // console.error('error on parsing get_prop result --> params length != values length')
                        // console.log(params)
                        // console.log(values)
                    }
                }

                // ******************** command response ********************
                if (id && this.messages[id]) {
                    const msg = this.messages[id]

                    clearTimeout(msg.timeout)

                    this.emit('success', { id: msg.id, method: msg.method, params: msg.params, response: json })

                    const resolve = msg.resolve

                    delete this.messages[id]

                    // resolve on the end
                    resolve(this)
                }
            }
        })
    }

    sendCommand(method, params) {
        // connect if not connected
        if (!this.isConnected()) this.connect()

        // check message
        let supportedMethods = []
        if (this.support) supportedMethods = this.support.split(' ')

        const id = this.messageId
        ++this.messageId

        // check if method is allowed - its also allowed if there is no support set (if light is added via hostname and port and not via ssdp)
        if ((this.support === '' || supportedMethods.indexOf(method) !== -1) && params && params.length > 0) {
            const paramsStr = JSON.stringify(params)

            const str = '{"id":' + id + ',"method":"' + method + '","params":' + paramsStr + '}' + '\r\n'

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    const msg = this.messages[id]
                    this.emit('timeout', { id: msg.id, method: msg.method, params: msg.params })

                    delete this.messages[id]
                    reject(new Error('id: ' + id + ' timeout'))
                }, REQUEST_TIMEOUT)

                // append message
                this.messages[id] = { id: id, method: method, params: params, timeout: timeout, resolve: resolve, reject: reject }

                this.socket.write(str)
            })
        } else return Promise.reject(new Error('method is not supported or empty params are set'))
    }

    updateState() {
        return this.sendCommand('get_prop', ['power', 'color_mode', 'ct', 'rgb', 'hue', 'sat', 'bright'])
    }

    setRGB(rgb, duration) {
        const number = Color.rgb(rgb).rgbNumber()

        // update local state
        this.updateByRGB(number)

        // "rgb_value", "effect", "duration"
        const params =
            [
                number,
                (duration) ? 'smooth' : 'sudden',
                (duration) || 0
            ]

        return this.sendCommand('set_rgb', params)
    }

    setBright(bright, duration) {
        // update local state
        this.updateBright(bright)

        // "brightness", "effect", "duration"
        const params =
            [
                bright,
                (duration) ? 'smooth' : 'sudden',
                (duration) || 0
            ]

        return this.sendCommand('set_bright', params)
    }

    setHSV(hsv, duration) {
        const color = Color.hsv(hsv)

        const hue = color.hue()
        const sat = color.saturationv()
        const bright = color.value()

        // update local state
        this.updateHSV(hue, sat, bright)

        // "hue", "sat", "effect", "duration"
        const params =
            [
                hue,
                sat,
                (duration) ? 'smooth' : 'sudden',
                (duration) || 0
            ]

        const proms = []

        proms.push(this.sendCommand('set_hsv', params))

        // set bright/value
        proms.push(this.setBright(bright, duration))

        return Promise.all(proms)
    }

    // ct: 1700 ~ 6500
    setCT(ct, duration) {
        // update local state
        this.updateCT(ct)

        // "ct_value", "effect", "duration"
        const params =
            [
                ct,
                (duration) ? 'smooth' : 'sudden',
                (duration) || 0
            ]

        return this.sendCommand('set_ct_abx', params)
    }

    setPower(power, duration) {
        // update local state
        this.updatePower(power)

        // "power", "effect", "duration"
        const params =
            [
                this.power ? 'on' : 'off',
                (duration) ? 'smooth' : 'sudden',
                (duration) || 0
            ]

        return this.sendCommand('set_power', params)
    }
}

module.exports = {
    YeelightScanner,
    Yeelight
}
