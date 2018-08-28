/* eslint-disable */
Function.prototype._before_ = function(beforefn) {
	var _self = this; //保存原函数引用
	return function() {
		beforefn.apply(this, arguments); //执行新函数，修正this
		return _self.apply(this, arguments); //执行原函数
	}
};

Function.prototype._after_ = function(afterfn) {
	var _self = this;
	return function() {
		var ret = _self.apply(this, arguments); //【不要直接写在return中】
		afterfn.apply(this, arguments);
		return ret;		
	}
}