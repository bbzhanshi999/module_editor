/*跨浏览器适用的绑定事件工具*/
var EventUtils = {
    addHandler: function (element, type, handler) {
        if (element.addEventListener) {
            element.addEventListener(type, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + type, handler);
        } else {
            element["on" + type] = handler;
        }
    },
    removeHander: function (element, type, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(type, handler, false);
        } else if (element.detachEvent) {
            element.detachEvent("on" + type, handler);
        } else {
            element["on" + type] = null;
        }
    },
    getEvent: function (event) {
        return event ? event : window.event;
    },
    getTarget: function (event) {
        return event.getTarget ? event.getTarget : event.srcElement;
    },
    preventDefault:function(event){
        event.preventDefault?event.preventDefault():event.returnValue=false;
    },
    stopPropagation:function(event){
        event.stopPropagation?event.stopPropagation():event.cancelBubble=true;
    },
    getRelatedTarget:function(event){
        if(event.relatedTarget){
            return event.relatedTarget;
        }else if(event.fromElement){
            return event.fromElement;
        }else if(event.toElement){
            return event.toElement;
        }else{
            return null;
        }
    },
    /*当时间为mouseup或者mousedown时，可以通过event.button方法确定鼠标上哪个按键*/
    getButton:function(event){
        if(document.implementation.hasFeature('MouseEvents','2.0')){
            return event.button;
        }else{
            switch(event.button){
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
    },

    /*获得鼠标滚轮事件中的滚动值*/
    getWheelDelta:function(event){
        if(event.wheelDelta){
            return event.wheelDelta;
        }else{
            return -event.detail*40;
        }
    },
    /*获取字符编码值*/
    getCharCode:function(event){
        if(typeof event.charCode=='number'){
            return event.charCode;
        }else{
            return event.keyCode;
        }
    },

    /*获得剪切板数据*/
    getClipboardText:function(event){
        var data =event.clipboardData?event.clipboardData:window.clipboardData;
        return data.getData('text');
    },

    /*设置剪贴板数据*/
    setClipboardText:function(event,value){
        if(event.clipboardData){
            return event.clipboardData.setData('text/plain',value);
        }else{
            return window.clipboardData.setData('text',value);
        }
    },

    /*删除剪贴板数据*/
    clearClipboardText:function(event,value){
        if(event.clipboardData){
            return event.clipboardData.clearData('text/plain');
        }else{
            return window.clipboardData.clearData('text');
        }
    }
}


/*序列化表单*/
function serialize(form){
    var result= new Array();
    var field;
    var i;
    var j;
    var selected;
    var value;
    var opt;
    for(i=0;i<form.elements.length;i++){
        field =form.elements[i];
        switch(field.type){
            case "select-one":
            case "select-multiple":
                if(field.options.length){
                    for(j =0;j<field.options.length;j++){
                        opt = field.options[j];
                        if(opt.selected){
                            if(opt.hasAttribute){
                                value = opt.hasAttribute('value')?opt.value:opt.text;
                            }else{
                                value = opt.attributes['value'].specified?opt.value:opt.text;
                            }
                            result.push(encodeURIComponent(field.name)+"="+encodeURIComponent(value));
                        }
                    }
                }
                break;
            case undefined:
            case "submit":
            case "button":
            case "reset":
            case "file":
                break;
            case "radio":
            case "checkbox":
                if(!field.checked){
                    break;
                }
            default:
                if(field.name.length>0){
                    result.push(encodeURIComponent(field.name)+"="+encodeURIComponent(field.value));
                }

        }
    }
    return result.join('&');
}