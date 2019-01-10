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
    },

    Init()
    {
        this.node.active = true;

        this.data = game.m_GameEndInfo;
        var users = this.params.users;
        let gameResCache = game.GetResCache();

        //规则 时间 房号 局数
        if (game.m_GameRuleConfig.haveAnZhao) {
            this.Text_player.getComponent(cc.Label).string = "暗找队友";
        } else {
            this.Text_player.getComponent(cc.Label).string = "明找队友";
        }
        this.Text_Times.getComponent(cc.Label).string = Util.getTime();
        this.Text_RoomNum.getComponent(cc.Label).string = "房号：" + game.sRoomNum;
        this.Text_GameCount.getComponent(cc.Label).string = "局数：" + (game.m_GameCount || 0) + "/" + (game.m_GameRuleConfig.gameRound || 0);
        // 胜负标题
        if (0 < game.m_GameEndInfo.lOnlyWinScore[game.m_MySeat_id]) {
            this.Sprite_WinOrLoss.getComponent(cc.Sprite).spriteFrame = ResCache["win.png"];
        } else {
            this.Sprite_WinOrLoss.getComponent(cc.Sprite).spriteFrame = ResCache["lose"];
        }

        for (let i = 0; i < game.m_PlayerNum; i++) {

            let playerPanel = this.Node_Main["Node_Player" + i];

            playerPanel.Sprite_Types.active = false;
            
            //房主固定为0号位
            //庄家
            if (game.bankerServerSeat === i) {
                playerPanel.zhuang.active = true;
            } else {
                playerPanel.zhuang.active = false;
            }
            //队友
            if (game.m_GameRuleConfig.bIsDatu) {
                if (game.daTuServerSeat === i) {
                    playerPanel.Sprite_DuiTypes.active = true;
                    playerPanel.Sprite_DuiTypes.getComponent(cc.Sprite).spriteFrame = gameResCache["dudaplayer"];
                } else {
                    playerPanel.Sprite_DuiTypes.active = false;
                }
            } else {
                if (game.mateServerSeat === i) {
                    playerPanel.Sprite_DuiTypes.active = true;
                    playerPanel.Sprite_DuiTypes.getComponent(cc.Sprite).spriteFrame = gameResCache["duiyou"];
                } else {
                    playerPanel.Sprite_DuiTypes.active = false;
                }
            }
            
            playerPanel.Text_PlayerName.getComponent(cc.Label).string = users[i].nickName;
            playerPanel.Text_PlayerID.getComponent(cc.Label).string = "ID:" + users[i].userId;
            this.LoadUrlImg(playerPanel.Sprite_head,users[i].avatarFile);
            
            //输赢得分 背景 窟桶
            playerPanel.Label_OnlyScore.getComponent(cc.Label).string = game.m_GameEndInfo.lOnlyWinScore[i];
            playerPanel.Sprite_Kutong.active = false;
            if (0 < game.m_GameEndInfo.lOnlyWinScore[i]) {
                playerPanel.Sprite_PlayerBg.getComponent(cc.Sprite).spriteFrame = ResCache["single_win"];

                playerPanel.Sprite_Kutong.active = true;
                if (game.m_GameEndInfo.bIsKuTong) {
                    playerPanel.Sprite_Kutong.getComponent(cc.Sprite).spriteFrame = ResCache["kutong"];
                } else {
                    playerPanel.Sprite_Kutong.getComponent(cc.Sprite).spriteFrame = ResCache["yingfen"];
                }
            } else {
                playerPanel.Sprite_PlayerBg.getComponent(cc.Sprite).spriteFrame = ResCache["single_lose"];
            }
            //本局得分
            playerPanel.Label_CurrentScore.getComponent(cc.Label).string = "当前得分：" + game.m_GameEndInfo.lCurrentGameScore[i];
            //总得分
            if (0 < game.m_GameEndInfo.lTotaslGameScore[i]) {
                playerPanel.Sprite_benBg.getComponent(cc.Sprite).spriteFrame = ResCache["TotalScoreWin"];
                playerPanel.Sprite_benBg.Label_TotalScore_Win.active = true;
                playerPanel.Sprite_benBg.Label_TotalScore_Loss.active = false;
                playerPanel.Sprite_benBg.Label_TotalScore_Win.getComponent(cc.Label).string = "." + game.m_GameEndInfo.lTotaslGameScore[i];
            } else {
                playerPanel.Sprite_benBg.getComponent(cc.Sprite).spriteFrame = ResCache["TotalScoreLose"];
                playerPanel.Sprite_benBg.Label_TotalScore_Win.active = false;
                playerPanel.Sprite_benBg.Label_TotalScore_Loss.active = true;
                playerPanel.Sprite_benBg.Label_TotalScore_Loss.getComponent(cc.Label).string = "/" + game.m_GameEndInfo.lTotaslGameScore[i];
            }
        }

        //奖牌显示
        let awardCardData = game.m_GameEndInfo.cbAwardCardData
        let awardCardlength = awardCardData.length
        if (0 < awardCardlength) {
            let tempThis = this;
            let playerAwardNumList = [0, 0, 0, 0];
            cc.loader.loadRes( "PK/Node_HandCard", function( error, perfab ) {
                for (let i = 0; i < awardCardlength; i++) {
                    let serverSeat = awardCardData[i].seat;
                    let scrollContentNode = tempThis.Node_Main["Node_Player" + serverSeat].ScrollViewitems.view.content;
                    ++playerAwardNumList[serverSeat];
                    for (let j = 0; j < awardCardData[i].CardsData.length; j++) {
                        let newNode = cc.instantiate( perfab );
                        scrollContentNode.addChild( newNode );
                        newNode.setScale(0.4);
                        newNode.setPosition(-60 + j * 20, 30 - playerAwardNumList[serverSeat] * 70);
                        let sc = newNode.getComponent(cc.Component);
                        if( sc && sc.OnLoaded ){
                            sc.OnLoaded(awardCardData[i].CardsData[j], game, false);
                        }
                    }
                    let awardScoreNode = new cc.Node()
                    awardScoreNode.addComponent(cc.Label).string = awardCardData[i].awardScore + "奖";
                    awardScoreNode.getComponent(cc.Label).fontSize = 24;
                    awardScoreNode.color = new cc.Color(235, 149, 106);
                    scrollContentNode.addChild(awardScoreNode);
                    awardScoreNode.setPosition(60, 20 - playerAwardNumList[serverSeat] * 70);
                }
                for (let i = 0; i < playerAwardNumList.length; i++) {
                    tempThis.Node_Main["Node_Player" + i].ScrollViewitems.view.content.height = playerAwardNumList[i] * 70;
                }
            });
        }
        
        //排名
        if (game.serverPlayerRank) {
            for (let i = 0; i < game.serverPlayerRank.length; i++) {
                let rankSpriteFrame = gameResCache["rank_" + (i + 1) + "_win"];
                this.Node_Main["Node_Player" + game.serverPlayerRank[i]].Sprite_Types.active = true;
                this.Node_Main["Node_Player" + game.serverPlayerRank[i]].Sprite_Types.getComponent(cc.Sprite).spriteFrame = rankSpriteFrame;
            }
        }

        //按钮显示
        if (this.data.bRoundEnd) {
            this.Button_NextGame.active = false;
            this.Button_Summ.active = true;
            this.Button_BackHall.active = true;
        } else {
            if (game.m_isReplay) {
                this.Button_NextGame.active = false;
            } else {
                this.Button_NextGame.active = true;
            }
            this.Button_Summ.active = false;
            this.Button_BackHall.active = false;
        }
    },

    OnButton_Back()
    {
        this.OnButton_BackDesk();
    },
    OnButton_Share()
    {
        GData.ShareScreenShot(0, 0, 1280, 720, "东乡510K");
    },
    OnButton_NextGame()
    {
        this.OnButton_BackDesk();
        game.OnButton_Ready();
    },
    OnButton_BackDesk()
    {
        if(game.m_isReplay)
        {
            this.OnButton_BackHall();
        }
        else{
            this.node.active = false;
        }   
    },
    OnButton_Summ()
    {
        if(game && game.m_TotalResultLayer){
            game.m_TotalResultLayer.node.active = true;
        }
    },
    OnButton_BackHall()
    {
        this.backToHall();
    },
    
});