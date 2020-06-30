module.exports = {

  reduceTimeLine(timeline, idealsize) {
  },

  moveAverage(timeline, framesize) {
    let result = [];

    lasts = [];
    timeline.forEach(item => {
      while (lasts.length >= framesize)
        lasts.shift();
      lasts.push(Number(item[1]));

      const avg = lasts.reduce((acc, curr) => acc + curr) / lasts.length;

      result.push([item[0], avg]);
    });

    return result;
  },

}