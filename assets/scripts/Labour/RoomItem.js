cc.Class({
    extends: cc.Component,

    //用户名
    SetPlayerName: function(name){
        this.node.getChildByName("Text_PlayerNames").getComponent(cc.Label).string = name;
    }, 

    //游戏描述
    SetGameDes: function(des){
        this.node.getChildByName("Text_Games").getComponent(cc.Label).string = des;
    },

    //游戏规则
    SetGameRule: function(rule){
        this.node.getChildByName("Text_GameRule").getComponent(cc.Label).string = rule;
    },

    //游戏人数
    SetGameNumber: function(numStr){
        this.node.getChildByName("Text_number").getComponent(cc.Label).string = numStr;
    },

    //用户头像
    SetPlayerHead: function(texture){
        this.node.getChildByName("head").getComponent(cc.Sprite).spriteFrame.setTexture(texture);
    }, 

    //0为可以加入，1为房间满
    SetRoomBg: function(index){
        if(index < 0 || index >= 2) return;
        if(index == 0){
            this.node.getChildByName("Btn_JionRoom").active = true;
            this.node.getChildByName("Btn_FullRoom").active = false;
        }else{
            this.node.getChildByName("Btn_JionRoom").active = false;
            this.node.getChildByName("Btn_FullRoom").active = true;
        }
    },

    SetDefaultHeadStatus: function(bEnable){
        this.node.getChildByName("DefaultBg").active = bEnable;
    }
});
