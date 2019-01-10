
cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function(params){
        this.params = params;

        cc.find("Text_RoomNums", this.node).getComponent(cc.Label).string = params.CardNums;
        cc.find("Text_GuildName", this.node).getComponent(cc.Label).string = params.GuildName;
    },

    OnButton_OK: function(event){
        if(this.params.sureCallBack){
            this.params.sureCallBack();
        }
        this.CloseSelf();
    },

    OnButton_Cancel: function(event){
        this.CloseSelf();
    }
});
