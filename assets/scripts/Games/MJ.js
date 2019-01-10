let GNet = require( 'GameNet' );
let _pb = require( "compiled" );
let GEvent = require( "GameEvent" );
let GConfig = require( "GameConfig" );
let GDefine = require( "MJGameDefine" );
let GData = require( "GameData");
let Util = require( "Util");
let GAudio = require( "GameAudio" );

let RuleConfig = null;

let loadFinished = false;
let ResCache = [];
let ResPrefabs = {};

function OnRecvProMJGameRuleConfig( ProMJGameRuleConfig )
{
    this.m_GameRuleConfig = ProMJGameRuleConfig;
    var num = ProMJGameRuleConfig.nPlayerNum;
    this.SetPlayerNum( num );

    //玩家人数加载初始化
    this.loadPlayerNode(num);
    //加载房间局数
    this.setGameRound(ProMJGameRuleConfig.currentGameCount,ProMJGameRuleConfig.gameRound);
    this.setRoomNum();

    this.ShowKingPanel(ProMJGameRuleConfig.bHaveKing);

    if (this.m_GameStatus === _pb.MJGameState.MJ_GAME_PLAY){
        this.Button_Ready.active = false;
    }

    // 设置房主座位号
    this.roomMasterSeat = ProMJGameRuleConfig.nMasterSeat;

    this.setGameruleLayer(ProMJGameRuleConfig);
}

function OnRecvProMJGameStatusResponse( ProMJGameStatusResponse )
{
    this.m_GameStatus = ProMJGameStatusResponse.status
}

function OnRecvProMJGameStart( ProMJGameStart ) 
{
    //清空数据
    this.m_cbKingData = {};             //上精
    this.m_tbHandCardsInfo = [];        //手牌
    this.m_tbOutCardsInfo = [];         //出牌
    this.m_tbOpearationsInfo = [];      //吃碰杠  
    this.m_KingWaitUserStatus = [];     //精吊状态
    this.m_KingWaitUserHandMahs = [];   //精吊牌精吊牌
    this.m_ReadyState = {};
    this.m_nNowPlayerSeat = 0xFF;

    this.InitLayout();

    if (this.Node_Player) 
    {
        this.m_BankerSeat = ProMJGameStart.bankerseat;
        for (var i = 0; i < this.m_PlayerNum; i++) 
        {
            var panelPlayer = this.Node_Player["Panel_Player" + this.Seat2Local(i)];
            panelPlayer.Sprite_Banker.active = (i === this.m_BankerSeat);        //设置庄
            panelPlayer.Sprite_Ready.active = false;
        }
    } 
    this.setGameRound(ProMJGameStart.gamecount, 0);

    this.m_ShowEndDelayTime = 1;
}

function OnRecvProMJGameReadyResponse( ProMJGameReadyResponse ) 
{  
    if(!this.m_ReadyState)this.m_ReadyState = {};
    this.m_ReadyState[ProMJGameReadyResponse.seat] = true;
    
    if(this.Node_Player)
    {
        var localSeat = this.Seat2Local(ProMJGameReadyResponse.seat);
        if(localSeat!=null)
        this.showReadyState( true,localSeat );
    }
    this.m_LeftCardCount = 0;
    this.UpdateLeftCardCount(this.m_LeftCardCount);
}

function OnRecvProMJGameReadyNotify( ProMJGameReadyNotify ) 
{
    this.Button_Ready.active = true;
}

function OnRecvProMJGameSendMahs( ProMJGameSendMahs ) 
{
    //更新剩余牌数
    this.m_LeftCardCount = ProMJGameSendMahs.cbLeftCount;
    this.UpdateLeftCardCount(this.m_LeftCardCount);

    var localSeat = this.Seat2Local( ProMJGameSendMahs.seat )

    if (this.m_isReplay) 
    {
        
    } 
    else 
    {
        this.m_tbHandCardsInfo = [];
        for (var i = 0; i < this.m_PlayerNum; i++) 
        {
            var kLocalSeat = this.Seat2Local(i);
            this.m_tbHandCardsInfo[kLocalSeat] = [];
            for (var j = 0; j < ProMJGameSendMahs.mahscount[i]; j++) 
            {
                if(localSeat === kLocalSeat)
                {
                    this.m_tbHandCardsInfo[kLocalSeat][j] = ProMJGameSendMahs.mahs[j] || 0;
                }
                else
                {
                    this.m_tbHandCardsInfo[kLocalSeat][j] = 0;
                }
            }
            this.UpdateHandCards(kLocalSeat,this.m_tbHandCardsInfo[kLocalSeat]);
        }
    }
}

function OnRecvProMJGameTimerPower( ProMJGameTimerPower )
{
    var localSeat = this.Seat2Local(ProMJGameTimerPower.seat);

    this.showLight(localSeat,ProMJGameTimerPower.time);
}

function OnRecvProMJGameDiceNotify( ProMJGameDiceNotify )
{
    this.dicecount = ProMJGameDiceNotify.dicecount

    var localSeat = this.Seat2Local( ProMJGameDiceNotify.seat )
    if(localSeat === 0)
    {
        this.Button_Dice.active = true;
    }

    this.showLight( localSeat,ProMJGameDiceNotify.time );
}

function OnRecvProMJGameDiceResult( ProMJGameDiceResult )
{
    // TODO hideClock .
    var left = ProMJGameDiceResult.result[0];
    var right = ProMJGameDiceResult.result[1];
    // 播放掷骰子动画
    this.DiceScenePlay(left,right);

    this.Button_Dice.active = false;
}


function OnRecvProMJGameKingData( ProMJGameKingData )
{
    if(!this.m_cbKingData)this.m_cbKingData = {};
    if(ProMJGameKingData.kingType === _pb.KIGN_TYPE.KING_UP)
    {
        this.m_cbKingData[0] = ProMJGameKingData.mahs[0]
        this.m_cbKingData[1] = this.getKingFromBrother(this.m_cbKingData[0])
        this.setKingCardShow();
        if(this.m_isReplay)
        {    
            for (var i = 0;i<this.m_PlayerNum;i++) 
            {
                this.UpdateHandCards(i,this.m_tbHandCardsInfo[i]) 
            }
        }
        else
        {
            this.UpdateHandCards(0,this.m_tbHandCardsInfo[0]) 
        }
    }
}

function OnRecvProMJGameOutMahsResponse( ProMJGameOutMahsResponse )
{
    var localSeat = this.Seat2Local(ProMJGameOutMahsResponse.seat);
    if(!this.m_tbOutCardsInfo)this.m_tbOutCardsInfo = {};
    if(!this.m_tbOutCardsInfo[localSeat])this.m_tbOutCardsInfo[localSeat] = {};

    this.playCardSoundByOutCards( ProMJGameOutMahsResponse.outMah,ProMJGameOutMahsResponse.seat );

    //添加出牌数据
    this.m_tbOutCardsInfo[localSeat][Util.count(this.m_tbOutCardsInfo[localSeat])] = ProMJGameOutMahsResponse.outMah;

    //刷新出牌指针
    this.UpdateOutCardTip(localSeat);

    //刷新手牌数据
    if(this.m_isReplay)
    {
        this.m_tbHandCardsInfo[localSeat] = [];
        for (var i = 0; i < 14; i++)
        {
            this.m_tbHandCardsInfo[localSeat][i] = ProMJGameOutMahsResponse.handmahs[i];
        }
    }
    else
    {
        if (localSeat === 0)
        {
            this.m_tbHandCardsInfo[localSeat] = [];
            for (var i = 0; i < 14; i++)
            {
                this.m_tbHandCardsInfo[localSeat][i] = ProMJGameOutMahsResponse.handmahs[i];
            }
        }
        else
            delete this.m_tbHandCardsInfo[localSeat][Util.count(this.m_tbHandCardsInfo[localSeat]) - 1];
    }

    this.UpdateHandCards(localSeat,this.m_tbHandCardsInfo[localSeat]);
    this.UpdateOutCards(localSeat,this.m_tbOutCardsInfo[localSeat]);
}

function OnRecvProMJGameCatchCard( ProMJGameCatchCard )
{
    this.ActionBg.active = false;

    var localSeat = this.Seat2Local( ProMJGameCatchCard.seat );
    this.m_tbHandCardsInfo[localSeat][Util.count(this.m_tbHandCardsInfo[localSeat])] = ProMJGameCatchCard.cbCardData;
    this.UpdateHandCards(localSeat,this.m_tbHandCardsInfo[localSeat],{isDontSort:true});


    //更新剩余牌数
    this.m_LeftCardCount = ProMJGameCatchCard.cbLeftCount;
    this.UpdateLeftCardCount(this.m_LeftCardCount);


    if(localSeat === 0 && !this.m_isReplay){
        this.showOperationLayer( ProMJGameCatchCard.wActionMask ,ProMJGameCatchCard.cbCardData,true )
    }
}

function OnRecvProMJGameOperateNotify( ProMJGameOperateNotify )
{
    var localSeat = this.Seat2Local( ProMJGameOperateNotify.operateseat )
    if(localSeat === 0)
    {
        this.showOperationLayer( ProMJGameOperateNotify.ActionMask ,ProMJGameOperateNotify.ActionCard )
    }
}

function OnRecvProMJGameOperateResult(ProMJGameOperateResult) 
{
    var localSeat = this.Seat2Local(ProMJGameOperateResult.wOperateUser);
    if (!this.m_tbOpearationsInfo) this.m_tbOpearationsInfo = {};
    if (!this.m_tbOpearationsInfo[localSeat]) this.m_tbOpearationsInfo[localSeat] = {};

    this.playCardSoundByOperation( ProMJGameOperateResult.wOperateCode,ProMJGameOperateResult.wOperateUser );

    //播放特效
    this.showOperateAction( ProMJGameOperateResult.wOperateCode,localSeat );

    //在有人操作结果的情况下隐藏自己的操作栏 说明别人的操作优先级比较高 我这边已经没用了
    this.ActionBg.active = false;

    var wProvideUser = this.Seat2Local(ProMJGameOperateResult.wProvideUser);
    var operation = {}
    operation.wProvideUser = wProvideUser;
    operation.wOperateCode = ProMJGameOperateResult.wOperateCode;
    operation.cbOperateCard = ProMJGameOperateResult.cbOperateCard;
    //这里防止如果是自己暗杠或者捡杠  先判断下牌是否对的上
    if (operation.wProvideUser == localSeat)   //如果是自己供应用户，就是暗杠或者捡杠
    {
        //如果是捡杠 从自己碰牌里找
        for (var k in this.m_tbOpearationsInfo[localSeat]) {
            var v = this.m_tbOpearationsInfo[localSeat][k];
            if (v.cbOperateCard === operation.cbOperateCard) {
                v.wProvideUser = operation.wProvideUser;
                v.wOperateCode = operation.wOperateCode;
                operation = null;
                break;
            }
        }
        if (operation) operation.isAnGang = true;
    }
    else 
    {
        //如果被吃被碰了 这里要删除供应者的牌
        var lastOutCardSeat = operation.wProvideUser;
        delete this.m_tbOutCardsInfo[lastOutCardSeat][Util.count(this.m_tbOutCardsInfo[lastOutCardSeat]) - 1];
        this.UpdateOutCards(lastOutCardSeat, this.m_tbOutCardsInfo[lastOutCardSeat]);
    }
    if (operation) 
    {
        this.m_tbOpearationsInfo[localSeat][Util.count(this.m_tbOpearationsInfo[localSeat])] = operation;
    }
    this.UpdateOpearationCards(localSeat, this.m_tbOpearationsInfo[localSeat]);

    //刷新手牌
    this.m_tbHandCardsInfo[localSeat] = [];
    for (var i = 0; i < ProMJGameOperateResult.handcount; i++) 
    {
        this.m_tbHandCardsInfo[localSeat][i] = ProMJGameOperateResult.handmahs[i] || 0;
    }
    this.UpdateHandCards(localSeat, this.m_tbHandCardsInfo[localSeat]);
}

function OnRecvProMJGameDataResp( ProMJGameDataResp )
{

}

function OnRecvProMJGameSendDiscardMahs( ProMJGameSendDiscardMahs )
{
    this.m_LeftCardCount = ProMJGameSendDiscardMahs.deskCount;
    this.UpdateLeftCardCount(this.m_LeftCardCount);

    this.m_tbOutCardsInfo = {};
    for (var i = 0; i < this.m_PlayerNum; i++)
    {
        var localSeat = this.Seat2Local(i);
        this.m_tbOutCardsInfo[localSeat] = {};    
        for (var j = 0; j < ProMJGameSendDiscardMahs.cbCardData[i].Mahs.length; j++)
        {
            this.m_tbOutCardsInfo[localSeat][j] = ProMJGameSendDiscardMahs.cbCardData[i].Mahs[j];
        }
        this.UpdateOutCards(localSeat,this.m_tbOutCardsInfo[localSeat]);
    }
}

function OnRecvProMJGameSendActionMahs( ProMJGameSendActionMahs )
{
    this.m_tbOpearationsInfo = {};

    for (var i = 0; i < this.m_PlayerNum; i++)
    {
        var localSeat = this.Seat2Local(i);
        this.m_tbOpearationsInfo[localSeat] = {}
        for(var j in ProMJGameSendActionMahs.weaves[i].items)
        {
            var operation = {};
            var val = ProMJGameSendActionMahs.weaves[i].items[j];
            var wProvideUser = this.Seat2Local( val.provideUser );
            operation.wProvideUser = wProvideUser;
            operation.wOperateCode = val.weaveKind;
            operation.cbOperateCard = val.centercard;
            this.m_tbOpearationsInfo[localSeat][Util.count(this.m_tbOpearationsInfo[localSeat])] = operation;
        }
        this.UpdateOpearationCards( localSeat,this.m_tbOpearationsInfo[localSeat] );
    }
}

function OnRecvProMJGameEnd( ProMJGameEnd )
{
    var self = this;
    this.m_GameEndInfo = ProMJGameEnd;
    this.m_bGameFinalEnd = this.m_GameEndInfo.bRoundEnd;

    var roomUserList = {};
    var roomUsers = this.GetRoomUsers();
    for (var k in roomUsers)
    {
        var vv = roomUsers[k];
        roomUserList[vv.seatID] = vv;
    }

    this.m_KingWaitUserStatus = [];
    this.Button_Dice.active = false;
    this.showLight();

    this.m_tbHandCardsInfo = [];
    for (var i = 0; i < this.m_PlayerNum; i++) 
    {
        //摊牌
        var kLocalSeat = this.Seat2Local(i);
        this.m_tbHandCardsInfo[kLocalSeat] = [];
        for (var j = 0; j < 14; j++)
        {
            this.m_tbHandCardsInfo[kLocalSeat][j] = this.m_GameEndInfo.cbCardData[i].Mahs[j];
        }
        this.UpdateHandCards(kLocalSeat, this.m_tbHandCardsInfo[kLocalSeat], { isShowCard: true, ChiHuCard: ProMJGameEnd.cbChiHuCard });

        //胡牌玩家
        if (this.m_GameEndInfo.dwChiHuKind[i] > GDefine.CHK_NULL)
        {
            this.playCardSoundByOperation( GDefine.WIK_CHI_HU,i );
            this.showOperateAction( GDefine.WIK_CHI_HU,kLocalSeat );
        }
    }

    var parm = {};
    parm.game = this;
    parm.users = roomUserList;

    function callback()
    {
        if(!self.m_ResultLayer)
        {
            function loadResult(node)
            {
                node.active = false;
                self.m_ResultLayer = node.getComponent("ResultLayer");
                self.m_ResultLayer.OnLoaded(parm);
                self.m_ResultLayer.node.setLocalZOrder(290);
            }
            self.LoadPanelByCallBackN("mj/ResultLayer",loadResult);
        }
        else
        {
            self.m_ResultLayer.OnLoaded(parm);
        }
        self.Button_BackSett.active = true;
        //self.UpdatePlayersTotalScore(self.m_GameEndInfo.lAllScore);
        //大结算
        if (self.m_GameEndInfo.bRoundEnd)
        {
            if(!self.m_TotalResultLayer)
            {
                function loadResult(node)
                {
                    node.active = false;
                    self.m_TotalResultLayer = node.getComponent("TotalResultLayer");
                    self.m_TotalResultLayer.OnLoaded(parm);
                    self.m_TotalResultLayer.node.setLocalZOrder(299);
                }
                self.LoadPanelByCallBackN("mj/TotalResultLayer",loadResult);
            }
            else
            {
                self.m_TotalResultLayer.OnLoaded(parm);
            }
            self.Button_BackHall.active = false;
            self.Button_BackSett.active = false;
        }
        else
        {
            self.Button_Ready1.active = true;
        }
    }
    
    Util.performWithDelay(this.node,callback, this.m_ShowEndDelayTime || 0);// 一次性定时器
    this.m_ShowEndDelayTime = 0;
}


function OnRecvProMJGameKingWaitNotify( ProMJGameKingWaitNotify )
{
    this.Button_KingWait.active = true;
    this.Button_GiveUp.active = true;
}
function OnRecvProMJGameKingWaitResponse( ProMJGameKingWaitResponse )
{
    if(!this.m_KingWaitUserStatus)this.m_KingWaitUserStatus = {};

    var localSeat = this.Seat2Local( ProMJGameKingWaitResponse.seat );
    if(ProMJGameKingWaitResponse.isClickKingWait){
        this.m_KingWaitUserStatus[localSeat] = true;

        for (let i = 0; i < ProMJGameKingWaitResponse.mahscount; i++) {
            this.m_tbHandCardsInfo[localSeat][i] = ProMJGameKingWaitResponse.mahs[i];
        }

        this.UpdateHandCards(localSeat,this.m_tbHandCardsInfo[localSeat]);
    }else{
        this.m_KingWaitUserStatus[localSeat] = false;
    }
}


cc.Class({
    extends: require("GameBase"),

    Loading() {
        // 注册网络消息
        GNet.SetAdepter( "ProMJGameRuleConfig", OnRecvProMJGameRuleConfig.bind(this) );             //游戏规则
        GNet.SetAdepter( "ProMJGameStatusResponse", OnRecvProMJGameStatusResponse.bind(this) );     //游戏状态
        GNet.SetAdepter( "ProMJGameStart", OnRecvProMJGameStart.bind(this) );                       //游戏开始
        GNet.SetAdepter( "ProMJGameReadyResponse", OnRecvProMJGameReadyResponse.bind(this) );       //玩家准备
        GNet.SetAdepter( "ProMJGameReadyNotify", OnRecvProMJGameReadyNotify.bind(this) );           //通知准备
        GNet.SetAdepter( "ProMJGameDiceNotify", OnRecvProMJGameDiceNotify.bind(this) );             //通知掷骰子
        GNet.SetAdepter( "ProMJGameDiceResult", OnRecvProMJGameDiceResult.bind(this) );             //骰子结果
        GNet.SetAdepter( "ProMJGameKingData", OnRecvProMJGameKingData.bind(this) );                 //精数据
        GNet.SetAdepter( "ProMJGameSendMahs", OnRecvProMJGameSendMahs.bind(this) );                 //发牌
        GNet.SetAdepter( "ProMJGameTimerPower", OnRecvProMJGameTimerPower.bind(this) );             //操作时间
        GNet.SetAdepter( "ProMJGameOutMahsResponse", OnRecvProMJGameOutMahsResponse.bind(this) );   //玩家出牌
        GNet.SetAdepter( "ProMJGameCatchCard", OnRecvProMJGameCatchCard.bind(this) );               //玩家抓牌
        GNet.SetAdepter( "ProMJGameOperateNotify", OnRecvProMJGameOperateNotify.bind(this) );       //操作通知
        GNet.SetAdepter( "ProMJGameOperateResult", OnRecvProMJGameOperateResult.bind(this) );       //操作回调
        GNet.SetAdepter( "ProMJGameEnd", OnRecvProMJGameEnd.bind(this) );                           //游戏结束

        //重连时的消息
        GNet.SetAdepter( "ProMJGameDataResp", OnRecvProMJGameDataResp.bind(this) );                 //总分？
        GNet.SetAdepter( "ProMJGameSendDiscardMahs", OnRecvProMJGameSendDiscardMahs.bind(this) );   //出牌数据
        GNet.SetAdepter( "ProMJGameSendActionMahs", OnRecvProMJGameSendActionMahs.bind(this) );     //吃碰杠数据

        //精吊
        GNet.SetAdepter( "ProMJGameKingWaitNotify", OnRecvProMJGameKingWaitNotify.bind(this) );
        GNet.SetAdepter( "ProMJGameKingWaitResponse", OnRecvProMJGameKingWaitResponse.bind(this) );

        GAudio.PlayMusic("resources/sound/mj_music.mp3");
        this.InitLayout();

        this.setBrokenProtoName(
            "ProMJGameBrokenRequest",
            "ProMJGameBrokenOperate",
            "ProMJGameBrokenNotify",
            "ProMJGameBrokenStatus"
        );
        this.setTalkList(new Array(
            "不要走啊，打到天亮，赢了就要逃",
            "差点点被你毒死了",
            "打你婆婆舍屎，跟到死，也会打点来吃啊",
            "跟紧打啊，有三秋喔",
            "老板，还吃不",
            "交个朋友，留个联系方式",
            "你睡着了是吗,快出一点牌好不",
            "我输了不要赢回来啊，打通宵",
            "兄弟不好意思，我有事情，等一下过来",
            "一门三张，打到天亮",
            "我多谢你一家人，就是要这张牌，胡啦",
            "这是什么手气，这么差的牌",
            "真是谢谢你哟，你是放了一世的炮",
        ));


        if( loadFinished )
            this.LoadFinish();      // 所有资源加载完成之后再调用
        else
        {
            var self = this;
            cc.loader.loadResDir( "mj/res", cc.SpriteFrame, function( err, assets ){
                // TODO: 保存资源
                for( var key in assets )
                {
                    var keyUrl = assets[key].name;
                    ResCache[keyUrl] = assets[key];
                }


                var PrefabNum = 4;
                var NumIdx = 0;

                function OnLoadResult( error, perfab )
                {
                    if( error )
                    {
                        cc.error( error.message );
                        return;
                    }
                    ResPrefabs[perfab.name] = perfab;
                    if(++NumIdx>=PrefabNum)
                    {
                        loadFinished = true;
                        self.LoadFinish();
                    }
                };
                for (i = 2; i <= 4; i++)
                {
                    cc.loader.loadRes( "mj/Node_"+i+"Player", OnLoadResult.bind(self) );
                }
                cc.loader.loadRes( "mj/ActionCard", OnLoadResult.bind(self) );
            } );
        }

    },




//-----------------------------------------

    InitLayout()
    {
        this.Button_Dice.active = false;
        this.ActionBg.active = false;
        this.ImgPlayerBG.active = false;
        this.Button_Ready1.active = false;    
        this.Button_KingWait.active = false;
        this.Button_BackSett.active = false;
        this.Button_BackHall.active = false;
        this.Button_GiveUp.active = false;

        this.m_LightSeat = undefined;
        
        if (this.m_GameStatus != undefined && _pb.MJGameState.MJ_GAME_IDLE != this.m_GameStatus){
            this.Button_Ready.active = false;
        }

        if(!this.m_isReplay){
            //this.Node_Playback.active = false;
        }
        this.UpdateLeftCardCount();
        this.NodePlayerInit();
        this.setKingCardShow();
        this.showLight();
    },

    NodePlayerInit()
    {
        if(!this.m_tbHandCardsInfo)this.m_tbHandCardsInfo = [];
        if(!this.m_tbOutCardsInfo)this.m_tbOutCardsInfo = [];
        if(!this.m_tbOpearationsInfo)this.m_tbOpearationsInfo = [];
        if(!this.m_KingWaitUserStatus)this.m_KingWaitUserStatus = [];
        for (var i = 0; i < this.m_PlayerNum; i++)
        {
            this.UpdateHandCards(i,this.m_tbHandCardsInfo[i]);
            this.UpdateOutCards(i,this.m_tbOutCardsInfo[i]);
            this.UpdateOpearationCards(i,this.m_tbOpearationsInfo[i]);
        }
    },

    loadPlayerNode(num)
    {
        if(!this.Node_Player && ResPrefabs["Node_"+num+"Player"])
        {
            this.Node_Player = this.LoadPrefab(ResPrefabs["Node_"+num+"Player"],this.NodePlayer);   //this.NodePlayer 用这个来接收 控制显示层级

            //初始化
            for (var i = 0; i < num; i++) 
            {
                var panelPlayer = this.Node_Player["Panel_Player"+i];
                //var panelPlayer = cc.find("Panel_Player"+i,this.Node_Player);
                panelPlayer.Sprite_Master.active = false;
                panelPlayer.Sprite_Banker.active = false;
                panelPlayer.Sprite_Ready.active = false;
                panelPlayer.Sprite_FenBg.Label_Source.getComponent(cc.Label).string = "0";
            }
            this.NodePlayerInit();
            this.UpdateUserInfo();
            this.LoadPlayerNodeFinished();
        }
    },

    //刷新玩家数据信息
    UpdateUserInfo()
    {
        if (this.m_bGameFinalEnd) return;
        if (!this.Node_Player) return;
        var roomUsers = this.GetRoomUsers();
        for (var i = 0; i < this.m_PlayerNum; i++) 
        {
            var localSeat = this.Seat2Local(i);
            var panelPlayer = this.Node_Player["Panel_Player"+localSeat];
            if(panelPlayer)
            {
                if(roomUsers[i])
                {    
                    panelPlayer.Label_PlayerName.getComponent(cc.Label).string = roomUsers[i].nickName;
                    this.LoadUrlImg(panelPlayer.Sprite_Heads,roomUsers[i].avatarFile);
                }
                else
                {
                    panelPlayer.Label_PlayerName.getComponent(cc.Label).string = "";
                    panelPlayer.Sprite_Heads.getComponent(cc.Sprite).spriteFrame = ResCache["head2xM"];
                    panelPlayer.Sprite_Ready.active = false;
                    if(this.m_ReadyState)delete this.m_ReadyState[i];
                }
                panelPlayer.Sprite_Master.active = (i===0);
            }
        }

        if(this.m_PlayerNum && Util.count(roomUsers) >= this.m_PlayerNum)
        {
            this.Button_Copy.active = false;
            this.Button_Invitee.active = false;
        }
        else
        {
            this.Button_Copy.active = true;
            this.Button_Invitee.active = true;
        }
    },

    setRoomNum()
    {
        var sRoomNum = Util.MytoString(GData.GetRoomID(),6);
        this.sRoomNum = sRoomNum;
        cc.find("Canvas/Node_Room/RoomNums").getComponent(cc.Label).string = sRoomNum;
    },

    setGameRound( currentRound, gameRound = 0)
    {
        this.m_GameCount = currentRound;
        if(gameRound != 0)
        {
            this.m_GameRound = gameRound;
        }  
        cc.find("Canvas/Node_Room/GameCount").getComponent(cc.Label).string = currentRound+"/"+this.m_GameRound;
    },

    LoadPlayerNodeFinished()
    {
        //准备消息在规则消息之前 这里重新刷新一遍
        if(this.m_ReadyState)
        {
            for(var i in this.m_ReadyState)
            {
                var localSeat = this.Seat2Local(i);
                this.showReadyState(true, localSeat);
            }
        }

        //给手牌添加触摸事件
        var handcardsPanel = this.Node_Player["Panel_Player" + 0].Node_Cards.handCards_player;
        var num = handcardsPanel.getChildrenCount();
        for (var i = 0; i < num; i++)
        {
            var kCardNode = handcardsPanel["HandCard"+i];
            this.setTouch(kCardNode);
        }
    },
    
    setTouch(card)
    {
        var self = this;
        card.on(cc.Node.EventType.TOUCH_START,function (event){
            if (self.m_GameStatus != _pb.MJGameState.MJ_GAME_PLAY)return;
            var target = event.target;
            self.delta = 0;
            if(!target.m_pos)target.m_pos = target.getPosition();
            if(self.curTouchCard&&self.curTouchCard != target)
            {
                self.curTouchCard.setPosition(self.curTouchCard.m_pos);
                self.curTouchCard = null;
            }
            self.showSameCards(target);
            target.m_oder = target.getLocalZOrder();
        });
        card.on(cc.Node.EventType.TOUCH_MOVE,function (event){  
            if (self.m_GameStatus != _pb.MJGameState.MJ_GAME_PLAY)return;         
            var target = event.target;
            var delta = event.touch.getDelta();
            var pos = target.getPosition();
            target.setPosition(pos.x + delta.x,pos.y + delta.y);

            self.delta += Math.abs(delta.x) + Math.abs(delta.y);
            target.setLocalZOrder(999);
        });
        card.on(cc.Node.EventType.TOUCH_END,function (event){
            if (self.m_GameStatus != _pb.MJGameState.MJ_GAME_PLAY)return;
            var target = event.target;
            target.setLocalZOrder(target.m_oder);
            if(self.delta > 30)
            {
                var curPos = target.getPosition();
                if(curPos.y - target.m_pos.y > 80)
                {
                    self.OnOutCard(target);
                    return;
                }
                target.setPosition(target.m_pos);
                self.curTouchCard = null;
                self.clearSameCards();
            }
            else
            {
                //这里拖动距离小于30  算单击      
                //模拟双击效果
                
                if(!self.oneTouchEnabled)
                {
                    function delOneTouchEnabled()
                    {
                        self.oneTouchEnabled = false;
                    }
                    self.oneTouchEnabled = true;
                    Util.performWithDelay(self.node,delOneTouchEnabled,1);
                }
                else if(self.curTouchCard === target)
                {
                    self.oneTouchEnabled = false;
                    self.OnOutCard(target);
                    return;
                }

                if(self.curTouchCard)
                {
                    self.curTouchCard.setPosition(self.curTouchCard.m_pos);
                    if(self.curTouchCard === target)
                    {
                        self.curTouchCard = null;
                        self.clearSameCards();
                    }
                    else
                    {
                        self.curTouchCard = target;
                        self.curTouchCard.setPosition(self.curTouchCard.m_pos.x,self.curTouchCard.m_pos.y + 30);
                    }
                }
                else
                {
                    self.curTouchCard = target;
                    self.curTouchCard.setPosition(self.curTouchCard.m_pos.x,self.curTouchCard.m_pos.y + 30);
                }
            }
        });

        card.on(cc.Node.EventType.TOUCH_CANCEL,function (event){
            var target = event.target;
            target.setPosition(target.m_pos);
            self.clearSameCards();
        });
    },

    OnOutCard(cardNode)
    {
        //重置数据
        this.curTouchCard = null;
        this.clearSameCards();
        if(!this.m_bCanOutCard)
        {
            cardNode.setPosition(cardNode.m_pos);
            cardNode.setScale(1);
            return;
        }

        var cardData = cardNode.card;
        GNet.send( "ProMJGameOutMahRequest", { seat:this.m_MySeat_id, outMah:cardData } );
        this.ActionBg.active = false;

        
        cardNode.setPosition(cardNode.m_pos);
        cardNode.active = false;

        var self = this;
        function callback()
        {
            cardNode.active = true;
            self.touchTimer = null;
        }
        this.touchTimer = Util.performWithDelay(this.node,callback,2);
    },

//------------------------------------------------------------
//---------------------------------------------------游戏逻辑与界面操作

    getKingFromBrother( kingCard )
    {
        var color = kingCard & 0xF0;
        var value = kingCard & 0x0F;
        if(kingCard > 0x30)
        {
            if(kingCard === 0x34)
                return 0x31;
            else if(kingCard === 0x37)
                return 0x35;
            else
                return kingCard + 1;
        }

        if(value === 9)
         value = 1;
        else
         value++;
        return color | value;
    },

    setKingCardShow()
    {
        var card1 = this.Node_King.Kings1;
        var card2 = this.Node_King.Kings2;
        if(!this.m_cbKingData || this.m_cbKingData.length === 0)
        {
            card1.active = false;
            card2.active = false;
            return;
        }
        this.UpdateCardTexture(card1,this.m_cbKingData[0],2);
        this.UpdateCardTexture(card2,this.m_cbKingData[1],2);
    },

    showReadyState( isShow, nSeat )
    {
        if(this.Node_Player)
        {
            if (_pb.MJGameState.MJ_GAME_IDLE === this.m_GameStatus || this.Node_Player["Panel_Player0"].Sprite_Ready.active){
                var panelPlayer = this.Node_Player["Panel_Player"+nSeat];
                panelPlayer.Sprite_Ready.active = isShow;
            }
            
            if(nSeat === 0)
            {
                if(_pb.MJGameState.MJ_GAME_IDLE === this.m_GameStatus || !this.FirstReady){
                    this.FirstReady = true;
                    this.Button_Ready.active = true;
                    this.Button_Ready.getComponent(cc.Button).interactable = !isShow;
                }else{
                    this.Button_Ready1.active = !isShow;
                    this.Button_BackSett.active = !isShow;
                }

                if(isShow)
                {
                    this.m_cbKingData = {};          //上精
                    this.m_tbHandCardsInfo = {};     //手牌
                    this.m_tbOutCardsInfo = {};      //出牌
                    this.m_tbOpearationsInfo = {};   //吃碰杠 
                    this.m_LeftCardCount = 0;
                    //清理桌面
                    this.InitLayout();
                }

                //清空数据以后再显示准备状态
                for (let i = 0;i<this.m_PlayerNum;i++){
                    var localSeat = this.Seat2Local(i);
                    this.Node_Player["Panel_Player"+localSeat].Sprite_Ready.active = (this.m_ReadyState[i] === true);
                }
            }
        }
    },

    ShowKingPanel(bShow)
    {
        this.Node_King.active = bShow;
    },

    setGameruleLayer(ProMJGameRuleConfig)
    {
        var pannel = this.ImgPlayerBG;
        function setSelected(kNode,isSelect)
        {
            if (isSelect){
                kNode.getComponent(cc.Sprite).spriteFrame = ResCache["select"];
            }else{
                kNode.getComponent(cc.Sprite).spriteFrame = ResCache["unselect"];
            }
        }

        if(ProMJGameRuleConfig.bHaveKing){
            pannel.Node_JingDiao.active = true;
            pannel.Node_FangPao.active = false;
            
            setSelected( pannel.Node_JingDiao.Img_option0,ProMJGameRuleConfig.nPlayerNum === 4 );
            setSelected( pannel.Node_JingDiao.Img_option1,ProMJGameRuleConfig.nPlayerNum === 2 );
            setSelected( pannel.Node_JingDiao.Img_option2,ProMJGameRuleConfig.havePengpeng );
            setSelected( pannel.Node_JingDiao.Img_option3,ProMJGameRuleConfig.haveBaosanqiu );
        }else{
            pannel.Node_JingDiao.active = false;
            pannel.Node_FangPao.active = true;

            setSelected( pannel.Node_FangPao.Img_option0,ProMJGameRuleConfig.nPlayerNum === 4 );
            setSelected( pannel.Node_FangPao.Img_option1,ProMJGameRuleConfig.nPlayerNum === 2 );
            setSelected( pannel.Node_FangPao.Img_option2,ProMJGameRuleConfig.haveSiguiyi );
            setSelected( pannel.Node_FangPao.Img_option3,ProMJGameRuleConfig.haveZhuangjiafanbei );
            
            setSelected( pannel.Node_FangPao.Img_option4,ProMJGameRuleConfig.nJiangMaCounts === 1 );
            setSelected( pannel.Node_FangPao.Img_option5,ProMJGameRuleConfig.nJiangMaCounts === 2 );
            setSelected( pannel.Node_FangPao.Img_option6,ProMJGameRuleConfig.nJiangMaCounts === 4 );
            setSelected( pannel.Node_FangPao.Img_option7,ProMJGameRuleConfig.nJiangMaCounts === 8 );
            setSelected( pannel.Node_FangPao.Img_option8,ProMJGameRuleConfig.nJiangMaCounts === 12 );	
            setSelected( pannel.Node_FangPao.Img_option9,ProMJGameRuleConfig.nJiangMaCounts === 0 );
        }
        pannel.active = true;
    },

    getGameRuleStr( gamerule,isShare = false )
    {
        var GameRuleConfig;
        if (gamerule) {
            GameRuleConfig = gamerule;
        } else if (this.m_GameRuleConfig) {
            GameRuleConfig = this.m_GameRuleConfig;
        } else
            return;

        var gameruleStr = new Array();
        if (GameRuleConfig.bHaveKing){
            gameruleStr.push("精吊玩法");
        }else{
            gameruleStr.push("放炮玩法");
        }

        if(!isShare)
        {
            if (GameRuleConfig.nPlayerNum === 4){
                gameruleStr.push("四人玩法");
            }else if (GameRuleConfig.nPlayerNum === 2){
                gameruleStr.push("二人玩法");
            }
        }

        if (GameRuleConfig.bHaveKing && GameRuleConfig.havePengpeng){
            gameruleStr.push("大七对");
        }

        if (GameRuleConfig.bHaveKing && GameRuleConfig.haveBaosanqiu){
            gameruleStr.push("包三丘");
        }

        if (!GameRuleConfig.bHaveKing){
            if(GameRuleConfig.haveSiguiyi){
                gameruleStr.push("四归一");
            }
            if(GameRuleConfig.haveZhuangjiafanbei){
                gameruleStr.push("庄家翻倍");
            }

            if (GameRuleConfig.nJiangMaCounts === 0){
                gameruleStr.push("不买码");
            }else if (GameRuleConfig.nJiangMaCounts === 1){
                gameruleStr.push("买1码");
            }else if (GameRuleConfig.nJiangMaCounts === 2){
                gameruleStr.push("买2码");
            }else if (GameRuleConfig.nJiangMaCounts === 4){
                gameruleStr.push("买4码");
            }else if (GameRuleConfig.nJiangMaCounts === 8){
                gameruleStr.push("买8码");
            }else if (GameRuleConfig.nJiangMaCounts === 12){
                gameruleStr.push("买12码");
            }
        }
        return gameruleStr;
    },

    UpdateLeftCardCount(nCount)
    {
        if(!nCount)
        {
            nCount = this.m_LeftCardCount || 0;
        }
        this.TotalBg.Text_Total.getComponent(cc.Label).string = "" + nCount;
    },

    OnButton_Pass()
    {
        var parm = {
            seat:this.m_MySeat_id,
            wOperateCode:0,
            cbOperateCard:this.cbActionCardData || 0
        }
        GNet.send( "ProMJGameOperateRequest", parm );

        this.ActionBg.active = false;
    },

    showOperationLayer( wActionMask ,cbCardData ,isCatch = false)
    {
        var self = this;
        if(wActionMask === GDefine.WIK_NULL)return;
        this.cbActionCardData = cbCardData;
        this.ActionBg.active = true;
        var operationPanel = this.ActionBg.ScrollView_Action.view.content;
        operationPanel.removeAllChildren();
        
        function BtnEventClicked(event)
        {
            var btn = event.target;
            var parm = {
                seat:self.m_MySeat_id,
                wOperateCode:btn.kOperateCode,
                cbOperateCard:btn.kOperateCard
            }
            GNet.send( "ProMJGameOperateRequest", parm );


            self.ActionBg.active = false;
        }

        var btn_info = this.getOperationInfoList( wActionMask ,cbCardData ,isCatch );

        var posX = 0;
        var size = operationPanel.getContentSize();
        var dis = 15;
        
        //test
        // for(i = 5;i<8;i++)
        // {
        //     var v = GDefine.OperationList[i];
        //     var key = v.key;
        //     if(!btn_info[key])btn_info[key] = {};
        //     btn_info[key].btn_path = v.path;
        //     btn_info[key].action_cards = this.getOperationCards( key,cbCardData );
        // }

        for(var i in btn_info)
        {
            var val = btn_info[i];
            var key = val.key;
            posX += dis;
            var btn = new cc.Node();
            operationPanel.addChild(btn);
            btn.setAnchorPoint(1, 0.5);
            //key = parseInt(key);                //key作为int存储 取出时莫名变成string型  所以转换一下 智障JS
            btn.kOperateCode = key;
            if (key != GDefine.WIK_GANG)
                btn.kOperateCard = cbCardData;
            else
                btn.kOperateCard = val.action_cards[0] || cbCardData;

            //btn.setPosition(posX, 0);
            btn.addComponent(cc.Sprite).spriteFrame = ResCache[val.btn_path];
            btn.on(cc.Node.EventType.TOUCH_END,BtnEventClicked);
            var btn_size = btn.getContentSize();
            posX += btn_size.width;

            //给操作按钮添加牌型
            if (val.action_cards && Util.count(val.action_cards) > 0)
            {
                var actionCard = cc.instantiate(ResPrefabs["ActionCard"]);
                actionCard.setPosition(-btn_size.width * 0.36,0);
                this.dealChildren(actionCard);
                btn.addChild(actionCard);

                for (var i = 0; i < 4; i++) {
                    var kCardNode = actionCard["card" + i];
                    this.UpdateCardTexture(kCardNode, val.action_cards[i]);
                }
            }
        }

        var scroll_view = this.ActionBg.ScrollView_Action;
        if (posX < 1100) {
            posX = 1100 - dis;          //内容层太小了不行 位置会错乱
        }

        scroll_view.view.content.width = posX + dis - 1;        //内容层比可视层小就滚不动了 
    },

    //获取吃碰杠所有相关类型
    getOperationInfoList(wActionMask,cbCardData,isCatch = false)
    {   
        var operationInfo = {}
        for (var i in GDefine.OperationList) {
        //for (var i = Util.count(GDefine.OperationList) - 1; i >= 0; i--) {
            var v = GDefine.OperationList[i];
            var key = v.key
            if (wActionMask & key) {
                if(isCatch && GDefine.WIK_GANG === key){
                    var cards = this.getMyGangCards(cbCardData);
                    for(let n = 0;n<Util.count(cards);n++){
                        var info = {};
                        info.key = key;
                        info.btn_path = v.path;
                        info.action_cards = this.getOperationCards( key,cards[n] );
                        operationInfo[Util.count(operationInfo)] = info;
                    }
                }
                else
                {
                    var info = {};
                    info.key = key;
                    info.btn_path = v.path;
                    info.action_cards = this.getOperationCards( key,cbCardData );
                    operationInfo[Util.count(operationInfo)] = info;
                }
            }
        }
        return operationInfo;
    },
    
    getMyGangCards(cbCardData)
    {
        var cards = {};

        if(Util.count(cards) === 0){
            cards[0] = cbCardData;
        }
        return cards;
    },

    //获取吃碰杠相关牌
    getOperationCards(wAction, cbCardData) 
    {
        var cards = {}
        if (wAction === GDefine.WIK_GANG) {
            for (var i = 0; i < 4; i++) {
                cards[i] = cbCardData;
            }
        }
        else if (wAction === GDefine.WIK_PENG) {
            for (var i = 0; i < 3; i++) {
                cards[i] = cbCardData;
            }
        }
        else if (wAction === GDefine.WIK_LEFT) {
            cards[0] = cbCardData;
            cards[1] = cbCardData + 1;
            cards[2] = cbCardData + 2;
        }
        else if (wAction === GDefine.WIK_CENTER) {
            cards[0] = cbCardData - 1;
            cards[1] = cbCardData;
            cards[2] = cbCardData + 1;
        }
        else if (wAction === GDefine.WIK_RIGHT) {
            cards[0] = cbCardData - 2;
            cards[1] = cbCardData - 1;
            cards[2] = cbCardData;
        }
        else if (wAction === GDefine.WIK_DNBL) {
            cards[0] = cbCardData;
            cards[1] = cbCardData + 1;
            cards[2] = cbCardData + 3;
        }
        else if (wAction === GDefine.WIK_DNBC) {
            cards[0] = cbCardData - 1;
            cards[1] = cbCardData;
            cards[2] = cbCardData + 2;
        }
        else if (wAction === GDefine.WIK_DNBR) {
            cards[0] = cbCardData - 3;
            cards[1] = cbCardData - 2;
            cards[2] = cbCardData;
        }
        else if (wAction === GDefine.WIK_DXBL) {
            cards[0] = cbCardData;
            cards[1] = cbCardData + 2;
            cards[2] = cbCardData + 3;
        }
        else if (wAction === GDefine.WIK_DXBC) {
            cards[0] = cbCardData - 2;
            cards[1] = cbCardData;
            cards[2] = cbCardData + 1;
        }
        else if (wAction === GDefine.WIK_DXBR) {
            cards[0] = cbCardData - 3;
            cards[1] = cbCardData - 1;
            cards[2] = cbCardData;
        }

        return cards;
    },



    UpdateOpearationCards(nSeat,tbOpearationsInfo)
    {
        var kOpearations = {}
        if (tbOpearationsInfo) kOpearations = tbOpearationsInfo;
        var parent = this.Node_Player["Panel_Player" + nSeat].Node_Cards.playCards_player;
        var num = parent.getChildrenCount();

        for (var i = 0; i < num; i++) {
            var playCards = parent["Play_Cards" + i];
            if (kOpearations[i]) {
                playCards.active = true;
                var cards = this.getOperationCards(kOpearations[i].wOperateCode, kOpearations[i].cbOperateCard);

                for (var j = 0; j < 4; j++) {
                    var kCardNode = playCards["PlayCard" + j];
                    this.UpdateCardTexture(kCardNode, cards[j]);
                    if (j === 2 && kCardNode.Brand) {
                        this.setOpearationDirection(kCardNode.Brand, nSeat, kOpearations[i].wProvideUser);
                    }
                    var isShow = 1;     //1表示打开
                    if (kOpearations[i].isAnGang) {
                        if (j < 3 || nSeat != 0) {
                            isShow = 2;          //2表示盖着
                        }
                    }

                    kCardNode.getComponent(cc.Sprite).spriteFrame = ResCache[this.getCardPathBySeat(2, nSeat, isShow)];
                    if (kCardNode.Brand) kCardNode.Brand.active = (isShow === 1);
                }
            }
            else
                playCards.active = false;
        }
    },

    //目前只有吃碰杠牌用到
    // nCardType 0 手牌  1 出牌  2 吃碰杠牌         isShow  1 打开 2 盖着
    getCardPathBySeat( nCardType, nSeat , isShow )
    {
        var nCardPathList;
        if (nCardType === 0){
            nCardPathList = {
                1:new Array(
                    "outcard_bg",
                    "outcard_bg_left",
                    "outcard_partner",
                    "outcard_bg_left",
                ),
                2:new Array(
                    "outcard_back",
                    "outcard_back_left",
                    "barcard_bg",
                    "outcard_back_left",
                )
            };
        }else if (nCardType === 2){
            nCardPathList = {
                1:new Array(
                    "outcard_bg",
                    "outcard_bg_left",
                    "outcard_partner",
                    "outcard_bg_left",
                ),
                2:new Array(
                    "outcard_back",
                    "outcard_back_left",
                    "barcard_bg",
                    "outcard_back_left",
                )
            };
        }

        if(this.m_PlayerNum != 4 && nSeat === this.m_PlayerNum - 1){
            nSeat++;
        }

        return nCardPathList[isShow][nSeat];
    },

    setOpearationDirection( Brand,nSeat,wProvideUser )
    {
        if (!Brand.directionSprite){
            Brand.directionSprite = new cc.Node("directionSprite");
            Brand.directionSprite.setScale(1.5);
            Brand.directionSprite.addComponent(cc.Sprite).spriteFrame = ResCache["arrow"];
            Brand.directionSprite.setPosition(17,21);
            Brand.addChild(Brand.directionSprite);
        }

        //direction 以玩家位置来定义 以0为自己 1为右边 2为对面 3为左边
        var direction = 0;
        direction = (wProvideUser - nSeat + 4) % 4;
        if (this.m_PlayerNum != 4 && wProvideUser != nSeat){
            if(wProvideUser === this.m_PlayerNum - 1){
                direction = (direction + 1) % 4;
            }
            if (nSeat === this.m_PlayerNum - 1){
                direction = (direction - 1 + 4) % 4;
            }
        }

        //--目前UI默认对着正上方  
        var angel = 180;        //先默认对着自己 旋转180
        angel = (angel + 360 - direction * 90) % 360;
        Brand.directionSprite.setRotation(angel);
    },

    UpdateOutCards(nSeat,tbOutCardsInfo)
    {
        var kCardsInfo = {}
        if(tbOutCardsInfo)kCardsInfo = tbOutCardsInfo;
        var parent = this.Node_Player["Panel_Player"+nSeat].Node_Cards.outCards_player;
        var num = parent.getChildrenCount();
        for (var i = 0; i < num; i++)
        {
            var kCardNode = parent["OutCard"+i];
            this.UpdateCardTexture(kCardNode,kCardsInfo[i]);
        }
    },

    UpdateHandCards( nSeat, tbHandCardsInfo, args = {}, isNotSave = false )
    {
        if(this.Node_Player)
        {
            //移除出牌动画
            if(this.touchTimer){
                Util.Unschedule(this.node,this.touchTimer);
                this.touchTimer = null;
            }
            //重置点击牌的效果
            if (nSeat === 0){
                this.curTouchCard = null;   
                this.clearSameCards();
            }

            var kCardsInfo = new Array();
            if (tbHandCardsInfo) kCardsInfo = tbHandCardsInfo;
            Util.resetArr(kCardsInfo);


            //排序  把精牌放在最左边
            if (!args.isDontSort) 
            {
                var kingCard = new Array(0,0);
                if (this.m_cbKingData){
                    var i = 0;
                    while (i < kCardsInfo.length){
                        if(kCardsInfo[i] === this.m_cbKingData[0]){
                            kingCard[0]++;
                            Util.remove(kCardsInfo,i);
                        }else if (kCardsInfo[i] === this.m_cbKingData[1]){
                            kingCard[1]++;
                            Util.remove(kCardsInfo,i);
                        }else{
                            i++;
                        }
                    }
                }
                Util.sort(kCardsInfo);

                if(this.m_cbKingData){
                    for(let i = 0;i < kingCard[1];i++){
                        kCardsInfo.splice(0,0,this.m_cbKingData[1]);
                    }
                    for(let i = 0;i < kingCard[0];i++){
                        kCardsInfo.splice(0,0,this.m_cbKingData[0]);
                    }
                }
            }

            if(typeof(args.ChiHuCard) === "number" && args.isShowCard && Util.count(kCardsInfo) % 3 != 1){
                for (let i = 0; i < kCardsInfo.length; i++) {
                    if(kCardsInfo[i] === args.ChiHuCard){
                        Util.remove(kCardsInfo,i);
                        kCardsInfo.push(args.ChiHuCard);
                        break;
                    }
                }
            }

            var parent;
            var jingType = 0;
            if(this.m_isReplay || args.isShowCard || this.m_KingWaitUserStatus[nSeat]){
                parent = this.Node_Player["Panel_Player" + nSeat].Node_Cards.showCards_player;

                parent.active = true;
                this.Node_Player["Panel_Player" + nSeat].Node_Cards.handCards_player.active = false;
                jingType = 0;

                //重置精吊盖着的牌
                for (var i = 1; i < parent.getChildrenCount(); i++){
                    let kCardNode = parent["HandCard" + i];
                    kCardNode.getComponent(cc.Sprite).spriteFrame = ResCache[this.getCardPathBySeat(0, nSeat, 1)];
                    if (kCardNode.Brand) kCardNode.Brand.active = true;
                }             
            }else{
                parent = this.Node_Player["Panel_Player" + nSeat].Node_Cards.handCards_player;

                parent.active = true;
                this.Node_Player["Panel_Player" + nSeat].Node_Cards.showCards_player.active = false;
                jingType = 1;
            }
             
            var startPoint = 0;
            var idx = Util.count(kCardsInfo) - 1;
            if(Util.count(kCardsInfo) % 3 === 1)
            {
                startPoint++;
                parent["HandCard0"].active = false;

                if (nSeat === 0)
                    this.m_bCanOutCard = false;
            }
            else if(nSeat === 0)
            {
                this.m_bCanOutCard = true;
            }

            var num = parent.getChildrenCount();
            for (var i = startPoint; i < num; i++)
            {

                //奇葩精吊需求
                if (this.m_KingWaitUserStatus[nSeat]) {
                    if (nSeat === 0) {          
                        if(i === 0){
                            parent = this.Node_Player["Panel_Player" + nSeat].Node_Cards.handCards_player;

                            parent.active = true;
                            jingType = 1;

                            for (let j = 1; j < num; j++) {
                                parent["HandCard"+j].active = false;
                            }

                        }else{
                            parent = this.Node_Player["Panel_Player" + nSeat].Node_Cards.showCards_player;

                            parent.active = true;
                            jingType = 0;
                            parent["HandCard0"].active = false;
                        }
                    } else if (i != 0) {
                        let kCardNode = parent["HandCard" + i];
                        kCardNode.getComponent(cc.Sprite).spriteFrame = ResCache[this.getCardPathBySeat(0, nSeat, 2)];
                        if (kCardNode.Brand) kCardNode.Brand.active = false;
                    }
                }

                var kCardNode = parent["HandCard"+i];
                this.UpdateCardTexture(kCardNode,kCardsInfo[idx--],jingType);

                if (nSeat === 0 && kCardNode.m_pos)
                    kCardNode.setPosition(kCardNode.m_pos);
            }
        }
    },

    //0 是默认 1 是手牌 精的位置需要上移一点  2是不显示  比如左上角
    UpdateCardTexture( kCardNode,kCardData = undefined,jingType = 0)
    {
        if (!kCardNode) return;
        if (kCardData != undefined && kCardData != null)
        {
            kCardNode.card = kCardData;
            kCardNode.active = true;
        }
        else
        {
            kCardNode.card = null;
            kCardNode.active = false;
            return;
        }
        var brand = kCardNode.Brand;
        if (!brand) return;
        var path = "";
        var color = kCardData >> 4;
        var value = kCardData & 0x0F;
        if(color === 0)
            path = "wan" + value;
        else if(color === 1)
            path = "tiao" + value;
        else if(color === 2)
            path = "tong" + value;
        else if(color === 3)
            path = "zi" + value;
             
        brand.getComponent(cc.Sprite).spriteFrame = ResCache[path];
        
        if(brand.jing)brand.jing.active = false;
        if(this.m_cbKingData && (this.m_cbKingData[0] === kCardData || this.m_cbKingData[1] === kCardData))
        {
            if(jingType === 2)return;
            if(!brand.jing)
            {
                brand.jing = new cc.Node("jing");
                brand.addChild(brand.jing);
                brand.jing.setAnchorPoint(0,1);
                if(jingType === 0)
                {
                    brand.jing.setPosition(-41.5,47.5);                 //坐标是直接在编辑器上试出来的 懒得算了
                }else{
                    brand.jing.setPosition(-41.5,61); 
                }
                
                var sp = brand.jing.addComponent(cc.Sprite);   
                sp.spriteFrame = ResCache["jing"];
            }
            brand.jing.active = true;
        }
    },

    UpdateOutCardTip(localSeat)
    {
        if (this.m_OutCardSprite){
            this.m_OutCardSprite.removeFromParent();
            delete this.m_OutCardSprite;
        }

        if (this.m_tbOutCardsInfo && this.m_tbOutCardsInfo[localSeat]) {
            var pannel = this.Node_Player;
            var idx = Util.count(this.m_tbOutCardsInfo[localSeat]);
            if (idx === 0) return;
            var lastOutCard = this.Node_Player["Panel_Player" + localSeat].Node_Cards.outCards_player["OutCard" + (idx - 1)];
            this.m_OutCardSprite = new cc.Node("NodeTips");
            this.m_OutCardSprite.addComponent(cc.Sprite).spriteFrame = ResCache["mah_arrow"];

            var moveDown2 = cc.moveBy(0.5,cc.p(0,20));
            this.m_OutCardSprite.runAction(cc.repeatForever(cc.sequence(moveDown2.reverse(),moveDown2)));
            this.m_OutCardSprite.setPosition(0,50);
            lastOutCard.addChild(this.m_OutCardSprite);
        }
    },

    showSameCards( cardNode )
    {      
        this.clearSameCards();
        if (!cardNode || !cardNode.card)return;
        var cbCardData = cardNode.card;

        var self = this;
        var panel = this.Node_Player;
        function showSameMask( kCardNode )
        {
            kCardNode.m_color = kCardNode.getColor();
            kCardNode.setColor( new cc.Color(160,200,240) );
            if(!self.m_SameCardMaskList)self.m_SameCardMaskList = new Array();
            self.m_SameCardMaskList.push(kCardNode);
        }

        //手牌
        var handPanel = panel["Panel_Player0"].Node_Cards.handCards_player;
        for (let j = 0; j < handPanel.getChildrenCount(); j++) {
            var kCardNode = handPanel["HandCard" + j];
            if (kCardNode && kCardNode.card && kCardNode.Brand && kCardNode.Brand.active) {
                if (kCardNode.card === cbCardData) {
                    showSameMask(kCardNode);
                }
            }
        }

        for (let i = 0; i < this.m_PlayerNum; i++) {
            //出的牌
            var playPanel = panel["Panel_Player"+i].Node_Cards.outCards_player;
            for (let j = 0; j < playPanel.getChildrenCount(); j++) {
                var kCardNode = playPanel["OutCard" + j];
                if (kCardNode && kCardNode.card && kCardNode.Brand && kCardNode.Brand.active) {
                    if (kCardNode.card === cbCardData) {
                        showSameMask(kCardNode);
                    }
                }
            }

            var opearationPanel = panel["Panel_Player" + i].Node_Cards.playCards_player;
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    var kCardNode = opearationPanel["Play_Cards" + j]["PlayCard" + k];
                    if (kCardNode && kCardNode.card && kCardNode.Brand && kCardNode.Brand.active) {
                        if (kCardNode.card === cbCardData) {
                            showSameMask(kCardNode);
                        }
                    }
                }
            }
        }
    },
    clearSameCards()
    {
        if(!this.m_SameCardMaskList)return;
        for(var i in this.m_SameCardMaskList){
            var kCardNode = this.m_SameCardMaskList[i];
            kCardNode.setColor(kCardNode.m_color);
        }
        delete this.m_SameCardMaskList;
    },

    showLight( nSeat = -1 ,nTime = 0 )
    {
        var self = this;
        var pannel = this.Panel_Center;
        function getLightPath( local_seat,isLight )
        {
            var path = ""
            
            if(local_seat === 0){
                path += "nan";
            }
            else if(local_seat === 1){
                path += "dong";
            }
            else if(local_seat === 2){
                path += "bei";
            }
            else if(local_seat === 3){
                path += "xi";
            }
            if(isLight){
                path += "bg";
            }else{
                path += "1";
            }
            return path;
        }

        for(let i = 0;i<4;i++){
            pannel["player" + i].getComponent(cc.Sprite).spriteFrame = ResCache[getLightPath(i,false)];
            if(this.Node_Player && this.Node_Player["Panel_Player"+i]){
                this.Node_Player["Panel_Player"+i].Anim_CutDown.active = false;
            }
        }

        if(nSeat != -1){
            if(this.Node_Player && this.Node_Player["Panel_Player"+nSeat]){
                this.Node_Player["Panel_Player"+nSeat].Anim_CutDown.active = true;
            }
            if(this.m_PlayerNum != 4 && nSeat === this.m_PlayerNum - 1){
                nSeat++;
            }
            pannel["player" + nSeat].getComponent(cc.Sprite).spriteFrame = ResCache[getLightPath(nSeat,true)];
        }
            

        if(nTime > 0){
            self.m_DickTime = nTime;
            pannel.AtlasTimers.getComponent(cc.Label).string = self.m_DickTime;
            if(!self.timers){
                function callback(){
                    if(self.m_DickTime > 0){
                        self.m_DickTime--;
                        pannel.AtlasTimers.getComponent(cc.Label).string = self.m_DickTime;
                    }
                }
                self.timers = Util.MySchedule(self.node,callback,1)
            }
        }
    },

    showOperateAction( nType,localSeat )
    {
        if(!this.Node_Player)return;
        if(!nType)return;

        var panel = this.Node_Player["Panel_Player"+localSeat].Node_Action;
        if(!panel)return;

        var path = ""

        if(nType === GDefine.WIK_PENG){
            path+="peng";
        }else if(nType === GDefine.WIK_GANG){
            path+="gang";
        }else if(nType === GDefine.WIK_CHI_HU){
            path+="hu";
        }else{
            path+="chi";
        }

        if(!panel.actionImg){
            panel.actionImg = {};

            panel.actionImg[1] = new cc.Node();
            panel.actionImg[1].addComponent(cc.Sprite);
            panel.addChild(panel.actionImg[1],1);

            panel.actionImg[2] = new cc.Node();
            panel.actionImg[2].addComponent(cc.Sprite);
            panel.addChild(panel.actionImg[2],1);
        }

        panel.actionImg[1].getComponent(cc.Sprite).spriteFrame = ResCache[path + ""];
        panel.actionImg[2].getComponent(cc.Sprite).spriteFrame = ResCache[path + "_2"];

        panel.active = true;
        function callback()
        {
            panel.active = false;
        }

        var scaleto1 = cc.scaleTo(0.2,1.5);
        var scaleto2 = cc.scaleTo(0.7,1);

        panel.actionImg[2].runAction(cc.sequence(scaleto1,scaleto2,cc.callFunc(callback)));
    },

    getDefineTalkSound( nSeat,Idx )
    {
        var path = "resources/mj/sound/"

        var users = this.GetRoomUsers();
        if (users && users[nSeat] && !users[nSeat].gender){
            path += "female/chat/";
        }else{
            path += "male/chat/";
        }

        return path + "chat_" + (Idx + 1) + ".mp3";
    },

    playCardSoundByOutCards( kCardData,nSeat )
    {
        var path = "resources/mj/sound/"

        var users = this.GetRoomUsers();
        if (users && users[nSeat] && !users[nSeat].gender){
            path += "female/";
        }else{
            path += "male/";
        }

        //1 普通话 2 方言
        if (true){//(type === 1){
            path += "putong/card/";
        }else{
            path += "fangyan/card/";
        }

        var color = kCardData >> 4;
        var value = kCardData & 0x0F;

        if(color === 0){
            path += "wan_";
        }else if(color === 1){
            path += "tiao_";
        }else if(color === 2){
            path += "tong_";
        }else if(color === 3){
            path += "zi_";
        }

        path = path + value + ".mp3";
        GAudio.PlaySound(path);
    },
    playCardSoundByOperation( nSoundType,nSeat )
    {
        var path = "resources/mj/sound/"

        var users = this.GetRoomUsers();
        if (users && users[nSeat] && !users[nSeat].gender){
            path += "female/";
        }else{
            path += "male/";
        }

        //1 普通话 2 方言
        if (true){//(type === 1){
            path += "putong/";
        }else{
            path += "fangyan/";
        }

        if(nSoundType === GDefine.WIK_PENG){
            path += "peng_";
        }else if(nSoundType === GDefine.WIK_GANG){
            path += "gang_";
        }else if(nSoundType === GDefine.WIK_CHI_HU){
            path += "hu_";
        }else{
            path += "chi_";
        }

        var num = Math.ceil(Math.random()*2);
        path = path + num + ".mp3";
        GAudio.PlaySound(path);
    },

//----------------------------------------------------------------

    LoadPanelFinished()
    {
        //cc.log("LoadPanelFinished");
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
    OnButton_Plays()
    {
        this.ImgPlayerBG.active = !this.ImgPlayerBG.active;
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
    OnButton_Invitee()
    {
        var title = "[东乡麻将]";// + "测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限测试显示的字数上限";
        title += this.m_PlayerNum + "人场,";
        if(this.m_GameRuleConfig.bHaveKing){
            title += "精吊玩法.";
        }else{
            title += "放炮玩法.";
        }

        title += "房号:<" + Util.MytoString(GData.GetRoomID()) + ">";
        var imageUrl = GConfig.ShareImgURL;
        var query = "roomID=" + GData.GetRoomID();
        GData.Share(title,imageUrl,query);
    },
    OnButton_Copy()
    {
        //复制房号
        var title = "[东乡麻将]";
        title += this.m_PlayerNum + "人场. ";
        title += "房号:<" + Util.MytoString(GData.GetRoomID()) + "> ";
        
        var ruleContent = "";

        //规则信息
        let gameruleStr = this.getGameRuleStr(null,true);
        for (let i = 0; i < gameruleStr.length; i++) {
            ruleContent += gameruleStr[i];
            if(i === gameruleStr.length - 1){
                ruleContent += ".";
            }else{
                ruleContent += ",";
            }
        }

        Util.SetClipboardStr(title + ruleContent);
    },
    OnButton_Ready()
    {
        GNet.send( "ProMJGameReadyRequest", {} );
    },
    OnButton_Dice()
    {
        GNet.send( "ProMJGameDiceRequest", {dicecount:this.dicecount || 0} );
    },
    OnButton_Ready1()
    {
        this.OnButton_Ready();
    },
    OnButton_BackSett()
    {
        if (this.m_ResultLayer){
            this.m_ResultLayer.node.active = true;
        }
    },
    OnButton_BackHall()
    {
        this.backToHall();
    },
    OnButton_KingWait()
    {
        this.Button_KingWait.active = false;
        this.Button_GiveUp.active = false;

        GNet.send( "ProMJGameKingWaitRequest", {isClickKingWait:true,seatId:this.m_MySeat_id} );
        this.m_KingWaitUserStatus[0] = true;
    },
    OnButton_GiveUp()
    {
        this.Button_KingWait.active = false;
        this.Button_GiveUp.active = false;

        GNet.send( "ProMJGameKingWaitRequest", {isClickKingWait:false,seatId:this.m_MySeat_id} );
        this.m_KingWaitUserStatus[0] = false;
    },
    Onplayer_mask_btn()
    {
        this.ImgPlayerBG.active = !this.ImgPlayerBG.active;
    },
});
