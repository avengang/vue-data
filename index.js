/* eslint-disable */
require('./aop.js')
require('./util.js')
var _name_uuid_Map = {}
var _viewDatas = {
	common: {}
}
var _vms = []
var wait2Update = {}
function hash2name(hash) {
	return encodeURIComponent(hash).replace(/%/g, '_')
}
function isUndefinedOrNull(arg) {
	if(arg === undefined || arg === null) return true
	return false
}
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
		function fn() {
			if(vm[key] === value) return // 没变化，不更新
			if(Object.prototype.toString.call(value) === '[object Array]') {
				for(var j=0;j<value.length;j++) {
					vm.$set(vm[key], j, window.$deepCopy(value[j]))
				}
			} else if(Object.prototype.toString.call(value) === '[object object]') {
				for(var _key in value) {
					vm.$set(vm[key], _key, window.$deepCopy(value[_key]))
				}
			} else {
				vm[key] = value
			}
		}
		var _viewtag = vm._props.viewtag || 'default'
		if(vm.configviewname === viewname) {
			if(_viewtag !== -1) {
				if(_viewtag !== viewtag) {
					continue
				}
				fn()
				return
			} else {
				fn()
			}
		}
	}
	if(!wait2Update[viewname])
		wait2Update[viewname] = {}
	if(!wait2Update[viewname][viewtag])
		wait2Update[viewname][viewtag] = {}
	wait2Update[viewname][viewtag][key] = window.$deepCopy(value)
}
function updateCommonDataHelper(vm, key, value) {
	if(!vm.common) {
		return //其他未从baseview继承的页面
	}
	if(Object.prototype.toString.call(value) === '[object Array]') {
		if(vm.common[key] === value) return
		for(var j=0;j<value.length;j++) {
			vm.$set(vm.common[key], j, window.$deepCopy(value[j]))
		}
	} else if(Object.prototype.toString.call(value) === '[object object]') {
		if(vm.common[key] === value) return
		for(var _key in value) {
			vm.$set(vm.common[key], _key, value[_key])
		}
	} else {
		var obj = {}
		obj[key] = value
		vm.$set(vm.common, key, window.$deepCopy(value))
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
	var uuid = $getUuid()
	var viewname = config.viewname || uuid
	if(_name_uuid_Map[config.viewname]) throw new Error('viewname不能重复, 已经存在viewname = ' + config.viewname + ' 的对象')
	_name_uuid_Map[viewname] = uuid
	if(!config.data || !config.data()) {
		config.data = function() {
			return window.$deepCopy({
				common: {
					$init: 'init'
				}
			})
		}
	} else {
		var d = config.data()
		d.common = {
			$init: 'init'
		}
		config.data = function() {
			return window.$deepCopy(d)
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
	_viewDatas[uuid] = {}
	var callbacks = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed']
	for(var k in config) {
		if(config.hasOwnProperty(k) && !isUndefinedOrNull(config[k])) {
			this[k] = config[k];
		}
	}
	for(var i = 0; i < callbacks.length; i++) {
		if(!this[callbacks[i]]) {
			this[callbacks[i]] = function() {}
		}
		var _this = this;
		(function(i) {
			_this[callbacks[i]] = _this[callbacks[i]]._before_(function() {
				if(i === 0) { // beforeCreate
					_vms.push(this)
				}
				if(i === 2) { // beforeMount
					this.configviewname = viewname
					this._viewname = uuid
					this.cache = cache
					this.$set(this.common, "randNum", window.$getUuid())
					var viewtag = this._props.viewtag || 'default'
					if(this.cache) { // 如果需要缓存的话就要把该baseview的对象data加入字段
						for(var k in _viewDatas[this._viewname][viewtag]) {
							if(this[k] === undefined) this.$set(this.$data, k, null)
						}
					}
				}
// 				if(i === 3) { // mounted
// 					this.$el.classList.add('_js_viewdata_' + uuid + '-' + viewtag) //给每个继承自该对象的页面根节点添加样式
// 				}
				_this['_' + callbacks[i]] && _this['_' + callbacks[i]]()
			})._after_(function() {
				if(i === 3) { // mounted
					var viewtag = this._props.viewtag || 'default'
					if(this.cache) { // 有指定该baseview是缓存的话就要在渲染完之后加入缓存内容
						var viewDatas = _viewDatas[this._viewname][viewtag]
						for(var k in viewDatas) {
							if(this[k] === viewDatas[k]) continue // 没变化，不更新
							if(Object.prototype.toString.call(viewDatas[k]) === '[object Array]') {
								for(var j=0;j<viewDatas[k].length;j++) {
									this.$set(this[k], j, window.$deepCopy(viewDatas[k][j]))
								}
							} else if(Object.prototype.toString.call(viewDatas[k]) === '[object object]') {
								for(var _key in viewDatas[k]) {
									this.$set(this[k], _key, viewDatas[k][_key])
								}
							} else {
								this[k] = viewDatas[k]
							}
						}
						_viewDatas[this._viewname][viewtag] = null
					}
					if(wait2Update[viewname] && wait2Update[viewname][viewtag]) {
						var waitData = wait2Update[viewname][viewtag]
						for(var k in waitData) {
							if(this[k] === waitData[k]) continue // 没变化，不更新
							if(Object.prototype.toString.call(waitData[k]) === '[object Array]') {
								for(var j=0;j<waitData[k].length;j++) {
									this.$set(this[k], j, window.$deepCopy(waitData[k][j]))
								}
							} else if(Object.prototype.toString.call(waitData[k]) === '[object object]') {
								for(var _key in waitData[k]) {
									this.$set(this[k], _key, waitData[k][_key])
								}
							} else {
								this[k] = waitData[k]
							}
						}
						// wait2Update[viewname][viewtag] = null
					}
					for(var commonk in _viewDatas.common) {
						updateCommonDataHelper(this, commonk, _viewDatas.common[commonk])
					}
				}
				if(i === 6) { // beforeDestroy
					for(var n=0,nn=_vms.length;n<nn;n++) {
						if(_vms[n] === this) {
							_vms.splice(n, 1)
							break
						}
					}
					if(this.cache) {
						var viewtag = this._props.viewtag || 'default'
						_viewDatas[this._viewname][viewtag] = window.$deepCopy(this._data)
					} else {
						_viewDatas[this._viewname][viewtag] = {}
					}
				}
				_this[callbacks[i] + '_'] && _this[callbacks[i] + '_']()
			})
		})(i)
	}
}
window.VueData = VueData
function install(Vue, options) {
	Vue.prototype.$updateView = updateViewData
	Vue.prototype.$updateCommon = updateCommonData
}
export default install