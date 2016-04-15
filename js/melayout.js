/**
 * 模板编辑器布局表格
 * Created by 赵千里 on 2016/4/13 0013.
 */

;(function ($, window, document, undefined) {

    var Layout, VLayout, HLayout,
        A4WIDTH = 794, A4HEIGHT = 1123, CONTENTWIDTH = 734, CONTENTHEIGHT = 1062//a4纸长宽,显示区域长宽
        ;

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
            options = $.extend({}, $.fn.meLayout.defaults, options);
            this.cellSizeCaculator(options);
            return options;
        },

        /**
         * 根据数量计算单元格长宽
         * @param options
         */
        cellSizeCaculator: function (options) {
            switch (options.orient) {
                case 'vertical':
                    options.rowHeights = Math.floor(CONTENTHEIGHT / options.rowNum);
                    options.colWidths = Math.floor(CONTENTWIDTH / options.colNum);

                    break;
                case 'horizontal':
                    options.rowHeights = Math.floor(CONTENTWIDTH / options.rowNum);
                    options.colWidths = Math.floor(CONTENTHEIGHT / options.colNum);
                    options.conWith = A4HEIGHT;
                    options.conHeig = A4WIDTH;
                    break;
            }
        },

        /**
         * 向容器中添加元素，创建table
         * @param options
         */
        createTable: function (options) {
            var $container = options.$container,//容器
                $indicator,//参照框
                $table;//table实体
            $container.empty();//去除容器内元素
            $container.removeAttr('style', '');//去除容器样式
            $container.css({
                'width': options.conWith + 'px', 'height': options.conHeig + 'px'
            });//让容器的长宽与a4纸尺寸相同
            $container.addClass('meLayout');

            $indicator = $(document.createElement('div')).css({
                'margin-left': '8px',
                'margin-top': '5px',
                'position': 'relative'
            }).addClass('indicator');

            $table = $(document.createElement('table')).prop('class', 'table').append('<thead></thead><tbody></tbody>');//设置table的位置

            $container.append($indicator);
            $indicator.append($table);


            $container.data("meLayout", this);//将整个对象存入容器元素中
            var $htr = $(document.createElement('tr')).css('height', options.rowHeights + 'px').appendTo('thead');
            (function () {
                for (var i = 0; i < options.colNum; i++) {

                }
            })();


        }
    });

    HLayout = clazz(Layout, {});
    VLayout = clazz(Layout, {});


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
            if (options.orient && options.orient === 'horizontal') {
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
     * 竖向布局初始化
     * @type {{}}
     */
    $.fn.meLayout.defaults = {
        rowNum: 40,
        colNum: 20,
        rowHeights: Math.floor(CONTENTHEIGHT / this.rowNum),//行高
        colWidths: Math.floor(CONTENTWIDTH / this.colNum),//列宽
        conWith: A4WIDTH,//容器宽度
        conHeig: A4HEIGHT,//容器长度
        orient: 'vertical'
    }


})(jQuery, window, document);