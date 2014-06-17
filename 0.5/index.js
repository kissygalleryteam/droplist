/**
 * @fileoverview
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/

KISSY.add(function (S, D, E, DropList) {

    DropList.decorate = function(el, config) {
        var data = [],
            attributes = config && config.attributes || {},
            selectedItem = config.mulSelect?[]:"";
        S.each(el.options, function(elOption,index) {
            var dt = {
                text: elOption.text,
                value: elOption.value
            };
            S.each(attributes, function(attr, key) {
                dt[key] = D.attr(elOption, attr);
            });
            data.push(dt);
            if(D.attr(elOption,"data-default")=="true") {
                if(config.mulSelect){
                    selectedItem.push(dt);
                }else{
                    selectedItem = dt;
                }
            }
        });
        var cfg = S.merge({
                selectedItem: selectedItem,
                placeholder: D.attr(el, 'placeholder'),
                fieldName: D.attr(el, 'name'),
                mulSelect: D.attr(el, 'multiple')?true:false,
                dataSource: data,
                autoMatch: true,
                insertion: function(elWrap) {
                    try {
                        D.replaceWith(el, elWrap);
                    }catch(ex) {
                        D.insertBefore(elWrap, el);
                        D.remove(el);
                    }
                }
            }, config);
        return new DropList(cfg);
    };

    DropList.multiple = function(config) {
        if(!config || !config.dataSource || !config.dataSource.length) return;
        // 创建存储所有droplist的对象
        function MulDroplist(){
            this.init();
        };
        S.augment(MulDroplist, S.EventTarget,{
            data: [],
            arrDoWith: [],
            init: function(){
                //创建第一级droplist
                this.createDropList(config.dataSource);
            },
            doWith: function(index, value, callback, errcallback){
                if(this.data[index]){
                    this.data[index].doWith(value, callback, errcallback);
                }
                this.arrDoWith[index] = arguments;
            },
            fireChange: function(data){
                var self=this, selData = [];
                for (var i = 0; i < data.length; i++) {
                    data[i]._data.selected && selData.push(data[i]._data.selected);
                };
                self.fire("change", {data: selData});
            },
            createDropList: function(dataSource){
                var self = this,
                    mData = this.data,
                    _dataSource = [];

                //创建droplist对象
                config.subConfig == config.subConfig || [];
                config.subConfig[mData.length] = config.subConfig[mData.length] || {};
                var _cfg = S.merge({
                        droplistCls: config.droplistCls,
                        insertion: config.insertion,
                        dataSource: _dataSource,
                        freedom: config.freedom,
                        mulSelect: config.mulSelect
                    }, config.subConfig[mData.length]);

                var _selectedItem = _cfg.mulSelect?[]:"";
                // 转成标准数据格式
                for (var i = 0; i < dataSource.length; i++) {
                    var dt = {
                        text: dataSource[i][config.paramText],
                        value: dataSource[i][config.paramValue],
                        dataSource: dataSource[i][config.paramSubcat] || []
                    };
                    _dataSource.push(dt);
                    if(!_cfg.selectedItem && config.isDefault && dataSource[i][config.isDefault]){
                        if(_cfg.mulSelect){
                            _selectedItem.push(dt); 
                        }else{
                            _selectedItem = dt;
                        }
                    }
                };
                _cfg.selectedItem = _cfg.selectedItem || _selectedItem;
                //生成droplist
                droplist = new DropList(_cfg);
                //保存对象
                mData.push(droplist);
                //设置当前深度
                droplist.deep = mData.length;
                //绑定注册事件
                if(self.arrDoWith[mData.length-1]){
                    droplist.doWith(self.arrDoWith[mData.length-1][1],self.arrDoWith[mData.length-1][2],self.arrDoWith[mData.length-1][3]);
                };
                // 值发生变化的时候触发change事件
                droplist.on('change', function(ev) {
                    // if(!ev.data) return;
                    //销毁 或清空 原所有子级
                    var curDroplist = ev.currentTarget,
                        selected = curDroplist._data.selected;
                    while(mData.length > curDroplist.deep){
                        mData.pop().destroy();
                    }
                    //如果是最后一级，则不生成下级
                    if(config.subcatDeep && mData.length == config.subcatDeep) return;
                    //生成下级
                    if(curDroplist.cfg.mulSelect){
                        var newDataSource = [];
                        if(selected && selected.length){
                            for (var i = 0; i < selected.length; i++) {
                                if(selected[i].dataSource.length) newDataSource = newDataSource.concat(selected[i].dataSource);
                            };
                        }
                        newDataSource.length && self.createDropList(newDataSource);
                        (!ev.data || newDataSource.length) && createSub();
                    }else{
                        ev.data && ev.data.dataSource && ev.data.dataSource.length && self.createDropList(ev.data.dataSource);
                        (!ev.data || ev.data.dataSource.length) && createSub();
                    }
                    //生成剩下的层级
                    function createSub(){
                        if(config.isShowSub && config.subcatDeep){
                            while(config.subcatDeep - mData.length){
                                self.createDropList([]);
                            }
                        }
                    }
                    //触发change事件
                    self.fireChange(mData);
                });
                droplist.render();
                //是否显示全部subDrop
                config.isShowSub && config.subcatDeep && mData.length < config.subcatDeep && self.createDropList([]);
            }
        });
        return new MulDroplist();
    };

    return DropList;

}, {requires:['dom', 'event', './droplist','./index.less.css']});



