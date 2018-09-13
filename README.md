# vue-data
vue-data是一个vue实例对象数据的管理工具。  

可以进行**数据共享**、**缓存**、**获取实例对象和属性**、**实例数据更新和方法调用**。  

使用非常简单，只暴露一个api函数：$vd，增加了两个生命周期函数：beforeCache和cached  

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
vue-data会在window对象中定义一个全局对象：VueData。  

  如果vue文件需要使用vue-data的功能就必须要通过VueData的方式生成对象来构建vue实例。  

```
<template>
  <div>
  <!-- 
    每个vue实例中的common对象是相互独立的，可以通过调用$vd(key, value)的方式修改并同步到所有实例
     因为每个实例common对象相互独立，所以可以把common对象和对象中的属性当做普通data里面的属性使用，
     比如watch，computed等。不建议在实例中通过this.common的形式对该对象进行修改和删除
  -->
    页面{{common.abc}}
  </div>
</template>
<script>
  export default new window.VueData({
    cache: true, // 是否缓存,表示该VueData对象是需要缓存的，那改vue实例在销毁前将会把data对象缓存起来，
                 //等待下次create该对象的时候直接将缓存data值赋值给新的vue对象。
                 //缓存的页面created 和beforeMount、mounted方法在使用缓存且未被清空该页面缓存的情况下不会调用，
                 //缓存页面beforeCreate会调用
                 //可以通过  beforeCache  和  cached  生命周期方法来执行激活逻辑
                 //如果未设置或者设置为false，但是父组件链中如果是设置了true的话值也为true，
                 //比如，页面设置了缓存，那页面中使用的自定义vue组件也是缓存的
                 //实例.$vd() 来清除该实例和子组件的缓存内容
                 //$vd(viewname, viewtag, '$clearCache')清除指定实例的缓存
    viewname: 'myview', //vuedata实例名称，是为了指定修改数据和指定调用方法的时候定位到具体实例
                        
    data() {
    },
    methods: {
    },
    beforeCache() { // 始终会调用，无论是否是缓存状态
      // TODO
    },
    cached() { // 始终会调用，无论是否是缓存状态
      // TODO
    }
  })
</script>
<style>
</style>
```
当然，如果确定为**每个vue文件**都添加vue-data功能的话最好结合专门为vue-data写的 **vue-data-loader** 来使用，  

结合vue-data-loader之后，像编写普通vue文件一样了：  

[vue-data-loader的使用方式](https://github.com/avengang/vue-data-loader/tree/master)  

### $vd()
vue-data的唯一暴露方法。  

$vd():清除调用者的缓存（数据是在beforeDestroy钩子函数中缓存的，所以清除缓存必须在这之后），  
      全局对象VueData.$vd()将会报错  
      
$vd(viewname, viewtag, '$clearCache'): 清除指定实例的缓存,若该实例还不存在就等实例创建之后清除缓存；  

$vd(key):返回全局属性key的值  

$vd(viewname|key, viewtag|value): 通过viewname，viewtag获取实例对象 或者 设置全局属性key值为value；  

$vd(viewname, viewtag, method, param...):调用指定viewname，viewtag的实例的method方法,后面可跟不定个数个参数；  

$vd(viewname, viewtag, key, value):修改指定viewname，viewtag的实例的key属性值为value；  

--------------------------------------------------------------------------------------  

其中，**key**可以指定到具体的数组**下标**或者对象的**属性**：
$vd('commonArr[0]', value0)
$vd('commonObj[key1]', value1)
$vd('myheader', '', 'dropMenuArr[0]', menuValue0)
$vd('myheader', '', 'logo[url]', url)  

**返回值使用场景**  
var commonObj = this.$vd('commonObj') // 获取全局对象的commonObj值，  
																						 
var commonObj = this.$vd('commonObj[key]') // 获取全局对象的commonObj的key属性对应的值，  

var headerMenu = this.$vd('myheader', '', 'dropMenuArr') // 获取头部菜单对象  

var headerMenu0 = this.$vd('myheader', '', 'dropMenuArr[0]')// 获取头部菜单对象的第0个元素  

var logo = this.$vd('myheader', '', 'logo')// 获取头部logo对象  

var logoUrl = this.$vd('myheader', '', 'logo[url]')// 获取头部logo对象的url属性  

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
      // 修改属性testCommon的值为abc并同步到其他VueData对象
      //'abc'同样的可以替换成数组或者对象，因为内部实现用到了Vue.set
      this.$vd('testCommon', 'abc')
      
      // 设置viewname为myview,viewtag为的实例的titles属性为[{text: "关于我们", route: '/about'}]
      this.$vd('myview', 'tag1', 'titles', [{text: "关于我们", route: '/about'}])
      
      // 调用viewname为myview,viewtag为tag1的实例方法 myMethod
      this.$vd('myview', 'tag1', 'myMethod']) // 
    }
  }
</script>

<style>
</style>
```
### viewtag
viewtag是为了处理同一个vue文件创建的多个vue实例导致的无法精确指定某个实例的问题。  

VueData在定义的时候就给每一个vue对象新增了**props**属性**viewtag**  

正因为如此，viewtag才必须在同一个viewname下具有唯一性，如果不指定，viewtag的值默认为最近一个VueData父实例的viewtag+"_"+viewname。  


viewtag变量传值或者方法调用  

if判定为false:  **修改当前存在未被销毁的viewname为指定值的所有实例的data属性或者调用其方法**  
              **如果当前没有匹配的实例则等到 viewtag为默认值 的实例创建时赋值或方法调用**  

具体值:  **修改viewname和viewtag为指定值的实例的data属性或调用其方法，若该vue实例还未创建就等到匹配实例创建时赋值或方法调用**  


如果页面中有重复使用的vue实例或者页面反复构建的页面  

比如，一个商品信息页面：商品信息下面有相关商品，点击相关商品又跳转到商品信息，  

必须为实例指定viewtag来区分同一个vue文件构造的不同实例.  

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
  <!-- 假设改组件的viewname为 detailview -->
    <detailview :datas="products" :viewtag="mytag"></detailview>
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
        mytag: 'tag1',
        titles: [],
        products: []
      }
    },
    methods: {
      someLikeFn() {
        this.mytag = 'tag' + (++window._mytag) // 使viewtag同viewname下具有唯一性
        this.$router.push({path: '/product/detail'}) // 详情页面跳到详情页面
      }
    }
  }
</script>
```
此时，因为有多个改vue文件创建的vue实例，所以如果指定该vue文件生成的vue实例的属性进行修改的话，  

需要指定viewtag,如果viewtag传 **if判断为false的值** 则会改动所有该vue文件模板创建出来的实例,。  

```
this.$vd('myview', 'myview1', 'titles', [{text: "123", route: '/sdasg'}])
this.$vd('myview', '', 'titles', [{text: "123", route: '/sdasg'}])

this.$vd('detailview', 'tag1', products, [{title: "商品1", content: '内容1'}])
this.$vd('detailview', '', products, [{title: "商品2", content: '内容2'}])
```
### 非vue文件中使用$vd
在非vue文件中同样可以使用$vd,因为VueData对象放到了window上，  

所以可以在任意js文件中通过VueData.$vd的形式调用该方法。  

比如远端服务器数据请求的方法得到数据之后，或者其他第三方js文件中想改变vue对象，调用对象方法和common数据的时候。  

```
//第三方js文件
VueData.$vd('abc', '123') // 修改全局属性abc的值为123
VueData.$vd('myview', '', 'title', 'hello') // 修改属性
VueData.$vd('myview', '', 'testMethod', 'param1', 'param2', 'param3') // 调用方法
```
### 关于封装性
因为可以在已经引入vue-data文件之后任何位置改变或者调用（某个或同一个viewname的多个实例的）方法，  

这似乎过于自由了，建议尽量把对自身vue文件data属性修改的方法放在该vue文件methods里面，再由外部调用。