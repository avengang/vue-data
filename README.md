# vue-data
vue-data是一个vue实例$data对象的管理工具，可以提供data数据**全局共享**、**缓存**实例data数据和vue实例的**指定修改**data属性等功能。
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
		页面
	</div>
</template>

<script>
	
	export default new window.VueData({
		cache: true, // 是否缓存
		viewname: 'myview', //vuedata实例名称
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
**cache**: true)：表示该VueData对象是需要缓存的，那改vue实例在销毁前将会把data对象缓存起来，等待下次create该对象的时候直接将缓存data值赋值给新的vue对象。
**viewname**: 'myview')：为该VueData对象取别名，以便后面指定修改操作使用。
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
				this.$updateCommon('testCommon', 'abc')
			}
		}
	}
</script>
```

### 指定修改
在vue实例中可使用方法：**$updateView**来修改指定的另一个vue实例的data属性值，具体做法是：
```
<script>
	export default {
		data() {
		},
		methods: {
			someFn() {
				this.$updateView('myview', 'titles', [{text: "关于我们", route: '/about'}])
			}
		}
	}
</script>
```
### 重复的vue实例
如果vue实例在页面中不存在多个或反复实例化的话，那该vue文件构建的实例都会使用一个默认的viewtag即：'default',指定该vue文件实例化的vue实例修改属性的话可以不用传viewtag,
如果页面中有重复使用的vue实例或者页面反复构建的页面（比如一个商品信息页面：商品信息下面有相关商品，点击相关商品又跳转到商品信息）,必须为实例指定viewtag来区分同一个vue对象的不同使用地方，区分了不同使用地方的vue实例才能被正确的缓存和指定修改，VueData在定义的时候就给每一个vue对象新增了**props**属性**viewtag**，
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
this.$updateView('myview', 'tag2', [{text: "123", route: '/sdasg'}])
```
