let GEvent = require( "GameEvent" );
let GData = require( "GameData");
let GConfig = require( "GameConfig" );
let GNet = require( 'GameNet' );
let Util = require("Util");
let encoding = require( "encoding" );
let _pb = require( "compiled" );
let self = null;

cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function(params){
        self = this;
        this.params=params;
        var profile = GData.GetProfile();
        this.memberScrollView = cc.find("AllMember_Node/ContentBg/ScrollView_Memeber", this.node).getComponent(cc.ScrollView);   //成员列表Scrollview
        this.reviewScrollView = cc.find("ReView_Node/Review_Content", this.node).getComponent(cc.ScrollView);   //审核列表Scrollview
        this.searchInput = cc.find("AllMember_Node/ImgUserID/TextField_UserID", this.node).getComponent(cc.EditBox);                       //查找用户框
        this.invitationInput = cc.find("AllMember_Node/ForUserID/UserID_TxtField", this.node).getComponent(cc.EditBox);                    //邀请用户框
        this.memberNumDis = cc.find("AllMember_Node/Text_numbers", this.node).getComponent(cc.Label);                     //成员人数
        this.spriteTip = cc.find("Button_Audited/tips", this.node);                                    //红点
        this.allMemberBtn = cc.find("Button_AllMember", this.node);                                    //全部成员
        this.auditedBtn = cc.find("Button_Audited", this.node);                                        //待审核
        this.invitationBtn = cc.find("AllMember_Node/Button_Invitation", this.node);                   //邀请按钮
        this.forUserID = cc.find("AllMember_Node/ForUserID", this.node);                               //邀请输入框
        this.exitGuildBtn = cc.find("AllMember_Node/Button_ExitGuild", this.node);                     //退出按钮
        this.allMemberNode = cc.find("AllMember_Node", this.node);                                     //全部成员节点
        this.reviewNode = cc.find("ReView_Node", this.node);                                           //待审核节点

        GNet.SetAdepter("ProMemberListResponse", function(ProMemberListResponse){
            GData.SetGuildMemberList(ProMemberListResponse.info);
            self.Guild_Member_List_Update();
        });

        GNet.SetAdepter("ProApplyListResponse", function(ProApplyListResponse){
            self.reviewScrollView.content.removeAllChildren();
            
            cc.loader.loadRes("Labour/GuildMemberItem", function(err, memberPrefab){
                if(err){
                    cc.error(err.message || err);
                    return;
                }                

                for(let i = 0; i < ProApplyListResponse.info.length; i++){
                    var memberItem = cc.instantiate(memberPrefab);
                    var sc = memberItem.getComponent("LabourMemberItem");

                    sc.SetNickName(new encoding.TextDecoder("utf-8").decode(ProApplyListResponse.info[i].nickName));
                    sc.SetPlayerID(ProApplyListResponse.info[i].userId);

                    var OKHandler = new cc.Component.EventHandler();
                    OKHandler.target = self.node;
                    OKHandler.component = "GuildMember";
                    OKHandler.handler = "DealApply";
                    OKHandler.customEventData = {dealId: ProApplyListResponse.info[i].dealId, OperCode: _pb.messages.DealType.DEALTYPE_AGREE};
                    var OKButton = memberItem.getChildByName("Btn_Agree").getComponent(cc.Button);
                    OKButton.clickEvents.push(OKHandler);

                    var RejectHandler = new cc.Component.EventHandler();
                    RejectHandler.target = self.node;
                    RejectHandler.component = "GuildMember";
                    RejectHandler.handler = "DealApply";
                    RejectHandler.customEventData = {dealId: ProApplyListResponse.info[i].dealId, OperCode: _pb.messages.DealType.DEALTYPE_REJECT};
                    var RejectButton = memberItem.getChildByName("Btn_Refuse").getComponent(cc.Button);
                    RejectButton.clickEvents.push(RejectHandler);

                    self.reviewScrollView.content.addChild(memberItem);
                }
            });

            if(ProApplyListResponse.info.length <= 0){
                var guild = GData.GetGuild(self.params.guildID);
                if(guild){
                    guild.applyFlag = 0;
                }
            }

            self.spriteTip.active = (ProApplyListResponse.info.length > 0);
        });

        self.RequestGuildMemberList(self.params.guildID);
        var guild = GData.GetGuild(self.params.guildID);
        if(!guild){
            return;
        }
        
        this.spriteTip.active = (guild.applyFlag && guild.applyFlag > 0);
        var masterID = guild.masterId;
        var myselfID = profile.user_id;
        if(masterID != myselfID){
            this.auditedBtn.active = false;
            this.invitationBtn.active =false;
            this.forUserID.active = false;
        }else{
            this.exitGuildBtn.active = false;
        }
    },

    DealApply: function(event, customEventData){
        var profile = GData.GetProfile();
        var ProDealApplyRequest = {
            dealId: customEventData.dealId,
            userId: profile.user_id,
            gameId: GConfig.GlobalGameId,
            result: customEventData.OperCode
        };

        GNet.send( "ProDealApplyRequest", ProDealApplyRequest );
        self.RequestGuildApplyList(self.params.guildID);
    },

    RequestGuildApplyList: function(guildID){
        if(!guildID || guildID <= 0){
            return;
        }

        var guild = GData.GetGuild(guildID);
        if(guild && guild.organizeId > 0){
            GNet.send( "ProApplyListRequest", {organizeId: guild.organizeId} );
        }
    },

    RequestGuildMemberList: function(guildID){
        if(!guildID || guildID <= 0){
            return;
        }

        var guild = GData.GetGuild(guildID);
        if(guild && guild.organizeId > 0){
            GNet.send( "ProMemberListRequest", {organizeId: guild.organizeId} );
        }
    },

    Guild_Member_List_Update: function(event){
        var strSearch = null;
        if(event){
            strSearch = event.strSearch;
        }
        
        var info = GData.getGuildMemberList();
        if(!info){
            cc.log("cannot find member info");
            return;
        }

        //查找id或者用户名包含字符串的用户
        if(strSearch){
            var find = [];
            var isSearching = false;
            for(let i = 0; i < info.length; i++){
                var strId = info[i].userId.toString();
                if(strId.indexOf(strSearch) > -1){
                    find.push(info[i]);
                    isSearching = true;
                }else if(info[i].nickName.indexOf(strSearch) > -1){
                    find.push(info[i]);
                    isSearching = true;
                }
            }

            if(!isSearching){
                Util.ShowTooltip("无该成员信息");
            }

            info = find;
        }

        if(!info){
            return;
        }

        self.memberNumDis.string = info.length;
        self.memberScrollView.content.removeAllChildren();

        cc.loader.loadRes("Labour/GuildMemberItem_m", function(err, memberPrefab){
            if(err){
                cc.error(err.message || err);
                return;
            }

            var profile = GData.GetProfile();
            cc.log("guildID = " + self.params.guildID);
            var guild = GData.GetGuild(self.params.guildID);
            if(!guild){
                return;
            }

            var masterID = guild.masterId;
            var myselfID = profile.user_id;

            for(let i = 0; i < info.length; i++){
                var memberItem = cc.instantiate(memberPrefab);
                var sc = memberItem.getComponent("LabourMemberItem_m");

                var booMaster = (info[i].userId == masterID);
                var nickName = new encoding.TextDecoder("utf-8").decode(info[i].nickName);
                sc.SetNickName(nickName);
                sc.SetPlayerID(info[i].userId);
                sc.SetJoinTime(new encoding.TextDecoder("utf-8").decode(info[i].joinDate));
                sc.SetPlayerPos(booMaster?"圈主": "成员");
                sc.SetPosColor(booMaster?new cc.Color(255, 0, 0):new cc.Color(150, 150, 150));
                sc.SetClearEnable(!booMaster && masterID == myselfID);
                var clickEventHandler = new cc.Component.EventHandler();
                clickEventHandler.target = self.node;
                clickEventHandler.component = "GuildMember";
                clickEventHandler.handler = "TickOutPlayer";
                clickEventHandler.customEventData = {userId: info[i].userId, organizeId: self.params.guildID, nickName: nickName, MemberReqFun: self.RequestGuildMemberList};
                var DelButton = memberItem.getChildByName("Button_Delete").getComponent(cc.Button);
                DelButton.clickEvents.push(clickEventHandler);

                sc.SetRemarkEnable((masterID == myselfID && !booMaster));
                if(masterID == myselfID){
                    var otherName = "";
                    if(info[i].otherName && info[i].otherName.length != 0){
                        otherName = new encoding.TextDecoder("utf-8").decode(info[i].otherName);
                        sc.SetRemarkName("(" + otherName + ")");
                    }

                    var EventHandler = new cc.Component.EventHandler();
                    EventHandler.target = self.node;
                    EventHandler.component = "GuildMember";
                    EventHandler.handler = "RemarkName";
                    EventHandler.customEventData = {userId: info[i].userId, organizeId: self.params.guildID, otherName: otherName, comNode: sc};
                    var RemarkButton = memberItem.getChildByName("Button_Remark").getComponent(cc.Button);
                    RemarkButton.clickEvents.push(EventHandler);
                }
                self.memberScrollView.content.addChild(memberItem);
            }
        });
    },

    //踢人
    TickOutPlayer: function(event, customEventData){
        this.OpenWindow( "Labour/Guild_Remove", customEventData);
    },

    //备注
    RemarkName: function(event, customEventData){
        this.OpenWindow( "Labour/Guild_EditRemarks", customEventData);
    },

    //返回
    OnButton_Back: function(event){
        this.CloseSelf();
    },
    
    //邀请
    OnButton_Invitation: function(event){
        var userInput = self.forUserID.getChildByName("UserID_TxtField").getComponent(cc.EditBox);
        var userID = Number(userInput.string);
        if(userID == NaN){
            Util.ShowTooltip("请输入正确用户ID");
            return;
        }

        var profile = GData.GetProfile();
        var ProDealOrganizeMemberRequest = {
            dealUserId: userID,
            userId: profile.user_id,
            gameId: GConfig.GlobalGameId,
            dealType: 1,
            organizeId: self.params.guildID
        };

        GNet.send( "ProDealOrganizeMemberRequest", ProDealOrganizeMemberRequest );
        self.RequestGuildMemberList(self.params.guildID);
    },

    //待审核
    OnButton_Audited: function(event){
        cc.find("Button_AllMember/bg_enable", this.node).active = true;
        cc.find("Button_AllMember/bg_disable", this.node).active = false;
        cc.find("Button_Audited/bg_enable", this.node).active = false;
        cc.find("Button_Audited/bg_disable", this.node).active = true;
        
        this.allMemberNode.active = false;
        this.reviewNode.active = true;
        self.RequestGuildApplyList(self.params.guildID);
    },

    //全部成员
    OnButton_AllMember: function(event){
        cc.find("Button_AllMember/bg_enable", this.node).active = false;
        cc.find("Button_AllMember/bg_disable", this.node).active = true;
        cc.find("Button_Audited/bg_enable", this.node).active = true;
        cc.find("Button_Audited/bg_disable", this.node).active = false;

        this.allMemberNode.active = true;
        this.reviewNode.active = false;
        self.RequestGuildMemberList(self.params.guildID);
    },
    

    //退出公会
    OnButton_ExitGuild: function(event){
        var guild = GData.GetGuild(self.params.guildID);
        if(!guild){
            return;
        }

        var sureCallBack = function(){
            var profile = GData.GetProfile();
            var ProApplyQuitOrganizeRequest = {
                userId: profile.user_id,
                gameId: GConfig.GlobalGameId,
                organizeId: self.params.guildID
            };
            GNet.send("ProApplyQuitOrganizeRequest", ProApplyQuitOrganizeRequest);
            self.CloseSelf();
        };
        
        var guildName = new encoding.TextDecoder("utf-8").decode(guild.organizeName);
        this.OpenWindow("Labour/Guild_ExitGuild", {GuildName: guildName, sureCallBack:sureCallBack});
    },

    OnClose: function(){
        cc.log("OnClose");
        this.params.GuildUpdate();
    }
});
