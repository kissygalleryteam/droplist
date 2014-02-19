/**
 * @fileoverview
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/

KISSY.add(function (S, D, E, DropList) {

    DropList.decorate = function(el, config) {
        var data = [],
            attributes = config && config.attributes || {};

        S.each(el.options, function(elOption) {
            var dt = {
                text: elOption.text,
                value: elOption.value
            };
            S.each(attributes, function(attr, key) {

                dt[key] = D.attr(elOption, attr);

            });

            data.push(dt);
        });

        var selected = el.options[el.selectedIndex],
            cfg = S.merge({
                selectedItem: {
                    value: selected.value,
                    text: selected.text
                },
                fieldName: D.attr(el, 'name'),
                dataSource: data,
                insertion: function(elWrap) {
                    try {debugger;
                        D.replaceWith(el, elWrap);
                    }catch(ex) {
                        D.insertBefore(elWrap, el);
                        D.remove(el);
                    }

                }
            }, config);

        return new DropList(cfg);
    };

    return DropList;

}, {requires:['dom', 'event', './droplist']});



