module.exports = {
    thousand(s) { return s.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
}