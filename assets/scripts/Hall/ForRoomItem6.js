let GConfig = require("GameConfig");
let encoding = require( "encoding" );
var GNet = require( 'GameNet' );
let GData = require( "GameData");
let Util = require( "Util");

// 玩家离线消息
function UseroffUpdate(ProGetPhoneStatusResponse)
{
    if(ProGetPhoneStatusResponse)
    {
        if (this.param.roomId == ProGetPhoneStatusResponse.roomTag)
        {//如果是该房间
            var useridList = ProGetPhoneStatusResponse.userId;
            var count = useridList.length;
            this.phonestatus = [];
            for (var i = 0;i < count;i++)
            {
                this.phonestatus[i] = ProGetPhoneStatusResponse.phonestatus[i];
            }
            this.refreshOffLine();
        }
    }
};

cc.Class({
    extends: cc.Component,

    properties: {

    },

    OnLoaded (params) {
        // this.startX = params.startX;
        // this.number = params.number;
        // this.roomId = params.roomId;
        // this.roomTag = params.roomTag;
        // this.gameId = params.gameId;
        // this.creat_time = params.creat_time;
        // this.rule = params.rule;
        // this.desk_seat = params.desk_seat;
        // this.user_num = params.user_num;
        // this.nick_name = params.nick_name;
        // this.parent = params.parent;
        // this.game_status = params.game_status;
        // params.user_id

        // 玩家离线状态消息
        GNet.SetAdepter( "ProGetPhoneStatusResponse", UseroffUpdate.bind(this) );

        this.param = params
        var itmHeight = this.node.getContentSize().height;
        var itmWidth = this.node.getContentSize().width;
        if (this.param.number == 0)
        {
            this.node.x = params.startX + itmWidth/2 + 10;
        }else
        {
            this.node.x = params.startX + this.param.number * (itmWidth + 10) + itmWidth/2;
        }
        
        this.node.y = -itmHeight/2;

        this.initLayer();
        if (this.param.game_status == 4)
        {
            this.node.getChildByName("ForRoomTime").getComponent(cc.Label).string = "游戏中";
        }else
        {
            this.updateLeftTimes();
            // 倒计时相关
            this.schedule(this.updateLeftTimes, 1);
        }

         // 是否在线监测
         var profile = GData.GetProfile();
         var master_id = profile.user_id;
         var room_tag = this.param.roomId;
         GNet.send("ProGetPhoneStatusRequest", {userId:master_id,roomTag:room_tag});
    },
    // 刷新玩家离线显示
    refreshOffLine:function()
    {
        if (this.phonestatus)
        {
            for (var k in this.phonestatus)
            {
                var idxx = Number(k) + 1;
                var nodeTemp = this.node.getChildByName("Node_Player" + String(idxx)).getChildByName("OffLine");
                cc.log("nodeTemp.active = " + nodeTemp.active);
                cc.log("this.phonestatus = " + this.phonestatus);
                if (this.phonestatus[k] == 0)
                {
                    nodeTemp.active = false;
                }else
                {
                    nodeTemp.active = true;
                }
            }
        }
    },
    updateLeftTimes:function()
    {
        var date = new Date(); 
        var nowTimes = Math.floor(date.getTime()/1000);
        var difftime = nowTimes - this.param.creat_time;
        var txtTime = Math.floor(900 - difftime);
        var min = Math.floor(txtTime/60).toString();
        while(min.length < 2)
        {
            min = "0" + min;
        }
        var sec = Math.floor(txtTime%60).toString();
        while(sec.length < 2)
        {
            sec = "0" + sec;
        }
        this.node.getChildByName("ForRoomTime").getComponent(cc.Label).string = "(" + min + ":" + sec + ")";
        if (txtTime <= 0)
        {
            this.node.getChildByName("ForRoomTime").getComponent(cc.Label).string = "(" + "00" + ":" + "00" + ")";
            // 请求刷新列表
            if (txtTime == 0)
            {
                this.param.parent.RequestRoomList();
            }
            if (txtTime <= -2)
            {
                this.DissRoom();
            }
        }
    },
    initLayer:function()
    {
        // for (var i = 1;i <= 4;i++)
        // {
        //     this.node.getChildByName("Node_Player" + i).active = false;
        // }
        // 设置房间号
        var sRoomNum = this.param.roomId.toString();
        while(sRoomNum.length < 6)
        {
            sRoomNum = "0" + sRoomNum;
        }
        this.node.getChildByName("ForRoomNum").getComponent(cc.Label).string = sRoomNum;
        // 设置当前房间人数 label
        this.node.getChildByName("ForRoom_CurrentPlayerNumTxt").getComponent(cc.Label).string = "" + this.param.user_num + " / " + this.param.desk_seat;
        // 设置游戏规则等信息
        var gameDef =  require(GConfig.GetGameDefine(this.param.gameId));
        if (this.param.rule)
        {
            if (gameDef.ConfigString)
            {
                var desc = gameDef.ConfigString(this.param.rule,true);
                var title = gameDef.ConfigString(this.param.rule,false);
                this.setRuleTitleStr(title);
                this.setRuleDescriptionStr(desc);
            }else
            {
                var str = "请在游戏的ruleLayer中添加ConfigString方法";
                this.setRuleDescriptionStr(str);
                this.setRuleTitleStr("ERROR");
            }
        }
        // 设置玩家名字
        for (var k = 1;k <= 6;k++)
        {
            if (this.param.nick_name && this.param.nick_name[k-1])
            {
                this.node.getChildByName("Node_Player" + k).active = true;
                this.node.getChildByName("Node_Player" + k).getChildByName("PlayerName").getComponent(cc.Label).string = new encoding.TextDecoder("utf-8").decode(this.param.nick_name[k-1]);
            }
        }
    },
    //邀请按钮回调
    OnForRoom_Invite:function()
    {
        var gameDef =  require(GConfig.GetGameDefine(this.param.gameId));
        var gameStr = this.getGameStr(this.param.gameId);
        var ProGameRuleConfig = gameDef.RuleParseFromString(this.param.rule);
        if (gameDef.ConfigString)
        {
            var desc = gameStr + "玩法:" + gameDef.ConfigString(this.param.rule,true);
            var sRoomNum = this.param.roomId.toString();
            while(sRoomNum.length < 6)
            {
                sRoomNum = "0" + sRoomNum;
            }
            var title = "房号:<" + sRoomNum + ">,";
            title = title + "(" + ProGameRuleConfig.gameRound + ")局," + this.toChinese(this.param.user_num) + "缺" + this.toChinese(this.param.desk_seat - this.param.user_num) + "。"
            
        }
        
    },
    setRuleTitleStr:function(str)
    {
        if (str)
        {
            this.node.getChildByName("ForRoom_DescripTitle").getComponent(cc.Label).string = str;
        }
    },
    setRuleDescriptionStr:function(str)
    {
        if (str)
        {
            this.node.getChildByName("ForRoom_DescripRule").getComponent(cc.Label).string = str;
        }
    },
    tickPlayer1CallBack:function()
    {
        cc.log("tick 1");
        this.TickFun(0);
    },
    tickPlayer2CallBack:function()
    {
        cc.log("tick 2");
        this.TickFun(1);
    },
    tickPlayer3CallBack:function()
    {
        cc.log("tick 3");
        this.TickFun(2);
    },
    tickPlayer4CallBack:function()
    {
        cc.log("tick 4");
        this.TickFun(3);
    },
    tickPlayer5CallBack:function()
    {
        cc.log("tick 5");
        this.TickFun(4);
    },
    tickPlayer6CallBack:function()
    {
        cc.log("tick 6");
        this.TickFun(5);
    },

    TickFun:function(idx)
    {
        var profile = GData.GetProfile();
        var user_id = this.param.user_id[idx];
        var master_id = profile.user_id;
        var room_tag = this.param.roomId;
        GNet.send("ProTickUserByMasterRequest", {userId:user_id,masterId:master_id,roomTag:room_tag});
    },
    //解散按钮回调
    DissRoom:function()
    {
        GNet.send("ProCleanDeskByMaterRequest", {roomTag:this.param.roomId});
    },
    start () {

    },
    getGameStr:function(gameId)
    {
        var s = "";
        if (gameId == 0)
        {
            s = s + "[约逗东乡麻将]"
        }else if(gameId == 1) 
        {
            s = s + "[约逗东乡K十五]"
        }else if(gameId == 2) 
        {
            s = s + "[约逗东乡窟桶]"
        }else if(gameId == 3) 
        {
            s = s + "[约逗东乡翻天]"
        }else if(gameId == 4) 
        {
            s = s + "[约逗东乡斗地主]"
        }
        return s;
    },
    toChinese:function(num)
    {
        if (num == 1)
        {
            return "一";
        }else if (num == 2)
        {
            return "二";
        }else if (num == 3)
        {
            return "三";
        }else if (num == 4)
        {
            return "四";
        }else if (num == 5)
        {
            return "五";
        }else if (num == 6)
        {
            return "六";
        }else if (num == 7)
        {
            return "七";
        }else if (num == 8)
        {
            return "八";
        }else if (num == 9)
        {
            return "九";
        }else if (num == 10)
        {
            return "十";
        }
        return "零";
    },
    // update (dt) {},
});
