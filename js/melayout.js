/**
 * 模板编辑器布局表格
 * Created by 赵千里 on 2016/4/13 0013.
 */

;(function ($, window, document, undefined) {

    var Layout,
        A4_WIDTH = 794, A4_HEIGHT = 1123, //a4纸长宽,
        ABS_CONTENT_WIDTH = 734, ABS_CONTENT_HEIGHT = 1062,//显示区域绝对长宽
        ROW_NUM = 40, COL_NUM = 20,//行列数
        $selectedCell,//被选中的单元格
        $mergBtn = $(document.createElement('div')).addClass('menu_btn').html('合并单元格'),
        $unmergBtn = $(document.createElement('div')).addClass('menu_btn').html('取消合并'),
        $menu = $(document.createElement('div')).addClass('menu').append($mergBtn).append($unmergBtn);//右击菜单

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

    /*当时间为mouseup或者mousedown时，可以通过event.button方法确定鼠标上哪个按键*/
    function getButton(event) {
        if (document.implementation.hasFeature('MouseEvents', '2.0')) {
            return event.button;
        } else {
            switch (event.button) {
                case 1:
                case 3:
                case 5:
                case 7:
                    return 0;
                case 2:
                case 6:
                    return 2;
                case 4:
                    return 1;
            }
        }
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

        /**
         * 初始化布局控件
         * @param options
         */
        init: function (options) {
            options = this.prepareOpts(options);
            this.createTable(options);
            this.initfeature(options);
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
            options.mergeCell = typeof options.mergeCell === 'boolean' || options.mergeCell instanceof Boolean ? options.mergeCell : true;
            options.editable = typeof options.editable === 'boolean' || options.editable instanceof Boolean ? options.editable : true;
            delete options.contentWidth;
            delete options.contentHeight;
            delete options.paperWidth;
            delete options.paperHeight;
            delete options.headWidth;
            options.headHeight = options.rowHeights;
            delete options.minWidth;
            delete options.minHeight;
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
                    'height': (options.rowHeights + 1) * options.rowNum + 1
                }),//参照框
                $wrapper = $(document.createElement('div')).addClass('wrapper'),//包裹内容table和竖直表头
                $content = $(document.createElement('table')).addClass('content'),//内容框
                $hhead = $(document.createElement('table')).addClass('thead').addClass('horizon'),//横表头
                $vhead = $(document.createElement('table')).addClass('thead').addClass('vertical'),//竖表头
                $rowResizer = $(document.createElement('div')).addClass('resizer').addClass('rowResizer'),//行高调整器
                $colResizer = $(document.createElement('div')).addClass('resizer').addClass('colResizer'),//列宽调整器
                $tipLineX = $(document.createElement('div')).addClass('tip_lineX'),//X轴辅助线
                $tipLineY = $(document.createElement('div')).addClass('tip_lineY'),//Y轴辅助线
                dragable, resDiretion,//拖拽标志,调整方向
                x, y,//原始位置
                col, row,
                moveX, moveY;//鼠标移动距离

            $container.empty();//去除容器内元素
            $container.removeAttr('style', '');//去除容器样式
            $container.css({
                'width': (options.colWidths + 1) * options.colNum + options.headWidth + 1,
                'height': (options.rowHeights + 1) * options.rowNum + 1
            });//让容器的长宽与a4纸尺寸相同
            $container.addClass('meLayout');

            /*循环生成横表头单元格*/
            (function () {
                var $tr = $(document.createElement('tr')).attr('data-type', 'hhead');
                for (var i = 1; i < parseInt(options.colNum) + 2; i++) {
                    var $th = $(document.createElement('th')).css({'height': options.rowHeights});
                    if (i > 1) {
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

                    for (var j = 1; j < options.colNum+1; j++) {
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


            //加载调整器
            $('.meLayout table.thead th').on('mouseover', function (e) {

                if ($(this).data('type') === 'hhead') {
                    $(this).append($colResizer);
                    $colResizer.css({
                        'display': 'block',
                        'height': options.rowHeights
                    }).attr('data-col', $(this).data('col'));
                } else if ($(this).data('type') === 'vhead') {
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
                    $tipLineX.css('top', (e.clientY+$('body').scrollTop())+'px');
                    $tipLineY.css('left', (e.clientX+$('body').scrollLeft())+'px');
                }
            };

            //鼠标松开处理器
            var mouseUpHandler = function (e) {
                var width, height;

                dragable = false;
                $(document).off('mousemove', mouseMoveHandler);

                switch (resDiretion) {
                    case 'V':

                        height = $('.meLayout .thead.vertical th[data-row=' + row + ']').height();
                        console.log("单元格高度："+height);


                        if (moveY < 0 && (height - Math.abs(moveY)) <= options.minHeight) {
                            $('.meLayout table th[data-row=' + row + ']').css('height', options.minHeight );
                        } else {
                            $('.meLayout table th[data-row=' + row + ']').css('height', height + moveY);
                            height = $wrapper.height();
                            $wrapper.css('height', (height + moveY) + 'px');
                        }

                        break;
                    case 'H':
                        width = $('.meLayout .thead.horizon th[data-col=' + col + ']').width();
                        console.log("单元格宽度："+width);
                        if (moveX < 0 && (width - Math.abs(moveX)) <= options.minWidth) {
                            console.log("col"+col);
                            console.log($('.meLayout table th[data-col=' + col + ']').length);
                            $('.meLayout table th[data-col=' + col + ']').each(function(){
                                if($(this).prop('colspan')&&$(this).prop('colspan')>1){

                                    $(this).css('width', options.minWidth + 'px');
                                }
                            })



                           // $('.meLayout table th[data-col=' + col + ']').filter('th[colspan=1]').css('width', options.minWidth + 'px');
                        } else {
                            console.log("col"+col);
                            console.log($('.meLayout table th[data-col=' + col + ']').length);
                            $('.meLayout table th[data-col=' + col + ']').each(function(){
                                if($(this).prop('colspan')&&$(this).prop('colspan')>1){
                                    console.log($(this).prop('colspan'));
                                    var w = $(this).css('width');
                                    console.log("mergerCellWith:"+w);
                                    $(this).css('width', parseFloat(moveX)+parseFloat(w));
                                }else{
                                    $(this).css('width', width+moveX);
                                }
                            })
                           // $('.meLayout table th[data-col=' + col + ']').filter('th[colspan=1]').css('width', (width + moveX) + 'px');
                            width = $wrapper.width();
                            $wrapper.css('width', (width + moveX) + 'px');
                        }
                        break;
                }

                $(document).off('mouseup', mouseUpHandler);
                moveX = 0;
                moveY = 0;
                x = 0;
                y = 0;
                resDiretion = undefined;
                col = 0;
                row = 0;
                $('body').css('cursor', 'default');
                $tipLineX.removeClass('show');
                $tipLineY.removeClass('show');
                if ($selectedCell && $selectedCell.length > 0) {
                    $container.find('div.selected').css({
                        'width': $selectedCell.width() - 4,
                        'height': $selectedCell.height() - 4
                    }).addClass('show').appendTo($selectedCell);
                }
            };

            /*绑定处理事件*/
            $('.meLayout .resizer').on('mousedown', function (e) {
                x = e.clientX;
                y = e.clientY;
                dragable = true;
                $(document).on('mousemove', mouseMoveHandler);
                if ($(this).hasClass('rowResizer')) {
                    resDiretion = 'V';
                    row = $(this).attr('data-row');
                    $('body').css('cursor', 'ns-resize');
                    $('body').append($tipLineX);
                    $tipLineX.addClass('show').css('top', (y+$('body').scrollTop())+'px');
                } else {
                    resDiretion = 'H';
                    col = $(this).attr('data-col');
                    $('body').css('cursor', 'ew-resize');
                    $('body').append($tipLineY);
                    $tipLineY.addClass('show').css('left', (x+$('body').scrollLeft())+'px');
                }
                $(document).on('mouseup', mouseUpHandler);


            });

            $container.data('meLayout', this);
            $container.data('options', options);
            $container.data('options', options);
            $container.data('options', options);
        },


        /**
         * 初始化功能模块
         */
        initfeature: function (options) {
            var $selectedShower = $(document.createElement('div')).addClass('selected'),
                $container = options.$container;
            $container.append($selectedShower);

            /*添加选中框显示*/
            $container.find('.content th').on('click', function (e) {
                $selectedShower.css({
                    'width': $(this).width() - 4,
                    'height': $(this).height() - 4
                }).addClass('show').appendTo(this);
                $selectedCell = $(this);


               /* console.log("css：width："+$(this).css('width'));
                console.log("width："+$(this).width());
                console.log("css：height："+$(this).css('height'));
                console.log("height："+$(this).height());*/
                return false;
            });

            /*取消选中框显示*/
            $('body').not('.meLayout.content th').on('click', function (e) {
                $selectedShower.removeClass('show');
                $selectedCell = undefined;
            })

            if (options.mergeCell) {
                this.runMergeCell(options);
            }
            if (options.editable) {
                this.openEdit(options);
            }
        },


        /**
         * 启动合并单元格功能
         * @param options
         */
        runMergeCell: function (options) {
            var $container = options.$container,
                $startCell, $endCell,//开始和终止和经过cell
                dragable = false, //拖拽状态
                transXFlag,transYFlag,//选中区域扩展标记
                runEvent = true,//为否启动事件流
                startX, startY, endX, endY, //坐标
                endminX,endmaxX,endminY,endmaxY,
                minX, minY, maxX, maxY,//迭代用坐标
                overHandler, upHandler, outHandler,//鼠标事件处理器
                mergeApplication,unmergeApplication, openMenu,//合并单元格主程序//取消合并//打开右键菜单
                getExtremeY,getExtremeX,
                $selectedShower=$('div.selected');


                outHandler = function (e) {
                    (function () {
                        for (var x = minX; x <= maxX; x++) {
                            for (var y = minY; y <= maxY; y++) {
                                $container.find('.content th[data-col=' + x + ']').filter('th[data-row=' + y + ']').removeClass('shade');
                            }
                        }
                    })();
                    $(this).off('mouseout', outHandler);
                };

            getExtremeY =function(x){
                (function(){

                    for(var i = minY;i<=maxY;i++){
                        var $th = $('.meLayout .content th[data-row = '+i+']').filter('th[data-col='+x+']');
                        var endminX = x;
                        var endminY = i;
                        var endmaxX = x+$th.prop('colspan')-1;
                        var endmaxY = i+$th.prop('rowspan')-1;
                        if(endminX<minX){
                            minX=endminX;
                            transXFlag =false;
                            console.log('minX变化为：'+minX);
                            getExtremeY(endminX);
                        }

                        if(endmaxX>maxX){
                            maxX=endmaxX;
                            transXFlag =false;
                            console.log('maxX变化为：'+maxX);
                            getExtremeY(endmaxX);
                        }

                        if(endminY<minY){
                            minY=endminY;
                            transYFlag =false;
                            console.log('minY变化为：'+minY);
                            getExtremeX(endminY);
                        }

                        if(endmaxY>maxY){
                            maxY=endmaxY;
                            transYFlag =false;
                            console.log('maxY变化为：'+maxY);
                            getExtremeX(endmaxY);
                        }
                    }
                })();
            };

            getExtremeX =function(y){
                (function(){

                    for(var i = minX;i<=maxX;i++){
                        var $th = $('.meLayout .content th[data-col = '+i+']').filter('th[data-row='+y+']');
                        var endminX = i;
                        var endminY = y;
                        var endmaxX = i+$th.prop('colspan')-1;
                        var endmaxY = y+$th.prop('rowspan')-1;
                        if(endminX<minX){
                            minX=endminX;
                            transXFlag =false;
                            console.log('minX变化为：'+minX);
                            getExtremeY(endminX);
                        }

                        if(endmaxX>maxX){
                            maxX=endmaxX;
                            transXFlag =false;
                            console.log('maxX变化为：'+maxX);
                            getExtremeY(endmaxX);
                        }

                        if(endminY<minY){
                            minY=endminY;
                            transYFlag =false;
                            console.log('minY变化为：'+minY);
                            getExtremeX(endminY);
                        }

                        if(endmaxY>maxY){
                            maxY=endmaxY;
                            transYFlag =false;
                            console.log('maxY变化为：'+maxY);
                            getExtremeX(endmaxY);
                        }
                    }
                })();
            }


            overHandler = function (e) {
                if (!dragable) {
                    return;
                  }
                $endCell = $(this);
                endminX = $endCell.data('col');
                endminY = $endCell.data('row');
                endmaxX =endminX+parseInt($endCell.prop('colspan'))-1;
                endmaxY =endminY+parseInt($endCell.prop('rowspan'))-1;
                minX = parseInt(startX);
                minY = parseInt(startY);
                maxX = minX +parseInt($startCell.prop('colspan'))-1;
                maxY = minY +parseInt($startCell.prop('rowspan'))-1;
                if(endminX<minX){
                    minX=endminX;
                    transXFlag =false;
                    console.log('minX变化为：'+minX);
                    getExtremeY(endminX);
                }

                if(endmaxX>maxX){
                    maxX=endmaxX;
                    transXFlag =false;
                    console.log('maxX变化为：'+maxX);
                    getExtremeY(endmaxX);
                }

                if(endminY<minY){
                    minY=endminY;
                    transYFlag =false;
                    console.log('minY变化为：'+minY);
                    getExtremeX(endminY);
                }

                if(endmaxY>maxY){
                    maxY=endmaxY;
                    transYFlag =false;
                    console.log('maxY变化为：'+maxY);
                    getExtremeX(endmaxY);
                }


                (function () {
                    for (var x = minX; x <= maxX; x++) {
                        for (var y = minY; y <= maxY; y++) {
                            $container.find('.content th[data-col=' + x + ']').filter('th[data-row=' + y + ']').addClass('shade');
                            /*  console.log("x:"+x+"，y:"+y);*/
                        }
                    }
                    /* console.log("--------------------------");*/
                })();

                $(this).on('mouseout', outHandler);


            };

            upHandler = function (e) {
                $container.find('.content th').off('mouseover', overHandler);
                $container.find('.content th').off('mouseout', outHandler);
                $container.removeClass('cross');

                $('.meLayout .content th.shade').on('contextmenu', function (e) {
                    var btnValue = getButton(e),
                        menuX, menuY;
                    if (btnValue == 2) {

                        e.preventDefault();
                        e.stopPropagation();
                        menuX = e.clientX+$('body').scrollLeft();
                        menuY = e.clientY+$('body').scrollTop();
                        openMenu(menuX, menuY);
                        return false;

                    }
                    runEvent = true;//启动事件流
                });

                $('body').on('mousedown', function () {
                    $container.find('.content th').removeClass('shade');
                })

            }


            $container.find('.content th').on('mousedown', function (e) {
                if (getButton(e) == 2) {
                    //console.log('th调用右键:'+'x:'+startX+",y:"+startY);
                    return false;
                }
                $startCell = $(this);
                startX = $startCell.data('col');
                startY = $startCell.data('row');
                minX = parseInt(startX);
                minY = parseInt(startY);
                maxX = minX +parseInt($startCell.prop('colspan'))-1;
                maxY = minY +parseInt($startCell.prop('rowspan'))-1;
                //console.log('th调用左键:'+'x:'+startX+",y:"+startY);
                dragable = true;
                transYFlag=true;
                transXFlag=true;
                $container.addClass('cross');
                $container.find('.content th').on('mouseover', overHandler);
                $container.find('.content th').on('mouseup', upHandler);
            });

            /*合并单元格处理程序*/
            mergeApplication = function () {
                var rowspan = parseInt(maxY, 10) - parseInt(minY, 10) + 1;
                var colspan = parseInt(maxX, 10) - parseInt(minX, 10) + 1;
                var totalWidth = 0, totalHeight = 0;

                var $mergeCell = $('.meLayout .content th[data-col=' + minX + ']').filter('th[data-row=' + minY + ']').prop({
                    'rowspan': rowspan,
                    'colspan': colspan
                });

                $selectedShower.css({
                    'width': $mergeCell.width() - 4,
                    'height': $mergeCell.height() - 4
                }).addClass('show').appendTo($mergeCell);
                $selectedCell = $mergeCell;

                (function () {
                    var $cell;
                    totalWidth = parseFloat($container.find('.thead.horizon th[data-col=' + minX + ']').css('width'));
                    totalHeight = parseFloat($container.find('.thead.vertical th[data-row=' + minY + ']').css('height'));
                    console.log(totalWidth);
                    console.log(totalHeight);

                    /*计算合并后的宽度*/
                    for (var x = minX; x < maxX; x++) {
                        $cell = $container.find('.thead.horizon th[data-col=' + x + ']');
                        totalWidth = totalWidth + parseFloat($cell.width()) + 1;
                    }
                    for (var y = minY; y < maxY; y++) {
                        $cell = $container.find('.thead.vertical th[data-row=' + y + ']');
                        totalHeight = totalHeight + parseFloat($cell.height()) + 1;
                    }
                    console.log(totalWidth);
                    console.log(totalHeight);
                })();


                (function () {
                    var $cell;
                    for (var x = minX; x <= maxX; x++) {
                        $cell = $container.find('.content th[data-col=' + x + ']');
                        for (var y = minY; y <= maxY; y++) {
                            $cell = $cell.filter('th[data-row=' + y + ']');
                            if (x != minX || y != minY) {
                                $container.find('.content th[data-col=' + x + ']').filter('th[data-row=' + y + ']').remove();
                            }

                        }
                    }
                })();

                //$mergeCell.css({'width': totalWidth, 'height': totalHeight});//给合并后的单元格赋高宽值
            };


            /**
             * 取消合并单元格
             */
            unmergeApplication=function(e){
                $('.meLayout th.shade').each(function(e){
                    if($(this).prop('rowspan')>1||$(this).prop('cowspan')>1){

                    }
                })
            };

            /**
             * 打开菜单程序
             * @param menuX
             * @param menuY
             */
            openMenu = function (menuX, menuY) {

                $menu.addClass('show').appendTo('body').css({
                    'top': menuY,
                    'left': menuX
                });

                $mergBtn.on('click', function (e) {
                    mergeApplication();
                    $menu.removeClass('show');
                    return false;
                });

                $unmergBtn.on('click',function(e){
                    unmergeApplication();

                });


                $('body').on('mouseup',function(){
                   $menu.removeClass('show');
                })

            }
        },

        /**
         * 启动编辑功能
         * @param options
         */
        openEdit: function (options) {
            //todo:启动编辑功能

        }
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
        //
        headWidth: 40,
        minWidth: 12,//单元格最小宽度
        minHeight: 14,//单元格最小宽度
        mergeCell: true,//是否允许合并单元格
        editable: true//是否可编辑
    }


})(jQuery, window, document);