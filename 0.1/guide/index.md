## 综述

DropList是模拟下拉表单的元素。

* 版本：0.1
* 作者：阿克
* 标签：select,dropdown list
* demo：[http://gallery.kissyui.com/droplist/0.1/demo/index.html](http://gallery.kissyui.com/droplist/0.1/demo/index.html)

## 初始化组件

<pre>
    /**
     * 组件有很多渲染模式，最简单的是根据 select 元素渲染
     * 更多渲染方式参考 Demo 和 API 说明
     */
    S.use('gallery/droplist/0.1/index', function (S, DropList) {
        // 根据 select 节点构造 droplist 对象
        var dl = DropList.decorate(elSelect);
        // 渲染结构和数据。
        dl.render();
    });
</pre>

## API说明
待补充。可以直接看Demo的源码。


