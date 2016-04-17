/**
 * 模板编辑器布局表格
 * Created by 赵千里 on 2016/4/13 0013.
 */

;(function ($, window, document, undefined) {

    var Layout, VLayout, HLayout,
        A4_WIDTH = 794, A4_HEIGHT = 1123, //a4纸长宽,
        ABS_CONTENT_WIDTH = 734, ABS_CONTENT_HEIGHT = 1062,//显示区域绝对长宽
        ROW_NUM = 40, COL_NUM = 20;

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
        optionSecurityFilter: function (options) {

            options.rowNum = options.rowNum ? parseInt(options.rowNum, 10) : options.rowNum;
            options.colNum = options.colNum ? parseInt(options.colNum, 10) : options.colNum;
            options.colWidths = options.colWidths ? parseInt(options.colWidths, 10) : options.colWidths;
            options.rowHeights = options.rowHeights ? parseInt(options.rowHeights, 10) : options.rowHeights;
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
                    'width': (options.colWidths + 1) * options.colNum + options.headWidth + 1,
                    'height': (options.rowHeights + 1) * options.rowNum + options.headHeight + 1
                }),//参照框
                $wrapper = $(document.createElement('div')).addClass('wrapper'),//包裹内容table和竖直表头
                $content = $(document.createElement('table')).addClass('content'),//内容框
                $hhead = $(document.createElement('table')).addClass('thead').addClass('horizon'),//横表头
                $vhead = $(document.createElement('table')).addClass('thead').addClass('vertical'),//竖表头
                $rowResizer = $(document.createElement('div')).addClass('resizer').addClass('rowResizer'),//行高调整器
                $colResizer = $(document.createElement('div')).addClass('resizer').addClass('colResizer'),//列宽调整器
                $tipLineX=$(document.createElement('div')).addClass('tip_lineX'),
                $tipLineY=$(document.createElement('div')).addClass('tip_lineY'),
                dragable,resDiretion,//拖拽标志,调整方向
                x, y,//原始位置
                col,row,
                moveX,moveY;//鼠标移动距离

            $container.empty();//去除容器内元素
            $container.removeAttr('style', '');//去除容器样式
            $container.css({
                'width': (options.colWidths + 1) * options.colNum + options.headWidth + 1,
                'height': (options.rowHeights + 1) * options.rowNum + options.headHeight + 1
            });//让容器的长宽与a4纸尺寸相同
            $container.addClass('meLayout');

            /*循环生成横表头单元格*/
            (function () {
                var $tr = $(document.createElement('tr')).attr('data-type', 'hhead');
                for (var i = 0; i < parseInt(options.colNum) + 1; i++) {
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
            $container.append($colResizer);
            $container.append($rowResizer);

            $wrapper.css({'width': ($hhead.width() + 1) + 'px', 'height': ($vhead.height() + 1) + 'px'});

            //todo:调整高宽功能

            //加载调整器
            $('.meLayout table.thead th').on('mouseover', function (e) {

                if ($(this).data('type') === 'hhead') {
                    $(this).append($colResizer);
                    $colResizer.css({
                        'display': 'block',
                        'height': options.headHeight
                    }).attr('data-col', $(this).data('col'));
                }else if($(this).data('type') === 'vhead'){
                    $(this).append($rowResizer);
                    $rowResizer.css({
                        'display': 'block',
                        'width': options.headWidth
                    }).attr('data-row', $(this).data('row'));
                }

            });

            //鼠标移动时的处理器
            var mouseMoveHandler = function (e) {
                if (dragable) {
                    moveX = e.clientX - x;
                    moveY = e.clientY - y;
                    $tipLineX.css('top',e.clientY);
                    $tipLineY.css('left',e.clientX);
                }
            };

            //鼠标松开处理器
            var mouseUpHandler = function (e) {
                var width,height;

                dragable = false;
                $(document).off('mousemove', mouseMoveHandler);

                switch(resDiretion){
                    case 'V':

                        height = $('.meLayout table.content th[data-row=' + row + ']').height();

                        if (moveY < 0 && (height - Math.abs(moveY)) <= options.minHeight) {
                            $('.meLayout table th[data-row=' + row + ']').css('height', options.minHeight + 'px');
                        } else {
                            $('.meLayout table th[data-row=' + row + ']').css('height', (height + moveY) + 'px');
                            height = $wrapper.height();
                            $wrapper.css('width', (height + moveY) + 'px');
                        }
                        break;
                    case 'H':
                        width = $('.meLayout table.content th[data-col=' + col + ']').width();

                        if (moveX < 0 && (width - Math.abs(moveX)) <= options.minWidth) {
                            $('.meLayout table th[data-col=' + col + ']').css('width', options.minWidth + 'px');
                        } else {
                            $('.meLayout table th[data-col=' + col + ']').css('width', (width + moveX) + 'px');
                            width = $wrapper.width();
                            $wrapper.css('width', (width + moveX) + 'px');
                        }
                        break;
                }

                $(document).off('mouseup', mouseUpHandler);
                moveX = 0;moveY = 0;x=0;y = 0;resDiretion = undefined;col = 0;row = 0;
                $('body').css('cursor','default');
                $tipLineX.removeClass('show');
                $tipLineY.removeClass('show');
            };

            /*绑定处理事件*/
            $('.meLayout .resizer').on('mousedown', function (e) {
                x = e.clientX;
                y = e.clientY;
                dragable = true;
                $(document).on('mousemove', mouseMoveHandler);
                if($(this).hasClass('rowResizer')){
                    resDiretion = 'V';
                    row = $(this).attr('data-row');
                    $('body').css('cursor','ns-resize');
                    $('body').append($tipLineX);
                    $tipLineX.addClass('show').css('top',y);
                }else{
                    resDiretion = 'H';
                    col = $(this).attr('data-col');
                    $('body').css('cursor','ew-resize');
                    $('body').append($tipLineY);
                    $tipLineY.addClass('show').css('left',x);
                }
                $(document).on('mouseup', mouseUpHandler);


            });

            $container.data('meLayout',this);
            $container.data('options',options);
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
                options.rowNum = options.rowNum ? options.rowNum : 20;
                options.colNum = options.colNum ? options.colNum : 20;
            } else {
                layout = new Layout();
                options.orient = 'vertical';
                options.rowNum = options.rowNum ? options.rowNum : 30;
                options.colNum = options.colNum ? options.colNum : 15;
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
        rowNum: 30,
        colNum: 15,
        rowHeights: Math.floor(ABS_CONTENT_HEIGHT / ROW_NUM),//行高
        colWidths: Math.floor(ABS_CONTENT_WIDTH / COL_NUM),//列宽
        paperWidth: A4_WIDTH,//容器宽度
        paperHeight: A4_HEIGHT,//容器长度
        contentWidth: ABS_CONTENT_WIDTH,//内容区域宽度
        contentHeight: ABS_CONTENT_HEIGHT,//内容区域长度
        orient: 'vertical',
        headHeight: 25,
        headWidth: 40,
        minWidth:12,//单元格最小宽度
        minHeight:14//单元格最小宽度
    }


})(jQuery, window, document);