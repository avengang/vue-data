/* eslint-disable */
require('./aop.js')
require('./util.js')
var _viewDatas = {}
function hash2name(hash) {
	return encodeURIComponent(hash).replace(/%/g, '_')
}
function isUndefinedOrNull(arg) {
	if(arg === undefined || arg === null) return true
	return false
}
function updateViewData(hash, key, value) {
	hash = hash.trim()
	if(hash[0] !== '#') hash = '#' + hash
	hash = hash2name(hash)
	if(_viewDatas[hash]) {
		_viewDatas[hash][key] = value
	} else {
		for(var k in _viewDatas) {
			if(k.split('_3F')[0] === hash) {
				_viewDatas[k][key] = value
			}
		}
	}
}
function updateCommonDataHelper(vm, key, value) {
	if(Object.prototype.toString.call(value) === '[object Array]') {
		for(var j=0;j<value.length;j++) {
			vm.$set(vm.common_data[key], j, window.deepCopy(value[j]))
		}
	} else if(Object.prototype.toString.call(value) === '[object object]') {
		for(var _key in value) {
			vm.$set(vm.common_data[key], _key, value[_key])
		}
	} else {
		var obj = {}
		obj[key] = value
		vm.$set(vm.common_data, key, window.deepCopy(value))
		// vm.common_data = Object.assign({}, vm.common_data, obj)
	}
}
function updateCommonData(key, value) {
	if(!_viewDatas.common_data) _viewDatas.common_data = {}
	_viewDatas.common_data[key] = value
	updateCommonDataHelper(this, key, value)
}
var Baseview = function(config) {
	if(!config.data()) {
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
				if(i === 2) {
					this._viewname = _this.name = hash2name(window.location.hash)
					this.$set(this.common_data, '$init', 'init')
					for(var k in _viewDatas[_this.name]) {
						if(this[k] === undefined) this.$set(this.$data, k, null)
					}
				}
				_this['_' + callbacks[i]] && _this['_' + callbacks[i]]()
			})._after_(function() {
				if(i === 3) {
					for(var k in _viewDatas[_this.name]) {
						if(Object.prototype.toString.call(_viewDatas[_this.name][k]) === '[object Array]') {
							for(var j=0;j<_viewDatas[_this.name][k].length;j++) {
								this.$set(this[k], j, window.deepCopy(_viewDatas[_this.name][k][j]))
							}
						} else if(Object.prototype.toString.call(_viewDatas[_this.name][k]) === '[object object]') {
							for(var _key in _viewDatas[_this.name][k]) {
								this.$set(this[k], _key, _viewDatas[_this.name][k][_key])
							}
						} else {
							this.$set(this[k], k, _viewDatas[_this.name][k])
						}
					}
					for(var commonk in _viewDatas.common_data) {
						updateCommonDataHelper(this, commonk, _viewDatas.common_data[commonk])
					}
				}
				_this[callbacks[i] + '_'] && _this[callbacks[i] + '_']()
			})
		})(i)
	}
	var _this = this;
	if(this.beforeRouteLeave) {
		this.beforeRouteLeave = this.beforeRouteLeave._before_(function() {
			_viewDatas[_this.name] = window.deepCopy(this._data)
		})
	} else {
		this.beforeRouteLeave = function(to, from, next) {
			_viewDatas[_this.name] = window.deepCopy(this._data)
			next();
		}
	}
}
function install(Vue, options) {
	window.Baseview = Baseview
	Vue.prototype.$updateView = updateViewData
	Vue.prototype.$updateCommon = updateCommonData
}
export default install