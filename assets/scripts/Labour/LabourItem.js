cc.Class({
    extends: cc.Component,

    //设置工会名称
    SetGuildName: function(guildName){
        this.node.getChildByName("Text_GuidNames").getComponent(cc.Label).string = guildName;
    },

    //设置自建，加入标志, 0为自建，1为加入
    SetTipFrame: function(index){
        if(index > 1 || index < 0) return;
        if(index == 0){
            cc.find("bg_unselected/Sprite_self", this.node).active = true;
            cc.find("bg_unselected/Sprite_join", this.node).active = false;
            cc.find("bg_selected/Sprite_self", this.node).active = true;
            cc.find("bg_selected/Sprite_join", this.node).active = false;
        }else{
            cc.find("bg_unselected/Sprite_self", this.node).active = false;
            cc.find("bg_unselected/Sprite_join", this.node).active = true;
            cc.find("bg_selected/Sprite_self", this.node).active = false;
            cc.find("bg_selected/Sprite_join", this.node).active = true;
        }
    },

    //设置背景图片, 1为选择，0为未选择状态
    SetBgFrame: function(index){
        if(index > 1 || index < 0) return;
        if(index == 1){
            this.node.getChildByName("bg_selected").active = true;
            this.node.getChildByName("bg_unselected").active = false;
            this.node.getChildByName("Text_GuidNames").color = new cc.Color(255, 252, 235);
        }else{
            this.node.getChildByName("bg_selected").active = false;
            this.node.getChildByName("bg_unselected").active = true;
            this.node.getChildByName("Text_GuidNames").color = new cc.Color(175, 99, 43);
        }
    }
});
