/**
 * 单页 scroll式的浮层。没有分页，没有分组。
 */

KISSY.add(function(S, Overlay, Template, Lap) {
    var D = S.DOM, E = S.Event;

    var EMPTY = "",
        TEMPLATES = {
            selectedCls: "selected",
            focusCls: "focus",
            itemCls: "drop-menuitem",
            prefixId: "dropmenu-item",
            menuItem: '<li class="drop-menuitem" id="dropmenu-item{{_id}}" data-id="{{_id}}">{{text}}</li>'
        };

    function View() {
        this.init.apply(this, arguments);
    }

    S.augment(View, S.EventTarget, {
        init: function(datalist) {
            var self = this,
                layer = new Overlay({
                    prefixCls: "dropmenu-"
                });

            self.layer = layer;
            self.elList = D.create('<ul></ul>')
            self.datalist = datalist;

            layer.on('afterRenderUI', function() {
                self._UIRender();
            });

            this.on('hide', function() {
                self.focused = undefined;
            })
        },
        /**
         * @public 渲染指定的数据
         * TODO 完善+限定高度的渲染。
         * @param list
         * @return boolean 若返回值为false，则列表元素隐藏。其他情况下显示
         */
        render: function(list) {
            if(!list || list.length == 0) {
                return false;
            }

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

                self.lap = null;
            });

            lap.start();

            return true;
        },
        _itemRender: function(data) {
            if(!data) return null;
            var html = Template(TEMPLATES.menuItem).render(data),
                el = D.create(html),
                selected = this.datalist.selected;

            if(selected && selected.value === data.value) {
                this._selectByElement(el, data);
            }

            return el;
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
            self.fire('UIRender');
        },
        _bindList: function() {
            var self = this,
                elList = self.elList;

            E.on(elList, 'click', function(ev) {
                var target = ev.target;
                if(!D.hasClass(target, TEMPLATES.itemCls)) {
                    target = D.parent(target, TEMPLATES.itemCls);
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

            this._setElementClass(elItem, this.focused, TEMPLATES.focusCls);

            this.focused = data;
            this.scrollIntoView(data);
            this.fire('focus', {data: data});
        },
        _selectByElement: function(elItem, data) {
            this._setElementClass(elItem, this.selected, TEMPLATES.selectedCls);

            this.selected = data;
            this.focused = data;
        },
        _setElementClass: function(el, data, cls) {
            if(data) {
                var elItem = this.getElement(data);
                elItem && D.removeClass(elItem, cls);
            }
            el && D.addClass(el, cls);
        },
        focusNext: function() {
            var focused = this.focused,
                newFocus;
            if(focused) {
                var index = 0;
                S.each(this._list, function(item, idx) {
                    if(item.value == focused.value) {
                        index = idx;
                        return false;
                    }
                });
                newFocus = this._list[index + 1];
            }else {
                newFocus = this._list[0];
            }

            this._focus(newFocus);
        },
        focusPrevious: function() {
            var focused = this.focused,
                newFocus;
            if(focused) {
                var index = 0;
                S.each(this._list, function(item, idx) {
                    if(item.value == focused.value) {
                        index = idx;
                        return false;
                    }
                });
                newFocus = this._list[index - 1];
            }else {
                newFocus = this._list[this._list.length - 1];
            }

            this._focus(newFocus);
        },
        selectFocused: function() {
            // 通过事件触发，而不是直接调用view的方法触发。
            // 因为对整个组件来说，选择操作除了表现层的改变，还有datalist数据层的处理。
            // 若focus为空的时候，并不等于取消选择。保持选择即可。
            if(this.focused) {
                this.fire('itemSelect', {id: this.focused._id});
            }
        },
        emptyRender: function() {
            this.visible(false);
        },
        /**
         * @public 显示和隐藏
         * @param isVisible
         */
        visible: function(isVisible) {
            if(isVisible) {
                this.layer.show();
                this.fire('show');
            }else {
                this.layer.hide();
                this.fire('hide');
            }
        },
        /**
         * @public 浮层的定位。按照overlay的align定义。
         * @param align
         */
        align: function(align) {
            this.layer.set('align', align);
        },
        getElement: function(data) {
            if(data && data._id) {
                return D.get('#' + TEMPLATES.prefixId + data._id, this.elList);
            }else {
                return;
            }
        },
        /**
         * TODO 指定项显示在当前可视视图内
         */
        scrollIntoView: function(data) {
            var elItem = this.getElement(data);

            D.scrollIntoView(elItem, this.elWrap);

        }
    });

    return View;
}, {
    requires: ['overlay', 'template', './lap']
});