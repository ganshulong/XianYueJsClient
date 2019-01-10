cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function(params){
        this.params=params;
        this.guildName = cc.find("Text_GuildName", this.node).getComponent(cc.Label);
        if(params.GuildName){
            this.guildName.string = params.GuildName;
        }else{
            this.guildName.string = "";
        }
    },

    //取消按钮
    OnButton_Cancel: function(event){
        this.CloseSelf();
    },

    //确定按钮
    OnButton_Ok: function(event){
        if(this.params.sureCallBack){
            this.params.sureCallBack();
            this.CloseSelf();
        }
    }
});
