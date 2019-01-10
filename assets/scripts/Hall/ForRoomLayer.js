let GData = require( "GameData");
let GNet = require( 'GameNet' );
let GConfig = require("GameConfig");
let Util = require( "Util");

// 刷新开房列表
function RoomListUpdate(ProBuildByOtherDeskListResponse)
{
    var room_info = ProBuildByOtherDeskListResponse.roomInfo;
    for (var i in room_info)
    {
        this.m_RoomList[i] = room_info[i];
    }

    this.Refresh();
}
// 解散成功消息
function RecvCleanDeskResponse(ProCleanDeskByMaterResponse)
{
    if (ProCleanDeskByMaterResponse.result == 0)
    {//解散成功
        this.RequestRoomList();
    }else
    {//解散失败

    }
};
// 踢人成功消息
function TickRespons(ProTickUserByMasterResponse)
{
    if (ProTickUserByMasterResponse)
    {
        if (ProTickUserByMasterResponse.result == 0)//成功
        {
            Util.ShowTooltip("踢人成功!");
            this.RequestRoomList();
        }else if (ProTickUserByMasterResponse.result == 1)
        {
            //点击解散房间也会进来!!!!
        }
    }
};




cc.Class({
    extends: require("WindowBase"),

    properties: {

    },

    // onLoad () {},
    OnLoaded: function( params )
    {
        this.m_RoomList = [];
        GNet.SetAdepter( "ProBuildByOtherDeskListResponse", RoomListUpdate.bind(this) );
        // 接收解散成功的消息
        GNet.SetAdepter( "ProCleanDeskByMaterResponse", RecvCleanDeskResponse.bind(this) );
        // 替人成功消息
        GNet.SetAdepter( "ProTickUserByMasterResponse", TickRespons.bind(this) );
        

        this.RequestRoomList();
        this.schedule(this.RequestRoomList,15);
    },
    //替人开房按钮回调
    OnForRoomBtn:function()
    {
        this.OpenWindow( "Hall/Node_CreateRoom", {spawnCreate:1,RequestRoomList:this.RequestRoomList});
    },
    //请求代开房的列表
    RequestRoomList:function()
    {
        this.m_RoomList = [];
        var profile = GData.GetProfile();
        var GameList = GConfig.GetGames();
        for (var k in GameList)
        {
            var gameId = GameList[k].GameID;
            GNet.send( "ProBuildByOtherDeskListRequest", {userId:profile.user_id,gameId:Number(GConfig.GlobalGameId),aeraId:gameId} );
        }

    },
    Refresh:function()
    {
        var itemCount = this.m_RoomList.length;
        if (itemCount > 0)
        {
            this.node.getChildByName("ForRoom_TipsLabel").active = false;
        }else
        {
            this.node.getChildByName("ForRoom_TipsLabel").active = true;
        }
        var roomLisTemp = this.m_RoomList;
        var self = this;
        var scrollContent = this.node.getChildByName("ForRoomScrollView").getChildByName("view").getChildByName("content");
        scrollContent.removeAllChildren();
        var tempItem = this.node.getChildByName("ItemTemp");
        var scrolMaxWidth = scrollContent.getContentSize().width;
        var nowTotalWidth = itemCount*(tempItem.width + 10);
        if (nowTotalWidth > scrolMaxWidth)
        {
            scrolMaxWidth = nowTotalWidth;
        }
        scrollContent.width = scrolMaxWidth;
        var startPosX = -scrolMaxWidth/2;
        var scrolHeight = scrollContent.getContentSize().height;
        var idx = 0;
       // for (var i = 0;i<itemCount;i++)
        for (var k in roomLisTemp)
        {
            // 加载 Prefab
           // cc.loader.loadRes( "Node_ForRoomItem4", OnLoadResult.bind(self) );
           var params = {startX:startPosX,number:k,roomId:roomLisTemp[k].roomTag,gameId:roomLisTemp[k].aeraId,creat_time:roomLisTemp[k].creatTime,rule:roomLisTemp[k].ruleFlag,desk_seat:roomLisTemp[k].deskSeat,user_num:roomLisTemp[k].userNum,nick_name:roomLisTemp[k].nickName,parent:self,game_status:roomLisTemp[k].gameStatus,user_id:roomLisTemp[k].userId};
           cc.log("roomLisTemp[" + k + "].deskSeat = " + roomLisTemp[k].deskSeat);
        //    if (roomLisTemp[k].deskSeat <= 4)
        //    {
              this.OpenWindow("Hall/Node_ForRoomItem4",params,scrollContent);
        //    }else
        //    {
        //       this.OpenWindow("Hall/Node_ForRoomItem6",params,scrollContent);
        //    }
        }
        this.node.getChildByName("ForRoomScrollView").getComponent(cc.ScrollView).scrollToLeft(0.1);
    },
    
    start () {

    },
    //查看历史记录按钮回调
    OnForRoomHistoryBtn:function()
    {
        var xhr = new XMLHttpRequest();
        var self = this;
        //xhr.responseType="json";
        xhr.open("POST", GConfig.HttpRequesAddress + "/new/ncmj_inning_master_log/");
        // xhr.open("POST", "http://test.connect.jxxykj.cn:5000/" + "new/ncmj_inning_master_log/");
        xhr.onreadystatechange = function () {
           cc.log("ForRoomHistory Post Response");
           if (xhr.readyState == 4 && xhr.status == 200) {
                var result = JSON.parse(xhr.responseText);
                cc.log("ForRoomHistory Post Succuss xhr.responseText = " + xhr.responseText);
                cc.log("ForRoomHistory Post Succuss xhr.response = " + xhr.response);
                
                if (result.length<=0) {
                 //       Util.ShowTooltip("result.length = " + result.length);
                        cc.log("ForRoomHistory Post Fild");
                }else
                {
                    //cc.log("ForRoomHistory Post Fild result.length = " + result.length);
                    // cc.log(" result.length = " + result.length);
                    // cc.log(" result.room_id = " + result.room_id);
                    // cc.log(" result[k].room_id = " + result[k].room_id);
                    cc.log("result.length = " + result.length);
                }
                self.OpenWindow("Hall/Node_ForRoomHistory",result,self.node);
          }
        };
        var userId = GData.GetProfile().user_id;
        var secretTokentmp = GData.GetProfile().secretToken;
        var paramsList = {game_id:GConfig.GlobalGameId, master_user_id:userId,record_type:1,secretToken:secretTokentmp};
        var paramStr = Util.GetMd5EncryptStr(paramsList);
        xhr.send(paramStr);
        
    },
    OnForRoom_CloseBtn:function()
    {
        this.unschedule(this.RequestRoomList);
        this.CloseSelf();
    },
    // update (dt) {},
});
