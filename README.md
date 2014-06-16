## droplist

* 版本：0.5
* 教程：[http://gallery.kissyui.com/droplist/0.5/guide/index.html](http://gallery.kissyui.com/droplist/0.5/guide/index.html)
* demo：[http://gallery.kissyui.com/droplist/0.5/demo/index.html](http://gallery.kissyui.com/droplist/0.5/demo/index.html)

## changelog

### v0.5
- [+] 增加复选select功能
- [+] 增加由json数据渲染多级联动select功能,支持单选联动、多选联动、混合联动
- [+] 增加了droplist的样式钩子，可配置样式名。config属性名: droplistCls
- [+] 从现有select结构渲染，增加了placeholder属性配置占位符。



### v0.4
- [*] bugfix

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

