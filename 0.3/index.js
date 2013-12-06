/**
 * @fileoverview 
 * @author wuake<ake.wgk@taobao.com>
 * @module droplist
 **/

KISSY.add(function (S, D, E, DropList) {

    var ARIA = {
    };

    DropList.decorate = function(el, config) {
        var data = [];

        S.each(el.options, function(elOption) {
            data.push({
                text: elOption.text,
                value: elOption.value
            });
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
                    D.replaceWith(el, elWrap);
                }
            }, config);

        return new DropList(cfg);
    };

    return DropList;

}, {requires:['dom', 'event', './droplist']});



