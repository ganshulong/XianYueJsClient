cc.Class({
    extends: cc.Component,

    //昵称
    SetNickName: function(nickName){
        this.node.getChildByName("Text_NickName").getComponent(cc.Label).string = nickName;
    },

    //备注
    SetRemarkName: function(remarkName){
        this.node.getChildByName("Text_Remark").getComponent(cc.Label).string = remarkName;
    },

    //用户ID
    SetPlayerID: function(ID){
        this.node.getChildByName("playerID").getComponent(cc.Label).string = ID;
    },

    //职位
    SetPlayerPos: function(pos){
        this.node.getChildByName("playerPosition").getComponent(cc.Label).string = pos;
    },

    //加入时间
    SetJoinTime: function(timeStr){
        this.node.getChildByName("Text_JoinTimes").getComponent(cc.Label).string = timeStr;
    },

    //职位颜色
    SetPosColor: function(color){
        this.node.getChildByName("playerPosition").color = color;
    },

    //踢人按钮状态
    SetClearEnable: function(active){
        this.node.getChildByName("Button_Delete").active = active;
    },

    //备注按钮状态
    SetRemarkEnable: function(active){
        this.node.getChildByName("Button_Remark").active = active;
    }
});
