let GNet = require( 'GameNet' );
let _pb = require( "compiled" );
let GEvent = require( "GameEvent" );
let GConfig = require( "GameConfig" );
let Util = require( "Util");
let encoding = require( "encoding" );
let QQMapWX = require('qqmap-wx-jssdk.min');
let qqmapsdk = new QQMapWX({
    key: 'CK7BZ-BF7RP-JF5D5-VUY5M-OMY43-OSFYJ'
  });

let _LastBeat = null;
function SendHeartbeat()
{
    if( _LastBeat )
    {
        var myDate = new Date();
        var sec = myDate.getTime();
        if( (sec - _LastBeat) > 16000 )
        {
            GNet.ReConnect()
            _LastBeat = sec;
        }
    }
    GNet.send( "ProHeartBeatRequest", {} );
    GNet.send( "ProGameHeartBeatRequest", {} );
    if( _IsWechatGame() )
    {
        wx.getBatteryInfo( {
            success : function( res ){
                _BatteryLevel = parseInt( res.level );
            }
        } );
        wx.getLocation({
            type: 'wgs84',
            success: function (res) {
                _ProfileLatitude = res.latitude;
                _ProfileLongitude = res.longitude;
                qqmapsdk.reverseGeocoder({
                    location: {
                      latitude: res.latitude,
                      longitude: res.longitude
                    },
                    success: function (addressRes) {
                        _ProfileAddress = addressRes.result.address;
                    }
                })
            }
        });                
    }
}

// local variables
let _ProfileNickName = null;    // 昵称
let _ProfileID = null;          // 用户ID
let _ProfileIp = null;          // 用户IP
let _ProfileGender = null;      // 性别
let _ProfileAvatar_file = null; // 头像地址
let _ProfileDeskId = -1;        // 房号
let _PropInfo = null;           // 房卡信息 包括公会房卡
let _ProfileAddress = "";
let _ProfileLatitude = 0;
let _ProfileLongitude = 0;
let _heartbeatRate = 10;        
let _guildInfo = null;         //工会信息
let _RuleConfig = null;
let _RuleConfigName = "";
let _memberList = null;         //工会成员列表
let _UnionID = null;
let _ProfileSecretToken = null;       //
let _guildSelectID = null;
let _LaunchCheck = true;
let _BatteryLevel = 100;
let _NetworkType = "wifi";      // "", "wifi", "2g", "3g", "4g", "unknown", "none"

function DoNothing(){};

function ThirdPartyLogin()
{
    if( !_UnionID )
    {
        _WXLogin( function( res ){
            _UnionID = res.data.unionid || res.data.openid;
            GNet.send( "ProUserThirdpartyLoginRequest", { marketType:_pb.messages.MarketType.MARKET_OTHER,
                source:"WechatGame", gameId:GConfig.GlobalGameId, gender:_ProfileGender, thirdpartyAvatar:_ProfileAvatar_file,
                thirdpartyNickname:_ProfileNickName, uuid:_UnionID } );        
        } );    
    }
    else
    {
        GNet.send( "ProUserThirdpartyLoginRequest", { marketType:_pb.messages.MarketType.MARKET_OTHER,
            source:"WechatGame", gameId:GConfig.GlobalGameId, gender:_ProfileGender, thirdpartyAvatar:_ProfileAvatar_file,
            thirdpartyNickname:_ProfileNickName, uuid:_UnionID } );        
    }
}

function _IsWechatGame(){
    return cc.sys.browserType == cc.sys.BROWSER_TYPE_WECHAT_GAME;
}

function _WXLogin( func ){
    if( _IsWechatGame() )
        wx.login( {
            success: function( res ){
                if( res.code )
                {
                    wx.request({
                        url:"https://test.connect.bbwork.cn/wechat?code=" + res.code,
                        success: func,
                        dataType: "json",
                        fail: function(){
                            cc.log( "用户授权失败，请重新进入小游戏" );
                        }
                    })
                } else {
                    cc.log( '登录失败！' + res.errMsg );
                }
            }
         } ); //重新登录
}

if( _IsWechatGame() )
{
  wx.getLocation({
    type: 'wgs84',
    success: function (res) {
        _ProfileLatitude = res.latitude;
        _ProfileLongitude = res.longitude;
        qqmapsdk.reverseGeocoder({
            location: {
              latitude: res.latitude,
              longitude: res.longitude
            },
            success: function (addressRes) {
                _ProfileAddress = addressRes.result.address;
            }
        })
    }
  });

  wx.onShow( function( res ){
    var num = res.query && res.query.roomID;
    if( num && num > 0 )
    {
        GNet.send( "ProGameUserEnterDeskRequest", {userId:_ProfileID,deskId:Number(num),playFlag:0xFFFFFFFF} );
    }
  } );

  wx.onNetworkStatusChange( function( res ) {
    _NetworkType = res.networkType;
  } );
  wx.setKeepScreenOn( { keepScreenOn:true } );
}
  
( function (){
    GNet.SetAdepter( "ProConnectResponse", ( ProConnectResponse )=>{
        GNet.send( "ProGameVersionVerifyRequest", { gameId: GConfig.GlobalGameId, deviceType:_pb.messages.DeviceType.DEVICE_ANDROID_PHONE,
            marketType:_pb.messages.MarketType.MARKET_ANDROID_PHONE, clientVersion:"4.2" } );
        if( _IsWechatGame() )
        {
            wx.getUserInfo( {
                success: function(res){
                    _ProfileNickName = res.userInfo.nickName;
                    _ProfileGender = res.userInfo.gender;
                    _ProfileAvatar_file = res.userInfo.avatarUrl;
                    ThirdPartyLogin();
                },
                fail: function(){
                    cc.log( "授权失败" );
                }
            } );
        }
        else
        {
            // TODO: ProUserThirdpartyLoginRequest
            if( !GConfig.TestAccount )
                GConfig.TestAccount = Math.random().toString();
            GNet.send( "ProUserAnonymousLoginRequest", { uuid:GConfig.TestAccount, source:"PC", gameId:GConfig.GlobalGameId } );
        }

    } );
    GNet.SetAdepter( "ProGameVersionVerifyResponse", DoNothing );
    GNet.SetAdepter( "ProHeartBeatResponse", ()=>{ 
        var myDate = new Date();
        _LastBeat = myDate.getTime();
     } );
    GNet.SetAdepter( "ProGameHeartBeatResponse", DoNothing );
    
    GNet.SetAdepter( "ProLoginSuccessResponse", ( ProLoginSuccessResponse ) =>{
        // 保存用户信息
        _ProfileNickName = new encoding.TextDecoder("utf-8").decode(ProLoginSuccessResponse.user.base.nickname);
        _ProfileAvatar_file = new encoding.TextDecoder("utf-8").decode(ProLoginSuccessResponse.user.base.avatarFile);
        _ProfileSecretToken = new encoding.TextDecoder("utf-8").decode(ProLoginSuccessResponse.user.base.secretToken);
        _ProfileID = ProLoginSuccessResponse.user.userId;
        _ProfileIp = new encoding.TextDecoder("utf-8").decode(ProLoginSuccessResponse.user.loginIp);
        _ProfileGender = ProLoginSuccessResponse.user.base.gender;
        _ProfileDeskId = ProLoginSuccessResponse.user.seat.deskId;

        GEvent.DispatchEvent( GEvent.ProLoginSuccessResponse, ProLoginSuccessResponse );
        GNet.send( "ProGameRoomListNewRequest", { gameId : GConfig.GlobalGameId } );
        // 查询房卡数量
        GNet.send( "ProGetUserPropRequest", { userId : _ProfileID, gameId : GConfig.GlobalGameId } );
        // 日常任务
        GNet.send( "ProNewUserDailyTaskRequest", { userId:_ProfileID, gameId : GConfig.GlobalGameId, taskType:1 } );
        GNet.send( "ProNewUserDailyTaskRequest", { userId:_ProfileID, gameId : GConfig.GlobalGameId, taskType:2 } );
        cc.director.getScheduler().unschedule( SendHeartbeat, cc.director.getScene() );
        cc.director.getScheduler().schedule( SendHeartbeat, cc.director.getScene(), _heartbeatRate );
    });
    GNet.SetAdepter( "ProGameRoomListResponse", ( ProGameRoomListResponse ) => {
        var rooms = ProGameRoomListResponse.room;
        for( var key in rooms )
        {
            if( rooms[key].gameId == GConfig.GlobalGameId )
            {
                GNet.SetDestId( rooms[key].destId );
            }
        }
        GEvent.DispatchEvent( GEvent.ReEnterDesk, _ProfileDeskId );
        if( _ProfileDeskId > -1 )
        {
            GNet.send( "ProGameUserEnterDeskRequest", { userId : _ProfileID, deskId : _ProfileDeskId, playFlag : 0xFFFFFF } );
        }
        else if( _LaunchCheck && _IsWechatGame() )
        {
            var res = wx.getLaunchOptionsSync();
            var num = res.query && res.query.roomID;
            if( num && num > 0 )
            {
                GNet.send( "ProGameUserEnterDeskRequest", {userId:_ProfileID,deskId:Number(num),playFlag:0xFFFFFFFF} );
            }
        
            _LaunchCheck = false;
        }
    });
    // 房卡
    GNet.SetAdepter( "ProGetUserPropResponse", ( ProGetUserPropResponse ) =>{
        _PropInfo = ProGetUserPropResponse.propInfo;
        GEvent.DispatchEvent( GEvent.ProGetUserPropResponse, _PropInfo );
        
    } );
    // 进入游戏
    GNet.SetAdepter( "ProGameUserEnterDeskResponse", ( ProGameUserEnterDeskResponse ) =>{
        _ProfileDeskId = ProGameUserEnterDeskResponse.flagId;
        var nGameType = ProGameUserEnterDeskResponse.bottomCoin;
        if( _RuleConfig )
        {
            GNet.send( _RuleConfigName, _RuleConfig );
            _RuleConfig = null;
        }    
        cc.director.loadScene( GConfig.GetGameScene( nGameType ), null );
    } );
    // 签到任务
    GNet.SetAdepter( "ProNewUserDailyTaskResponse", ( ProNewUserDailyTaskResponse ) =>{
        
    });
    // 加载桌子
    GNet.SetAdepter( "ProGameDeskLaunchResponse", (ProGameDeskLaunchResponse) =>{
        //GNet.send( "ProGameClientReadyRequest", {} );
    } );
    // 错误提示
    GNet.SetAdepter( "ProGetGoldBoxAwardErrorResponse", (ProGetGoldBoxAwardErrorResponse) =>{
        let msgStr = new encoding.TextDecoder("utf-8").decode(ProGetGoldBoxAwardErrorResponse.errorMsg);
        switch (msgStr) {
            case "ROOMCARD NOT ENOUGH":    
                Util.ShowTooltip("房卡不足");               
                break;        
            case "ERROR CARDS":
                Util.ShowTooltip("选择的牌型错误");   
                break;
            case "LESS CARDS":
                Util.ShowTooltip("您的牌太小");   
                break;
            case "YOU MUST OUT CARD":
                Util.ShowTooltip("您必须要出牌");   
                break;
            case "YOU CANT OUT CARD":
                Util.ShowTooltip("您没有能大过上家的牌");   
                break;
            default:
                break;
        }
    } );
    // 用户进入
    // GNet.SetAdepter( "ProGameDeskUserEnterResponse", (ProGameDeskUserEnterResponse) =>{
    // } );
})();

module.exports = {
    // 获取用户信息
    GetProfile(){
        return { nickname:_ProfileNickName, gender:_ProfileGender, user_id:_ProfileID, user_iP:_ProfileIp, avatar_file:_ProfileAvatar_file, secretToken:_ProfileSecretToken,
        address:_ProfileAddress, latitude:_ProfileLatitude, longitude:_ProfileLongitude };
    },
    // 房卡
    GetRoomCard(){
        if( _PropInfo )
        {
            for( var key in _PropInfo )
            {
                if( _PropInfo[key].type == _pb.messages.propType.PROPTYPE_ROOMCARD )
                    return _PropInfo[key].count;
            }
        }
        else
            return 0;
    },
    // 房号
    GetRoomID(){
        return _ProfileDeskId;
    },

    SetSelectGuildID(guildID){
        _guildSelectID = guildID;
    },

    GetSelectGuildID(){
        return _guildSelectID;
    },


    GetGuildInfo: function(){
        return _guildInfo
    },

    SetGuildInfo: function(info){
        _guildInfo = info;
    },

    SetGuildMemberList: function(MemberList){
        _memberList = MemberList;
    },

    getGuildMemberList: function(){
        return _memberList;
    },

    GetGuild: function(guildID){
        for(let i = 0; i < _guildInfo.info.length; i++){
            if(_guildInfo.info[i].organizeId == guildID){
                return _guildInfo.info[i];
            }
        }
        return null;
    },    

    // spawnCreate = nil 普通房 1 替人开房 2 公会房
    SendBuildDesk( nNeedRoomCard, nPlay_flag, nGameType, RuleConfigName, RuleConfig, spawnCreate, guildID ){
        if (spawnCreate == 1)
        {
            GNet.send( "ProBuildDeskByOtherRequest", {
                userId: _ProfileID,
                // bottomCoin:1,
                gameId:GConfig.GlobalGameId,
                needRoomcard:nNeedRoomCard,
                playFlag:nPlay_flag,
                aeraId:nGameType,
                deskSeat:RuleConfig.nPlayerNum,
                ruleFlag:GNet.Encode(RuleConfigName,RuleConfig)
            } );
        }else if (spawnCreate == 2)
        {
            // local guild = UserManager:getUserInfo():getGuildInfo()
            // if not guild then 
            //     TipView:showTip( "您尚未加入公会" )
            //     return
            // end
            var guild = this.GetGuild(guildID);
            GNet.send( "ProBuildDeskOrganizeByRequest", {
                userId: _ProfileID,
                gameId:GConfig.GlobalGameId,
                needRoomcard:nNeedRoomCard,
                playFlag:nPlay_flag,
                aeraId:nGameType,
                deskSeat:RuleConfig.nPlayerNum,
                ruleFlag:GNet.Encode(RuleConfigName,RuleConfig),//scrpt.GetRuleConfig(),//RuleConfig:SerializeToString()
                organizeId:guild.organizeId,//guild.organize_id
                masterUserId:guild.masterId,//guild.master_user
            } );
        }else
        {
            GNet.send( "ProGameUserBuildDeskRequest", {
                userId: _ProfileID,
                bottomCoin:1,
                gameId:GConfig.GlobalGameId,
                needRoomcard:nNeedRoomCard,
                playFlag:nPlay_flag,
                aeraId:nGameType,
                deskSeat:RuleConfig.nPlayerNum,
            } );
            _RuleConfig = RuleConfig;
            _RuleConfigName = RuleConfigName;
        }
    },
    SendRuleConfig(){
        if( _RuleConfig )
        {
            GNet.send( _RuleConfigName, _RuleConfig );
            _RuleConfig = null;
        }
    },
    Share( title, imageUrl, query ){
        if( _IsWechatGame() ){
            wx.shareAppMessage( { title:title, imageUrl:imageUrl, query:query } )
        }
    },
    // 截图分享
    ShareScreenShot( x, y, width, height, title, query ){
        var canvas = cc.game.canvas;
        canvas.toTempFilePath({
            x: x,
            y: y,
            width: width,
            height: height,
            destWidth: width,
            destHeight: height,
            success (res) {
                wx.shareAppMessage({
                    title:title, imageUrl: res.tempFilePath, query:query
                })
            }
        });
    },
    // 返回电量 1-100
    GetBatteryLevel(){
        return _BatteryLevel;
    },
    // 返回网络类型 "wifi", "2g", "3g", "4g", "unknown", "none"
    GetNetworkType(){
        return _NetworkType;
    },
    IsWechatGame: _IsWechatGame,
};