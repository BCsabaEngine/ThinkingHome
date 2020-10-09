module.exports = {
  sortByProperty(array, property) {
    let sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }

    array.sort((a, b) => {
      const result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
    });
  },

  sortByFn(array, propertyfn) {
    array.sort((a, b) => {
      const avalue = propertyfn(a);
      const bvalue = propertyfn(b);
      return (avalue < bvalue) ? -1 : (avalue > bvalue) ? 1 : 0;
    });
  },

  groupByFn(array, groupfn, sortproperty = '') {
    const temp = {};
    for (const item of array) {
      const group = groupfn(item);
      if (temp[group] === undefined)
        temp[group] = [];
      temp[group].push(item);
    }

    const result = {};
    for (const key of Object.keys(temp).sort()) {
      result[key] = temp[key];
      if (sortproperty)
        this.sortByProperty(result[key], sortproperty);
    }
    return result;
  },
}