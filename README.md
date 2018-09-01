# vue-data
vue-data是一个vue实例对象数据的管理工具。  

可以进行**全局数据共享**、**数据缓存**、**指定实例的数据更新和方法调用**。  

使用非常简单，只暴露一个api函数：$vuedataDo，学习成本远远低于同类插件。  

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
    每个vue实例中的common对象是相互独立的，可以通过调用$vuedataDo(key, value)的方式修改并同步到所有实例
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
    viewname: 'myview', //vuedata实例名称，是为了指定修改数据和指定调用方法的时候定位到具体实例，
                        //如果不指定该属性，该属性为'default'
    data() {
    },
    methods: {
    }
  })
</script>
<style>
</style>
```
当然，如果确定为**每个vue文件**都添加vue-data功能的话最好结合专门为vue-data写的 **vue-data-loader** 来使用，  

结合vue-data-loader之后，像编写普通vue文件一样了：  

[vue-data-loader的使用方式](https://github.com/avengang/vue-data-loader/tree/master)  

**注意**：在data方法的return对象属性的值不允许出现this,因为此时还未创建vue实例对象，  

所以调用this对象的值时会报错，比如：  

```
<script>
  export default new window.VueData({
    cache: true, // 是否缓存,表示该VueData对象是需要缓存的，那改vue实例在销毁前将会把data对象缓存起来，
                 //等待下次create该对象的时候直接将缓存data值赋值给新的vue对象。
    viewname: 'myview', //vuedata实例名称，是为了指定修改数据和指定调用方法的时候定位到具体实例，
                        //如果不指定该属性，该属性为'default'
    data() {
			viewTitle: this.$route.params.type // 错误，因为此时还未创建vue实例对象
    },
    methods: {
    }
  })
</script>
```
### $vuedataDo()
vue-data的唯一暴露方法。  

$vuedataDo(key, value):修改全局属性key的值为value；  

$vuedataDo(viewname, viewtag, method):调用指定viewname，viewtag的实例的method方法；  

$vuedataDo(viewname, viewtag, key, value):修改指定viewname，viewtag的实例的key属性值为value；  

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
      this.$vuedataDo('testCommon', 'abc')
      
      // 设置viewname为myview,viewtag为的实例的titles属性为[{text: "关于我们", route: '/about'}]
      // tag1(tag1可以替换成 '': 'default'; '-1': 所有viewname为myview)
      //tag可以为'','-1',其他
      this.$vuedataDo('myview', 'tag1', 'titles', [{text: "关于我们", route: '/about'}])
      
      // 调用viewname为myview,viewtag为tag1的实例方法 myMethod
      // tag1(tag1可以替换成 '': 'default'; '-1': 所有viewname为myview)
      this.$vuedataDo('myview', 'tag1', 'myMethod']) // 
    }
  }
</script>

<style>
</style>
```
### viewtag
viewtag是为了处理同一个vue文件创建的多个vue实例导致的无法精确指定某个实例的问题。  

VueData在定义的时候就给每一个vue对象新增了**props**属性**viewtag**  

正因为如此，viewtag才必须在同一个viewname下具有唯一性，如果不指定，viewtag的值默认为default。  


viewtag变量传值  

-1: **修改当前存在未被销毁的viewname为指定值的实例的data属性**  

''或者'default': **修改viewname为指定值viewtag为default的实例的data属性，若该vue实例还未创建就等到创建时赋值**  

其他: **修改viewname和viewtag为指定值的实例的data属性，若该vue实例还未创建就等到创建时赋值**  


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

需要指定viewtag,如果viewtag传-1则会改动所有该vue文件模板创建出来的实例。  

```
this.$vuedataDo('myview', 'myview1', 'titles', [{text: "123", route: '/sdasg'}])
this.$vuedataDo('myview', '-1', 'titles', [{text: "123", route: '/sdasg'}])

this.$vuedataDo('detailview', 'tag1', products, [{title: "商品1", content: '内容1'}])
this.$vuedataDo('detailview', '-1', products, [{title: "商品2", content: '内容2'}])
```
### 非vue文件中使用$vuedataDo
在非vue文件中同样可以使用$vuedataDo,因为VueData对象放到了window上，  

所以可以在任意js文件中通过VueData.$vuedataDo的形式调用该方法。  

比如远端服务器数据请求的方法得到数据之后，或者其他第三方js文件中想改变vue对象，调用对象方法和common数据的时候。  

```
//第三方js文件
VueData.$vuedataDo('abc', '123') // 修改全局属性abc的值为123
VueData.$vuedataDo('myview', '', 'title', 'hello') // 修改属性
VueData.$vuedataDo('myview', 'testMethod') // 调用方法
```
### 关于封装性
因为可以在已经引入vue-data文件之后任何位置改变或者调用（某个或同一个viewname的多个实例的）方法，  

这似乎过于自由了，建议尽量把对自身vue文件data属性修改的方法放在该vue文件methods里面，再由外部调用，  

尽量不要破坏vue文件的封装性。