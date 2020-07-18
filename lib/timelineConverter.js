const moment = require('moment');

module.exports = {

  reduceTimeline(timeline, idealsize) {
    if (timeline.length <= idealsize)
      return timeline;

    const result = [];
    const originalsize = timeline.length;
    const factor = Math.round(timeline.length / idealsize);

    for (let i = 0; i < timeline.length; i++)
      if (i % factor == 0)
        result.push(timeline[i]);

    logger.debug(`[TimelineConverter] Reduced count from ${originalsize} to ${result.length}`);

    return result;
  },

  moveAverage(timeline, framesize) {
    const result = [];

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

  groupByDay(timeline, datefield = 'DateTime') {
    const result = {};

    timeline.forEach(item => {
      const datetime = item[datefield];
      const datestr = moment(datetime).format('YYYY. MM. DD.');

      if (!result.hasOwnProperty(datestr))
        result[datestr] = [];

      result[datestr].push(item);
    });

    return result;
  },

}