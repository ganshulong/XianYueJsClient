let GEvent = require( "GameEvent" );
let GData = require( "GameData");
let GConfig = require( "GameConfig" );
let GNet = require( 'GameNet' );
let self = null;

cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function( params ){
        self= this;
        this.params = params;
        this.m_GameType = -1;
        this.m_RuleFlag = "";

        this.Guild_Names = cc.find("ImgGuildName/Guild_Names", this.node).getComponent(cc.EditBox);            //工会名称
        this.Guild_Contact = cc.find("ImgContact/Guild_Contact", this.node).getComponent(cc.EditBox);        //工会联系
        this.Guild_Des = cc.find("ImgGuildDes/Guild_Des", this.node).getComponent(cc.EditBox);                //工会公告
        this.m_TxtGame = cc.find("Button_Plays/Text_Games", this.node).getComponent(cc.Label);                 //游戏名称
        this.m_TxtPlay = cc.find("Button_Plays/Text_Plays", this.node).getComponent(cc.Label);                 //玩法规则
    },

    //关闭窗口
    OnButton_Close: function(event){
        this.CloseSelf();
    },

    //玩法选择
    OnButton_Plays: function(event){
        this.OpenWindow("Hall/Node_CreateRoom", {spawnCreate: 3, setGuildRule: self.setGuildRule});
    },

    setGuildRule: function(GameType, rule_flag){
        if(GameType == -1) return;

        var gameDefine = require(GConfig.GetGameDefine(GameType));

        var title = gameDefine.ConfigString(rule_flag, false);
        var desc = gameDefine.ConfigString(rule_flag, true);

        if(title.length != 0 && desc.length != 0){
            var strList = title.split("]");
            title = strList[0] + "]";
            desc = strList[1] + " " + desc;
        }
        self.m_TxtGame.string = title;
        self.m_TxtPlay.string = desc;

        self.m_GameType = GameType;
        self.m_RuleFlag = rule_flag;
    },

    //创建按钮
    OnButton_CreateGuild: function(event){
        var profile = GData.GetProfile();
        var guildName = self.Guild_Names.string;
        if(guildName.length==0){
            return;
        }

        var phoneNum = self.Guild_Contact.string;
        var guildInfo = self.Guild_Des.string;
        if(guildInfo.length == 0){
            guildInfo = "欢迎加入俱乐部，来了就是朋友，有问题联系群主，请大家文明娱乐，留意公告";
        }

        var ProCreateOrganizeRequest = {
            userId: profile.user_id,
            gameId: GConfig.GlobalGameId,
            organizeName: guildName,
            phoneNum: phoneNum,
            info: guildInfo,
            nickName: profile.nickname,
            gameType: self.m_GameType,
            ruleType: self.m_RuleFlag
        };

        GNet.send( "ProCreateOrganizeRequest", ProCreateOrganizeRequest );


        GNet.send( "ProGetOrganizeInfoRequest", {userId: profile.user_id, gameId: GConfig.GlobalGameId} );


        this.CloseSelf();
    },

    //清除
    OnButton_Clear: function(event){
        self.m_GameType = -1;
        self.m_RuleFlag = "";
        self.m_TxtGame.string = "";
        self.m_TxtPlay.string = "";
    }
});
