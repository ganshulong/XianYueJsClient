cc.Class({
    extends: require("WindowBase"),

    properties: {

    },

    OnLoaded: function( showMsgStr ){
        if (10 < showMsgStr.length) {
            cc.find("Sprite_Bg", this.node).width = showMsgStr.length * 30 + 60;
        }
        cc.find("Label_Msg", this.node).getComponent(cc.Label).string = showMsgStr;
        //this.node.runAction(cc.moveBy(1, 0, 200));
        this.schedule(function(){
            this.CloseSelf();
         }, 1.2);
    },
});
