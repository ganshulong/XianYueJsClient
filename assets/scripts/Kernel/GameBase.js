// 游戏公用基类
let GNet = require( 'GameNet' );
let _pb = require( "compiled" );
let encoding = require( "encoding" );
let GEvent = require( "GameEvent" );
let GConfig = require( "GameConfig" );
let GData = require( "GameData");
let Util = require( "Util");
let GDefine = require( "GameDefine" );          //这个Define不是游戏中的Define
let GAudio = require( "GameAudio" );

let RoomUsers = [];
let loadFinished = false;
let ResCache = {};
let ResPrefabs = {};
let TALK_LIST = [];

function OnGameBrokenStatus( data )
{
    var parm = {};
    parm.game = this;
    parm.brokenSeat = data.brokenSeat;
    parm.brokenStatus = [];
    for(let i = 0;i<this.m_PlayerNum;i++){
        parm.brokenStatus.push(data.brokenStatus[i]);
    }

    this.ShowDissRoomLayer(parm);
}

function OnGameBrokenRequest( data )
{
    if (data.type === 0 || data.type === 1){
        this.backToHall();
        return;
    }

    var parm = {};
    parm.game = this;
    parm.brokenSeat = data.seatId;
    parm.brokenStatus = [];
    parm.brokenStatus[data.seatId] = true;

    this.ShowDissRoomLayer(parm);
}

function OnGameBrokenNotify( data )
{
    var operateCode = data.operateCode;
    if(operateCode === 2 || operateCode === 3){
        this.backToHall();
    }else if (operateCode === 0 || operateCode === 1){
        if(this.m_DissRoomLayer){
            this.m_DissRoomLayer.node.removeFromParent();
            delete this.m_DissRoomLayer;
        }

        var seatId = data.seatId;
        var name = this.GetRoomUsers()[seatId].nickName;

        if(operateCode === 0){
            this.ShowTipsLayer({tipsStr:"经玩家<" + name + ">同意，房间解散成功!",type:1});
        }else{
            this.ShowTipsLayer({tipsStr:"由于玩家<" + name + ">拒绝,房间解散失败,游戏继续",type:1});
        }
    }
}

function RecvProQuickSoundResponse( ProQuickSoundResponse )
{
    var iFrom = this.Seat2Local( ProQuickSoundResponse.seatId );
    var iDest = this.Seat2Local( ProQuickSoundResponse.deskId );

    if (ProQuickSoundResponse.soundId < GDefine.SOUND_DEFINED_MAX) {
        this.onDefineTalk( ProQuickSoundResponse.seatId,ProQuickSoundResponse.soundId );
    } else if (ProQuickSoundResponse.soundId < GDefine.SOUND_EMOTION_MAX) {
        this.onEmotion( iFrom,ProQuickSoundResponse.soundId - GDefine.SOUND_DEFINED_MAX );
    } else if (ProQuickSoundResponse.soundId === GDefine.SOUND_TEXT) {
        this.onTextTalk( iFrom,new encoding.TextDecoder("utf-8").decode(ProQuickSoundResponse.text) );
    } else if (ProQuickSoundResponse.soundId === GDefine.SOUND_VOICE) {
        //onUserVoice
    } else if (ProQuickSoundResponse.soundId > GDefine.SOUND_ITEM) {
        this.onUseProp(iFrom, iDest, ProQuickSoundResponse.soundId - GDefine.SOUND_ITEM);
    }
}


// 用户数据
function RecvUserEnter( ProGameDeskUserEnterResponse )
{
    var dwUserID = ProGameDeskUserEnterResponse.user.userId;
    var seatID = ProGameDeskUserEnterResponse.seatId;
    if( dwUserID == GData.GetProfile().user_id )
        this.SetMySeatID( seatID );
    RoomUsers[seatID] = 
    {
        userId : dwUserID,
        nickName : new encoding.TextDecoder("utf-8").decode(ProGameDeskUserEnterResponse.user.base.nickname),
        gender : ProGameDeskUserEnterResponse.user.base.gender,
        avatarFile : new encoding.TextDecoder("utf-8").decode(ProGameDeskUserEnterResponse.user.base.avatarFile) + "?a=a.jpg",
        ip : new encoding.TextDecoder("utf-8").decode(ProGameDeskUserEnterResponse.user.loginIp),
        seatID : seatID,
    };

    this.UpdateUserInfo();
    this.SendMyLocation();
}

function RecvUserLeave( ProGameDeskUserStandUpResponse )
{
    var dwUserID = ProGameDeskUserStandUpResponse.userId;
    var seatID = ProGameDeskUserStandUpResponse.seatId;
    if(!RoomUsers[seatID] || RoomUsers[seatID].userId != dwUserID)return;

    delete RoomUsers[seatID];

    this.UpdateUserInfo();
}

//用户被踢出房间接收消息
function RecvProUserLoginOutRoomNofify( ProUserLoginOutRoomNofify )
{
    var selfUserId = GData.GetProfile().user_id;
    if (selfUserId == ProUserLoginOutRoomNofify.userId)
    {
        this.backToHall();
    }
}

function RecvProUserLocationRequest( ProUserLocationRequest )
{
    for(let id in RoomUsers)
    {
        let user =  RoomUsers[id];
        if(user.userId === ProUserLocationRequest.userId)
        {
            user.dwlongitude = ProUserLocationRequest.dwlongitude;
            user.dwlatitude = ProUserLocationRequest.dwlatitude;
            user.strLocation = new encoding.TextDecoder("utf-8").decode(ProUserLocationRequest.strLocation);
            break;
        } 
    }
}

cc.Class({
    extends: require("WindowBase"),

    // 设置玩家数量
    SetPlayerNum( num )
    {
        this.m_PlayerNum = num;
    },
    // 取得玩家数量
    GetPlayerNum()
    {
        return this.m_PlayerNum;
    },
    // 设置我的座位id
    SetMySeatID( seat_id )
    {
        this.m_MySeat_id = seat_id;
    },
    // 获取我的座位id
    GetMySeatID()
    {
        return this.m_MySeat_id;
    },
    // 服务器的座位id转成客户端座位,自己是0
    Seat2Local( seat_id )
    {
        if(typeof(seat_id)==="string")seat_id = parseInt(seat_id);      //使用 far in 的时候 key会变成string型  这里处理一下

        var SELFLOCALSEAT = 0;
        if( this.m_PlayerNum && this.m_PlayerNum > 0 && this.m_MySeat_id != undefined)
            return (seat_id + this.m_PlayerNum - this.m_MySeat_id ) % this.m_PlayerNum + SELFLOCALSEAT;
        else
            return null;
    },
    // 客户端的位置转成服务器座位id，自己是0
    Local2Seat( local_id )
    {
        var SELFLOCALSEAT = 0;
        if( this.m_PlayerNum && this.m_PlayerNum > 0 && this.m_MySeat_id != undefined)
            return (local_id - SELFLOCALSEAT + this.m_PlayerNum + this.m_MySeat_id ) % this.m_PlayerNum;
        else
            return null;
    },
    //是否是一个有效的座位ID
    IsValidSeatID(seat_id)
    {
        if(seat_id >= 0 && seat_id < this.m_PlayerNum)
        {
            return true;
        }
        return false;
    },
    // 加载场次界面
    LoadPanel( strRes )
    {
        function OnLoadResult( error, perfab )
        {
            if( error )
            {
                cc.error( error.message );
                return;
            }
            this.LoadPrefab(perfab);
            this.LoadPanelFinished();
        };
        cc.loader.loadRes( strRes, OnLoadResult.bind(this) );
    },
    // 加载场次界面(返回节点回调)
    LoadPanelByCallBackN( strRes, callback )
    {
        function OnLoadResult( error, perfab )
        {
            if( error )
            {
                cc.error( error.message );
                return;
            }
            var node = this.LoadPrefab(perfab);
            callback(node)
        };
        cc.loader.loadRes( strRes, OnLoadResult.bind(this) );
    },

    // 加载场次界面(返回预制回调)
    LoadPanelByCallBackP( strRes, callback )
    {
        function OnLoadResult( error, perfab )
        {
            if( error )
            {
                cc.error( error.message );
                return;
            }
            callback(perfab);
        };
        cc.loader.loadRes( strRes, OnLoadResult.bind(this) );
    },

    // 加载结束回调
    LoadPanelFinished()
    {},
    start () {
        GNet.SetAdepter( "ProGameDeskUserEnterResponse", RecvUserEnter.bind(this) );
        
        
        this.Loading();
    },
    LoadFinish(){
        GNet.SetAdepter( "ProGameDeskUserStandUpResponse", RecvUserLeave.bind(this) );
        GNet.SetAdepter( "ProUserLoginOutRoomNofify", RecvProUserLoginOutRoomNofify.bind(this) );
        GNet.SetAdepter( "ProQuickSoundResponse", RecvProQuickSoundResponse.bind(this) );
        GNet.SetAdepter( "ProUserLocationRequest", RecvProUserLocationRequest.bind(this) );

        if( loadFinished )
            GNet.send( "ProGameClientReadyRequest", {} );           //加载完成
        else
        {
            cc.loader.loadResDir( "public/res", cc.SpriteFrame, function( err, assets ){
                // TODO: 保存资源
                for( var key in assets )
                {
                    var keyUrl = assets[key].name;
                    ResCache[keyUrl] = assets[key];
                }
                loadFinished = true;
                GNet.send( "ProGameClientReadyRequest", {} );       //加载完成
            } );
        }     
    },
    Loading()
    {
        cc.log( "重载该函数" );
    },

    // 子类重载刷新界面函数
    UpdateUserInfo()
    {
        //cc.log( "重载该函数" );
    },
    GetRoomUsers()
    {
        return RoomUsers;
    },
    ClearRoomUsers()
    {
        RoomUsers = [];
    },
    GetRoomOnlineNum()
    {   
        let OnLineNum = 0;
        for(j = 0; j < RoomUsers.length; j++) {
            if(RoomUsers[j].userId != 0 ) OnLineNum++;
        } 
        return OnLineNum;
    },
    SendMyLocation()
    {
        var profile = GData.GetProfile();
        GNet.send("ProUserLocationRequest",{
            userId          : RoomUsers[this.m_MySeat_id].userId,
            dwlongitude     : profile.longitude,
            dwlatitude      : profile.latitude,
            strLocation     : profile.address
        });
    },


    update(dt)
    {
        if(!this.m_PhoneStatusDelayTime)this.m_PhoneStatusDelayTime = 15;
        this.m_PhoneStatusDelayTime += dt;
        if(this.Node_PhoneState && this.m_PhoneStatusDelayTime > 15)
        {
            this.m_PhoneStatusDelayTime = 0;

            var parent = this.Node_PhoneState;
            
            //刷新时间
            var myData = new Date();
            var strTime = Util.MytoString(myData.getHours(),2) + ":" + Util.MytoString(myData.getMinutes(),2);
            parent.Label_CurrenTime.getComponent(cc.Label).string = strTime;


            //电池电量
            var battery = GData.GetBatteryLevel();
            parent.Sprite_BatteryBG.Sprite_BatteryItem.setScaleX(battery/100);
            
            //信号
            var NetType = GData.GetNetworkType();
            if(NetType == "4g"){
                parent.Net_Type.wifi.active = false;
                parent.Net_Type.net.active = true;

                parent.Net_Type.net.getComponent(cc.Label).string = "4G";
            }else if(NetType == "3g"){
                parent.Net_Type.wifi.active = false;
                parent.Net_Type.net.active = true;

                parent.Net_Type.net.getComponent(cc.Label).string = "3G";
            }else if(NetType == "2g"){
                parent.Net_Type.wifi.active = false;
                parent.Net_Type.net.active = true;

                parent.Net_Type.net.getComponent(cc.Label).string = "2G";
            }else if(NetType == "wifi"){
                parent.Net_Type.wifi.active = true;
                parent.Net_Type.net.active = false;
            }else{
                parent.Net_Type.wifi.active = false;
                parent.Net_Type.net.active = false;
            }
        }
    },

    //骰子动画
    DiceScenePlay( numLeft,numRight )
    {
        var self = this;
        cc.loader.loadRes("public/Dice/dice",cc.SpriteAtlas,function (err,atlas){
 
            function callback()
            {
                if(self.leftDiceSp){
                    self.leftDiceSp.removeFromParent();
                    self.leftDiceSp = null;
                }
                if(self.rightDiceSp){
                    self.rightDiceSp.removeFromParent();
                    self.rightDiceSp = null;
                }
                self.updateTimer = null;
            }
            if (self.updateTimer){
                Util.Unschedule(self.node,self.updateTimer);
                callback()
            }


            var leftDiceSp = new cc.Node("left");
            leftDiceSp.setScale(1.4);
            leftDiceSp.setPosition(-50,0);
            var leftSp = leftDiceSp.addComponent(cc.Sprite);
            leftSp.sizeMode = cc.Sprite.SizeMode.RAW;
            leftSp.trim = false;
            self.node.addChild(leftDiceSp);

            var framesLeft = [];
            for (var i = 0; i <= 6; i++) {
                framesLeft[i] = atlas.getSpriteFrame("dice" + numLeft + "_" + Util.MytoString(i, 3));
            }

            var clipLeft = cc.AnimationClip.createWithSpriteFrames(framesLeft, 6);
            clipLeft.speed = 2;
            clipLeft.name = "leftDice";
            var animationLeft = leftDiceSp.addComponent(cc.Animation);
            animationLeft.addClip(clipLeft);
            animationLeft.play("leftDice");

            var rightDiceSp = new cc.Node("right");
            rightDiceSp.setScale(1.4);
            rightDiceSp.setPosition(50, 0);
            var rightSp = rightDiceSp.addComponent(cc.Sprite);
            rightSp.sizeMode = cc.Sprite.SizeMode.RAW;
            rightSp.trim = false;
            self.node.addChild(rightDiceSp);

            var framesRight = [];
            for (var i = 0; i <= 6; i++) {
                framesRight[i] = atlas.getSpriteFrame("dice" + numRight + "_" + Util.MytoString(8 + i, 3));
            }

            var clipRight = cc.AnimationClip.createWithSpriteFrames(framesRight, 6);
            clipRight.speed = 2;
            clipRight.name = "rightDice";
            var animationRight = rightDiceSp.addComponent(cc.Animation);
            animationRight.addClip(clipRight);
            animationRight.play("rightDice");


            self.leftDiceSp = leftDiceSp;
            self.rightDiceSp = rightDiceSp;
            self.updateTimer = Util.performWithDelay(self.node,callback,2.5);
        });
    },

    SendLogoutRoom()
    {
        GNet.send("ProGameRoomLogoutRequest",{});
        GNet.send("ProGameDeskUserStandUpRequest",{});
    },

    setBrokenProtoName(request,operate,notify,status)
    {
        this.BrokenProtoNames = {};
        this.BrokenProtoNames.Request = request;
        this.BrokenProtoNames.Operate = operate;
        this.BrokenProtoNames.Notify  = notify;
        this.BrokenProtoNames.Status  = status;

        GNet.SetAdepter( status, OnGameBrokenStatus.bind(this) );
        GNet.SetAdepter( request, OnGameBrokenRequest.bind(this) );
        GNet.SetAdepter( notify, OnGameBrokenNotify.bind(this) );
    },

    QuitRoom()
    {
        var self = this;
        if(self.m_bGameFinalEnd){
            self.backToHall();
            return;
        }

        if(self.m_GameStatus == 5 || self.m_GameCount > 0){
            GNet.send( self.BrokenProtoNames.Request,{seatId:self.m_MySeat_id,type:2} );
        }else{
            //游戏没有开始 创建房间等待开始界面 只有房主能解散房间
            if(self.roomMasterSeat === self.m_MySeat_id){

                self.ShowTipsLayer({tipsStr:"您确定要解散房间吗？",
                    sureCallback: function () {
                        GNet.send(self.BrokenProtoNames.Request, { seatId: self.m_MySeat_id, type: 0 });
                    }
                });

            }else{
                //普通用户退出
                GNet.send( self.BrokenProtoNames.Request,{seatId:self.m_MySeat_id,type:1} );
            }
        }
    },

    ShowDissRoomLayer(param)
    {
        var self = this;
        if(!self.m_DissRoomLayer)
        {
            function loadResult(node)
            {
                node.active = false;
                self.m_DissRoomLayer = node.getComponent("DissRoomLayer");
                self.m_DissRoomLayer.OnLoaded(param);
                self.m_DissRoomLayer.node.setLocalZOrder(800);
            }
            self.LoadPanelByCallBackN("public/DissRoomLayer",loadResult);
        }
        else
        {
            self.m_DissRoomLayer.OnLoaded(param);
        }
    },

    OnSprite_Heads(event)
    {
        var target = event.target;
        var parent = target.getParent();
        var name = parent.name;
        var localSeat = parseInt(name[name.length - 1]);
        
        var SeatId = this.Local2Seat(localSeat);

        var self = this;
        var param = {};
        param.game = self;
        param.user = this.GetRoomUsers()[SeatId];
        param.SeatId = SeatId;

        if(param.user){
            function loadResult(node)
            {
                node.active = false;
                node.setLocalZOrder(500);
                var PlayerInfo = node.getComponent("PlayerInfo");
                PlayerInfo.OnLoaded(param);
            }
    
            if (localSeat === 0) {
                self.LoadPanelByCallBackN("public/PlayerInfoSelf",loadResult);
            }
            else {
                self.LoadPanelByCallBackN("public/PlayerInfo",loadResult);
            }
        }
    },

    setTalkList( list )
    {
        TALK_LIST = list;
    },
    GetTalkList()
    {
        return TALK_LIST;
    },
    onDefineTalk( nSeat,Idx )
    {
        var localSeat = this.Seat2Local( nSeat );

        //播放音效
        if(this.getDefineTalkSound){
            GAudio.PlaySound(this.getDefineTalkSound( nSeat,Idx ));
        }

        //文字
        this.onTextTalk( localSeat,"  " + TALK_LIST[Idx] + "  " )
    },

    onTextTalk( localSeat,text )
    {
        if(!this.Node_Player)return;
        var speekNode = null;
        if (this.Node_Player["Panel_Player"+localSeat]) {
            speekNode = this.Node_Player["Panel_Player"+localSeat].player_speek_bg;
        } else {
            speekNode = this.Node_Player[localSeat].player_speek_bg;
        }
        if(speekNode)
        {
            speekNode.active = true;
            speekNode.Label_Message.getComponent(cc.Label).string = text;
            var size = speekNode.Label_Message.getContentSize();
            speekNode.setContentSize(cc.size(size.width+20,size.height+35));
            var sprite = speekNode.getComponent(cc.Sprite);
            function callback()
            {
                speekNode.active = false;
            }

            Util.performWithDelay(speekNode,callback,3);
        }
    },

    onEmotion( localSeat,Idx )
    {
        if(!this.Node_Player)return;

        var parentNode = null;
        if (this.Node_Player["Panel_Player"+localSeat]) {
            parentNode = this.Node_Player["Panel_Player"+localSeat].Node_Emotion;
        } else {
            parentNode = this.Node_Player[localSeat].Node_Emotion;
        }

        var preFile = "Expression_Anim/EE_Anim"+Idx;

        var self = this;
        function loadEndNode(prefab)
        {
            var node = cc.instantiate( prefab );
            parentNode.addChild( node );
            node.setScale( 1.6 );
            node.getComponent(cc.Animation).play();

            function callback()
            {
                if(node)
                {
                    node.removeFromParent();
                }
            }

            Util.performWithDelay(node,callback,3);
        }
        self.LoadPanelByCallBackP(preFile,loadEndNode);
    },

    onUseProp( from, dest, iPropIdx )
    {
        var self = this;
        var PropList = {
            1:"Chat_Anim/FlowerEnd",
            2:"Chat_Anim/SlipperEnd",
            3:"Chat_Anim/Bomb",
            4:"Chat_Anim/Eggs",
            5:"Chat_Anim/ThumbEnd",
        };
        if(iPropIdx > PropList.length)return;

        var SoundList = {
            1:"resources/sound/daoju/Effect1.mp3",
            2:"resources/sound/daoju/Effect2.mp3",
            3:"resources/sound/daoju/Effect3.mp3",
            4:"resources/sound/daoju/Effect4.mp3",
            5:"resources/sound/daoju/Effect5.mp3",
         }
        //播放音效
        GAudio.PlaySound(SoundList[iPropIdx]);


        var PropListStart = {
            1:"Chat_Anim/FlowerStart",
            5:"Chat_Anim/ThumbStart",
        };


        var srcpos;
        var destpos;
        var srcNode = null;
        if (this.Node_Player["Panel_Player"+from]) {
            srcNode = this.Node_Player["Panel_Player"+from].Node_Emotion;
        } else {
            srcNode = this.Node_Player[from].Node_Emotion;
        }
        if(!srcNode) {
            return;
        }
        var srcpos = srcNode.convertToWorldSpace(cc.p(0,0));
        var destNode = null;
        if (this.Node_Player["Panel_Player"+from]) {
            destNode = this.Node_Player["Panel_Player"+dest].Node_Emotion;
        } else {
            destNode = this.Node_Player[dest].Node_Emotion;
        }
        if(!destNode) {
            return;
        }
        var destpos = destNode.convertToWorldSpace(cc.p(0,0));

        var movesp = {
            1:"daoju1",
            2:"daoju2",
            3:"daoju3",
            4:"daoju4",
            5:"daoju5",
        };

        var img = new cc.Node("daoju");
        img.setPosition(srcpos);
        img.addComponent(cc.Sprite).spriteFrame = ResCache[movesp[iPropIdx]];
        img.active = false;
        this.node.parent.addChild(img);

        function movefinish()
        {
            img.removeFromParent();
            var endFile = PropList[iPropIdx];
            function loadEndNode(prefab)
            {
                var node = cc.instantiate( prefab );
                destNode.addChild( node );

                var animation = node.getComponent(cc.Animation);
                animation.Event_End = function ()
                {
                    node.removeFromParent();
                };

                animation.play();
            }
            self.LoadPanelByCallBackP(endFile,loadEndNode);
        }

        var moveAction = cc.sequence(cc.moveTo(0.7,destpos),cc.callFunc(movefinish));

        // /有些道具有个起始动画
        var startCsdfile = PropListStart[iPropIdx];
        var startNode = null;
        if(startCsdfile){
            function loadStartNode(prefab)
            {
                startNode = cc.instantiate( prefab );
                srcNode.addChild( startNode );

                var animation = startNode.getComponent(cc.Animation);
                animation.Event_Start = function ()
                {
                    startNode.removeFromParent();
                    img.active = true;
                    img.runAction(moveAction);
                };

                animation.play();
            }
            self.LoadPanelByCallBackP(startCsdfile,loadStartNode);
        }else{
            img.active = true;
            img.runAction(moveAction);
            img.runAction(cc.repeatForever(cc.rotateBy(0.5,360)));
        }
    },


    OnButton_Chat()
    {
        var self = this;
        
        if(!self.m_CharNode)
        {
            var param = {};
            param.game = self;

            function loadResult(node)
            {
                node.active = false;
                node.setLocalZOrder(600);
                self.m_CharNode = node.getComponent("Chat");
                self.m_CharNode.OnLoaded(param);
            }
    
            self.LoadPanelByCallBackN("mj/MJChat",loadResult);
        }
        else
        {
            self.m_CharNode.node.active = true;
        }
    },
});