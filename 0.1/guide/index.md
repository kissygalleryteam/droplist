## 综述

DropList是模拟下拉表单的元素。

* 版本：0.1
* 作者：阿克
* 标签：select,dropdown list
* demo：[http://gallery.kissyui.com/droplist/0.1/demo/index.html](http://gallery.kissyui.com/droplist/0.1/demo/index.html)

## 快速使用

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

## 参数详解

<pre>
KISSY.use('gallery/droplist/0.1/index', function (S, DropList) {
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
</pre>

## API说明

### 构造参数
* cfg
	* fieldName {String}
		* 设置用来同步value值的隐藏域的name属性。
	* insertion 用来决定如何将DropList容器对象插入文档中。
		* {String} 目标容器的selector字符串。DropList对象会append到目标容器。
		* {Function} 第一个参数是DropList容器的节点对象。
		* {DOMElement} DOM元素，会直接append到该元素。
	* fnDataAdapter {Function}
		* 对设置的列表选项数据进行适配处理。
		* return Array<Object> 返回的数组，每一项需要包含value和text属性，属性值是字符串类型数据，且value值是列表唯一的。
	* fnReceive {Function}
		* 对异步返回的数据进行适配处理。
		* return {Object} 返回的数据需要包含result和list属性。若result为true，则表示数据返回成功，若result为false，则表示失败，默认会调用alert方法显示msg属性值；list为数据列表。
	* hideDelay {Number}
		* 输入框失去焦点以后，隐藏列表的延迟时间。默认100ms。
	* fieldName {String}
		* 用于同步选择项的value值的隐藏域的name属性。


### 静态方法
* decorate 用于渲染select元素为DropList对象。
	* 调用方式`DropList.decorate(elSelect, cfg)`
	* elSelect为要渲染的select元素。
	* cfg为构造参数。若与select元素的配置有冲突，会覆盖select上的配置信息（如fieldName）。
	* return {DropList Instance} 返回DropList实例对象。

### 属性

* isVisible
	* 列表是否可见
* elWrap
	* DropList对象的容器。列表浮层元素不包含在该容器中。

### 方法
* selectByValue
	* 根据指定的value值选择选项。
* getDataByValue
	* 根据指定的value获取对应的数据内容。
	* return 设置dataSource的完整的数据内容。
		* 注意：包含其他内部使用的数据。建议对返回的数据只做读操作，不要覆盖原有的属性。
	* getSelectedData
		* 获取当前选择项的数据内容
		* return 当前选中的数据。
	* render
		* 初始化渲染结构。初始化获取和数据处理。
		* 注意：设置同步数据时，若先render后注册change事件。则初始化的change事件不会触发。

### 事件
* change
	* 当选择项发生变化时触发。其事件对象中包含的`data`数据为当前选择的数据。
	* 当进行搜索操作的时候，会将当前选项清除。此时也会触发change事件。

## 其他
* 键盘操作
	* 支持键盘操作。聚焦时显示列表，上下方向键控制聚焦操作，回车选择当前聚焦项。
