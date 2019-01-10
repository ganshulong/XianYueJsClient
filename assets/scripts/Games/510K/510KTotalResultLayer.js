let Util = require( "Util");
let GData = require( "GameData");

let game = null;
let loadFinished = false;
let ResCache = [];

cc.Class({
    extends: require("WindowBase"),

    OnLoaded( params ){
        this.params=params;
        game = this.params.game;

        if(loadFinished){
            this.Init();
        }
        else{
            var self = this;
            cc.loader.loadResDir( "510K/Result", cc.SpriteFrame, function( err, assets ){
                for( var key in assets )
                {
                    var keyUrl = assets[key].name;
                    ResCache[keyUrl] = assets[key];
                }
                loadFinished = true;
                self.Init();
            });
        }

        this.Init();
    },
    Init()
    {
        this.node.active = true;

        this.data = game.m_GameEndInfo;
        var users = this.params.users;

        this.Text_Times.getComponent(cc.Label).string = Util.getTime();
        this.Text_RoomNum.getComponent(cc.Label).string = "房号：" + game.sRoomNum;

        let maxScore = 0;
        for (let i = 0; i < game.m_PlayerNum; i++) {
            if (maxScore < game.m_GameEndInfo.lTotaslGameScore[i]) {
                maxScore = game.m_GameEndInfo.lTotaslGameScore[i];
            }
        }

        for (let i = 0; i < game.m_PlayerNum; i++) {

            let playerPanel = this.Node_Main["Node_Player" + i];

            playerPanel.Text_PlayerName.getComponent(cc.Label).string = users[i].nickName;
            playerPanel.Text_PlayerID.getComponent(cc.Label).string = "ID:" + users[i].userId;
            this.LoadUrlImg(playerPanel.Sprite_head,users[i].avatarFile);
            
            //背景 总得分
            if (0 <= game.m_GameEndInfo.lTotaslGameScore[i]) {
                playerPanel.Sprite_PlayerBg.getComponent(cc.Sprite).spriteFrame = ResCache["single_win"];
                playerPanel.Sprite_benBg.getComponent(cc.Sprite).spriteFrame = ResCache["TotalScoreWin"];

                playerPanel.Sprite_benBg.Label_TotalScore_Win.active = true;
                playerPanel.Sprite_benBg.Label_TotalScore_Loss.active = false;
                if (0 === game.m_GameEndInfo.lTotaslGameScore[i]) {
                    playerPanel.Sprite_benBg.Label_TotalScore_Win.getComponent(cc.Label).string = game.m_GameEndInfo.lTotaslGameScore[i];
                } else {
                    playerPanel.Sprite_benBg.Label_TotalScore_Win.getComponent(cc.Label).string = "." + game.m_GameEndInfo.lTotaslGameScore[i];
                }
            } else {
                playerPanel.Sprite_PlayerBg.getComponent(cc.Sprite).spriteFrame = ResCache["single_lose"];
                playerPanel.Sprite_benBg.getComponent(cc.Sprite).spriteFrame = ResCache["TotalScoreLose"];

                playerPanel.Sprite_benBg.Label_TotalScore_Win.active = false;
                playerPanel.Sprite_benBg.Label_TotalScore_Loss.active = true;
                playerPanel.Sprite_benBg.Label_TotalScore_Loss.getComponent(cc.Label).string = "/" + game.m_GameEndInfo.lTotaslGameScore[i];
            }
            //big winner
            if (0 < maxScore && maxScore == game.m_GameEndInfo.lTotaslGameScore[i]) {
                playerPanel.Sprite_BigWinner.active = true;
            }else{
                playerPanel.Sprite_BigWinner.active = false;
            }
            
            for (let j = 0; j < game.m_GameCount; j++) {
                var text = playerPanel.ScrollViewSoucre.view.content["Text_" + (j + 1)];
                text.active = true;
                if (0 < game.m_GameEndInfo.detailedScores[i].roundScore[j]) {
                    text.AtlasSources.getComponent(cc.Label).string = "." + game.m_GameEndInfo.detailedScores[i].roundScore[j];
                }else if(0 == game.m_GameEndInfo.detailedScores[i].roundScore[j]){
                    text.AtlasSources.getComponent(cc.Label).string = game.m_GameEndInfo.detailedScores[i].roundScore[j];
                } else {
                    text.AtlasSources.getComponent(cc.Label).string = "/" + game.m_GameEndInfo.detailedScores[i].roundScore[j];
                }
            }
            for (let j = game.m_GameCount; j < 12; j++) {
                playerPanel.ScrollViewSoucre.view.content["Text_" + (j + 1)].active = false; 
            }
        }
    },
    OnButton_Back()
    {
        this.OnButton_SignSett(); 
    },
    OnButton_Share()
    {
        GData.ShareScreenShot(0, 0, 1280, 720, "东乡510K");
    },
    OnButton_SignSett()
    {
        this.node.active = false;
    },
    OnButton_BackHall()
    {
        this.backToHall();
    },

});