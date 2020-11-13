/* eslint-disable no-magic-numbers */
module.exports = {

    clamp(x, min, max) {
        if (x < min) return min
        if (x > max) return max
        return x
    },

    rgb2xyz(rgb) {
        let r = rgb[0] / 255
        let g = rgb[1] / 255
        let b = rgb[2] / 255

        // Assume sRGB
        r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92)
        g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92)
        b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92)

        const x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805)
        const y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722)
        const z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505)

        return [x * 100, y * 100, z * 100]
    },

    xyz2xy(xyz) {
        const x = xyz[0]
        const y = xyz[1]
        const z = xyz[2]

        let rx = 0
        let ry = 0
        if (x + y + z !== 0) {
            rx = x / (x + y + z)
            ry = y / (x + y + z)
        }

        return [rx, ry]
    },

    xyz2rgb(xyz) {
        const x = xyz[0] / 100
        const y = xyz[1] / 100
        const z = xyz[2] / 100
        let r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986)
        let g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415)
        let b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570)

        // Assume sRGB
        r = r > 0.0031308
            ? ((1.055 * (r ** (1.0 / 2.4))) - 0.055)
            : r * 12.92

        g = g > 0.0031308
            ? ((1.055 * (g ** (1.0 / 2.4))) - 0.055)
            : g * 12.92

        b = b > 0.0031308
            ? ((1.055 * (b ** (1.0 / 2.4))) - 0.055)
            : b * 12.92

        r = Math.min(Math.max(0, r), 1)
        g = Math.min(Math.max(0, g), 1)
        b = Math.min(Math.max(0, b), 1)

        return [r * 255, g * 255, b * 255]
    },

    // Kelvin = 2500...7000 (1000...40000)
    colortemp2rgb(kelvin) {
        const temp = kelvin / 100

        let red, green, blue

        if (temp <= 66) {
            red = 255
            green = temp
            green = 99.4708025861 * Math.log(green) - 161.1195681661
            if (temp <= 19) {
                blue = 0
            } else {
                blue = temp - 10
                blue = 138.5177312231 * Math.log(blue) - 305.0447927307
            }
        } else {
            red = temp - 60
            red = 329.698727446 * Math.pow(red, -0.1332047592)

            green = temp - 60
            green = 288.1221695283 * Math.pow(green, -0.0755148492)

            blue = 255
        }

        return {
            r: this.clamp(red, 0, 255),
            g: this.clamp(green, 0, 255),
            b: this.clamp(blue, 0, 255)
        }
    }
}
