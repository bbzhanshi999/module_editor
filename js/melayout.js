/**
 * 模板编辑器布局表格
 * Created by 赵千里 on 2016/4/13 0013.
 */

;(function ($, window, document, undefined) {

    var Layout, VLayout, HLayout,
        A4_WIDTH = 794, A4_HEIGHT = 1123, //a4纸长宽,
        ABS_CONTENT_WIDTH = 734, ABS_CONTENT_HEIGHT = 1062,//显示区域绝对长宽
        REL_CONTENT_WIDTH = 780, REL_CONTENT_HEIGHT = 1160,
        ROW_NUM =40,COL_NUM = 20;

    /**
     * 判断是否数组中是否含有此值
     * @param value
     * @param array
     * @returns {number}
     */
    function indexOf(value, array) {
        var i = 0, l = array.length;
        for (; i < l; i = i + 1) {
            if (equal(value, array[i])) return i;
        }
        return -1;
    }

    /**
     * 判断是否相等
     * @param a
     * @param b
     */
    function equal(a, b) {
        if (a === b) return true;
        if (a === undefined || b === undefined) return false;
        if (a === null || b === null) return false;
        // Check whether 'a' or 'b' is a string (primitive or object).
        // The concatenation of an empty string (+'') converts its argument to a string's primitive.
        if (a.constructor === String) return a + '' === b + ''; // a+'' - in case 'a' is a String object
        if (b.constructor === String) return b + '' === a + ''; // b+'' - in case 'b' is a String object
        return false;
    }


    /**
     * 将列数转换成列名,类似excel
     */
    function spreadsheetColumnLabel(index) {
        var dividend = index + 1;
        var columnLabel = '';
        var modulo;
        while (dividend > 0) {
            modulo = (dividend - 1) % 26;
            columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
            dividend = parseInt((dividend - modulo) / 26, 10);
        }
        return columnLabel;
    }

    /**
     * 通过原型链继承模式创建新的构造函数
     * @param superClass
     * @param methods
     */
    function clazz(SuperClass, methods) {
        var constructor = function () {
        };
        constructor.prototype = new SuperClass;
        constructor.prototype.constructor = constructor;
        constructor.prototype.parent = SuperClass.prototype;
        constructor.prototype = $.extend(constructor.prototype, methods);
        return constructor;
    }



    Layout = clazz(Object, {


        init: function (options) {
            options = this.prepareOpts(options);
            this.createTable(options);
        },

        /**
         * 预处理对象参数
         * @param options
         * @returns {void|*|{get}}
         */
        prepareOpts: function (options) {
            options = this.optionSecurityFilter(options);
            options = $.extend({}, $.fn.meLayout.defaults, options);
            this.cellSizeCaculator(options);
            return options;
        },

        /**
         * 数据安全性过滤
         * @param options
         * @returns {*}
         */
        optionSecurityFilter:function(options){

            options.rowNum=options.rowNum?parseInt(options.rowNum,10):options.rowNum;
            options.colNum=options.colNum?parseInt(options.colNum,10):options.colNum;
            options.colWidths=options.colWidths?parseInt(options.colWidths,10):options.colWidths;
            options.rowHeights=options.rowHeights?parseInt(options.rowHeights,10):options.rowHeights;
            delete options.contentWidth;
            delete options.contentHeight;
            delete options.paperWidth;
            delete options.paperHeight;
            delete options.headWidth;
            delete options.headHeight;
            return options;
        },

        /**
         * 根据数量计算单元格长宽
         * @param options
         */
        cellSizeCaculator: function (options) {
            var temp;
            switch (options.orient) {
                case 'vertical':
                    options.rowHeights = Math.floor(ABS_CONTENT_HEIGHT / options.rowNum);
                    options.colWidths = Math.floor(ABS_CONTENT_WIDTH / options.colNum);

                    break;
                case 'horizontal':
                    options.rowHeights = Math.floor(ABS_CONTENT_WIDTH / options.rowNum);
                    options.colWidths = Math.floor(ABS_CONTENT_HEIGHT / options.colNum);
                    options.paperWidth = A4_HEIGHT;
                    options.paperHeight = A4_WIDTH;
                    options.contentWidth = ABS_CONTENT_HEIGHT;
                    options.contentHeight = ABS_CONTENT_WIDTH;
                    break;
            }
        },

        /**
         * 向容器中添加元素，创建table
         * @param options
         */
        createTable: function (options) {
            var $container = options.$container,//容器
                $indicator = $(document.createElement('div')).addClass('indicator').css({
                    'width': (options.colWidths+3)*options.colNum+options.headWidth+3,
                    'height': (options.rowHeights+3)*options.rowNum+options.headHeight+3
                }),//参照框
                $wrapper = $(document.createElement('div')).addClass('wrapper'),//包裹内容table和竖直表头
                $content = $(document.createElement('table')).addClass('content'),//内容框
                $hhead = $(document.createElement('table')).addClass('thead').addClass('horizon'),//横表头
                $vhead = $(document.createElement('table')).addClass('thead').addClass('vertical');//竖表头


            $container.empty();//去除容器内元素
            $container.removeAttr('style', '');//去除容器样式
            $container.css({
                'width': (options.colWidths+3)*options.colNum+options.headWidth+3,
                'height': (options.rowHeights+3)*options.rowNum+options.headHeight+3
            });//让容器的长宽与a4纸尺寸相同
            $container.addClass('meLayout');

            /*循环生成横表头单元格*/
            (function () {
                var $tr = $(document.createElement('tr')).attr('data-type', 'hhead');
                for (var i = 0; i < parseInt(options.colNum)+1 ; i++) {
                    var $th = $(document.createElement('th')).css({'height': options.headHeight});
                    if (i > 0) {
                        $th.html(spreadsheetColumnLabel(i - 1)).attr({
                            'data-col': i - 1,
                            'data-type': 'hhead'
                        }).css('width', options.colWidths + 'px');
                    } else {
                        $th.attr('data-col', 'blank').css('width', options.headWidth);
                    }
                    $tr.append($th);
                }
                $hhead.append($tr);
            })();

            /*循环生成竖表头单元格*/
            (function () {
                for (var i = 0; i < options.rowNum; i++) {
                    var $tr = $(document.createElement('tr')).attr('data-type', 'vhead');
                    var $th = $(document.createElement('th')).css({
                        'width': options.headWidth,
                        'height': options.rowHeights
                    }).attr({'data-row': i, 'data-type': 'vhead'}).html(i);
                    $tr.append($th);
                    $vhead.append($tr);
                }
            })();

            /*循环生存内容单元格*/
            (function () {
                for (var i = 0; i < options.rowNum; i++) {

                    var $tr = $(document.createElement('tr')).attr({'data-type': 'content', 'data-row': i});

                    for (var j = 0; j < options.colNum; j++) {
                        var $th = $(document.createElement('th')).css({
                            'width': options.colWidths,
                            'height': options.rowHeights
                        }).attr({'data-row': i, 'data-col': j, 'data-type': 'content'});
                        $tr.append($th);
                    }
                    $content.append($tr);
                }
            })();

            $indicator.append($hhead);
            $wrapper.append($vhead);
            $wrapper.append($content);
            $indicator.append($wrapper);
            $container.append($indicator);


            $wrapper.css({'width': ($hhead.width()+1)+'px', 'height': ($vhead.height()+1) + 'px'});




        }
    });


    HLayout = clazz(Layout, {
        //todo
    });
    VLayout = clazz(Layout, {
        //todo
    });


    /**
     * jquery方法接口
     * @param options
     * @returns {jQuery}
     */
    $.fn.meLayout = function () {
        var args = Array.prototype.slice.call(arguments, 0),
            options, layout,
            allowedMethods = [],
            value;

        if (this.length > 1 || this.prop('nodeName') !== ('DIV' || 'div')) {
            throw "invalid element:必须且只能传入一个div控件 ";
        }

        if (!args[0] || args[0] instanceof Object) {
            options = args[0] ? args[0] : {};
            if (options.orient && options.orient.toLowerCase() === 'horizontal') {
                layout = new Layout();
                options.rowNum = options.rowNum ? options.rowNum : 30;
                options.colNum = options.colNum ? options.colNum : 30;
            } else {
                layout = new Layout();
                options.orient = 'vertical';
                options.rowNum = options.rowNum ? options.rowNum : 40;
                options.colNum = options.colNum ? options.colNum : 20;
            }
            options.$container = this;
            layout.init(options);
        } else if (args[0] instanceof String) {
            if (indexOf(args[0], allowedMethods) < 0) {
                throw "Unknown method: " + args[0];
            }

            // TODO:调用方法的业务逻辑
        }


        return (value === undefined) ? this : value;
    }

    /**
     * 布局初始化
     * @type {{}}
     */
    $.fn.meLayout.defaults = {
        rowNum: 40,
        colNum: 20,
        rowHeights: Math.floor(ABS_CONTENT_HEIGHT / ROW_NUM),//行高
        colWidths: Math.floor(ABS_CONTENT_WIDTH / COL_NUM),//列宽
        paperWidth: A4_WIDTH,//容器宽度
        paperHeight: A4_HEIGHT,//容器长度
        contentWidth: ABS_CONTENT_WIDTH,//内容区域宽度
        contentHeight: ABS_CONTENT_HEIGHT,//内容区域长度
        orient: 'vertical',
        headHeight: 25,
        headWidth: 40
    }


})(jQuery, window, document);