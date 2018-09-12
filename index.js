/* eslint-disable */
import util from './util.js'
var name_tags = {}
var _viewDatas = {
  common: {}
}
var _vms = []
var wait2Update = {}
function vd() {
  if(arguments.length === 0) {
    console.log('传入参数：', arguments)
    throw new Error('$vd参数个数必须大于2')
  } else if(arguments.length === 1) { // 获取全局属性
    var arguments0 = arguments[0]
    var indexOrKey = ''
    if(arguments0.indexOf('[') !== -1) {
      var tempArr = arguments0.split('[')
      arguments0 = tempArr[0]
      indexOrKey = tempArr[1].split(']')[0]
    }
    if(indexOrKey) {
      return _viewDatas.common[arguments0][indexOrKey]
    } else {
      return _viewDatas.common[arguments0]
    }
  } else if(arguments.length === 2) { // 更新全局属性或者通过viewname和viewtag拿到实例
    var arg1 = arguments[0]
    var arg2 = arguments[1]
    for(var n=0,nn=_vms.length;n<nn;n++) {
      var vm = _vms[n]
      var _viewtag = vm.$$viewtag
      if(vm.configviewname === arg1) {
        if(arg2) {
          if(_viewtag === arg2) return vm
        } else {
          return vm // 返回第一个找到的实例
        }
      }
    }
    updateCommonData(arg1, arg2)
    return null
  } else {
    var viewname = arguments[0]
    var viewtag = arguments[1]
    var vmMatchNum = 0 // 匹配的vm
    for(var n=0,nn=_vms.length;n<nn;n++) {
      var vm = _vms[n]
      var _viewtag = vm.$$viewtag
      if(vm.configviewname === viewname) {
        vmMatchNum++
        var arguments2 = arguments[2]
        var arg2 = vm[arguments2]
        var isMethod = Object.prototype.toString.call(arg2) === '[object Function]'
        var params = util.$getArgMethodParam(arguments)
        if(viewtag) {
          if(_viewtag !== viewtag) {
            continue
          }
          if(isMethod) {
            arg2 && arg2.apply(vm, params)
          } else {
            util.$setSingle(arguments2, arguments[3], vm)
          }
          return
        } else {
          if(isMethod) {
            arg2 && arg2.apply(vm, params)
          } else {
            util.$setSingle(arguments2, arguments[3], vm)
          }
        }
      }
    }
  }
  if(!vmMatchNum) {
    var tag = viewtag || '$default'
    if(!wait2Update[viewname])
    	wait2Update[viewname] = {}
    if(!wait2Update[viewname][tag])
    	wait2Update[viewname][tag] = {}
    if(arguments.length === 4) {
    	wait2Update[viewname][tag][arguments[2]] = util.$deepCopy(arguments[3])
    } else if(arguments.length > 4) {
    	var params = util.$getArgMethodParam(arguments)
    	wait2Update[viewname][tag][arguments[2]] = params
    }
  }
}
function updateCommonDataHelper(vm, key, value) {
  if(!vm.common) {
    return //其他非VueData对象
  }
  var indexOrKey = ''
  if(key.indexOf('[') !== -1) {
    var tempArr = key.split('[')
    key = tempArr[0]
    indexOrKey = tempArr[1].split(']')[0]
  }
  if(indexOrKey) {
    if(Object.prototype.toString.call(vm.common[key]) === '[object Array]') {
      if(vm.common[key][indexOrKey] === value) return
      vm.$set(vm.common[key], indexOrKey, util.$deepCopy(value))
    } else if(Object.prototype.toString.call(vm.common[key]) === '[object Object]') {
      if(vm.common[key][indexOrKey] === value) return
      vm.$set(vm.common[key], indexOrKey, util.$deepCopy(value))
    } else {
      throw new Error('非对象和非数组不允许按下标或字段设置值')
    }
  } else {
    if(vm.common[key] === value) return // 没变化，不更新
    if(Object.prototype.toString.call(vm.common[key]) === '[object Array]') {
      vm.common[key] = []
      for(var j=0;j<value.length;j++) {
        vm.$set(vm.common[key], j, util.$deepCopy(value[j]))
      }
    } else if(Object.prototype.toString.call(vm.common[key]) === '[object Object]') {
      vm.common[key] = {}
      for(var _key in value) {
        vm.$set(vm.common[key], _key, util.$deepCopy(value[_key]))
      }
    } else {
      vm.$set(vm.common, key, util.$deepCopy(value))
    }
  }
}
function updateCommonData(key, value) {
  _viewDatas.common[key] = value
  for(var i=0,ii=_vms.length;i<ii;i++) {
    var vm = _vms[i]
    updateCommonDataHelper(vm, key, value)
  }
}
var VueData = function(config) {
  var cache = config.cache
  var uuid = util.$getUuid()
  var viewname = config.viewname || uuid
  if(name_tags[viewname]) throw new Error('viewname不能重复, 已经存在viewname = ' + config.viewname + ' 的对象')
  name_tags[viewname] = {}
  _viewDatas[uuid] = {}
  var dataReturn = null
  if(config.data && Object.prototype.toString.call(config.data) === "[object Function]") {
    try{
      dataReturn = config.data()
    }catch(e){
      console.warn('VueData构造方法中data方法返回的对象中不允许使用this的属性，因为此时对象还未构造中，建议在created方法中给变量赋值。')
      console.error(e)
    }
  }
  if(!config.data || !dataReturn) {
    config.data = function() {
      return util.$deepCopy({
        common: {}
      })
    }
  } else {
    var d = dataReturn
    d.common = dataReturn.common || {}
    config.data = function() {
      return util.$deepCopy(d)
    }
  }
  if(!config.props) {
    config.props = []
    config.props.push('viewtag')
  } else {
    if(Object.prototype.toString.call(config.props) === '[object Array]') { // 数组
      if(config.props.indexOf('viewtag') === -1)
        config.props.push('viewtag')
    } else { // 对象
      if(config.props.viewtag === undefined)
        config.props.viewtag = String
    }
  }
  var oldBeforeCreate = config.beforeCreate
  config.beforeCreate = function() {
    _vms.push(this)
    this.configviewname = viewname
    oldBeforeCreate && oldBeforeCreate.bind(this)()
  }
  var oldCreated = config.created
  config.created = function() {
    this.$$cache = cache || util.$getCache(this)
    this.$$viewtag = util.$getViewtag(this)
    if(this.$$cache || (this.$$cache && !name_tags[viewname][this.$$viewtag])) {
      oldBeforeCreate && oldBeforeCreate.bind(this)()
      oldCreated && oldCreated.bind(this)()
    }
  }
  var oldBeforeMount = config.beforeMount
  config.beforeMount = function() {
    if(!this.$$cache && name_tags[viewname][this.$$viewtag]) {
      console.warn('同一个viewname（' + viewname + '）下定义了同一个viewtag:' + viewtag + '（如果是热更新引起的话请忽略。）')
    }
    name_tags[viewname][this.$$viewtag] = true
    if(this.$$cache) { // 如果需要缓存的话就要把该对象data加入字段
      for(var k in _viewDatas[uuid][this.$$viewtag]) {
        if(this[k] === undefined) this.$set(this.$data, k, null)
      }
    }
    if(!this.$$cache || (this.$$cache && !_viewDatas[uuid][this.$$viewtag])) oldBeforeMount && oldBeforeMount.bind(this)()
  }
  var oldMounted = config.mounted
  config.mounted = function() {
    config.beforeCache && config.beforeCache.bind(this)()
    if(!this.$$cache || (this.$$cache && !_viewDatas[uuid][this.$$viewtag])) oldMounted && oldMounted.bind(this)()
    if(this.$$cache) { // 有指定该对象需要缓存的话就要在渲染完之后加入缓存内容
      var viewDatas = _viewDatas[uuid][this.$$viewtag]
      util.$set(viewDatas, this)
      _viewDatas[uuid][this.$$viewtag] = null
    }
    for(var k in wait2Update[viewname]) {
      if(k === '$default' && wait2Update[viewname].$default) {
        var waitData = wait2Update[viewname].$default
        util.$set(waitData, this)
        wait2Update[viewname].$default = null
        break
      }
    }
    if(wait2Update[viewname] && wait2Update[viewname][this.$$viewtag]) {
      var waitData = wait2Update[viewname][this.$$viewtag]
      util.$set(waitData, this)
      wait2Update[viewname][this.$$viewtag] = null
    }
    for(var commonk in _viewDatas.common) {
      updateCommonDataHelper(this, commonk, _viewDatas.common[commonk])
    }
    config.cached && config.cached.bind(this)()
  }
  var oldBeforeDestroy = config.beforeDestroy
  config.beforeDestroy = function() {
    oldBeforeDestroy && oldBeforeDestroy.bind(this)()
    for(var n=0,nn=_vms.length;n<nn;n++) {
      if(_vms[n] === this) {
        _vms.splice(n, 1)
        break
      }
    }
    if(this.$$cache) {
      _viewDatas[uuid][this.$$viewtag] = util.$deepCopy(this._data)
    } else {
      name_tags[viewname][this.$$viewtag] = undefined
      _viewDatas[uuid][this.$$viewtag] = null
    }
  }
  return config
}
VueData.$vd = vd
window.VueData = VueData
function install(Vue, options) {
  Vue.prototype.$vd = vd
}
export default install