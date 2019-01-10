


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

        if(loadFinished)
        {
            this.Init();
        }
        else
        {
            var self = this;
            cc.loader.loadResDir( "mj/Result", cc.SpriteFrame, function( err, assets ){
                // TODO: 保存资源
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

        for (let i = 0; i < 4; i++) {
            this.Panel_Main["Panel_Player" + i].active = (i < game.m_PlayerNum);
        }


        this.data = game.m_GameEndInfo;
        var users = this.params.users;

        var dwCreatorID = game.roomMasterSeat;
        var wBankerSeat = game.m_BankerSeat;


        //时间显示
        var getTime = Util.getTime();
        this.Text_DateTime.getComponent(cc.Label).string = getTime;

        if (game.m_isReplay) {
            this.Button_Summ.active = false;
            this.Button_BackDesk.active = false;
            this.Button_BackHall.active = true;
        }
        else if (this.data.bRoundEnd) {
            this.Button_Summ.active = true;
            this.Button_BackDesk.active = false;
            this.Button_BackHall.active = true;
        }
        else {
            this.Button_Summ.active = false;
            this.Button_BackDesk.active = true;
            this.Button_BackHall.active = false;
        }

        //房间信息
        this.Text_RoomNum.getComponent(cc.Label).string = game.sRoomNum;
        this.Text_Count.getComponent(cc.Label).string = (game.m_GameCount || 0) + "/" + (game.m_GameRuleConfig.gameRound || 0);

        //规则信息
        let gameruleStr = game.getGameRuleStr();
        for (let i = 0; i < 5; i++) {
            if (gameruleStr[i])
                this["Text_Play" + i].getComponent(cc.Label).string = gameruleStr[i];
            else
                this["Text_Play" + i].getComponent(cc.Label).string = "";
        }

        this.Text_HouseName.getComponent(cc.Label).string = users[dwCreatorID].nickName;

        for (let i = 0; i < game.m_PlayerNum; i++) {
            let playerPanel = this.Panel_Main["Panel_Player" + i];

            //放炮
            if (i === (this.data.wProvideUser)) {
                playerPanel.Img_HuTypes.active = true;
                playerPanel.Img_HuTypes.getComponent(cc.Sprite).spriteFrame = ResCache["fangpao1"];
            }
            else{
                playerPanel.Img_HuTypes.active = false;
            }

            //庄家
            if (wBankerSeat === i) {
                playerPanel.Sprite_DZFlag.active = true;
            }
            else {
                playerPanel.Sprite_DZFlag.active = false;
            }


            //昵称和ID
            playerPanel.Text_PlayerName.getComponent(cc.Label).string = users[i].nickName;

            this.LoadUrlImg(playerPanel.Image_Head,users[i].avatarFile);
        }

        for (let i = 0; i < 12; i++) {
            this.Node_MaiMa.Node_MaCard2["MaCard" + i].active = false;
        }

        this.showEndInfo();
    },

    showEndInfo() 
    {
        var chk_Kind = 0;
        var chr_Right = 0;
        for (let i = 0; i < game.m_PlayerNum; i++) {
            var playerPanel = this.Panel_Main["Panel_Player"+i];

            //分数显示
            playerPanel.Text_HuPaiSrc.getComponent(cc.Label).string = this.data.lGameHuScore[i] || 0;               //胡牌分
            if(game.m_GameRuleConfig.bHaveKing){
                this.Text_King.getComponent(cc.Label).string = "精分";
                playerPanel.Text_KingSrc.getComponent(cc.Label).string = this.data.lGameScoreEx[i] || 0;            //精分
            }else{
                playerPanel.Text_KingSrc.getComponent(cc.Label).string = this.data.lGamejiangmaScore[i] || 0;       //买码
                this.Text_King.getComponent(cc.Label).string = "买码";
            }

            playerPanel.Text_GangSrc.getComponent(cc.Label).string = this.data.lGangScore[i] || 0;                  //杠分
            playerPanel.Text_OneSSrc.getComponent(cc.Label).string = this.data.lHuiTouScore[i] || 0;                //抄庄分
            playerPanel.Text_DefenSrc.getComponent(cc.Label).string = this.data.lGameScore[i] || 0;                 //本局得分 + 臭庄分

            //总得分
            if (this.data.lAllScore[i] >= 0){
                playerPanel.AtlasTotalscore.getComponent(cc.Label).string = "." + (this.data.lAllScore[i] || 0);
            }else{
                playerPanel.AtlasTotalscore.getComponent(cc.Label).string = "/" + (this.data.lAllScore[i] || 0);
            }

            //霸王
            playerPanel.ImgBaWang.active = (this.data.cbBaWangKing[i] === 1);
            //冲关
            playerPanel.ImgChongGuan.active = (this.data.cbChongGuang[i] === 1);
            //解散
            playerPanel.ImgDissies.active = (game.m_DisMissSeat && game.m_DisMissSeat === i);


            //胡牌玩家
            if(this.data.dwChiHuKind[i] > GDefine.CHK_NULL)
            {
                chk_Kind = this.data.dwChiHuKind[i];
                chr_Right = this.data.dwChiHuRight[i];
                playerPanel.Img_HuTypes.active = true;
                playerPanel.Node_HuType.active = true;
                playerPanel.Img_HuTypes.getComponent(cc.Sprite).spriteFrame = ResCache["huzi"];
                playerPanel.Image_OutComeBg.getComponent(cc.Sprite).spriteFrame = ResCache["hubg1"];

                var cbCardData = {};
                for (let n = 0; n < 14; n++) {
                    cbCardData[n] = this.data.cbCardData[i].Mahs[n];
                }

                Util.sort(cbCardData,1);

                var idx = 0;
                var isShowHuCard = false;
                for (let j = 13; j >= 0; j--) {
                    var kCardNode = playerPanel.handCard["handCard"+j];

                    if(!isShowHuCard && cbCardData[idx] === this.data.cbChiHuCard)
                    {
                        isShowHuCard = true;
                        if(!kCardNode.hu_mask)
                        {
                            kCardNode.hu_mask = new cc.Node("hu_mask");
                            kCardNode.addChild(kCardNode.hu_mask);
                            kCardNode.hu_mask.addComponent(cc.Sprite).spriteFrame = ResCache["hu"];
                            kCardNode.hu_mask.setScale(1.3);
                        }
                        kCardNode.hu_mask.active = true;
                    }else if(kCardNode.hu_mask){
                        kCardNode.hu_mask.active = false;
                    }
                    game.UpdateCardTexture(kCardNode,cbCardData[idx++]);
                }

                //胡牌类型
                var chihu_str = "";
                chihu_str = this.GetResultTypeString(chk_Kind, chr_Right);
                var imagePath = this.GetImagePath(chihu_str);

                for(let kk = 0;kk<5;kk++)
                {
                    if(imagePath[kk])
                    {
                        playerPanel.Node_HuType["SprieType"+kk].active = true;
                        playerPanel.Node_HuType["SprieType"+kk].getComponent(cc.Sprite).spriteFrame = ResCache[imagePath[kk]];
                        if(kk!=0)
                        {
                            var PosX = playerPanel.Node_HuType["SprieType" + (kk - 1)].getPositionX();
                            var size = playerPanel.Node_HuType["SprieType" + (kk - 1)].getContentSize();
                            var selfSize = playerPanel.Node_HuType["SprieType" + kk].getContentSize();
                            playerPanel.Node_HuType["SprieType" + kk].setPositionX(PosX + size.width /2 + selfSize.width / 2 + 10);
                        }
                    }
                    else
                    {
                        playerPanel.Node_HuType["SprieType"+kk].active = false;
                    }
                }
            }
            else
            {
                playerPanel.Node_HuType.active = false;
                playerPanel.Image_OutComeBg.getComponent(cc.Sprite).spriteFrame = ResCache["meihu"];

                var cbCardData = {};
                for (let n = 0; n < 14; n++) {
                    cbCardData[n] = this.data.cbCardData[i].Mahs[n];
                }

                Util.sort(cbCardData,1);
                
                //手牌
                var idx = 0;
                for (let j = 13; j >= 0; j--) {
                    var kCardNode = playerPanel.handCard["handCard"+j];
                    game.UpdateCardTexture(kCardNode,cbCardData[idx++]);
                }
            }


            //吃碰杠的牌
            var localSeat = game.Seat2Local(i);
            var kOpearations = {};
            if (game.m_tbOpearationsInfo[localSeat]) kOpearations = game.m_tbOpearationsInfo[localSeat];
            for (let k = 0; k < 4; k++) {
                var actionCards = playerPanel.Node_action["player_action"+k];
                if (kOpearations[k]){
                    actionCards.active = true;
                    var cards = game.getOperationCards( kOpearations[k].wOperateCode,kOpearations[k].cbOperateCard );
                    for(let j = 0;j<4;j++){
                        var kCardNode = actionCards["ActionCard"+j];
                        game.UpdateCardTexture(kCardNode,cards[j]);
                    }
                }else{
                    actionCards.active = false;
                }
            }
        }

        this.UpdateMaCards(this.Node_MaiMa.Node_MaCard2, this.data.cbJiangMaCardData);

        if (game.m_DisMissSeat || chk_Kind === 0) {
            this.WinTypes.getComponent(cc.Sprite).spriteFrame = ResCache["liujue"];
            this.ApertBg.active = false;
        } else if (this.data.dwChiHuKind[game.m_MySeat_id] > 0) {
            this.WinTypes.getComponent(cc.Sprite).spriteFrame = ResCache["wins"];
            this.ApertBg.active = true;
        } else {
            this.WinTypes.getComponent(cc.Sprite).spriteFrame = ResCache["loss"];
            this.ApertBg.active = false;
        }
    },

    OnButton_Next()
    {
        if(!game)return;
        this.OnButton_BackDesk();
        game.OnButton_Ready();
    },
    OnButton_BackDesk()
    {
        if(!game)return;
        if(game.m_isReplay)
        {
            //game.StopReplay();
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
    OnButton_Share()
    {
        GData.ShareScreenShot(0, 0, 1280, 720, "东乡麻将");
    },


    UpdateMaCards(kPanel,tbMaCardsInfo)
    {
        var kCardsInfo = {};
        if (tbMaCardsInfo) kCardsInfo = tbMaCardsInfo;

        for (let i = 0; i < kPanel.getChildrenCount(); i++) {
            var kCardNode = kPanel["MaCard" + i];
            game.UpdateCardTexture(kCardNode, kCardsInfo[i]);
        }
    },


    GetResultTypeString(nKind, nRight)
    {
        var info = this.GetRightString(nRight);
        var strValue = info[0];
        var isHuanYuan = info[1];
        var jingdiao = "精吊";
        var gangdiao = "杠吊";
        var shuanggangdiao = "双杠吊";
        var sangangdiao = "三杠吊";
        var siganggdiao = "四杠吊";
        var zimo = "自摸";
        var qianggang = "抢杠";
        var gangkai = "杠开";
        var youbao = " ";
        var wubao = " ";

        if (isHuanYuan) {
            if (nKind === GDefine.CHK_MIX_DA_QI) {
                strValue += "混一色碰碰胡";
            }else if(nKind === GDefine.CHK_SAME_DA_QI){
                strValue += "清一色碰碰胡";
            }else if(nKind === GDefine.CHK_MIX_QI){
                strValue += "混一色七对";
            }else if(nKind === GDefine.CHK_SAME_QI){
                strValue += "清一色七对";
            }else if(nKind === GDefine.CHK_MIX){
                strValue += "混一色";
            }else if(nKind === GDefine.CHK_SAME){
                strValue += "清一色";
            }else if(nKind === GDefine.CHK_ZI){
                strValue += "字一色";
            }else if(nKind === GDefine.CHK_ZI_QI){
                strValue += "字一色七对";
            }else if(nKind === GDefine.CHK_ZI_DA_QI){
                strValue += "字一色碰碰胡";
            }else if(nKind === GDefine.CHK_ZI_JIA){
                strValue += "字一色假胡";
            }else if(nKind === GDefine.CHK_SAME_JIA){
                strValue += "清一色假胡";
            }else if(nKind & GDefine.CHK_JI_HU){
                strValue += "平胡";
            }else if(nKind & GDefine.CHK_QI_DUI){
                strValue += "七对";
            }else if(nKind & GDefine.CHK_PENG_PENG){
                strValue += "碰碰胡";
            }
        }
        else if (strValue === jingdiao || strValue === gangdiao || strValue === shuanggangdiao ||
            strValue === sangangdiao || strValue === siganggdiao)
        {
            strValue += youbao;
            if(nRight & GDefine.CHR_MIX_COLOR){
                strValue += "混一色";
            }else if(nRight & GDefine.CHR_SAME_COLOR){
                strValue += "清一色";
            }

            if(nKind & GDefine.CHK_JI_HU){
                strValue += "平胡";
            }else if(nKind & GDefine.CHK_QI_DUI){
                strValue += "七对";
            }else if(nKind & GDefine.CHK_PENG_PENG){
                strValue += "碰碰胡";
            }
        }
        else if (strValue == zimo || strValue == qianggang || strValue == gangkai){
            // if(nRight & GDefine.CHR_GERMAN){
            //     strValue += " ";
            // }
            strValue += " ";

            if(nRight & GDefine.CHR_MIX_COLOR){
                strValue += "混一色";
            }else if (nRight & GDefine.CHR_SAME_COLOR){
                strValue += "清一色";
            }

            if(nKind & GDefine.CHK_JI_HU){
                strValue += "平胡";
            }else if(nKind & GDefine.CHK_QI_DUI){
                strValue += "七对";
            }else if(nKind & GDefine.CHK_PENG_PENG){
                strValue += "碰碰胡";
            }else if(nKind & GDefine.CHK_THIRTEEN){
                strValue += "十三烂";
            }else if(nKind & GDefine.CHK_SERVEN){
                strValue += "七星十三烂";
            }
        }
        else if (strValue == youbao || strValue == wubao){
            if(nRight & GDefine.CHR_MIX_COLOR){
                strValue += "混一色";
            }else if (nRight & GDefine.CHR_SAME_COLOR){
                strValue += "清一色";
            }

            if(nKind & GDefine.CHK_JI_HU){
                strValue += "平胡";
            }else if(nKind & GDefine.CHK_QI_DUI){
                strValue += "七对";
            }else if(nKind & GDefine.CHK_PENG_PENG){
                strValue += "碰碰胡";
            }else if(nKind & GDefine.CHK_THIRTEEN){
                strValue += "十三烂";
            }else if(nKind & GDefine.CHK_SERVEN){
                strValue += "七星十三烂";
            }
        }
        return strValue;
    },
    GetImagePath(chihu_str)
    {
        var imgPath = new Array();

        if ( chihu_str.indexOf("天胡")!=-1){
            imgPath.push("type14");
        }
        if ( chihu_str.indexOf("地胡")!=-1){
            imgPath.push("type19");
        }
        if ( chihu_str.indexOf("平胡")!=-1){
            imgPath.push("type1");
        }
        if ( chihu_str.indexOf("四杠吊")!=-1){
            imgPath.push("type31");
        }
        if ( chihu_str.indexOf("三杠吊")!=-1){
            imgPath.push("type29");
        }
        if ( chihu_str.indexOf("双杠吊")!=-1){
            imgPath.push("type30");
        }
        if ( chihu_str.indexOf("杠吊")!=-1){
            imgPath.push("type5");
        }
        if ( chihu_str.indexOf("抢杠")!=-1){
            imgPath.push("type21");
        }
        if ( chihu_str.indexOf("杠开")!=-1){
            imgPath.push("type2");
        }
        if ( chihu_str.indexOf("精吊")!=-1){
            imgPath.push("type7");
        }
        if ( chihu_str.indexOf("自摸")!=-1){
            imgPath.push("type6");
        }
        if ( chihu_str.indexOf("还原")!=-1){
            imgPath.push("type12");
        }
        if ( chihu_str.indexOf("四归一")!=-1){
            imgPath.push("type32");
        }
        if ( chihu_str.indexOf("八归一")!=-1){
            imgPath.push("type25");
        }
        if ( chihu_str.indexOf("混一色")!=-1){
            imgPath.push("type4");
        }
        if ( chihu_str.indexOf("清一色")!=-1){
            imgPath.push("type20");
        }
        if ( chihu_str.indexOf("字一色")!=-1){
            imgPath.push("type33");
        }
        if ( chihu_str.indexOf("碰碰胡")!=-1){
            imgPath.push("type27");
        }
        if ( chihu_str.indexOf("假胡")!=-1){
            imgPath.push("type26");
        }
        if ( chihu_str.indexOf("七对")!=-1){
            imgPath.push("type28");
        }
        
        if ( chihu_str.indexOf("七星十三烂")!=-1){
            imgPath.push("type34");
        }
        else if ( chihu_str.indexOf("十三烂")!=-1){
            imgPath.push("type24");
        }
        return imgPath;
    },

    GetRightString(nRight)
    {
        var strResult = "";
        var huanyuan = false;

        if(nRight === 0)
        {
            strResult += " ";
            return [strResult,huanyuan];
        }

        if(nRight & GDefine.CHR_DI)
        {
            strResult += "地胡";
            return [strResult,huanyuan];
        }

        if(nRight & GDefine.CHR_TIAN)
        {
            strResult += "天胡";
            return [strResult,huanyuan];
        }

        if(nRight & GDefine.CHR_ULTRA_GANG_WAIT){
            strResult += "四杠吊";
            huanyuan = true;
        }else if(nRight & GDefine.CHR_TRIPLE_GANG_WAIT){
            strResult += "三杠吊";
            huanyuan = true;
        }else if(nRight & GDefine.CHR_DOUBLE_GANG_WAIT){
            strResult += "双杠吊";
            huanyuan = true;
        }else if(nRight & GDefine.CHR_KING_WAIT && nRight & GDefine.CHR_GANG_FLOWER){
            strResult += "杠吊";
            huanyuan = true;
        }else if(nRight & GDefine.CHR_QIANG_GANG){
            strResult += "抢杠";
            huanyuan = true;
        }else if(nRight & GDefine.CHR_GANG_FLOWER){
            strResult += "杠开";
            huanyuan = true;
        }else if(nRight & GDefine.CHR_KING_WAIT){
            strResult += "精吊";
            huanyuan = true;
        }else if(nRight & GDefine.CHR_ZI_MO){
            strResult += "自摸";
        }

        if(huanyuan && nRight & GDefine.CHR_GERMAN){
            strResult += "还原";
        }else{
            huanyuan = false;
        }

        if(nRight & GDefine.CHR_SI_GUI_YI){
            strResult += "四归一";
        }else if(nRight & GDefine.CHR_BA_GUI_YI){
            strResult += "八归一";
        }

        if(strResult.length > 0){
            return [strResult,huanyuan];
        }
        else{
            strResult += " ";
            return [strResult,huanyuan];
        }
    },
});