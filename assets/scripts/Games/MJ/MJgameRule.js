var key = "MJRule"
let GNet = require( 'GameNet' );

cc.Class({
    extends: cc.Component,//require("GameBase"),
    onLoad: function( params )
    {
        //cc.log("MJ gameRule script");
        this.params = params;
        // 为了避免 必须点两次才能选中的BUG 初始化设置一下 check -> 选中
        this.node.getChildByName("Node_JingDiao").getChildByName("Node_Plays").getChildByName("toggle5").getComponent( cc.Toggle ).uncheck();
        this.node.getChildByName("Node_JingDiao").getChildByName("Node_Plays").getChildByName("toggle6").getComponent( cc.Toggle ).uncheck();
        this.node.getChildByName("Node_FangPao").getChildByName("Node_Plays").getChildByName("toggle11").getComponent( cc.Toggle ).uncheck();
        this.node.getChildByName("Node_FangPao").getChildByName("Node_Plays").getChildByName("toggle12").getComponent( cc.Toggle ).uncheck();
        this.JD_CallBack();
    },
    // 手动添加的回调方法
    check1:function(toggle, customEventData){
        var isCheck = toggle.isChecked//this.node.getChildByName("Toggle_GamesNums").getChildByName("toggle1").getComponent( cc.Toggle ).isChecked;
    },
    getWanFa:function()
    {
        //精吊
        if (!this.node.getChildByName("Btn_JingDiao").getComponent( cc.Button ).interactable)
        {
            return 0;
        }else
        {
            return 1;
        }
    },
    JD_CallBack:function()
    {
        this.node.getChildByName("Btn_JingDiao").getComponent( cc.Button ).interactable = false;
        this.node.getChildByName("Btn_FangPao").getComponent( cc.Button ).interactable = true;
        this.node.getChildByName("Node_JingDiao").active = true;
        this.node.getChildByName("Node_FangPao").active = false;
        this.node.getChildByName("Btn_JingDiao").getChildByName("Txt").color = new cc.Color(186, 89, 0);
        this.node.getChildByName("Btn_FangPao").getChildByName("Txt").color = new cc.Color(255, 252, 235);
    },
    FP_CallBack:function()
    {
        this.node.getChildByName("Btn_JingDiao").getComponent( cc.Button ).interactable = true;
        this.node.getChildByName("Btn_FangPao").getComponent( cc.Button ).interactable = false;
        this.node.getChildByName("Node_JingDiao").active = false;
        this.node.getChildByName("Node_FangPao").active = true;
        this.node.getChildByName("Btn_JingDiao").getChildByName("Txt").color = new cc.Color(255, 252, 235);
        this.node.getChildByName("Btn_FangPao").getChildByName("Txt").color = new cc.Color(186, 89, 0);
    },
    JD_4PlayerCall:function(toggle, customEventData)
    {
        var isCheck = toggle.isChecked;
        if (isCheck)
        {
            this.node.getChildByName("Node_JingDiao").getChildByName("Node_Plays").getChildByName("toggle6").active = true;
        }
    },
    JD_2PlayerCall:function(toggle, customEventData)
    {
        var isCheck = toggle.isChecked
        if (isCheck)
        {
            this.node.getChildByName("Node_JingDiao").getChildByName("Node_Plays").getChildByName("toggle6").active = false;
        }
    },
    FP_4PlayerCall:function(toggle, customEventData)
    {
        var isCheck = toggle.isChecked
        if (isCheck)
        {
            this.node.getChildByName("Node_FangPao").getChildByName("Node_Plays").getChildByName("toggle12").active = true;
            this.node.getChildByName("Node_FangPao").getChildByName("Toggle_MaiMa").active = true;
            
        }
    },
    FP_2PlayerCall:function(toggle, customEventData)
    {
        var isCheck = toggle.isChecked
        if (isCheck)
        {
            this.node.getChildByName("Node_FangPao").getChildByName("Node_Plays").getChildByName("toggle12").active = false;
            this.node.getChildByName("Node_FangPao").getChildByName("Toggle_MaiMa").active = false;

        }
    },
    // 获得房卡数量
    GetNeedRoomCard:function(){
        var wanfaTag = this.getWanFa();
        //精吊
        if (wanfaTag === 0)
        {
            var isCheck = this.node.getChildByName("Node_JingDiao").getChildByName("Toggle_GamesNums").getChildByName("toggle1").getComponent( cc.Toggle ).isChecked;
            if (isCheck)
            {
                return 1;
            }else{
                return 2;
            }
        }else{
            var isCheck2 = this.node.getChildByName("Node_FangPao").getChildByName("Toggle_GamesNums").getChildByName("toggle7").getComponent( cc.Toggle ).isChecked;
            if (isCheck2)
            {
                return 1;
            }else{
                return 2;
            }
        }
    },
    // 获得 flag
    GetPlayFlag:function(){
        return 0x0000;
    },
    GetGameType:function(){
        return 0;
    },
    GetRuleConfig:function(){
        var wanfaTag = this.getWanFa();
        var playNum = 16;
        var needCards = 2;
        var playerNum = this.GetPlayerNum();
        var daQiDui = false;
        var BaoSanQiu = false;
        var haveKing = true;
        var havesiguiyi = false;
        var havezhuangfanbei = false;
        var havejiangma = 0; 
        //精吊
        if (wanfaTag === 0)
        {
            if (this.node.getChildByName("Node_JingDiao").getChildByName("Toggle_GamesNums").getChildByName("toggle1").getComponent( cc.Toggle ).isChecked)
            {
                playNum = 8;
                needCards = 1;
            }
            
            if (this.node.getChildByName("Node_JingDiao").getChildByName("Node_Plays").getChildByName("toggle5").getComponent( cc.Toggle ).isChecked)
            {
                daQiDui = true;
            }
            if (playerNum == 4)
            {
                if (this.node.getChildByName("Node_JingDiao").getChildByName("Node_Plays").getChildByName("toggle6").getComponent( cc.Toggle ).isChecked)
                {
                    BaoSanQiu = true;
                }
            }
            haveKing = true;
        }else{
            haveKing = false;

            if (this.node.getChildByName("Node_FangPao").getChildByName("Toggle_GamesNums").getChildByName("toggle7").getComponent( cc.Toggle ).isChecked)
            {
                playNum = 8;
                needCards = 1;
            }
            if (this.node.getChildByName("Node_FangPao").getChildByName("Node_Plays").getChildByName("toggle11").getComponent( cc.Toggle ).isChecked)
            {
                havesiguiyi = true;
            }
            if (playerNum == 4)
            {
                if (this.node.getChildByName("Node_FangPao").getChildByName("Node_Plays").getChildByName("toggle12").getComponent( cc.Toggle ).isChecked)
                {
                    havezhuangfanbei = true;
                }

                if (this.node.getChildByName("Node_FangPao").getChildByName("Toggle_MaiMa").getChildByName("toggle13").getComponent( cc.Toggle ).isChecked)
                {
                    havejiangma = 1;
                }else if (this.node.getChildByName("Node_FangPao").getChildByName("Toggle_MaiMa").getChildByName("toggle14").getComponent( cc.Toggle ).isChecked)
                {
                    havejiangma = 2;
                }else if (this.node.getChildByName("Node_FangPao").getChildByName("Toggle_MaiMa").getChildByName("toggle15").getComponent( cc.Toggle ).isChecked)
                {
                    havejiangma = 4;                    
                }else if (this.node.getChildByName("Node_FangPao").getChildByName("Toggle_MaiMa").getChildByName("toggle16").getComponent( cc.Toggle ).isChecked)
                {
                    havejiangma = 8;
                }else if (this.node.getChildByName("Node_FangPao").getChildByName("Toggle_MaiMa").getChildByName("toggle17").getComponent( cc.Toggle ).isChecked)
                {
                    havejiangma = 12;
                }else if (this.node.getChildByName("Node_FangPao").getChildByName("Toggle_MaiMa").getChildByName("toggle18").getComponent( cc.Toggle ).isChecked)
                {
                    havejiangma = 0;
                }
            }
        }
        // 返回规则 proto
        return {gameRound:playNum,needCard:needCards,nPlayerNum:playerNum,bHaveKing:haveKing,haveSiguiyi:havesiguiyi,haveZhuangjiafanbei:havezhuangfanbei,nJiangMaCounts:havejiangma,havePengpeng:daQiDui,haveBaosanqiu:BaoSanQiu};
    },
    GetRuleConfigName:function(){
        return "ProMJGameRuleConfig";
    },
    GetPlayerNum:function(){
        var playerNum = 0;
        var wanfaTag = this.getWanFa();

        if (wanfaTag == 0)
        {
            if (this.node.getChildByName("Node_JingDiao").getChildByName("Toggle_PlayerNums").getChildByName("toggle3").getComponent( cc.Toggle ).isChecked)
            {
                playerNum = 4;
            }else
            {
                playerNum = 2;
            }
        }else
        {
            if (this.node.getChildByName("Node_FangPao").getChildByName("Toggle_PlayerNums").getChildByName("toggle9").getComponent( cc.Toggle ).isChecked)
            {
                playerNum = 4;
            }else
            {
                playerNum = 2;
            }
        }
        return playerNum;
    },
});