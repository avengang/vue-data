/* eslint-disable */
require('./aop.js')
require('./util.js')
var _name_uuid_Map = {}
var _viewDatas = {}
var _vms = []
// 动态加载页面文件的时候，页面文件还没加载等待，对应的baseview实例还没存在，此时要修改对象的值就先放到临时对象里面
var wait2Update = {}
function hash2name(hash) {
	return encodeURIComponent(hash).replace(/%/g, '_')
}
function isUndefinedOrNull(arg) {
	if(arg === undefined || arg === null) return true
	return false
}
function updateViewData(name, key, value) {
	var uuid = _name_uuid_Map[name]
	if(!uuid) {
		wait2Update[name] = {}
		wait2Update[name][key] = value
	} else {
		_viewDatas[uuid][key] = value
	}
}
function updateCommonDataHelper(vm, key, value) {
	if(!vm.common_data) {
		return //其他未从baseview继承的页面
	}
	if(Object.prototype.toString.call(value) === '[object Array]') {
		if(vm.common_data[key] === value) return
		for(var j=0;j<value.length;j++) {
			vm.$set(vm.common_data[key], j, window.$deepCopy(value[j]))
		}
	} else if(Object.prototype.toString.call(value) === '[object object]') {
		if(vm.common_data[key] === value) return
		for(var _key in value) {
			vm.$set(vm.common_data[key], _key, value[_key])
		}
	} else {
		var obj = {}
		obj[key] = value
		vm.$set(vm.common_data, key, window.$deepCopy(value))
	}
}
function updateCommonData(key, value) {
	if(!_viewDatas.common_data) _viewDatas.common_data = {}
	_viewDatas.common_data[key] = value
	for(var i=0,ii=_vms.length;i<ii;i++) {
		var vm = _vms[i]
		updateCommonDataHelper(vm, key, value)
	}
}
var Baseview = function(config) {
	var uuid = $getUuid()
	var viewname = config.viewname || uuid
	if(_name_uuid_Map[config.viewname]) throw new Error('viewname不能重复, 已经存在viewname = ' + config.viewname + ' 的对象')
	_name_uuid_Map[viewname] = uuid
	if(!config.data || !config.data()) {
		config.data = function() {
			return {
				common_data: {
					$init: 'init'
				}
			}
		}
	} else {
		var d = config.data()
		d.common_data = {
			$init: 'init'
		}
		config.data = function() {
			return d
		}
	}
	_viewDatas[uuid] = config.data()
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
					this._viewname = _this.name = uuid
					for(var k in _viewDatas[_this.name]) {
						if(this[k] === undefined) this.$set(this.$data, k, null)
					}
				}
				if(i === 3) { // mounted
					this.$el.classList.add('_js_isbaseview' + uuid) //给每个继承自该对象的页面根节点添加样式
				}
				_this['_' + callbacks[i]] && _this['_' + callbacks[i]]()
			})._after_(function() {
				if(i === 3) { // mounted
					var els = document.getElementsByClassName('_js_isbaseview' + uuid)
					if(!els) return //没显示就不用浪费性能去更新data
					for(var k in _viewDatas[_this.name]) {
						if(this[k] === _viewDatas[_this.name][k]) continue // 没变化，不更新
						if(Object.prototype.toString.call(_viewDatas[_this.name][k]) === '[object Array]') {
							for(var j=0;j<_viewDatas[_this.name][k].length;j++) {
								this.$set(this[k], j, window.$deepCopy(_viewDatas[_this.name][k][j]))
							}
						} else if(Object.prototype.toString.call(_viewDatas[_this.name][k]) === '[object object]') {
							for(var _key in _viewDatas[_this.name][k]) {
								this.$set(this[k], _key, _viewDatas[_this.name][k][_key])
							}
						} else {
							this[k] = _viewDatas[_this.name][k]
						}
					}
					for(var commonk in _viewDatas.common_data) {
						updateCommonData(this, commonk, _viewDatas.common_data[commonk])
					}
				}
				if(i === 6) { // beforeDestroy
					for(var i=0,ii=_vms.length;i<ii;i++) {
						if(_vms[i] === this) {
							_vms.splice(i, 1)
							return
						}
					}
					for(var i=0,ii=_viewDatas.length;i<ii;i++) {
						if(_viewDatas[i] === this) {
							_viewDatas.splice(i, 1)
							return;
						}
					}
				}
				_this[callbacks[i] + '_'] && _this[callbacks[i] + '_']()
			})
		})(i)
	}
	var _this = this;
	if(this.beforeRouteLeave) {
		this.beforeRouteLeave = this.beforeRouteLeave._before_(function() {
			_viewDatas[_this.name] = window.$deepCopy(this._data)
		})
	} else {
		this.beforeRouteLeave = function(to, from, next) {
			_viewDatas[_this.name] = window.$deepCopy(this._data)
			next();
		}
	}
}
window.Baseview = Baseview
function install(Vue, options) {
	Vue.prototype.$updateView = updateViewData
	Vue.prototype.$updateCommon = updateCommonData
}
export default install