/* eslint-disable */
var $deepCopy = function (o) {
  if(o instanceof Date) {
    var d = new Date();
    d.setFullYear(o.getFullYear())
  }
  if (o instanceof Array) {
    var n = [];
    for (var i = 0; i < o.length; ++i) {
      n[i] = $deepCopy(o[i]);
    }
    return n;
  } else if (o instanceof Function) {
    var n = new Function("return " + o.toString())();
    return n
  } else if (o instanceof Date) {
    var d = new Date();
    d.setFullYear(o.getFullYear());
    d.setMonth(o.getMonth());
    d.setDate(o.getDate());
    d.setHours(o.getHours());
    d.setMinutes(o.getMinutes());
    d.setSeconds(o.getSeconds());
    d.setMilliseconds(o.getMilliseconds());
    return d;
  } else if (o instanceof Number || o instanceof String || o instanceof Boolean) {
    return o.valueOf();
  } else if (o instanceof RegExp) {
    var pattern = o.valueOf();
    var flags = '';
    flags += pattern.global ? 'g' : '';
    flags += pattern.ignoreCase ? 'i' : '';
    flags += pattern.multiline ? 'm' : '';
    return new RegExp(pattern.source, flags);
  } else if (o instanceof Object) {
    var n = {}
    for (var i in o) {
      n[i] = $deepCopy(o[i]);
    }
    return n;
  } else {
    return o;
  }
};
var $getElLink = function(el) {
  var result = '';
  while(el) {
    result += el.nodeName + el.id + el.className;
    el = el.parent;
  }
  return result;
};
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
};
var $setSingle = function(k, value, dist) {
  if(Object.prototype.toString.call(dist[k]) == '[object Function]') {
    if(k == '$clearCache') {
      dist[k]();
      return;
    }
    if(Object.prototype.toString.call(value) == '[object Array]') {
      dist[k].apply(dist, value);
    } else {
      dist[k].call(dist, value);
    }
    return;
  }
  var indexOrKey = '';
  if(k.indexOf('[') != -1) {
    var tempArr = k.split('[');
    k = tempArr[0];
    indexOrKey = tempArr[1].split(']')[0];
  }
  if(indexOrKey) {
    if(Object.prototype.toString.call(dist[k]) == '[object Array]') {
      if(dist[k][indexOrKey] == value) return; // 没变化，不更新
      dist.$set(dist[k], indexOrKey, $deepCopy(value));
    } else if(Object.prototype.toString.call(dist[k]) == '[object Object]') {
      if(dist[k][indexOrKey] == value) return; // 没变化，不更新
      dist.$set(dist[k], indexOrKey, $deepCopy(value));
    } else {
      throw new Error('非对象和非数组不允许按下标或字段设置值');
    }
  } else {
    if(dist[k] == value) return; // 没变化，不更新
    if(Object.prototype.toString.call(dist[k]) == '[object Array]') {
      dist[k] = [];
      for(var j=0;j<value.length;j++) {
        dist.$set(dist[k], j, $deepCopy(value[j]));
      }
    } else if(Object.prototype.toString.call(dist[k]) == '[object Object]') {
      dist[k] = {};
      for(var _key in value) {
        dist.$set(dist[k], _key, $deepCopy(value[_key]));
      }
    } else {
      dist[k] = $deepCopy(value);
    }
  }
};
var $set = function(src, dist) {
  for(var k in src) {
    $setSingle(k, src[k], dist);
  }
};
var $isUndefinedOrNull = function(arg) {
  if(arg == undefined || arg == null) return true;
  return false;
};
var $getCache = function(vm) {
  while(vm) {
    if(!!vm.$$cache) return true;
    vm = vm.$parent;
  }
  return false;
  return vm.$$cache;
};
var $getArgMethodParam = function(arg) {
  var result = [];
  for(var i=0,ii=arg.length;i<ii;i++) {
    if(i >= 3) {
      result.push(arg[i]);
    }
  }
  return result;
};
var $getViewtag = function(vm, name_tags) {
  if(vm._uid == 1) {
  	return 'app';
  }
  if(vm._props.viewtag) {
    return vm._props.viewtag;
  }
  if(vm.$parent._props.viewtag) {
  	if(!name_tags[vm.configviewname][vm.$parent._props.viewtag + '_' + vm.configviewname] || vm.$$cache) {
  		return vm.$parent._props.viewtag + '_' + vm.configviewname;
  	} else {
  		return vm.$parent._props.viewtag + '_' + vm.configviewname + '_' + name_tags[vm.configviewname]._max;
  	}
  }
  if(vm.$parent.configviewname) {
    if(!name_tags[vm.configviewname][vm.$parent.configviewname + '_' + vm.configviewname] || vm.$$cache) {
    	return vm.$parent.configviewname + '_' + vm.configviewname;
    } else {
    	return vm.$parent.configviewname + '_' + vm.configviewname + '_' + name_tags[vm.configviewname]._max;
    }
  }
  if(!name_tags[vm.configviewname][vm.configviewname + '_' + vm.configviewname] || vm.$$cache) {
    return vm.configviewname + '_' + vm.configviewname;
  } else {
    return vm.configviewname + '_' + vm.configviewname + '_' + name_tags[vm.configviewname]._max;
  }
  return $getUuid();
};
// module.exports = {
//   $deepCopy: $deepCopy,
//   $getElLink: $getElLink,
//   $getUuid: $getUuid,
//   $set: $set,
//   $setSingle: $setSingle,
//   $isUndefinedOrNull: $isUndefinedOrNull,
//   $getCache: $getCache,
//   $getArgMethodParam: $getArgMethodParam,
//   $getViewtag: $getViewtag
// };
export default {
  $deepCopy: $deepCopy,
  $getElLink: $getElLink,
  $getUuid: $getUuid,
  $set: $set,
  $setSingle: $setSingle,
  $isUndefinedOrNull: $isUndefinedOrNull,
  $getCache: $getCache,
  $getArgMethodParam: $getArgMethodParam,
  $getViewtag: $getViewtag
}