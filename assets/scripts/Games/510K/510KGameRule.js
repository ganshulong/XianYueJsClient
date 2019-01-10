cc.Class({
    extends: cc.Component,//require("GameBase"),
        
    OnLoaded: function( params )
    {
        this.params = params;
        this.node.getChildByName("Toggle_Play").getChildByName("toggle4").getComponent( cc.Toggle ).uncheck();
        this.node.getChildByName("Toggle_Play").getChildByName("toggle5").getComponent( cc.Toggle ).uncheck();
        
    },
    // 手动添加的回调方法
    check1:function(toggle, customEventData){
        var isCheck = toggle.isChecked//this.node.getChildByName("Toggle_GamesNums").getChildByName("toggle1").getComponent( cc.Toggle ).isChecked;
    },
    // 获得房卡数量
    GetNeedRoomCard:function(){
        if (this.node.getChildByName("Toggle_GamesNums").getChildByName("toggle1").getComponent( cc.Toggle ).isChecked)
        {
            return 1;
        }else{
            return 2;
        }
    },
    

    GetRuleConfigName:function(){
        return "ProPKGameRuleConfig";
    },
    // 获得 flag
    GetPlayFlag:function(){
        return 0x0000;
    },

    GetGameType:function(){
        return 1;
    },

    GetRuleConfig:function(){
        let gameCount  = 6;
        let needCards = 1;
        let playerNum = this.GetPlayerNum();
        let anZhao = true;

        if(this.node.getChildByName("Toggle_GamesNums").getChildByName("toggle1").getComponent( cc.Toggle ).isChecked)
        {
            gameCount = 6;
            needCards = 1;
        }else{
            gameCount = 12;
            needCards = 2; 
        }

        if(this.node.getChildByName("Toggle_Play").getChildByName("toggle4").getComponent( cc.Toggle ).isChecked)
        {
            anZhao = false;
        }else{
            anZhao = true;
        }
        
        return {gameRound:gameCount,needCards:needCards,nPlayerNum:playerNum,haveAnZhao:anZhao};// 返回规则 proto
    },

    GetPlayerNum:function(){
        return 4;
    }
});