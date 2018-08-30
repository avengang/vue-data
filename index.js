/* eslint-disable */
import util from './util.js'
var _name_uuid_Map = {}
var _viewDatas = {
	common: {}
}
var _vms = []
var wait2Update = {}
function updateViewData() {
	var viewname, viewtag, key, value
	if(arguments.length === 4) {
		viewname = arguments[0]
		viewtag = arguments[1]
		key = arguments[2]
		value = arguments[3]
	} else if(arguments.length === 3) {
		viewname = arguments[0]
		viewtag = 'default'
		key = arguments[1]
		value = arguments[2]
	} else {
		console.log('传入参数：', arguments)
		throw new Error('$updateView参数不匹配，参数必须为3（viewname, key, value。其中viewtag为默认值：\'default\'）或者4个(viewname, viewtag, key, value)，传入的参数为：')
	}
	for(var n=0,nn=_vms.length;n<nn;n++) {
		var vm = _vms[n]
		var _viewtag = vm._props.viewtag || 'default'
		if(vm.configviewname === viewname) {
			if(+viewtag !== -1) {
				if(_viewtag !== viewtag) {
					continue
				}
				util.$setSingle(key, value, vm)
				return
			} else {
				util.$setSingle(key, value, vm)
			}
		}
	}
	if(viewtag !== -1) {
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
	if(_name_uuid_Map[config.viewname]) throw new Error('viewname不能重复, 已经存在viewname = ' + config.viewname + ' 的对象')
	_name_uuid_Map[viewname] = uuid
	if(!config.data || !config.data()) {
		config.data = function() {
			return util.$deepCopy({
				common: {}
			})
		}
	} else {
		var d = config.data()
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
	var oldBeforeMount = config.beforeCreate
	config.beforeCreate = function() {
		_vms.push(this)
		oldBeforeMount && oldBeforeMount.bind(this)()
	}
	var oldBeforeMount = config.beforeMount
	config.beforeMount = function() {
		this.configviewname = viewname
		this._viewname = uuid
		this.cache = cache
		var viewtag = this._props.viewtag || 'default'
		if(this.cache) { // 如果需要缓存的话就要把该对象data加入字段
			for(var k in _viewDatas[this._viewname][viewtag]) {
				if(this[k] === undefined) this.$set(this.$data, k, null)
			}
		}
		oldBeforeMount && oldBeforeMount.bind(this)()
	}
	var oldMounted = config.mounted
	config.mounted = function() {
		oldMounted && oldMounted.bind(this)()
		var viewtag = this._props.viewtag || 'default'
		if(this.cache) { // 有指定该对象需要缓存的话就要在渲染完之后加入缓存内容
			var viewDatas = _viewDatas[this._viewname][viewtag]
			util.$set(viewDatas, this)
			_viewDatas[this._viewname][viewtag] = null
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
		oldBeforeDestroy && oldBeforeDestroy.bind(this)()
		for(var n=0,nn=_vms.length;n<nn;n++) {
			if(_vms[n] === this) {
				_vms.splice(n, 1)
				break
			}
		}
		if(this.cache) {
			var viewtag = this._props.viewtag || 'default'
			_viewDatas[this._viewname][viewtag] = util.$deepCopy(this._data)
		} else {
			_viewDatas[this._viewname][viewtag] = {}
		}
	}
	_viewDatas[uuid] = {}
	return config
}
window.VueData = VueData
function install(Vue, options) {
	Vue.prototype.$updateView = updateViewData
	Vue.prototype.$updateCommon = updateCommonData
}
export default install