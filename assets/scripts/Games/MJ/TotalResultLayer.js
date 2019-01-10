let game = null;
let loadFinished = false;
let ResCache = [];
let GDefine = require( "MJGameDefine" );
let Util = require( "Util");
let GData = require( "GameData");

cc.Class({
    extends: require("WindowBase"),

    
    OnLoaded( params ){
        this.params=params;
        game = this.params.game;

        this.initPos();

        this.Init();
    },
    initPos()
    {
        var posList = {};
        if(game.m_PlayerNum === 4){
            posList[0] = 0;
            posList[1] = 304;
            posList[2] = 608;
            posList[3] = 912;
        }else if(game.m_PlayerNum === 3){
            posList[0] = 84;
            posList[1] = 454;
            posList[2] = 824;
        }else if(game.m_PlayerNum === 2){
            posList[0] = 205;
            posList[1] = 708;
        }

        for (let i = 0; i < 4; i++) {
            if(i < game.m_PlayerNum){
                this.Panel_Main["panel_Information"+i].setPositionX(posList[i]);
                this.Panel_Main["panel_Information"+i+"_1"].setPositionX(posList[i]);
            }
            this.Panel_Main["panel_Information"+i].active = (i < game.m_PlayerNum);
            this.Panel_Main["panel_Information"+i+"_1"].active = (i < game.m_PlayerNum);
        }
    },
    Init()
    {
        this.node.active = true;

        
        this.data = game.m_GameEndInfo;
        var users = this.params.users;

        var dwCreatorID = game.roomMasterSeat;

        //时间显示
        var getTime = Util.getTime();
        this.Text_DateTime.getComponent(cc.Label).string = getTime;

        //房间信息
        this.Text_RoomNum.getComponent(cc.Label).string = game.sRoomNum;
        this.Text_Count.getComponent(cc.Label).string = (game.m_GameCount || 0) + "/" + (game.m_GameRuleConfig.gameRound || 0);

        //规则信息
        let gameruleStr = game.getGameRuleStr();
        for (let i = 0; i < 4; i++) {
            if (gameruleStr[i])
                this["Text_Play" + i].getComponent(cc.Label).string = gameruleStr[i];
            else
                this["Text_Play" + i].getComponent(cc.Label).string = "";
        }

        var tempScore = 0;
        var bigWinner = 0;
        for (let i = 0; i < game.m_PlayerNum; i++) {
            if(this.data.lAllScore[i] > tempScore){
                tempScore = this.data.lAllScore[i];
                bigWinner = i;
            }
        }
        this.bigWinner = bigWinner;

        for (let i = 0; i < game.m_PlayerNum; i++) {
            var playerPanel = null;
            if (i === this.bigWinner){
                playerPanel = this.Panel_Main["panel_Information"+i+"_1"];
                playerPanel.active = true;
                this.Panel_Main["panel_Information"+i].active = false;
            }else{
                playerPanel = this.Panel_Main["panel_Information"+i];
                playerPanel.active = true;
                this.Panel_Main["panel_Information"+i+"_1"].active = false;
            }

            //房主
            playerPanel.Image_Master.active = (dwCreatorID === i);

            //昵称和ID
            playerPanel.Text_PlayerName.getComponent(cc.Label).string = users[i].nickName;
            playerPanel.Text_PlayerID.getComponent(cc.Label).string = users[i].userId;

            //头像显示
            this.LoadUrlImg(playerPanel.Image_Head,users[i].avatarFile);
        }

        this.showEndInfo();
    },

    showEndInfo() 
    {
        for (let i = 0; i < game.m_PlayerNum; i++) {
            var playerPanel = null;
            if (i === this.bigWinner){
                playerPanel = this.Panel_Main["panel_Information"+i+"_1"];
                playerPanel.active = true;
                this.Panel_Main["panel_Information"+i].active = false;
            }else{
                playerPanel = this.Panel_Main["panel_Information"+i];
                playerPanel.active = true;
                this.Panel_Main["panel_Information"+i+"_1"].active = false;
            }


            //总得分
            if (this.data.lAllScore[i] >= 0){
                playerPanel.Image_benBg.AtlasTotalscore.getComponent(cc.Label).string = "." + (this.data.lAllScore[i] || 0);
            }else{
                playerPanel.Image_benBg.AtlasTotalscore.getComponent(cc.Label).string = "/" + (this.data.lAllScore[i] || 0);
            }


            for (let j = 0; j < 16; j++) {
                var text = playerPanel.ScrollViewSoucre.view.content["Text_"+j];
                if(this.data.lRoundGameScore[i].score[j]){
                    text.Sources.getComponent(cc.Label).string = this.data.lRoundGameScore[i].score[j];
                    text.active = true;
                }else{
                    text.active = false; 
                }
            }
        }
    },



    OnButton_BackHall()
    {
        this.backToHall();
    },
    OnButton_Share()
    {
        GData.ShareScreenShot(0, 0, 1280, 720, "东乡麻将");
    },
    OnButton_SignSett()
    {
        this.node.active = false;
    },
    OnBtn_Back()
    {
        this.OnButton_SignSett();
    },

});