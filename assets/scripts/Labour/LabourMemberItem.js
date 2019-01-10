
cc.Class({
    extends: cc.Component,

    //昵称
    SetNickName: function(nickName){
        this.node.getChildByName("Text_NickName").getComponent(cc.Label).string = nickName;
    },

    //用户ID
    SetPlayerID: function(ID){
        this.node.getChildByName("playerID").getComponent(cc.Label).string = ID;
    },

    //职位
    SetPlayerPos: function(pos){
        this.node.getChildByName("playerPosition").getComponent(cc.Label).string = pos;
    },
});
