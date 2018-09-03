/* eslint-disable */

var $deepCopy = function (obj, cache = []) {

  function find (list, f) {
    return list.filter(f)[0]
  }

  // just return if obj is immutable value
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // if obj is hit, it is in circular structure
  const hit = find(cache, c => c.original === obj)
  if (hit) {
    return hit.copy
  }

  const copy = Array.isArray(obj) ? [] : {}
  // put the copy into cache at first
  // because we want to refer it in recursive deepCopy
  cache.push({
    original: obj,
    copy
  })

  Object.keys(obj).forEach(key => {
    copy[key] = $deepCopy(obj[key], cache)
  })

  return copy
}
var $getElLink = function(el) {
  var result = ''
  while(el) {
    result += el.nodeName + el.id + el.className
    el = el.parent
  }
  return result
}

var $getUuid = function() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "_";
  var uuid = s.join("");
  return uuid;
}
var $setSingle = function(k, value, dist) {
  if(dist[k] === value) return // 没变化，不更新
  if(Object.prototype.toString.call(value) === '[object Array]') {
    for(var j=0;j<value.length;j++) {
      dist.$set(dist[k], j, $deepCopy(value[j]))
    }
  } else if(Object.prototype.toString.call(value) === '[object object]') {
    for(var _key in value) {
      dist.$set(dist[k], _key, value[_key])
    }
  } else {
    dist[k] = value
  }
}
var $set = function(src, dist) {
  for(var k in src) {
    $setSingle(k, src[k], dist)
  }
}
var $isUndefinedOrNull = function(arg) {
  if(arg === undefined || arg === null) return true
  return false
}
var $getCache = function(vm) {
  while(vm) {
    if(!!vm.$$cache) return true
    vm = vm.$parent
  }
  return false
}
var $getArgMethodParam = function(arg) {
  var result = []
  for(var i=0,ii=arg.length;i<ii;i++) {
    if(i >= 3) {
      result.push(arg[i])
    }
  }
  return result
}
export default {
  $deepCopy,
  $getElLink,
  $getUuid,
  $set,
  $setSingle,
  $isUndefinedOrNull,
  $getCache,
  $getArgMethodParam
}