let GEvent = require( "GameEvent" );
let GData = require( "GameData");
let GConfig = require( "GameConfig" );
let GNet = require( 'GameNet' );
let encoding = require( "encoding" );
let _pb = require( "compiled" );
let Util = require("Util");
let self = null;
let key = "SelGuild";

cc.Class({
    extends: require("WindowBase"),
    // LIFE-CYCLE CALLBACKS:

    start () {
        self = this;
        this.m_SelGuild = null;
        this.isFastEntry = false;
        this.scroll_guidList = cc.find("Canvas/Scroll_GuidList").getComponent(cc.ScrollView);                   //公会列表
        this.scroll_roomList = cc.find("Canvas/Scroll_RoomList").getComponent(cc.ScrollView);                   //房间列表
        this.labour_des = cc.find("Canvas/Text_Info").getComponent(cc.Label);                            //公会描述
        this.phone_txt = cc.find("Canvas/Txt_Phone").getComponent(cc.Label);                             //联系方式
        this.creator_name = cc.find("Canvas/Text_Founder").getComponent(cc.Label);                       //联系人
        this.card_num = cc.find("Canvas/Node_Tops/LabourCard/Text_CardNums").getComponent(cc.Label);            //房卡
        this.guild_name = cc.find("Canvas/Node_Tops/LabourName/Text_GuidNames").getComponent(cc.Label);         //公会名称
        this.labour_id = cc.find("Canvas/Node_Tops/LabourID/Text_ID").getComponent(cc.Label);                   //工会ID         

        GNet.SetAdepter("ProUserOrganizeNotify", function(ProUserOrganizeNotify){
            if(ProUserOrganizeNotify){
                self.RequestGuildInfo();
            }
        });

        //亲友圈房间
        GNet.SetAdepter( "ProBuildByOrganizeDeskListResponse", self.Guild_Room_Update);     //公会房间

        //亲友圈列表
        GNet.SetAdepter( "ProGetOrganizeInfoResponse", function(ProGetOrganizeInfoResponse){
            GData.SetGuildInfo(ProGetOrganizeInfoResponse);
            self.Guild_Info_Update();
        }); 

        GNet.SetAdepter("ProGetOrganizePropResponse", function(ProGetOrganizePropResponse){
            if(ProGetOrganizePropResponse){
                var guild = GData.GetGuild(ProGetOrganizePropResponse.organizeId);
                if(guild){
                    for(let i = 0; i < ProGetOrganizePropResponse.propInfo.length; i++){
                        if(ProGetOrganizePropResponse.propInfo[i].type == _pb.messages.propType.PROPTYPE_ORGINIZE_ROOMCARD){
                            guild.roomcardNum = ProGetOrganizePropResponse.propInfo[i].count;
                            self.Guild_Info_Update();
                        }
                    }
                }
            }
        });

        //亲友圈加入
        GNet.SetAdepter("ProApplyJoinOrganizeResponse", function(ProApplyJoinOrganizeResponse){
            if(ProApplyJoinOrganizeResponse.info){
                var str = new encoding.TextDecoder("utf-8").decode(ProApplyJoinOrganizeResponse.info);
                Util.ShowTooltip(str);
            }
        });

        //创建亲友圈
        GNet.SetAdepter( "ProCreateOrganizeResponse", function(ProCreateOrganizeResponse){
            if(ProCreateOrganizeResponse.result == 0){
                if(ProCreateOrganizeResponse.info){
                    var str = new encoding.TextDecoder("utf-8").decode(ProCreateOrganizeResponse.info);
                    Util.ShowTooltip(str);
                }else{
                    Util.ShowTooltip("俱乐部创建成功");
                }
            }else{
                var str = new encoding.TextDecoder("utf-8").decode(ProCreateOrganizeResponse.info);
                Util.ShowTooltip(str);
            }
        });

       cc.find("Canvas/Button_Member/tips").active = false;
       this.schedule(function(){
           self.RequestRoomList();
        }, 10);

        self.RequestGuildInfo();

      //this.Guild_Info_Update();
    },

    //亲友圈信息请求
    RequestGuildInfo: function(){
        var profile = GData.GetProfile();
        GNet.send( "ProGetOrganizeInfoRequest", { userId: profile.user_id , gameId: GConfig.GlobalGameId} );
    },

    //返回大厅
    OnButton_Homes: function(event){
        this.backToHall();
    },

    //复制
    OnButton_Copys: function(event){
        var IDString = self.phone_txt.string;
        Util.SetClipboardStr(IDString);
        //Util.ShowTooltip("复制成功");
    },

    //创建工会
    OnCreate_Labour: function(event){
        this.OpenWindow( "Labour/CreateGuild");
    },

    //加入工会
    OnJoin_Labour: function(event){
        this.OpenWindow( "Labour/JoinGuild");
    },

    //邀请
    OnInvitation_Labour: function(event){
        if(!self.m_SelGuild){
            Util.ShowTooltip("请选择俱乐部");
            return;
        }
        var title = "[约逗棋牌]" + "邀请您加入亲友圈:" + self.m_SelGuild;    
        var imageUrl = GConfig.ShareImgURL;
        var query = "";
        GData.Share(title,imageUrl,query);
    },

    //房卡购买
    OnBtn_AddPuy: function(event){
        if(!self.m_SelGuild){
            Util.ShowTooltip("请选择俱乐部");
            return;
        }
        this.OpenWindow("Labour/GuildRCards", {guildID: self.m_SelGuild});
    },

    //商城
    OnButton_Shops: function(event){
        cc.log("shop");
    },

    //开房
    OnButton_GetRoom: function(event){
        self.Button_CreateRoomClick();
    },

    //管理
    OnButton_Manage: function(event){
        if(!self.m_SelGuild){
            Util.ShowTooltip("请选择俱乐部");
            return;
        }

        this.OpenWindow( "Labour/Node_Manage", {guildID: self.m_SelGuild});
    },

    //战绩
    OnButton_History: function(event){
        if(!self.m_SelGuild){
            Util.ShowTooltip("请选择俱乐部");
            return;
        }
        this.OpenWindow("Labour/GuildHistory", {guildID: self.m_SelGuild});
    },

    //成员
    OnButton_Member: function(event){
        if(!self.m_SelGuild){
            Util.ShowTooltip("请选择俱乐部");
            return;
        }
        this.OpenWindow("Labour/GuildMemeber", {guildID: self.m_SelGuild, GuildUpdate: self.RequestGuildInfo});
    },

    //快速加入
    OnButton_FastEntry: function(event){
        cc.log("OnButton_FastEntry");
        self.RequestRoomList();
        self.isFastEntry = true;
        cc.find("Canvas/Button_FastEntry").getComponent(cc.Button).interactable = false;

        self.scheduleOnce(function(){
            cc.find("Canvas/Button_FastEntry").getComponent(cc.Button).interactable = true;
        }, 2);
    },

    GuildListItemClicked: function(event, customEventData){
        cc.log("customEventData: " + customEventData);
        self.SelectGuild(customEventData);
    },

    Guild_Info_Update: function(){
        var profile = GData.GetProfile();
        var initSelect = 0;
        var guild = GData.GetGuildInfo();

        var booEmpty = (guild.info.length <= 0);

        cc.find("Canvas/Img_Tips").active = booEmpty;
        cc.find("Canvas/Txt_Phone").active = !booEmpty;
        cc.find("Canvas/Text_Founder").active = !booEmpty;
        cc.find("Canvas/phone_Tips").active = !booEmpty;
        cc.find("Canvas/master_Tips").active = !booEmpty;
        cc.find("Canvas/Button_Copys").active = !booEmpty;
        cc.find("Canvas/Text_Info").active = !booEmpty;
        cc.find("Canvas/Scroll_RoomList").active = !booEmpty;
        cc.find("Canvas/Node_Tops").active = !booEmpty;
        cc.find("Canvas/Invitation_Labour").active = !booEmpty;
        cc.find("Canvas/Button_FastEntry").active = !booEmpty;

        if(booEmpty){
            cc.find("Canvas/Button_Member/tips").active = false;
            self.labour_des.string = "您尚未加入俱乐部";
        }
        
        self.scroll_guidList.content.removeAllChildren();
        cc.loader.loadRes("Labour/Button_Guilds", function(err, labourPrefab){
            if(err){
                cc.error(err.message || err);
                return;
            }
            for(let i = 0; i < guild.info.length; i++){
                var guildItem = cc.instantiate(labourPrefab);
                var sc = guildItem.getComponent("LabourItem");

                var index = 0;
                if(guild.info[i].masterId == profile.user_id){
                    index = 0;
                }else{
                    index = 1;
                }
                var strName = new encoding.TextDecoder("utf-8").decode(guild.info[i].organizeName);
                sc.SetTipFrame(index);
                sc.SetGuildName(strName);
                guildItem.tag = guild.info[i].organizeId;

                var clickEventHandler = new cc.Component.EventHandler();
                clickEventHandler.target = self.node;
                clickEventHandler.component = "Labour";
                clickEventHandler.handler = "GuildListItemClicked";
                clickEventHandler.customEventData = guild.info[i].organizeId;
                var button = guildItem.getComponent(cc.Button);
                button.clickEvents.push(clickEventHandler);
                
                /*
                if(GData.GetSelectGuildID()){
                    if(guild.info[i].organizeId == GData.GetSelectGuildID()){
                        self.RefreshItem(sc, guild.info[i].organizeId);
                    }
                }else{
                    self.RefreshItem(sc, guild.info[i].organizeId);
                }
                */
                self.scroll_guidList.content.addChild(guildItem);
                if(initSelect == 0){
                    initSelect = guild.info[i].organizeId;
                }
            }

            if(guild.info.length > 0){
                self.SelectGuild(GData.GetSelectGuildID() || initSelect);
            }            
        });
    },

    EnterGameRoom: function(roomNum){
        var profile = GData.GetProfile();
        GNet.send( "ProGameUserEnterDeskRequest", {userId:profile.user_id,deskId:Number(roomNum),playFlag:0xFFFFFFFF} );
    },

    Guild_Room_Update: function(event){
        var rooms = [];
        for(let i = 0; i < event.roomInfo.length; i++){
            rooms.push(event.roomInfo[i]);
        }
        rooms.sort(function( a, b ){
            return (a.deskSeat - a.userNum) > (b.deskSeat - b.userNum);
        });

        if(self.isFastEntry){
            self.isFastEntry = false;
            for(let i = rooms.length - 1; i >= 0; i--){
                if(rooms[i].userNum < rooms[i].deskSeat){
                    self.EnterGameRoom(rooms[i].roomTag);
                    return;
                }
            }
            //创建房间
            self.Button_CreateRoomClick();
        }

        self.scroll_roomList.content.removeAllChildren();
        cc.loader.loadRes("Labour/RoomItem", function(err, roomPrefab){
            if(err){
                cc.error(err.message || err);
                return;
            }

            for(let i = 0; i < rooms.length; i++){
                var item = cc.instantiate(roomPrefab);
                var sc = item.getComponent("RoomItem");
                var gameDefine = require(GConfig.GetGameDefine(rooms[i].aeraId));


                var title = gameDefine.ConfigString(rooms[i].ruleFlag, false);
                var desc = gameDefine.ConfigString(rooms[i].ruleFlag, true);

                title = title.substr(0, title.length - 1);
                sc.SetGameDes(title);
                sc.SetGameRule(desc);

                var index = (rooms[i].deskSeat > rooms[i].userNum) ? 0 : 1;
                sc.SetRoomBg(index);
                sc.SetGameNumber(rooms[i].userNum + "/" + rooms[i].deskSeat);
                var nickName = new encoding.TextDecoder("utf-8").decode(rooms[i].nickName[0]);
                sc.SetPlayerName(nickName);

                sc.SetDefaultHeadStatus(false);

                if(rooms[i].headFile[0].length != 0){
                    self.LoadUrlImg( item.getChildByName("head"), new encoding.TextDecoder("utf-8").decode(rooms[i].headFile[0]) + "?a=a.jpg" );
                }

                var clickEventHandler = new cc.Component.EventHandler();
                clickEventHandler.target = self.node;
                clickEventHandler.component = "Labour";
                clickEventHandler.handler = "HeadClicked";
                var headButton = item.getChildByName("head").getComponent(cc.Button);
                headButton.clickEvents.push(clickEventHandler);

                var EventHandler = new cc.Component.EventHandler();
                EventHandler.target = self.node;
                EventHandler.component = "Labour";
                EventHandler.handler = "ReEnterGameRoom";
                EventHandler.customEventData = rooms[i].roomTag;
                var JoinButton = item.getChildByName("Btn_JionRoom").getComponent(cc.Button);
                JoinButton.clickEvents.push(EventHandler);

                self.scroll_roomList.content.addChild(item);
            }
            
            //添加三个默认房间
            var guild = GData.GetGuild(self.m_SelGuild);
            if(guild && guild.gameType != undefined && guild.gameType != -1 && guild.ruleType != undefined && guild.ruleType != ""){
                for(let i = rooms.length; i < 3; i++){
                    var item = cc.instantiate(roomPrefab);
                    var sc = item.getComponent("RoomItem");
                    var gameDefine = require(GConfig.GetGameDefine(guild.gameType));

                    var title = gameDefine.ConfigString(guild.ruleType, false);
                    var desc = gameDefine.ConfigString(guild.ruleType, true);

                    title = title.substr(0, title.length - 1);
                    sc.SetGameDes(title);
                    sc.SetGameRule(desc);

                    var ProGameRuleConfig = gameDefine.RuleParseFromString(guild.ruleType);

                    sc.SetRoomBg(0);
                    sc.SetGameNumber(0 + "/" + ProGameRuleConfig.nPlayerNum);

                    sc.SetDefaultHeadStatus(true);

                    var EventHandler = new cc.Component.EventHandler();
                    EventHandler.target = self.node;
                    EventHandler.component = "Labour";
                    EventHandler.handler = "OnButton_FastEntry";
                    var JoinButton = item.getChildByName("Btn_JionRoom").getComponent(cc.Button);
                    JoinButton.clickEvents.push(EventHandler);

                    self.scroll_roomList.content.addChild(item);
                }
            }
            
            cc.loader.loadRes("Labour/Node_Create", function(err, createPrefab){
                if(err){
                    cc.error(err.message || err);
                    return;
                }

                var createNode = cc.instantiate(createPrefab);

                var EventHandler = new cc.Component.EventHandler();
                EventHandler.target = self.node;
                EventHandler.component = "Labour";
                EventHandler.handler = "CreateGameRoom";            
                var CreateButton = createNode.getComponent(cc.Button);
                CreateButton.clickEvents.push(EventHandler);
                self.scroll_roomList.content.addChild(createNode);            
            });
        });
    },

    //创建房间
    CreateGameRoom:function(event, customEventData){
        self.Button_CreateRoomClick();
    },

    //进入房间
    ReEnterGameRoom: function(event, customEventData){
        cc.log("customEventData = " + customEventData);
        self.EnterGameRoom(customEventData);
    },

    //头像点击
    HeadClicked: function(event, customEventData){
        cc.log("HeadClicked");
    },

    Button_CreateRoomClick:function(){
        if(!self.m_SelGuild){
            Util.ShowTooltip("请选择俱乐部");
            return;
        }

        var guild = GData.GetGuild(self.m_SelGuild);
        if(!guild){
            return;
        }

        if(guild.gameType != undefined && guild.gameType != -1 && guild.ruleType != undefined && guild.ruleType != ""){
            var gameDefine = require(GConfig.GetGameDefine(guild.gameType));
            var RuleConfig = gameDefine.RuleParseFromString(guild.ruleType);

            GData.SendBuildDesk(RuleConfig.needCard, gameDefine.GetPlayFlag(), gameDefine.GetGameType(), gameDefine.GetRuleConfigName(), RuleConfig, 2, guild.organizeId);
        }else{
            this.OpenWindow("Hall/Node_CreateRoom", {spawnCreate: 2, guildID: self.m_SelGuild});
        }
    },

    SelectGuild: function(guildID){
        if (!GData.GetGuild(guildID)){
            cc.log("cannot find guildInfo.");
            return;
        }
        
        var profile = GData.GetProfile();

        var children = self.scroll_guidList.content.children;
        for(let i = 0; i < children.length; i++){
            children[i].getComponent("LabourItem").SetBgFrame(0);
        }

        var item = self.scroll_guidList.content.getChildByTag(guildID);
        if(item){
            GData.SetSelectGuildID(guildID);
            self.m_SelGuild = guildID;
            item.getComponent("LabourItem").SetBgFrame(1);

            var guild = GData.GetGuild(guildID);
            if(guild){
                var booMaster = (guild.masterId == profile.user_id);
                self.labour_id.string = guildID;
                self.card_num.string = guild.roomcardNum
                var desInfo = new encoding.TextDecoder("utf-8").decode(guild.info);
                self.labour_des.string = desInfo;
                var phoneNum = new encoding.TextDecoder("utf-8").decode(guild.phoneNum);
                self.phone_txt.string = phoneNum;
                var nickName = new encoding.TextDecoder("utf-8").decode(guild.nickName);
                self.creator_name.string = nickName;

                cc.find("Canvas/Node_Tops/LabourCard").active = booMaster;
                cc.find("Canvas/Button_Member/tips").active = (booMaster && guild.applyFlag && guild.applyFlag > 0);
                cc.find("Canvas/Button_Shops").active = booMaster;
                cc.find("Canvas/Button_Manage").active = booMaster;
                cc.find("Canvas/Button_History").active = booMaster;
                cc.find("Canvas/Button_GetRoom").active = booMaster;
                cc.find("Canvas/Button_FastEntry").active = !booMaster;

                cc.find("Canvas/Node_Tops/LabourName").active = !booMaster;
                var organizeName = new encoding.TextDecoder("utf-8").decode(guild.organizeName);
                self.guild_name.string = organizeName;
            }
            self.RequestRoomList();
        }else{
            GData.SetSelectGuildID(null);
            self.m_SelGuild = null;

            var booEmpty = (guild.info.length <= 0);

            cc.find("Canvas/Img_Tips").active = booEmpty;
            cc.find("Canvas/Txt_Phone").active = !booEmpty;
            cc.find("Canvas/Text_Founder").active = !booEmpty;
            cc.find("Canvas/phone_Tips").active = !booEmpty;
            cc.find("Canvas/master_Tips").active = !booEmpty;
            cc.find("Canvas/Button_Copys").active = !booEmpty;
            cc.find("Canvas/Text_Info").active = !booEmpty;
            cc.find("Canvas/Scroll_RoomList").active = !booEmpty;
            cc.find("Canvas/Node_Tops").active = !booEmpty;
            cc.find("Canvas/Invitation_Labour").active = !booEmpty;
            cc.find("Canvas/Button_FastEntry").active = !booEmpty;

            if(booEmpty){
                cc.find("Canvas/Button_Member/tips").active = false;
                self.labour_des.string = "您尚未加入俱乐部";
            }
        }
    },

    RefreshItem: function(sc, guildID){
        var profile = GData.GetProfile();
        GData.SetSelectGuildID(guildID);
        self.m_SelGuild = guildID;
        sc.SetBgFrame(1);

        var guild = GData.GetGuild(guildID);
        if(guild){
            var booMaster = (guild.masterId == profile.user_id);
            cc.log("booMaster = " + booMaster);
            self.labour_id.string = guildID;
            self.card_num.string = guild.roomcardNum
            var desInfo = new encoding.TextDecoder("utf-8").decode(guild.info);
            self.labour_des.string = desInfo;
            var phoneNum = new encoding.TextDecoder("utf-8").decode(guild.phoneNum);
            self.phone_txt.string = phoneNum;
            var nickName = new encoding.TextDecoder("utf-8").decode(guild.nickName);
            self.creator_name.string = nickName;

            cc.find("Canvas/Node_Tops/LabourCard").active = booMaster;
            cc.find("Canvas/Button_Member/tips").active = (booMaster && guild.applyFlag && guild.applyFlag > 0);
            cc.find("Canvas/Button_Shops").active = booMaster;
            cc.find("Canvas/Button_Manage").active = booMaster;
            cc.find("Canvas/Button_History").active = booMaster;
            cc.find("Canvas/Button_GetRoom").active = booMaster;
            cc.find("Canvas/Button_FastEntry").active = !booMaster;

            cc.find("Canvas/Node_Tops/LabourName").active = !booMaster;
            var organizeName = new encoding.TextDecoder("utf-8").decode(guild.organizeName);
            self.guild_name.string = organizeName;
        }
        self.RequestRoomList();
    },

    RequestRoomList: function(){
        if(self.m_SelGuild == null) return;
        var guild = GData.GetGuild(self.m_SelGuild);
        if(guild == null) return;

        var profile = GData.GetProfile();
        GNet.send( "ProBuildByOrganizeDeskListRequest", { userId: guild.masterId , gameId: GConfig.GlobalGameId, organizeId: guild.organizeId} );
    },

    // update (dt) {},
});
