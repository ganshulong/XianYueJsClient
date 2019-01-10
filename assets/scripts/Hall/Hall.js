let GEvent = require( "GameEvent" );
let GData = require( "GameData");
let GNet = require( 'GameNet' );
let GAudio = require( "GameAudio" );
let Util = require( "Util");
let encoding = require( "encoding" );
let GConfig = require("GameConfig");

cc.Class({
    extends: require("WindowBase"),

    properties: {

    },
    OnLoaded:function()
    {
        
    },
    start () {
        if( GData.IsWechatGame() )
        {
            wx.showShareMenu({
                    withShareTicket:false,
                    success:function(){},
                    fail:function(){}
                }
            );
            wx.onShareAppMessage(
                function(){
                    return {
                        title:"约逗棋牌",
                        imageUrl:GConfig.ShareImgURL,
                        //query:"a=123123"
                    };
                }
            );
        }
        GEvent.OnGameEvent( GEvent.ProLoginSuccessResponse, function( event ){
            var profile = GData.GetProfile();
            cc.find("Canvas/Layout_Player/Button_Player/Label_PlayerName").getComponent( cc.Label ).string = profile.nickname;
            cc.find("Canvas/Layout_Player/Button_Player/Label_PlayerID").getComponent( cc.Label ).string = profile.user_id;
            if( profile.avatar_file )
                this.LoadUrlImg( cc.find("Canvas/Layout_Player/Button_Player/Player_Heads"), profile.avatar_file + "?a=a.jpg" );
        }.bind(this) );

        GEvent.OnGameEvent( GEvent.ProGetUserPropResponse, function( event ){
            var nodeCard = cc.find("Canvas/Layout_Player/Button_PuyCard/Label_CardNums").getComponent( cc.Label ).string = GData.GetRoomCard()
        } );        
        GEvent.OnGameEvent( GEvent.ReEnterDesk, function( event ){
            var deskId = event.getUserData();
            // TODO: 加载游戏
            if( deskId != -1 )
            {

            }
        } );
        GNet.SetAdepter("ProGameDeskErrorResponse", function(ProGameDeskErrorResponse){
            if(ProGameDeskErrorResponse){
                var msgStr = new encoding.TextDecoder("utf-8").decode(ProGameDeskErrorResponse.errorMsg);
                // self.OpenWindow("Node_Tooltip", msgStr);
                Util.ShowTooltip(msgStr);
            }
        });

        GAudio.PlayMusic("resources/sound/homeMusic.mp3");

        var profile = GData.GetProfile();
        if( profile.nickname )
            cc.find("Canvas/Layout_Player/Button_Player/Label_PlayerName").getComponent( cc.Label ).string = profile.nickname;
        if( profile.user_id )
            cc.find("Canvas/Layout_Player/Button_Player/Label_PlayerID").getComponent( cc.Label ).string = profile.user_id;
        if( profile.avatar_file )
            this.LoadUrlImg( cc.find("Canvas/Layout_Player/Button_Player/Player_Heads"), profile.avatar_file + "?a=a.jpg" );
        var nodeCard = cc.find("Canvas/Layout_Player/Button_PuyCard/Label_CardNums").getComponent( cc.Label ).string = GData.GetRoomCard()

       // cc.find("Canvas/Layout_Player/Button_PuyCard").active = false;
       //弹出公告
       if (GConfig.IsFirstIntoGame)
       {
            this.OnButton_Public();
            GConfig.IsFirstIntoGame = false;
       }
},
    //头像点击
    OnButton_Player: function(event)
    {
        var aa = this.node.getChildByName("Home_Bg").addComponent( cc.Animation );
        cc.loader.loadRes( "Anim_Egg", function( err, ani ){
            aa.addClip( ani );
            aa.play( "Anim_Egg" );
        } ) 
        this.OpenWindow( "Hall/Node_PlayerInfoHeadFrame", "test params" );
    },
    // 界面函数
    OnButton_CreateRoom: function(event)
    {
        cc.log("OnButton_CreateRoom clicked");
        this.OpenWindow( "Hall/Node_CreateRoom", "test params" );
    },
    OnButton_JoinRoom: function(event)
    {
        cc.log("OnButton_JoinRoom clicked");
        this.OpenWindow( "Hall/Node_JoinRoom" );
    },
    //战绩
    OnButton_History: function(event)
    {
        cc.log("OnButton_History clicked");
        this.OpenWindow( "History/Node_HistoryLayerOrDetail");
    },
    //规则
    OnButton_Rule: function(event)
    {
        cc.log("OnButton_Rule clicked");
        this.OpenWindow( "Hall/Node_RuleLayer" );
    },
    //工会
    OnButton_Gonghui: function(event){
        cc.director.loadScene("LabourUnion");
    },
    // 綁定
    OnButton_Bund: function(event){
        this.OpenWindow( "Hall/Node_Bunding" );
    },
    // 公告
    OnButton_Public: function(event){
        this.OpenWindow( "Hall/Node_GongGao" );
    },
    // 设置
    OnButton_Setting: function(event){
        this.OpenWindow( "Hall/Node_HallSetting" );
    },
    //替人开房
    OnButton_ForRoom:function()
    {
        this.OpenWindow( "Hall/Node_ForRoomLayer" );
    },
    //客服
    OnButton_Kefu:function()
    {
        this.OpenWindow( "Hall/Node_ServiceLayer" );
    },
    // 竞技场
    OnButton_RankingRoom:function()
    {
        Util.ShowTooltip( "敬请期待" );
    },
    // 添加房卡
    OnButton_PuyCard:function()
    {
        var profile = GData.GetProfile();
        var needUrl = GConfig.RECHARGE_URL + "user_id=" + profile.user_id + "&game_id=" + GConfig.GlobalGameId;
        if (GData.IsWechatGame())
        {
            wx.navigateTo({
                url:needUrl
            });
        }
    },
    // update (dt) {},
});