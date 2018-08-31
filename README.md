# vue-data
vue-data是一个vue实例对象数据和方法的管理工具。
可以实现 实例的**共享全局对象**、**缓存**、**数据修改**、**方法调用**。
## 安装
```
npm install vue-data --save-dev
```
## 使用
```
import Vue from 'vue'
import vuedata from 'vue-data'
Vue.use(vuedata)
```
### vue实例构建
1.vue-data会在window对象中定义一个全局对象：VueData,如果vue文件需要使用vue-data的功能就必须要通过VueData的方式生成对象来构建vue实例：
```
<template>
	<div>
		页面{{common.abc}}<!-- abc为全局共享属性 -->
	</div>
</template>

<script>
	
	export default new window.VueData({
		cache: true, // 是否缓存,表示该VueData对象是需要缓存的，那改vue实例在销毁前将会把data对象缓存起来，等待下次create该对象的时候直接将缓存data值赋值给新的vue对象。
		viewname: 'myview', //vuedata实例名称，是为了指定修改数据和指定调用方法的时候定位到具体实例，如果不指定该属性，该属性为'default'
		data() {
		},
		methods: {
		}
	})
</script>

<style>
</style>
```
当然，如果确定为每个vue文件都添加vue-data功能的话最好结合专门为vue-data写的**vue-data-loader**来使用，结合vue-data-loader之后，所有vue文件将不会和普通vue文件有任何区别：
```
<template>
	<div>
		页面
	</div>
</template>

<script>
	
	export default {
		data() {
		},
		methods: {
		}
	}
</script>

<style>
</style>
```
[vue-data-loader的使用方式](https://github.com/avengang/vue-data-loader/tree/master)
### 全局共享
顾名思义，全局共享就是所有的vue文件中可以共享一个对象的值，并且共享对象值的改变会直接导致页面更新，这个对象就是**common**对象，
common对象会默认存在每个vue实例的data属性中，并且和其他在data中的属相并无区别，依然可以watch，computed等操作。
```
<template>
	<div>
		{{common.testCommon}}
	</div>
</template>

<script>
	
	export default {
		cache: true,
		viewname: 'myview',
		data() {
			return {
				titles: [{
					text: "权限管理",
					route: '/xxx'
				}, {
					text: "角色列表",
					route: '/xxx2'
				}]
			}
		},
		methods: {
		}
	}
</script>

<style>
</style>
```
**全局对象的新增和修改**, ***$updateCommon***,如果不存在该属性就创建，如果存在该属性就修改
```
<script>
	export default {
		data() {
		},
		methods: {
			someFn() {
				this.$updateCommon('testCommon', 'abc') // 修改全局属性testCommon的值为abc，'abc'同样的可以替换成数组或者对象，因为内部实现用到了Vue.set
			}
		}
	}
</script>
```

### 指定修改
在vue实例中可使用方法：**$updateInstance**来修改指定的另一个vue实例的data属性值或者调用该实例的方法，具体做法是：
```
<script>
	export default {
		data() {
		},
		methods: {
			someFn() {
				// 更新viewname为myview,viewtag为tag1(tag1可以替换成 '': 'default'; '-1': 所有viewname为myview)的实例，设置该实例的titles属性为[{text: "关于我们", route: '/about'}]
				this.$updateInstance('myview', 'tag1', 'titles', [{text: "关于我们", route: '/about'}])
				
				// 调用viewname为myview,viewtag为tag1(tag1可以替换成 '': 'default'; '-1': 所有viewname为myview)的实例方法 myMethod
				this.$updateInstance('myview', 'tag1', 'myMethod']) // 
			}
		}
	}
</script>
```
### 重复的vue实例
如果vue实例在页面中不存在多个或反复实例化的话，那该vue文件构建的实例都会使用一个默认的viewtag即：'default',指定该vue文件实例化的vue实例修改属性的话可以不用传viewtag,
如果页面中有重复使用的vue实例或者页面反复构建的页面（比如一个商品信息页面：商品信息下面有相关商品，点击相关商品又跳转到商品信息）,必须为实例指定viewtag（VueData在定义的时候就给每一个vue对象新增了**props**属性**viewtag**）来区分同一个vue文件构造的不同实例，
```
<template>
	<div>
		<myview :datas="titles" viewtag="myview1"></myview>
		<myview :datas="titles" viewtag="myview2"></myview>
	</div>
</template>
```
```
<template>
	<div>
		<detailview :datas="titles" :viewtag="mytag"></detailview>
		<!-- 相关商品列表 -->
		<div @click="someLikeFn">商品1</div>
		<div @click="someLikeFn">商品2</div>
	</div>
</template>
<script>
	window._mytag = 1
	export default {
		data() {
			return {
				mytag: 'tag1'
			}
		},
		methods: {
			someLikeFn() {
				this.mytag = 'tag' + (++window._mytag)
				this.$router.push({path: '/product/detail'})
			}
		}
	}
</script>
```
此时，因为有多个改vue文件创建的vue实例，所以如果指定该vue文件生成的vue实例的属性进行修改的话，需要指定viewtag,如果viewtag传-1则会改动所有该vue文件模板创建出来的实例。
```
this.$updateInstance('myview', 'tag2', [{text: "123", route: '/sdasg'}])
this.$updateInstance('myview', '-1', [{text: "123", route: '/sdasg'}])
```
### 更新属性，viewtag变量传值

-1: **修改当前存在未被销毁的viewname为指定值的实例的data属性**
''或者'default': **修改viewname为指定值viewtag为default的实例的data属性，若该vue实例还未创建就等到创建时赋值**
其他: **修改viewname和viewtag为指定值的实例的data属性，若该vue实例还未创建就等到创建时赋值**