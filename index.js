/* eslint-disable */
import util from './util.js'
var name_tags = {}
var _viewDatas = {
  common: {}
}
var _vms = []
var wait2Update = {}
function vuedataDo() {
  var viewname, viewtag, key, value, method, isMethod = false
  viewname = arguments[0]
  viewtag = arguments[1]
  if(arguments.length < 2) {
    console.log('传入参数：', arguments)
    throw new Error('$vuedataDo参数个数必须大于2')
  } else if(arguments.length === 2) { // 更新全局属性
    updateCommonData(arguments[0], arguments[1])
    return
  } else {
    viewtag = viewtag || 'default'
    for(var n=0,nn=_vms.length;n<nn;n++) {
      var vm = _vms[n]
      var _viewtag = vm._props.viewtag || 'default'
      if(vm.configviewname === viewname) {
        var arg2 = vm[arguments[2]]
        var isMethod = Object.prototype.toString.call(arg2) === '[object Function]'
        var params = util.$getArgMethodParam(arguments)
        if(+viewtag !== -1) {
          if(_viewtag !== viewtag) {
            continue
          }
          if(isMethod) {
            arg2 && arg2.apply(vm, params)
          } else {
            util.$setSingle(arguments[2], arguments[3], vm)
          }
          return
        } else {
          if(isMethod) {
            arg2 && arg2.apply(vm, params)
          } else {
            util.$setSingle(arguments[2], arguments[3], vm)
          }
        }
      }
    }
  }
  
  if(viewtag !== -1 && !isMethod) {
    if(!wait2Update[viewname])
      wait2Update[viewname] = {}
    if(!wait2Update[viewname][viewtag])
      wait2Update[viewname][viewtag] = {}
    wait2Update[viewname][viewtag][key] = util.$deepCopy(value)
  }
}
function updateCommonDataHelper(vm, key, value) {
  if(!vm.common) {
    return //其他未从VueData继承的页面
  }
  if(Object.prototype.toString.call(value) === '[object Array]') {
    if(vm.common[key] === value) return
    for(var j=0;j<value.length;j++) {
      vm.$set(vm.common[key], j, util.$deepCopy(value[j]))
    }
  } else if(Object.prototype.toString.call(value) === '[object object]') {
    if(vm.common[key] === value) return
    for(var _key in value) {
      vm.$set(vm.common[key], _key, value[_key])
    }
  } else {
    var obj = {}
    obj[key] = value
    vm.$set(vm.common, key, util.$deepCopy(value))
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
    d.common = {}
    config.data = function() {
      return util.$deepCopy(d)
    }
  }
  if(!config.props) {
    config.props = []
    config.props.push('viewtag')
  } else {
    if(Object.prototype.toString.call(config.props) === '[object Array]') { // 数组
      config.props.push('viewtag')
    } else { // 对象
      config.props.viewtag = String
    }
  }
  var oldBeforeCreate = config.beforeCreate
  config.beforeCreate = function() {
    _vms.push(this)
    oldBeforeCreate && oldBeforeCreate.bind(this)()
  }
  var oldCreated = config.created
  config.created = function() {
    this.$$cache = cache || util.$getCache(this)
    var viewtag = this._props.viewtag || 'default'
    if(this.$$cache || (this.$$cache && !name_tags[viewname][viewtag])) {
      oldBeforeCreate && oldBeforeCreate.bind(this)()
      oldCreated && oldCreated.bind(this)()
    }
  }
  var oldBeforeMount = config.beforeMount
  config.beforeMount = function() {
    this.configviewname = viewname
    var viewtag = this._props.viewtag || 'default'
    if(!this.$$cache && name_tags[viewname][viewtag]) throw new Error('同一个viewname（' + viewname + '）下不能重复定义同一个viewtag:' + viewtag)
    name_tags[viewname][viewtag] = true
    if(this.$$cache) { // 如果需要缓存的话就要把该对象data加入字段
      for(var k in _viewDatas[uuid][viewtag]) {
        if(this[k] === undefined) this.$set(this.$data, k, null)
      }
    }
    if(!this.$$cache || (this.$$cache && !_viewDatas[uuid][viewtag])) oldBeforeMount && oldBeforeMount.bind(this)()
  }
  var oldMounted = config.mounted
  config.mounted = function() {
    var viewtag = this._props.viewtag || 'default'
    if(!this.$$cache || (this.$$cache && !_viewDatas[uuid][viewtag])) oldMounted && oldMounted.bind(this)()
    config.activated && config.activated.bind(this)()
    if(this.$$cache) { // 有指定该对象需要缓存的话就要在渲染完之后加入缓存内容
      var viewDatas = _viewDatas[uuid][viewtag]
      util.$set(viewDatas, this)
      _viewDatas[uuid][viewtag] = null
    }
    if(wait2Update[viewname] && wait2Update[viewname][viewtag]) {
      var waitData = wait2Update[viewname][viewtag]
      util.$set(waitData, this)
      wait2Update[viewname][viewtag] = null
    }
    for(var commonk in _viewDatas.common) {
      updateCommonDataHelper(this, commonk, _viewDatas.common[commonk])
    }
  }
  var oldBeforeDestroy = config.beforeDestroy
  config.beforeDestroy = function() {
    var viewtag = this._props.viewtag || 'default'
    oldBeforeDestroy && oldBeforeDestroy.bind(this)()
    for(var n=0,nn=_vms.length;n<nn;n++) {
      if(_vms[n] === this) {
        _vms.splice(n, 1)
        break
      }
    }
    if(this.$$cache) {
      _viewDatas[uuid][viewtag] = util.$deepCopy(this._data)
    } else {
      name_tags[viewname][viewtag] = undefined
      _viewDatas[uuid][viewtag] = null
    }
  }
  return config
}
VueData.$vuedataDo = vuedataDo
window.VueData = VueData
function install(Vue, options) {
  Vue.prototype.$vuedataDo = vuedataDo
}
export default install