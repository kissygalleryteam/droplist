/**
 * 单页 scroll式的浮层。没有分页，没有分组。
 */

KISSY.add(function(S, Overlay, Lap) {
    var D = S.DOM, E = S.Event;

    var EMPTY = "",
        TEMPLATES = {
            selectedCls: "selected",
            focusCls: "focus",
            prefixId: "dropmenu-",
            prefixCls: "dropmenu-",
            menuItem: '<li class="{prefixCls}item" id="{prefixId}item{__id}" data-id="{__id}">{text}</li>',
            empty: "搜索无结果"
        },
        def = {
            format: function(data) {
                return data;
            }
        };

    function View() {
        this._init.apply(this, arguments);
    }

    S.augment(View, S.EventTarget, {
        _init: function(datalist, config) {
            var self = this,
                cfg = S.merge(def, config);

            var popupCfg = config.popup,
                layer;

            // 允许自定义浮层对象。
            if(!(popupCfg instanceof Overlay)) {
                layer = new Overlay(S.merge({
                    prefixCls: TEMPLATES.prefixCls
                }, popupCfg));
            }else {
                layer = popupCfg;
            }

            self.layer = layer;
            self.elList = D.create('<ul></ul>')
            self.datalist = datalist;
            self.format = cfg.format;
            self.mulSelect = cfg.mulSelect;

            layer.on('afterRenderUI', function() {
                self._UIRender();
            });

            this.on('hide', function() {
                self.focused = undefined;
            })
        },
        _UIRender: function() {
            var self = this,
                layer = self.layer,
                elList = self.elList;

            var elWrap = layer.get('el'),
                elContent = layer.get('contentEl');

            elContent.append(elList);

            self._bindList();

            /**
             * @public 在渲染列表容器的时候触发。droplist对象用来进行焦点控制。
             * @requires this.elWrap this.fire('UIRender');
             */
            self.elWrap = elWrap;
            self.elWrap.attr('id', TEMPLATES.prefixId + 'wrap' + S.guid());
            self.fire('UIRender');
        },
        emptyRender: function(html) {
            this._list = [];
            D.html(this.elList, html || TEMPLATES.empty);
        },
        /**
         * @public 渲染指定的数据
         * TODO 完善+限定高度的渲染。
         * @param list
         */
        render: function(list) {
            var self = this,
                lap = self.lap,
                fragment = document.createDocumentFragment();

            lap && lap.stop();

            // self.lap变量在这里指向的对象可能在lap.stop()方法执行后被改变了。
            // 而变量lap还是指向原有的lap对象的，所以这里应该以self.lap来做判断。
            if(self.lap) {
                S.later(function() {
                    self.render(list);
                }, 20);
                return true;
            }
            var timerStart = S.now();

            D.html(self.elList, EMPTY);
            lap = self.lap = Lap(list, {duration: 30});
            self._list = list;
            // 每一条记录的事件响应
            lap.handle(function(item, globalIndex) {
                var elItem = self._itemRender(item);
                elItem && fragment.appendChild(elItem);
            });

            // 每一批次数据的事件响应
            lap.batch(function() {
                D.append(fragment, self.elList);
            });

            // 数据完成以后的事件响应。
            lap.then(function() {
                D.append(fragment, self.elList);

                self.fire('afterRender', {
                    timer : S.now() - timerStart
                });

                self.lap = null;
            });
            lap.start();
        },
        _itemRender: function(data) {
            if(!data) return null;

            var _data = this.format(S.clone(data)),
                html = S.substitute(TEMPLATES.menuItem, S.merge({
                    prefixId: TEMPLATES.prefixId,
                    prefixCls: TEMPLATES.prefixCls
                }, _data)),
                el = D.create(html),
                selected = this.datalist.getSelectedData();

            if(this.mulSelect){
                if(selected && S.inArray(data, selected)) {
                    this._selectByElement(el, data);
                }
            }else{
                if(selected && selected.value === data.value) {
                    this._selectByElement(el, data);
                }
            }
            return el;
        },
        _bindList: function() {
            var self = this,
                elList = self.elList;

            E.on(elList, 'click', function(ev) {
                var target = ev.target,
                    itemCls = TEMPLATES.prefixCls + "item";
                if(!D.hasClass(target, itemCls)) {
                    target = D.parent(target, itemCls);
                }

                if(!target) return;
                ev.stopPropagation();

                var _id = D.attr(target, 'data-id');
                self.fire('itemSelect', {id: _id})
            });
        },
        /**
         * @public 根据data._id获取元素，选择指定的元素。若不存在，则取消选择
         * @param data
         */
        select: function(data) {
            var elItem = this.getElement(data);
            if(!elItem) {
                elItem = data = undefined;
            }
            this._selectByElement(elItem, data);
            this.fire('select', {data: data});
        },
        /**
         * @public 根据clientId 聚焦指定的元素。若不存在，则取消聚焦
         * @param id
         */
        _focus: function(data) {
            var elItem = this.getElement(data);

            // TODO 列表未渲染出来时如何处理？
            if(!elItem) {
                elItem = data = undefined;
            }
            this._setElementClass(elItem, this.focused, TEMPLATES.focusCls,true);
            this.focused = data;
            this.scrollIntoView(data);
            if(this.mulSelect && this.datalist.selected && data && S.inArray(data,this.datalist.selected)) return;
            this.fire('focus', {data: data});
        },
        _selectByElement: function(elItem, data) {
            this._setElementClass(elItem, this.datalist.selected, TEMPLATES.selectedCls);
            this.focused = data;
        },
        _setElementClass: function(el, data, cls, isfocus) {
            if(data && !this.mulSelect || isfocus) {
                var elItem = this.getElement(data);
                elItem && D.removeClass(elItem, cls);
            }
            el && D.addClass(el, cls);
        },
        focusNext: function() {
            var self = this,
                focused = this.focused,
                newFocus;
            if(focused) {
                var index = 0;
                S.each(this._list, function(item, idx) {
                    if(item.value == focused.value) {
                        index = idx;
                        return false;
                    }
                });
                if(this.mulSelect){
                    toNewFocus(index+1);
                }else{
                    newFocus = this._list[index + 1];
                }
            }else {
                toNewFocus(0);
            }
            this._focus(newFocus);
            function toNewFocus(_index){
                var i = self._list.length - _index + 1;
                while(i--){
                    if(!self.datalist.selected || !S.inArray(self._list[self._list.length - i], self.datalist.selected)){
                        newFocus = self._list[self._list.length - i];
                        break;
                    };
                }
            }
        },
        focusPrevious: function() {
            var self = this,
                focused = this.focused,
                newFocus;
            if(focused) {
                var index = 0;
                S.each(this._list, function(item, idx) {
                    if(item.value == focused.value) {
                        index = idx;
                        return false;
                    }
                });
                if(this.mulSelect){
                    toNewFocus(index-1);
                }else{
                    newFocus = this._list[index - 1];
                }
            }else {
                toNewFocus(this._list.length-1);
            }
            this._focus(newFocus);
            function toNewFocus(index){
                index++;
                while(index--){
                    if(!self.datalist.selected || !S.inArray(self._list[index], self.datalist.selected)){
                        newFocus = self._list[index];
                        break;
                    }
                }
            }
        },
        selectFocused: function() {
            // 通过事件触发，而不是直接调用view的方法触发。
            // 因为对整个组件来说，选择操作除了表现层的改变，还有datalist数据层的处理。
            // 若focus为空的时候，并不等于取消选择。保持选择即可。
            if(this.focused) {
                this.fire('itemSelect', {id: this.datalist.getClientId(this.focused)});
            }
        },
        /**
         * @public 显示和隐藏
         * @param isVisible
         */
        visible: function(visible) {
            var isVisible = this.getVisible(),
                willVisible = visible === undefined ? !isVisible : visible;

            if(isVisible === willVisible) return;

            if(willVisible) {
                this.layer.show();
                this.fire('show');
            }else {
                this.layer.hide();
                this.fire('hide');
            }
        },
        destroy: function(){
            this.layer.destroy();
        },
        getVisible: function() {
            return this.layer.get('visible');
        },
        /**
         * @public 浮层的定位。按照overlay的align定义。
         * @param align
         */
        align: function(align) {
            this.layer.set('align', align);
        },
        getElement: function(data) {
            var id = this.datalist.getClientId(data);
            if(id) {
                return D.get('#' + TEMPLATES.prefixId + "item" + id, this.elList);
            }else {
                return;
            }
        },
        /**
         * 指定项显示在当前可视视图内
         */
        scrollIntoView: function(data) {
            var elItem = this.getElement(data);
            D.scrollIntoView(elItem, this.elWrap);
        }
    });

    return View;
}, {
    requires: ['overlay', 'gallery/lap/0.1/index']
});