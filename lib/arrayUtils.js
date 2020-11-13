/* eslint-disable no-magic-numbers */
module.exports = {
  sortByProperty(array, property) {
    let sortOrder = 1
    let propertname = property
    if (propertname[0] === '-') {
      sortOrder = -1
      propertname = propertname.substr(1)
    }

    array.sort((a, b) => {
      const result = a[propertname] < b[propertname] ? -1 : a[propertname] > b[propertname] ? 1 : 0
      return result * sortOrder
    })
  },

  sortByFn(array, fn, reverse = false) {
    array.sort((a, b) => {
      const avalue = fn(a)
      const bvalue = fn(b)
      return (avalue < bvalue ? -1 : avalue > bvalue ? 1 : 0) * (reverse ? -1 : 1)
    })
  },

  groupByFn(array, groupfn, options = {
    groupsortfn: '',
    groupsortreverse: false,
    itemsortfn: '',
    itemsortreverse: false,
    itemsortproperty: ''
  }) {
    const temp = {}
    for (const item of array) {
      const group = groupfn(item)
      if (temp[group] === undefined) { temp[group] = [] }
      temp[group].push(item)
    }

    const result = {}
    const groups = Object.keys(temp)
    if (options.groupsortfn) {
      this.sortByFn(groups, options.groupsortfn, options.groupsortreverse)
    } else groups.sort()

    for (const key of groups) {
      result[key] = temp[key]

      if (options.itemsortfn) {
        this.sortByFn(result[key], options.itemsortfn, options.itemsortreverse)
      } else if (options.itemsortproperty) {
        this.sortByProperty(result[key], options.itemsortproperty)
      }
    }
    return result
  }
}
