
let GEvent = require( "GameEvent" );
let GData = require( "GameData");
let GConfig = require( "GameConfig" );
let GNet = require( 'GameNet' );
let Util = require("Util");
let encoding = require( "encoding" );
let self = null;

cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function( params ){
        self= this;
        this.params = params;

        this.guildNameLabel = cc.find("Img_GuildName/Guild_Name", this.node).getComponent(cc.EditBox);
        this.phoneLabel = cc.find("Img_GuildContact/Guild_Contact", this.node).getComponent(cc.EditBox);
        this.notiyLabel = cc.find("Img_GuildDes/guildNotify", this.node).getComponent(cc.EditBox);
        this.gameTitle = cc.find("Button_Plays/Text_Games", this.node).getComponent(cc.Label);
        this.Text_Plays = cc.find("Button_Plays/Text_Plays", this.node).getComponent(cc.Label);

        var curGuildInfo = null;
        curGuildInfo = GData.GetGuild(params.guildID);
        if(!curGuildInfo){
            return;
        }

        this.guildNameLabel.string = new encoding.TextDecoder("utf-8").decode(curGuildInfo.organizeName);
        this.phoneLabel.string = new encoding.TextDecoder("utf-8").decode(curGuildInfo.phoneNum);
        this.notiyLabel.string = new encoding.TextDecoder("utf-8").decode(curGuildInfo.info);

        this.m_GameType = -1;
        this.m_RuleType = "";
        this.setGuildRule(curGuildInfo.gameType, curGuildInfo.ruleType);
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
        self.gameTitle.string = title;
        self.Text_Plays.string = desc;

        self.m_GameType = GameType;
        self.m_RuleFlag = rule_flag;
    },

    OnButton_Clear: function(event){
        self.m_GameType = -1;
        self.m_RuleFlag = "";
        self.gameTitle.string = "";
        self.Text_Plays.string = "";
    },

    OnButton_Close: function(event){
        this.CloseSelf();
    },

    OnButton_Save: function(event){
        var guildName = self.guildNameLabel.string;
        if(guildName.length == 0){
            Util.ShowTooltip("请输入俱乐部名称");
            return;
        }

        var phoneNum = self.phoneLabel.string;
        var guildNotify = self.notiyLabel.string;

        var profile = GData.GetProfile();
        var ProModifyOrganizeRequest = {
            userId: profile.user_id,
            gameId: GConfig.GlobalGameId,
            organizeId: self.params.guildID,
            organizeName: guildName,
            info: guildNotify,
            phoneNum: phoneNum,
            gameType: self.m_GameType,
            ruleType: self.m_RuleFlag
        };

        GNet.send( "ProModifyOrganizeRequest", ProModifyOrganizeRequest );

        GNet.send( "ProGetOrganizeInfoRequest", {userId: profile.user_id, gameId: GConfig.GlobalGameId} );

        Util.ShowTooltip("修改成功");

        this.CloseSelf();
    },

    OnButton_Plays: function(event){
        this.OpenWindow("Hall/Node_CreateRoom", {spawnCreate: 3, setGuildRule: self.setGuildRule});
    }
});
