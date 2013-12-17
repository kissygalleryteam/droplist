## DropList

一个解决大数据列表渲染效率的下拉菜单组件。

* 版本：0.3
* 教程：[http://gallery.kissyui.com/droplist/0.3/guide/index.html](http://gallery.kissyui.com/droplist/0.3/guide/index.html)
* demo：[http://gallery.kissyui.com/droplist/0.3/demo/index.html](http://gallery.kissyui.com/droplist/0.3/demo/index.html)


## 快速使用

<pre>
    /**
     * 组件有很多渲染模式，最简单的是根据 select 元素渲染
     * 更多渲染方式参考 Demo 和 API 说明
     */
    S.use('gallery/droplist/0.3/index', function (S, DropList) {
        // 根据 select 节点构造 droplist 对象
        var dl = DropList.decorate(elSelect);
        // 渲染结构和数据。
        dl.render();
    });
</pre>

## 参数详解

````
KISSY.use('gallery/droplist/0.3/index', function (S, DropList) {
    var droplist = new DropList({
        // 用于设置初始化的选择值。
        // 注意：默认选项的数据格式为text和value。允许有其他值，但内部只使用text作为展示文案，value为选项唯一的标识（选项对比依赖value值）。
        selectedItem: {
            text: "",
            value: ""
        },
        // 设置表单域的name值。该name值对应的表单域，会同步存储value值。
        fieldName: "selectName",
        /**
         * dataSource参数支持多种格式数据。
         * 1. 同步获取数据。
         *    1.1 直接传递数组。
         *    1.2 传入一个函数。该函数的第一个参数为callback，只需要将数据作为这个callback函数的第一个参数执行即可。
         * 2. 异步获取数据。
         *    2.1 传入一个url地址。向该地址发起请求，默认要求返回json数据，其list参数为实际的数组数据；result参数为true。
         *    2.2 传入一个plainObject对象，参照`KISSY.IO`的格式。
         */
        dataSource: {
            url: "./getlist3.html",
            // 默认就是json格式
            dataType: "json",
            // 设置异步请求的参数
            data: {
                parama: 1,
                paramb: 2
            }
        },
        /**
         * 搜索的异步条件。KISSY.IO的参数格式
         * 搜索的结果也会过fnReceive和fnDataAdapter函数。
         */
        remote: {
            url: "./search.html"
        },

        /**
         * 是否支持自定义输入内容。
         * 在失去焦点时，若没有对应的选择项。则会将当前输入内容为text，默认-1为value进行存储。
         */
        freedom: true,

        /**
         * 是否在失去焦点的时候自动根据当前输入值进行匹配。
         * 若匹配到某一项的text与输入值一致，则设置该项为选中状态。
         */
        autoMatch: true,

        /**
         * 若搜索结果为空，则可以定制展示的内容。
         * 支持function，其返回的html作为内容显示。参数query为当前输入的搜索关键词
         * 也支持纯字符串。字符串直接作为内容显示。
         */
        emptyFormat: function(query) {
            return "没有与" + query + "匹配的搜索结果";
        }

        // 指定插入的位置。参数el为droplist对象的容器节点。
        insertion: function(el) {
            S.one(el).insertBefore($log);
        },
        // 通过对异步返回的数据进行调整。
        // 使得异步数据也满足约定的标准。
        // 主要是确保有result和list数据。
        // 这里不对列表项进行适配。
        fnReceive: function(dt) {
            var data = dt.data,
                result = data && data.length > 0;

            if(!result) {
                alert("您还没有创建数据");
            }

            return {
                result: result,
                list: data
            }
        },
        // 通过数据适配函数来调整异步获取的数据。
        // 使得列表项的数据结构符合约定的标准。
        fnDataAdapter: function(list) {
            var result = [];
            S.each(list, function(it) {
                result.push({
                    text: it.text,
                    value: it.id
                });
            });
            return result;
        }
    });

    // 注册change事件。当选择项发生变化时触发。
    // 注意：进行搜索的时候，默认会取消选项，即会触发change事件且ev.data值为undefined
    droplist.on('change', function(ev) {
        // 获取当前选项的数据。
        var data = ev.data
        console.log('current selected data is:', data);
    });

    // 对于同步设置的数据，在注册事件之前执行render()方法，不会触发初始值的change事件。
    // 对于异步获取数据，在注册事件前后执行都是会触发change事件。因为数据处理总是比render迟执行。
    droplist.render();
});
````

## changelog

### v0.3.1
- [+] 在freedom模式下，配置customData，可以设置默认的value值。
- [+] 增加inputName和ariaLabel配置，分别用于设置输入框的name属性和aria-label属性。
- [*] 一些调整和bugfix

### v0.3

- [*] kissy版本升级为1.4的兼容。去掉对template的依赖。
- [*] 替换本地的lap为“gallery”的对应版本。
- [*] 部分代码调整及bug修复
- [+] 支持placeholder显示。placeholder配置
- [+] 支持自定义内容输入。freedom配置
- [+] 支持自动匹配输入项。autoMatch配置
- [+] 支持搜索无结果的显示配置。emptyFormat配置
- [+] 增加doWith方法。针对指定的值是否匹配，以执行对应的处理逻辑。
- [+] 添加ARIA属性支持
- [+] 支持自定义菜单项模板

### V0.2

- [+]支持关键词异步搜索
- [+]支持focus聚焦到当前视图内。
- [*]修复demo中首次显示错位和toggle显示错误的问题。
- [*]数据源存储调整，搜索结果也存到datalist中。
- [*]部分实现调整和优化

### V0.1

- [+]基础的下拉菜单模拟功能
- [+]支持本地数据和异步数据初始化
- [+]支持多种结构渲染的方式
- [+]支持搜索
- [+]支持大数据量的渲染优化
- [+]支持键盘操作
- [+]支持数据定制

