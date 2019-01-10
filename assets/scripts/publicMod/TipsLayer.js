


cc.Class({
    extends: require("WindowBase"),


    OnLoaded( params ){
        this.node.active = true;

        var tipsStr;
        var sureCallback;
        var cancelCallback;
        var type;
        if(params)
        {
            tipsStr = params.tipsStr;
            sureCallback = params.sureCallback;
            cancelCallback = params.cancelCallback;
            type = params.type;           //type 1 取消键隐藏  确认放中间
        }

        this.tips_text.getComponent(cc.Label).string = tipsStr;

        if(type){
            this.btn_queren.setPositionX(0);
            this.btn_quxiao.active = false;
        }


        var self = this;
        this.btn_queren.on(cc.Node.EventType.TOUCH_END,function (event) {
            self.node.removeFromParent();
            if (sureCallback) sureCallback();
        });
        this.btn_quxiao.on(cc.Node.EventType.TOUCH_END,function (event) {
            self.node.removeFromParent();
            if (cancelCallback) cancelCallback();
        });  

    },
});