let GNet =  require('GameNet');
let GConfig = require('GameConfig');
let GDefine = require( "510KGameDefine" );
let GData = require( "GameData");
let Util = require( "Util");
let GAudio = require( "GameAudio" );

let loadFinished = false;
let ResCache = [];
let CardResCache = [];

let LOCAL_SEAT = 0;

cc.Class({
    extends: require("GameBase"),
    Loading()
    {
        GNet.SetAdepter( "ProPKGameRuleConfig",onRecvProPkGameRuleConfig.bind(this));//游戏规则消息
        GNet.SetAdepter( "ProPKGameStatusResponse", OnProPKGameStatusResponse.bind(this) );// 游戏状态消息
        GNet.SetAdepter( "ProPKGameDeskInfoResponse", OnRecvProPKGameDeskInfo.bind(this) );// 房间规则等信息消息
        GNet.SetAdepter( "ProPKGameReadyNotify", OnRecvProPKGameReadyNotify.bind(this) );// 玩家创建房间准备提示消息
        GNet.SetAdepter( "ProPKGameReadyResponse", OnRecvProPKGameReadyResponse.bind(this) );// 有玩家准备的消息
        GNet.SetAdepter( "ProPKGameDiceNotify", OnRecvProPKGameDiceNotify.bind(this) );// 游戏开始发来的掷骰子提醒消息
        GNet.SetAdepter( "ProPKGameDiceResult", OnRecvProPKGameDiceResult.bind(this) );// 接受到摇筛子的结果
        GNet.SetAdepter( "ProPKGameStart", OnRecvProPKGameStart.bind(this) );// 游戏开始
        GNet.SetAdepter( "ProPKGameSendMahs", OnRecvProPKGameSendMahs.bind(this) );// 游戏发牌
        GNet.SetAdepter( "ProPKGameUserDaTuNotify", OnRecvProPKGameUserDaTuNotify.bind(this) );// 打途消息
        GNet.SetAdepter( "ProPKGameUserDaTuResponse", OnRecvProPKGameUserDaTuResponse.bind(this) );// 打途响应
        GNet.SetAdepter( "ProPKGameUserDaTuResult", OnRecvProPKGameUserDaTuResult.bind(this) );// 打途结果
        GNet.SetAdepter( "ProPKGameUserTeammateNotify", OnRecvProPKGameUserTeammateNotify.bind(this) );// 明找队友
        GNet.SetAdepter( "ProPKGameLightCardsRequest", OnRecvProPKGameLightCardsRequest.bind(this) );// 亮牌    
        GNet.SetAdepter( "ProPKGameUserTeammateRequest", OnRecvProPKGameUserTeammateRequest.bind(this) );// 明找队友
        GNet.SetAdepter( "ProPKGameAnZhaoNotify", OnRecvProPKGameAnZhaoNotify.bind(this) );// 暗找队友消息
        GNet.SetAdepter( "ProPKGameAnZhaoResult", OnRecvProPKGameAnZhaoResult.bind(this) );// 暗找队友结果
        GNet.SetAdepter( "ProPKGameDataResp", OnRecvProPKGameDataResp.bind(this) );// 捡分牌消息
        GNet.SetAdepter( "ProPKGameOutMahsResponse", OnRecvProPKGameOutMahsResponse.bind(this) );// 玩家出牌消息
        GNet.SetAdepter( "ProPKGameTimerPower", OnRecvProPKGameTimerPower.bind(this) );// 游戏定时器消息
        GNet.SetAdepter( "ProPKGameShangYouResult", OnRecvProPKGameShangYouResult.bind(this) );// 上下游消息
        GNet.SetAdepter( "ProPKGameEnd", OnRecvProPKGameEnd.bind(this) );// 游戏结束接受的小结算消息
        GNet.SetAdepter( "ProPKGameUserTeammateResult", OnRecvProPKGameUserTeammateResult.bind(this) );// 找出队友                                        
        GNet.SetAdepter( "ProPKGameSendDiscardMahs", OnRecvProPKGameSendDiscardMahs.bind(this) );// 断线重连消息
                                                                               
        GNet.SetAdepter( "ProPKGameUserPhoneStatusRequest", OnRecvProPKGameUserPhoneStatusRequest.bind(this) );//手机状态
        GNet.SetAdepter( "ProPKGameRecordResponse", OnRecvProPKGameRecordResponse.bind(this) );
        GNet.SetAdepter( "ProPKGameQuickSoundResponse", OnRecvProPKGameQuickSoundResponse.bind(this) );
        GNet.SetAdepter( "ProGameSendLocationNotify", OnRecvProGameSendLocationNotify.bind(this) );

        //资源缓存加载
        if( loadFinished )
            this.LoadFinish();      //所有资源加载完成之后再调用
        else
        {
            var self = this;
            cc.loader.loadResDir( "PK/PokerCard", cc.SpriteFrame, function( err, assets ){
                for( var key in assets )
                {
                    var keyUrl = assets[key].name;
                    CardResCache[keyUrl] = assets[key];
                }
            } );
            cc.loader.loadResDir( "510K/res", cc.SpriteFrame, function( err, assets ){
                for( var key in assets )
                {
                    var keyUrl = assets[key].name;
                    ResCache[keyUrl] = assets[key];
                }
                self.LoadFinish();
            } );
        }

        this.SetPlayerNum( GDefine.GamePlayerNum );//510k人数固定为4
        
        //设置玩家节点,积分结点,手牌结点，出牌结点
        this.loadPlayerNode();

        this.InitLayout();
        GAudio.PlayMusic("resources/sound/pk_music.mp3");

        this.setBrokenProtoName(
            "ProPKGameBrokenRequest",
            "ProPKGameBrokenOperate",
            "ProPKGameBrokenNotify",
            "ProPKGameBrokenStatus"
        );
        this.setTalkList(new Array(
            "大家好，很高兴见到各位！",
            "和你合作真实太愉快了！",
            "快点啊，等的花都谢了！",
            "你的牌打得也忒好了！",
            "不要吵了，有啥好吵的。",
            "怎么又断线了！",
            "各位不好意思，我要离开一会儿。",
            "不要走，决战到天亮！",
        ));

        if( GData.IsWechatGame() )
        {
            wx.onShareAppMessage(
                function(){
                    return {
                        title:"东乡510K，点击进入",
                        query:"roomID=" + GData.GetRoomID()
                    };
                }
            );
        }
    },


    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // UI更新 
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    InitLayout()
    {
        //隐藏按钮
        // this.Button_Invitee.active = false;
        // this.Button_Copy.active = false;

        this.Button_Ready.active = false;
        this.Button_Dice.active = false;
        
        this.Button_Du.active = false;
        this.Button_BuDu.active = false;

        this.Button_NoPlay.active = false;
        this.Button_Play.active = false;

        this.Button_Settle.active = false;
        this.Button_Next.active = false;
        this.Button_BackHall.active = false;

        this.Node_FindFriend.active = false;
        this.DuiYouBg.active = false;
        
        this.showLight();
        this.SetSurplusCardVis(false);

        for (let index = 0; index < this.m_PlayerNum; index++) 
        {
            let panelPlayer = this.Node_Player[index];

            //玩家标志
            //panelPlayer.Sprite_Master.active = false;
            panelPlayer.Sprite_Banker.active = false;
            panelPlayer.Sprite_DuTips.active = false;
            panelPlayer.Sprite_Call.active = false;
            panelPlayer.Sprite_Offine.active = false;

            // panelPlayer.Sprite_Wait.active = false;
            // panelPlayer.Node_Source.active = false;
            // panelPlayer.Node_Source.Label_Source.getComponent(cc.Label).string = "0"
            
            panelPlayer.player_speek_bg.active = false;
            panelPlayer.Sprite_ChatBg.active = false;

            panelPlayer.Sprite_Ready.active = false;
            panelPlayer.Sprite_DuTypes.active = false;
            panelPlayer.Sprite_Pass.active = false;
            panelPlayer.Sprite_ShangyouTypes.active = false;

            //捡分 奖分
            let Node_PlayerScore = this.Node_PlayerScoer[index];
            Node_PlayerScore.Label_jiang.getComponent(cc.Label).string="";
            Node_PlayerScore.Label_Source.getComponent(cc.Label).string="";
        }   
    },

    //刷新玩家数据信息
    UpdateUserInfo()
    {
        if (!this.Node_Player) 
            return;
        var roomUsers = this.GetRoomUsers();
        for (var i = 0; i < this.m_PlayerNum; i++) 
        {
            var localSeat = this.Seat2Local(i);
            var node_Player = this.Node_Player[localSeat];//玩家结点 按本地座位顺序存储
            let node_PlayerScore = this.Node_PlayerScoer[i];//积分UI 玩家结点 按网络座位顺序存储
            if(roomUsers[i]){    
                node_Player.Label_PlayerName.getComponent(cc.Label).string = roomUsers[i].nickName.substr(0, 4);
                node_Player.Sprite_Wait.active = false;
                node_Player.Node_Source.active = true;
                if (0==roomUsers[i].seatID) {
                    node_Player.Sprite_Master.active = true;
                } else {
                    node_Player.Sprite_Master.active = false;
                }
                this.LoadUrlImg(node_Player.Sprite_Heads, roomUsers[i].avatarFile);

                node_PlayerScore.Label_playerName.getComponent(cc.Label).string=roomUsers[i].nickName.substr(0, 4);
            }
            else{
                node_Player.Label_PlayerName.getComponent(cc.Label).string = "";
                node_Player.Sprite_Heads.getComponent(cc.Sprite).spriteFrame = ResCache["head2xM"];
                node_Player.Sprite_Wait.active = true;
                node_Player.Node_Source.active = false;
                node_Player.Sprite_Master.active = false;

                node_PlayerScore.Label_playerName.getComponent(cc.Label).string="";
            }
        }

        if(this.m_PlayerNum && Util.count(roomUsers) >= this.m_PlayerNum)
        {
            this.Button_Copy.active = false;
            this.Button_Invitee.active = false;
        }
        else
        {
            if (!this.m_bGameFinalEnd) {
                this.Button_Copy.active = true;
                this.Button_Invitee.active = true;
            }
        }
    },

    //设置有的局数和当前局数
    setGameRound(currentRound, gameRound)
    {
        this.m_GameCount = currentRound;
        if(gameRound != 0)
        {
            this.m_GameRound = gameRound;
        }  
        cc.find("Canvas/Node_Tops/Label_GameCount").getComponent(cc.Label).string = currentRound + "/" +gameRound;

    },
    //设置庄的
    setGameBanker(bankerLocalSeat)
    {
        for (let i = 0; i < this.m_PlayerNum; i++) 
        {
            if (i == bankerLocalSeat) {
                this.Node_Player[i].Sprite_Banker.active = true;
            } else {
                this.Node_Player[i].Sprite_Banker.active = false;
            }
        }
    },
    //准备状态
    showReadyState( bIsShow, localSeat )
    {
        this.Node_Player[localSeat].Sprite_Ready.active = bIsShow;
    },

    //更新 手牌
    UpdateHandCard(localSeat, bIsGameEnd)
    {
        let tempThis = this;
        let cardList = this.handCardLists[localSeat];

        let cardDistance = GDefine.CardWidth/2;
        let cardScale = 1;
        if (LOCAL_SEAT != localSeat) { 
            cardScale = 0.4; 
        }
        let cardOffset = 0;
        let bIsLocalHandCard = false;
        if (0 === localSeat) {
            cardOffset = - (cardList.length - 1) / 2;
            bIsLocalHandCard = true;
        } else if (1 === localSeat || 2 === localSeat) {
            cardOffset = - (cardList.length - 1);
        }

        let cardNodeRoot = this.Node_Player[localSeat].Node_HandCard;
        
        cc.loader.loadRes( "PK/Node_HandCard", function( error, perfab ) {
            cardNodeRoot.removeAllChildren();
            for (let index = 0; index < cardList.length; index++) {
                let newNode = cc.instantiate( perfab );
                cardNodeRoot.addChild( newNode );
                newNode.setPositionX((index + cardOffset) * cardDistance * cardScale);
                newNode.setScale(cardScale);
                newNode.setLocalZOrder(1+index);
                let sc = newNode.getComponent(cc.Component);
                if( sc && sc.OnLoaded && cardList[index]){
                    sc.OnLoaded(cardList[index], tempThis, bIsLocalHandCard);
                }
            }
            if (bIsLocalHandCard) {
                tempThis.setTouch();
            }
        });
    },
    //更新 出牌
    UpdateOutCard(localSeat, bIsGameEnd)
    {
        let tempThis = this;
        let cardList = this.outCardLists[localSeat];

        let cardDistance = GDefine.CardWidth/2;
        let cardScale = 0.4;
        let cardOffset = 0;
        if (0 === localSeat) {
            cardOffset = - (cardList.length - 1) / 2;
        } else if (1 === localSeat || 2 === localSeat) {
            cardOffset = - (cardList.length - 1);
        }

        let cardNodeRoot = this.Node_Player[localSeat].Node_OutCard;
        cardNodeRoot.removeAllChildren();
        
        cc.loader.loadRes( "PK/Node_HandCard", function( error, perfab ) {
            for (let index = 0; index < cardList.length; index++) {
                let newNode = cc.instantiate( perfab );
                cardNodeRoot.addChild( newNode );
                newNode.setPositionX((index + cardOffset) * cardDistance * cardScale);
                newNode.setScale(cardScale);
                newNode.setLocalZOrder(1+index);
                let sc = newNode.getComponent(cc.Component);
                if( sc && sc.OnLoaded && cardList[index]){
                    sc.OnLoaded(cardList[index], tempThis, false);
                }            
            }
        });
    },
    PlayCardSound(gender, cardType, seriesFlag, point, cardNum)
    {
        let cardValue = point +2;
        if (2 >= point) {
            cardValue = point + 11
        } else {
            cardValue = point - 2
        }
        
        let path = "resources/510K/sound/";

        if (gender) {
            path += "male/";
        } else {
            path += "female/";
        }

        //1 普通话 2 方言
        if (true){
            path += "510K_putong/";
        }else{  
            path += "510K_fangyan/";
        }

        switch (cardType) {
            case GDefine.CARD_TYPE_ERROR:
                path += ("Pass/b_pass" + parseInt(Math.random(0,4) / 1));
                break;
            case GDefine.CARD_TYPE_SINGLE:
                path += ("Single/b_" + cardValue);
                break;
            case GDefine.CARD_TYPE_DOUBLE:
                path += ("Double/b_pairOf" + cardValue);
                break;
            case GDefine.CARD_TYPE_THREE:
                path += "b_3add2";
                break;
            case GDefine.CARD_TYPE_SERISE:
                if (seriesFlag == GDefine.SERIES_SINGLE) {
                    path += "b_straight"
                }else if(seriesFlag == GDefine.SERIES_DOULE){
                    path += "b_manytwo"
                }else if(seriesFlag == GDefine.SERIES_THREE){
                    path += "b_plane"
                }
                break;
            case GDefine.CARD_TYPE_BOOM:
                if (4 == cardNum) {
                    path += "boom"
                }else if(3 == cardNum){
                    path += "510K"
                }
                break;
            default:
                break;
        }
        path += ".mp3";

        GAudio.PlaySound(path);
    },
    ClearHandCard(localSeat)
    {
        this.Node_Player[localSeat].Node_HandCard.removeAllChildren();
    },
    ClearOutCard(localSeat)
    {
        this.Node_Player[localSeat].Node_OutCard.removeAllChildren();
    },

    ShowDaTuInfo(localSeat)
    {
        this.Node_Player[localSeat].Sprite_DuTypes.active = true;
        if (this.bIsDaTu) {
            this.Node_Player[localSeat].Sprite_DuTypes.getComponent(cc.Sprite).spriteFrame = ResCache["daTus"];
            this.Node_Player[localSeat].Sprite_DuTips.active = true;
            this.Node_Player[localSeat].Sprite_DuTips.getComponent(cc.Sprite).spriteFrame = ResCache["dudaplayer"];
        } else {
            this.Node_Player[localSeat].Sprite_DuTypes.getComponent(cc.Sprite).spriteFrame = ResCache["buDaTu"];
        }
    },
    SetMateImgVis(mateLocalSeat)
    {
        this.mateServerSeat = this.Local2Seat(mateLocalSeat);
        this.Node_Player[mateLocalSeat].Sprite_DuTips.active = true;
        this.Node_Player[mateLocalSeat].Sprite_DuTips.getComponent(cc.Sprite).spriteFrame = ResCache["duiyou"];
    },
    ShowFindFriendPanels()
    {
        this.Node_FindFriend.active = true;
        if ( ! this.FindFriendCardList) {
            this.FindFriendCardList = []
            this.FindFriendCardList[5+48]   = this.Button_Spade5;
            this.FindFriendCardList[5+32]   = this.Button_Heart5;
            this.FindFriendCardList[5+16]   = this.Button_Plum5;
            this.FindFriendCardList[5]      = this.Button_Block5;
            this.FindFriendCardList[10+48]  = this.Button_Spade10;
            this.FindFriendCardList[10+32]  = this.Button_Heart10;
            this.FindFriendCardList[10+16]  = this.Button_Plum10;
            this.FindFriendCardList[10]     = this.Button_Block10;
            this.FindFriendCardList[13+48]  = this.Button_SpadeK;
            this.FindFriendCardList[13+32]  = this.Button_HeartK;
            this.FindFriendCardList[13+16]  = this.Button_PlumK;
            this.FindFriendCardList[13]     = this.Button_BlockK;
        }
        //禁用自己已有的手牌按钮
        this.handCardLists[LOCAL_SEAT].forEach(cardValue => {
            let cardNum = cardValue%16;
            if (5==cardNum || 10==cardNum || 13==cardNum) {
                this.FindFriendCardList[cardValue].getComponent(cc.Button).interactable = false;
            }
        });
        
        this.FindFriendCardList.forEach(element => {
            element.Sprite_SelectMask.active = false;
        });
        this.selectCardValue = 0;
    },
    SelectFriendCard(cardValue)
    {
        if (this.selectCardValue) {
            this.FindFriendCardList[this.selectCardValue].Sprite_SelectMask.active = false;
        }
        this.selectCardValue = cardValue;
        this.FindFriendCardList[this.selectCardValue].Sprite_SelectMask.active = true;
    },

    ShowFriendCard(feiendCardValue)
    {
        this.DuiYouBg.active = true;
        this.DuiYouBg.Sprite_FriendCard.getComponent(cc.Sprite).spriteFrame = CardResCache[feiendCardValue];
    },
    SetCardOperateBtnVis(bIsShow)
    {
        this.Button_NoPlay.active = bIsShow;
        this.Button_Play.active = bIsShow;
    },
    SetPassImg(localSeat, bIsShow)
    {
        this.Node_Player[localSeat].Sprite_Pass.active = bIsShow;
    },
    GetSelectCard()
    {
        let selectCardlist = [];
        let handCardlist = this.Node_Player[LOCAL_SEAT].Node_HandCard.children;
        let handCardLength = handCardlist.length;
        for (let i = 0; i < handCardLength; i++) {
            if (handCardlist[i].bIsSelected) {
                selectCardlist[selectCardlist.length] = this.handCardLists[LOCAL_SEAT][i];
            }
        }
        return selectCardlist;
    },
    SetShangYouTips(localSeat, rank)
    {
        this.Node_Player[localSeat].Sprite_ShangyouTypes.active = true;
        this.Node_Player[localSeat].Sprite_ShangyouTypes.getComponent(cc.Sprite).spriteFrame = ResCache["rank_" + rank + "_win"];
    },
    showLight(localSeat = -1)
    {
        for (var i = 0; i < this.m_PlayerNum; i++) {
            this.Node_Player[i].Anim_CutDown.active = false;
        }

        if(localSeat != -1){
            this.Node_Player[localSeat].Anim_CutDown.active = true;
        }
    },
    SetSurplusCardVis(vis)
    {
        for (var i = 0; i < this.m_PlayerNum; i++) {
            this.Node_Player[i].Sprite_SurplusCardBg.active = vis;
        }
    },
    SetSurplusCardNum(localSeat, cardNum)
    {
        this.Node_Player[localSeat].Sprite_SurplusCardBg.Label_SurplusCardNum.getComponent(cc.Label).string = cardNum;
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // 按钮事件响应 
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    OnButton_Invitee()
    {
        var title = "[东乡510K]";
        title += this.m_PlayerNum + "人场,";
        if(this.m_GameRuleConfig.haveAnZhao){
            title += "暗找队友.";
        }else{
            title += "明找队友.";
        }

        title += "房号:<" + Util.MytoString(GData.GetRoomID()) + ">";
        var imageUrl = GConfig.ShareImgURL;
        var query = "roomID=" + GData.GetRoomID();
        GData.Share(title,imageUrl,query);
    },
    OnButton_Copy()
    {
        //复制房号
        var title = "[东乡510K]";
        title += this.m_PlayerNum + "人场. ";
        title += "房号:<" + Util.MytoString(GData.GetRoomID()) + "> ";
        
        var ruleContent = this.m_PlayerNum + "人场,";
        if(this.m_GameRuleConfig.haveAnZhao){
            ruleContent += "暗找队友.";
        }else{
            ruleContent += "明找队友.";
        }

        Util.SetClipboardStr(title + ruleContent);
    },
    OnButton_Ready()
    {
        GNet.send( "ProPKGameReadyRequest" , {} );
    },
    OnButton_Dice()
    {
        GNet.send( "ProPKGameDiceRequest", {dicecount:this.dicecount || 0} );
    },
    OnButton_Du()
    {
        GNet.send( "ProPKGameUserDaTuRequest", {bIsDaTu:true, seat:this.m_MySeat_id} );
    },
    OnButton_BuDu()
    {
        GNet.send( "ProPKGameUserDaTuRequest", {bIsDaTu:false, seat:this.m_MySeat_id} );
    },
    //找队友牌按钮
    OnButton_Spade5()
    {
        this.SelectFriendCard(5+48);
    },
    OnButton_Heart5()
    {
        this.SelectFriendCard(5+32);
    },
    OnButton_Plum5()
    {
        this.SelectFriendCard(5+16);
    },
    OnButton_Block5()
    {
        this.SelectFriendCard(5);
    },
    OnButton_Spade10()
    {
        this.SelectFriendCard(10+48);
    },
    OnButton_Heart10()
    {
        this.SelectFriendCard(10+32);
    },
    OnButton_Plum10()
    {
        this.SelectFriendCard(10+16);
    },
    OnButton_Block10()
    {
        this.SelectFriendCard(10);
    },
    OnButton_SpadeK()
    {
        this.SelectFriendCard(13+48);
    },
    OnButton_HeartK()
    {
        this.SelectFriendCard(13+32);
    },
    OnButton_PlumK()
    {
        this.SelectFriendCard(13+16);
    },
    OnButton_BlockK()
    {
        this.SelectFriendCard(13);
    },
    OnButton_FindFriendConfirm()
    {
        if (this.selectCardValue) {
            GNet.send( "ProPKGameUserTeammateRequest", {mateCard:this.selectCardValue} );
            this.Node_FindFriend.active = false;
        }
    },
    OnButton_Play()
    {
        let outCardSelectList = this.GetSelectCard();
        if (outCardSelectList) {
            GNet.send( "ProPKGameOutMahRequest", {seat:this.m_MySeat_id, outMahs:outCardSelectList} );
        }
    },
    OnButton_NoPlay()
    {
        GNet.send( "ProPKGameOutMahRequest", {seat:this.m_MySeat_id} );
    },
    OnButton_Settle()
    {
        this.m_ResultLayer.node.active = true;
    },
    OnButton_Next()
    {
        this.OnButton_Ready();
    },
    OnButton_BackHall()
    {
        this.backToHall();
    },

    OnButton_MoreMask()
    {
        this.MoreNode.Button_MoreMask.active = !this.MoreNode.Button_MoreMask.active;
        this.MoreNode.BtnNodes.active = !this.MoreNode.BtnNodes.active;
    },
    OnButton_More()
    {
        this.OnButton_MoreMask();
    },
    OnButton_Setting()
    {
        this.OpenWindow( "Hall/Node_HallSetting" );
        this.OnButton_MoreMask();
    },
    OnButton_Quit()
    {
        this.QuitRoom();
        this.OnButton_MoreMask();
    },

    //加载 初始化 资源
    
    loadPlayerNode()
    {
        this.Node_Player = [];
        this.Node_PlayerScoer = [];
        for (let index = 0; index < this.m_PlayerNum; index++) {
            this.Node_Player[index] = cc.find("Canvas/Panel_Player" + index);
            this.Node_Player[index].Node_Source.Label_Source.getComponent(cc.Label).string = "0"

            this.Node_PlayerScoer[index] = cc.find("Canvas/Node_Integral/Node_player" + index);
            this.Node_PlayerScoer[index].Label_playerName.getComponent(cc.Label).string="";
        }
        this.LoadPlayerNodeFinished();
    },

    LoadPlayerNodeFinished()
    {
    },

    LoadPanelFinished()
    {
        return;
        //准备消息在规则消息之前 这里重新刷新一遍
        if(this.m_ReadyState)
        {
            for(var i in this.m_ReadyState)
            {
                var localSeat = this.Seat2Local(i);
                this.showReadyState(true, localSeat);
            }
        }
    },
    
    GetCardResCache()
    {
        return CardResCache;
    },
    GetResCache()
    {
        return ResCache;
    },
    setTouch()
    {
        let self = this;
        let handCard = this.Node_Player[LOCAL_SEAT].Node_HandCard;

        var winSize = cc.view.getVisibleSize();
        let handCardNodePosY = handCard.convertToWorldSpace(cc.p(0, handCard.height / 2)).y;

        handCard.on(cc.Node.EventType.TOUCH_START,function (touchEvent){
            let TouchPos = cc.v2(touchEvent.getLocationX() - winSize.width / 2, touchEvent.getLocationY() - handCardNodePosY);
            self.checkSelCard(TouchPos, true);
        });
        handCard.on(cc.Node.EventType.TOUCH_MOVE,function (touchEvent){  
            let TouchPos = cc.v2(touchEvent.getLocationX() - winSize.width / 2, touchEvent.getLocationY() - handCardNodePosY);
            self.checkSelCard(TouchPos, false);
        });
        handCard.on(cc.Node.EventType.TOUCH_END,function (touchEvent){
            self.checkSelCardEnd();
        });
    },
    checkSelCard(touchPos, bIsTouchStart)
    {
        let handCardlist = this.Node_Player[LOCAL_SEAT].Node_HandCard.children;
        let handCardLength = handCardlist.length;

        var winSize = cc.view.getVisibleSize();
        let cardWidth = winSize.width / 1280 * GDefine.CardWidth + 1;
        let cardHeight = winSize.height / 720 * GDefine.CardHeight ;

        if (bIsTouchStart) {
            this.bIsTouchedList = [];
            for (let i = 0; i < handCardLength; i++) {
                this.bIsTouchedList[i] = false; //记录牌结点是否被触摸过
            }
        }
        for (let i = 0; i < handCardLength; i++) {
            if (!this.bIsTouchedList[i]) {
                let cardRect = new cc.rect(handCardlist[i].x - cardWidth / 2, handCardlist[i].y - cardHeight / 2, cardWidth / 2, cardHeight);
                if (i+1 == handCardLength) {
                    cardRect = new cc.rect(handCardlist[i].x - cardWidth / 2, handCardlist[i].y - cardHeight / 2, cardWidth, cardHeight);
                }
                if (cc.rectContainsPoint(cardRect, touchPos)) {
                    handCardlist[i].Sprite_SelectMask.active = true;
                    this.bIsTouchedList[i] = true;
                }
            }
        }
    },
    checkSelCardEnd()
    {
        let handCardlist = this.Node_Player[LOCAL_SEAT].Node_HandCard.children;
        let handCardLength = handCardlist.length;

        for (let i = 0; i < handCardLength; i++) {
            if (handCardlist[i].Sprite_SelectMask.active) {
                handCardlist[i].Sprite_SelectMask.active = false;
                if (handCardlist[i].bIsSelected) {
                    handCardlist[i].bIsSelected = false;
                    handCardlist[i].y -= 30 ;
                } else {
                    handCardlist[i].bIsSelected = true;
                    handCardlist[i].y += 30 ;
                }
            }
        }
    },
    getDefineTalkSound( nSeat,Idx )
    {
        var path = "resources/510K/sound/"

        var users = this.GetRoomUsers();
        if (users && users[nSeat] && !users[nSeat].gender){
            path += "female/510K_chat/";
        }else{
            path += "male/510K_chat/";
        }

        return path + "510_Chat_" + (Idx) + ".mp3";
    },
 });


////////////////////////////////////////////////////////////////////////////////////////////////////
// 网络消息响应 
////////////////////////////////////////////////////////////////////////////////////////////////////

function onRecvProPkGameRuleConfig(ProPkGameRuleConfig)
{
    this.m_GameRuleConfig = ProPkGameRuleConfig;

    //房号
    this.sRoomNum = Util.MytoString(GData.GetRoomID(),6);
    this.Node_Tops.RoomNumAltas.getComponent(cc.Label).string = this.sRoomNum;
    //当前局数/总局数
    this.setGameRound(this.m_GameRuleConfig.currentGameCount, this.m_GameRuleConfig.gameRound);
    //明找 or 暗找
    if (this.m_GameRuleConfig.haveAnZhao) {
        this.Node_Tops.Sprite_Plays.getComponent(cc.Sprite).spriteFrame = ResCache["anzhao"];
    }else{
        this.Node_Tops.Sprite_Plays.getComponent(cc.Sprite).spriteFrame = ResCache["mingzhao"];
    }

    // 设置房主座位号
    this.roomMasterSeat = ProPkGameRuleConfig.nMasterSeat;
}

function OnProPKGameStatusResponse(ProPKGameStatusResponse)
{
    this.m_GameStatus = ProPKGameStatusResponse.status
}

function OnRecvProPKGameReadyNotify(ProPkGameReadyNotify)
{
    this.Button_Ready.active = true;
}

function OnRecvProPKGameReadyResponse(ProPkGameReadyResponse)
{
    let localSeat = this.Seat2Local(ProPkGameReadyResponse.seat);
    if (LOCAL_SEAT==localSeat) {
        this.Button_Ready.active = false;

        this.Button_Settle.active = false;
        this.Button_Next.active = false;
        this.Button_BackHall.active = false;

        for (let i = 0; i < this.m_PlayerNum; i++) {
            this.ClearOutCard(i);
            this.ClearHandCard(i);
        }
    }
    this.showReadyState( true, localSeat );
}

function OnRecvProPKGameDiceNotify(ProPkGameDiceNotify)
{
    for (let i = 0; i < this.m_PlayerNum; i++) {
        this.Node_Player[i].Sprite_Ready.active = false;
    }

    let localSeat = this.Seat2Local( ProPkGameDiceNotify.seat )
    if(LOCAL_SEAT===localSeat)
    {
        this.dicecount = ProPkGameDiceNotify.dicecount
        this.Button_Dice.active = true;
    }
    this.showLight(localSeat);
}

function OnRecvProPKGameDiceResult(ProPkGameDiceResult)
{
    this.Button_Dice.active = false;

    // 骰子动画
    let left = ProPkGameDiceResult.result[0];
    let right = ProPkGameDiceResult.result[1];
    this.DiceScenePlay(left,right);
}

function OnRecvProPKGameStart(ProPKGameStart)
{
    this.InitLayout();

    this.bankerServerSeat = ProPKGameStart.bankerseat;
    this.bankerLocalSeat = this.Seat2Local(this.bankerServerSeat);
    this.setGameBanker(this.bankerLocalSeat);
    
    this.setGameRound(ProPKGameStart.gamecount, this.m_GameRuleConfig.gameRound);

    this.handCardLists = [];
    this.handCardNums = [];
    this.outCardLists = [];
    this.m_ReadyState = [];
    this.serverPlayerRank = [];

    this.m_ShowEndDelayTime = 1;
}

function OnRecvProPKGameSendMahs(ProPKGameSendMahs)
{
    let localSeat = this.Seat2Local(ProPKGameSendMahs.seat);
    if (LOCAL_SEAT===localSeat) {
        this.handCardNums = [];
        for (let i = 0; i < this.m_PlayerNum; i++) {
            this.handCardNums[i] = ProPKGameSendMahs.mahscount[i];
            this.SetSurplusCardNum(this.Seat2Local(i), this.handCardNums[i])
        }
        this.SetSurplusCardVis(true);

        this.handCardLists[localSeat] = [];
        for (let i = 0; i < this.handCardNums[localSeat]; i++) {
            this.handCardLists[localSeat][i] = ProPKGameSendMahs.mahs[i];
        }
        this.UpdateHandCard(localSeat, false);
    }
}

function OnRecvProPKGameUserDaTuNotify(ProPkGameUserDaTuNotify)
{
    let localSeat = this.Seat2Local(ProPkGameUserDaTuNotify.seat);
    if (LOCAL_SEAT === localSeat) {
        this.Button_Du.active = true;
        this.Button_BuDu.active = true;
    }
    this.showLight(localSeat);
}

function OnRecvProPKGameUserDaTuResponse(ProPkGameUserDaTuResponse)
{
    let localSeat = this.Seat2Local(ProPkGameUserDaTuResponse.seat);
    if (LOCAL_SEAT === localSeat) {
        this.Button_Du.active = false;
        this.Button_BuDu.active = false;
    }
    this.bIsDaTu = ProPkGameUserDaTuResponse.bIsDaTu;
    this.ShowDaTuInfo(localSeat)

    let nextLocalSeat = this.Seat2Local(ProPkGameUserDaTuResponse.nextSeat);
    if (LOCAL_SEAT === nextLocalSeat) {
        this.Button_Du.active = true;
        this.Button_BuDu.active = true;
    }
}

function OnRecvProPKGameUserDaTuResult(ProPkGameUserDaTuResult)
{
    let localSeat = this.Seat2Local(ProPkGameUserDaTuResult.seat);
    if (LOCAL_SEAT === localSeat) {
        this.Button_Du.active = false;
        this.Button_BuDu.active = false;
    }

    this.bIsDaTu = ProPkGameUserDaTuResult.bIsDaTu;
    this.ShowDaTuInfo(localSeat)
    
    let tempThis = this;
    this.scheduleOnce(function(){
        for (let i = 0; i < tempThis.m_PlayerNum; i++) {
            tempThis.Node_Player[i].Sprite_DuTypes.active = false;
        }
    }, 2);

    if (ProPkGameUserDaTuResult.bIsDaTu) {
        this.daTuServerSeat = ProPkGameUserDaTuResult.seat
        this.daTuLocalSeat = this.Seat2Local(this.daTuServerSeat)
    }
}

function OnRecvProPKGameUserTeammateNotify(ProPkGameUserTeammateNotify)
{
    let localSeat = this.Seat2Local(ProPkGameUserTeammateNotify.seat);
    if (LOCAL_SEAT === localSeat) {
        this.ShowFindFriendPanels()
    }
    this.showLight(localSeat);
}
function OnRecvProPKGameUserTeammateRequest(ProPkGameUserTeammateRequest)
{
    this.ShowFriendCard(ProPkGameUserTeammateRequest.mateCard);
}
function OnRecvProPKGameUserTeammateResult(ProPKGameUserTeammateResult)
{
    let bankerMateLocalSeat = this.Seat2Local(ProPKGameUserTeammateResult.nMateSeat);
    if (LOCAL_SEAT === this.bankerLocalSeat) {
        this.mateLocalSeat = bankerMateLocalSeat;
    } else if (LOCAL_SEAT === bankerMateLocalSeat) {
        this.mateLocalSeat = this.bankerLocalSeat;
    }
    else{
        this.mateLocalSeat = (0+1+2+3)-this.bankerLocalSeat-bankerMateLocalSeat;
    }
    this.SetMateImgVis(this.mateLocalSeat);
}
function OnRecvProPKGameShangYouResult(ProPKGameShangYouResult)
{
    this.serverPlayerRank = ProPKGameShangYouResult.shangyouSeat;
    this.LocalPlayerRank = [0,0,0,0]
    for (let i = 0; i < this.serverPlayerRank.length; i++) {
        this.LocalPlayerRank[i] = this.Seat2Local(this.serverPlayerRank[i]);
        this.SetShangYouTips(this.LocalPlayerRank[i], i+1);
    }
}
//暗找流程
function OnRecvProPKGameAnZhaoNotify(ProPKGameAnZhaoNotify)
{
    let localSeat = this.Seat2Local(ProPKGameAnZhaoNotify.seat);
    if (LOCAL_SEAT === localSeat) {
        this.dicecount = ProPKGameAnZhaoNotify.dicecount;
        this.Button_Dice.active = true;
    }
    this.SetCardOperateBtnVis(false);
    this.showLight(localSeat);
}
function OnRecvProPKGameAnZhaoResult(ProPKGameAnZhaoResult)
{
    let firstLocalSeat = this.LocalPlayerRank[0];
    let firstMateLocalSeat = this.Seat2Local(ProPKGameAnZhaoResult.mateSeat);
    if (LOCAL_SEAT === firstLocalSeat) {
        this.mateLocalSeat = firstMateLocalSeat;
    } else if (LOCAL_SEAT === firstMateLocalSeat) {
        this.mateLocalSeat = firstLocalSeat;
    }
    else{
        this.mateLocalSeat = (0+1+2+3)-firstLocalSeat-firstMateLocalSeat;
    }
    this.SetMateImgVis(this.mateLocalSeat);
}

function OnRecvProPKGameLightCardsRequest(ProPKGameLightCardsRequest)
{
    if (ProPKGameLightCardsRequest.bIsLightCard) {
        for (let i = 0; i < this.m_PlayerNum; i++) {
            let localSeat = this.Seat2Local(i);
            this.handCardNums[localSeat] = ProPKGameLightCardsRequest.cbHandCardData[i].Mahs.length;
            this.handCardLists[localSeat] = [];
            for (let j = 0; j < this.handCardNums[localSeat]; j++) {
                this.handCardLists[localSeat][j] = ProPKGameLightCardsRequest.cbHandCardData[i].Mahs[j];
            }   
            this.UpdateHandCard(localSeat, false);
        }
    }
}

function OnRecvProPKGameTimerPower(ProPKGameTimerPower)
{
    let localSeat = this.Seat2Local(ProPKGameTimerPower.seat);
    if (LOCAL_SEAT === localSeat) {
        this.SetCardOperateBtnVis(true)
    }
    this.SetPassImg(localSeat, false);
    this.ClearOutCard(localSeat);
    this.showLight(localSeat);
}
function OnRecvProPKGameOutMahsResponse(ProPKGameOutMahsResponse)
{
    let localSeat = this.Seat2Local(ProPKGameOutMahsResponse.seat);
    if (LOCAL_SEAT === localSeat) {
        this.SetCardOperateBtnVis(false)
    }
    
    this.outCardLists[localSeat] = [];
    let cardNum = ProPKGameOutMahsResponse.outMahs.length
    if (0 < cardNum) {
        GAudio.PlaySound("resources/510K/sound/outCard.mp3")

        for (let i = 0; i < cardNum; i++) {
            this.outCardLists[localSeat][i] =  ProPKGameOutMahsResponse.outMahs[i];
        }
        this.UpdateOutCard(localSeat, false);

        if (LOCAL_SEAT === localSeat || this.bIsDaTu) {
            this.handCardNums[localSeat] = ProPKGameOutMahsResponse.handmahs.length;
            this.handCardLists[localSeat] = [];
            for (let i = 0; i < this.handCardNums[localSeat]; i++) {
                this.handCardLists[localSeat][i] = ProPKGameOutMahsResponse.handmahs[i];
            }
            this.UpdateHandCard(localSeat, false);
        }
        this.SetSurplusCardNum(localSeat, ProPKGameOutMahsResponse.cardCount);
    } else {
        this.SetPassImg(localSeat, true);
    }

    //出牌 音效
    let point = 0;
    if (0 < cardNum) {
        point = ProPKGameOutMahsResponse.outMahs[0] % 16
    }
    let outCardType = ProPKGameOutMahsResponse.cardType;
    let seriesFlag = parseInt(ProPKGameOutMahsResponse.cardtypeflg / 16);

    let gender = this.GetRoomUsers()[ProPKGameOutMahsResponse.seat].gender

    this.PlayCardSound(gender, outCardType, seriesFlag, point, cardNum);
}
//更新分数 1:总分, 2, 捡分, 3奖励分
function OnRecvProPKGameDataResp(ProPKGameDataResp)
{
    if (ProPKGameDataResp.type == 1) {
        for(let i = 0;i < this.m_PlayerNum; i++)
        {
            if (0 <= ProPKGameDataResp.totalScore[i]) {
                this.Node_Player[this.Seat2Local(i)].Node_Source.Label_Source.getComponent(cc.Label).string = ProPKGameDataResp.totalScore[i];
            } else {
                this.Node_Player[this.Seat2Local(i)].Node_Source.Label_Source.getComponent(cc.Label).string = "/" + ProPKGameDataResp.totalScore[i];
            }
        }
    } else {
        //初始化
        if (""==this.Node_PlayerScoer[i].Label_Source.getComponent(cc.Label).string) {
            for(let i = 0;i < this.m_PlayerNum; i++){
                this.Node_PlayerScoer[i].Label_Source.getComponent(cc.Label).string = "捡分0";
                this.Node_PlayerScoer[i].Label_jiang.getComponent(cc.Label).string = "0奖";
            }
        }
        if(ProPKGameDataResp.type == 2){
            for(let i = 0;i < this.m_PlayerNum; i++){
                this.Node_PlayerScoer[i].Label_Source.getComponent(cc.Label).string = "捡分" + ProPKGameDataResp.totalScore[i];
            }
        }else if(ProPKGameDataResp.type == 3){   
            for(let i = 0;i < this.m_PlayerNum; i++){
                this.Node_PlayerScoer[i].Label_jiang.getComponent(cc.Label).string = ProPKGameDataResp.totalScore[i] + "奖";
            }
        }
    }
}
function OnRecvProPKGameEnd(ProPKGameEnd)
{
    this.m_GameEndInfo = ProPKGameEnd;
    this.m_bGameFinalEnd = ProPKGameEnd.bRoundEnd;
    var self = this;

    //隐藏 按钮
    this.Button_Du.active = false;
    this.Button_BuDu.active = false;
    this.Button_Dice.active = false;
    this.Button_Play.active = false;
    this.Button_NoPlay.active = false;
    this.Node_FindFriend.active = false;

    this.Button_Settle.active = true;
    this.Button_BackHall.active = this.m_bGameFinalEnd;
    this.Button_Next.active = (!this.m_bGameFinalEnd);

    this.showLight();
    this.SetSurplusCardVis(false);

    var roomUserList = {};
    var roomUsers = this.GetRoomUsers();
    for (var k in roomUsers){
        var vv = roomUsers[k];
        roomUserList[vv.seatID] = vv;
    }

    if (this.handCardLists) {
        for (let i = 0; i < this.m_PlayerNum; i++) {
            let localSeat = this.Seat2Local(i);
            if (LOCAL_SEAT != localSeat) {
                //摊牌
                this.handCardLists[localSeat] = [];
                let cardNum = ProPKGameEnd.cbHandCardData[i].Mahs.length;
                for (let j = 0; j < cardNum; j++) {
                    this.handCardLists[localSeat][j] = ProPKGameEnd.cbHandCardData[i].Mahs[j];
                }
                this.UpdateHandCard(localSeat, true);
            }
        }
    }
    
    //更新总得分
    for(let i = 0;i < this.m_PlayerNum; i++){
        if (0 <= ProPKGameEnd.lTotaslGameScore[i]) {
            this.Node_Player[this.Seat2Local(i)].Node_Source.Label_Source.getComponent(cc.Label).string = ProPKGameEnd.lTotaslGameScore[i];
        } else {
            this.Node_Player[this.Seat2Local(i)].Node_Source.Label_Source.getComponent(cc.Label).string = "/" + ProPKGameEnd.lTotaslGameScore[i];
        }
    }

    var parm = {};
    parm.game = this;
    parm.users = roomUserList;

    function callback(){
        if(!self.m_ResultLayer){
            function loadResult(node){
                node.active = false;
                self.m_ResultLayer = node.getComponent("510KResultLayer");
                self.m_ResultLayer.OnLoaded(parm);
                self.m_ResultLayer.node.setLocalZOrder(290);
            }
            self.LoadPanelByCallBackN("510K/ResultLayer",loadResult);
        }
        else{
            self.m_ResultLayer.OnLoaded(parm);
        }

        //大结算
        if (self.m_GameEndInfo.bRoundEnd){
            if(!self.m_TotalResultLayer){
                function loadResult(node){
                    node.active = false;
                    self.m_TotalResultLayer = node.getComponent("510KTotalResultLayer");
                    self.m_TotalResultLayer.OnLoaded(parm);
                    self.m_TotalResultLayer.node.setLocalZOrder(299);
                }
                self.LoadPanelByCallBackN("510K/TotalResultLayer",loadResult);
            }
            else{
                self.m_TotalResultLayer.OnLoaded(parm);
            }
        }
    }
    
    Util.performWithDelay(this.node, callback, this.m_ShowEndDelayTime || 0);// 一次性定时器
    this.m_ShowEndDelayTime = 0;
}

function OnRecvProPKGameSendDiscardMahs(ProPkGameSendDiscardMahs)
{
    for(let i = 0;i < this.m_PlayerNum; i++){
        let localSeat = this.Seat2Local(i);
        let outCardNum = ProPkGameSendDiscardMahs.cbCardData[i].Mahs.length;
        this.outCardLists[localSeat] = [];
        if (0 < outCardNum) {
            for (let j = 0; j < outCardNum; j++) {
                this.outCardLists[localSeat][j] =  ProPkGameSendDiscardMahs.cbCardData[i].Mahs[j];
            }
            this.UpdateOutCard(localSeat, false);
        } else {
            this.SetPassImg(localSeat, true);
        }
    }
}
function OnRecvProPKGameDeskInfo(ProPkGameDeskInfo)
{


}
function OnRecvProPKGameUserPhoneStatusRequest(ProPKGameUserPhoneStatusRequest)
{
    let roomUsers = this.GetRoomUsers();
    let localSeatID = this.Seat2Local(ProPKGameUserPhoneStatusRequest.seatId);
    for(let v in roomUsers)
    {
        if( v.seatID != localSeatID)
        {
            let m_player = this.Node_Player[this.Seat2Local(ProPKGameUserPhoneStatusRequest.seatId)];
            if(ProPKGameUserPhoneStatusRequest.userstatus == 0)
            {
                m_player.Sprite_Call.active = false;
                m_player.Sprite_Offine.active = false;

            }else if(ProPKGameUserPhoneStatusRequest.userstatus == 1)
            {
                m_player.Sprite_Call.active = true;
                m_player.Sprite_Offine.active = false;

            }else if(ProPKGameUserPhoneStatusRequest.userstatus == 2)
            {
                m_player.Sprite_Call.active = false;
                m_player.Sprite_Offine.active = true;
            }
        }
    }



}

function OnRecvProPKGameQuickSoundResponse(ProPKGameQuickSoundResponse)
{

}
function OnRecvProPKGameRecordResponse(ProPKGameRecordResponse)
{

}
function OnRecvProGameSendLocationNotify(ProGameSendLocationNotify)
{


}


