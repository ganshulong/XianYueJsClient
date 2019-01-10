let GData = require( "GameData");
let GConfig = require("GameConfig");

cc.Class({
    extends: cc.Component,
    OnLoaded: function( params, parent)
    {
        this.params = params;

        var itmHeight = this.node.getContentSize().height;
        var itmWidth = this.node.getContentSize().width;
        var startPosY = params.startY;
        var idx = params.number;

        this.node.x = 0;
        if (idx == 0)
        {
            this.node.y = startPosY - itmHeight/2 - 10;
        }else
        {
            this.node.y = startPosY - idx * (itmHeight + 10) - itmHeight/2
        }
        
        var roomId = String(params.room_id);
        while(roomId.length < 6)
        {
            roomId = "0" + roomId; 
        }
        cc.find("Sprite_Bg/Label_RoomNum", this.node).getComponent(cc.Label).string = roomId;
        cc.find("Sprite_Bg/Label_Time", this.node).getComponent(cc.Label).string=params.datetime;

        var playerNum = params.users.length;
        for (var k = 1;k <= playerNum;k++)
        {
            cc.find("Sprite_Bg/Node_PlayerData/Node_Player" + k, this.node).active = true;
            cc.find("Sprite_Bg/Node_PlayerData/Node_Player" + k + "/Label_Name", this.node).getComponent(cc.Label).string = params.users[k-1].nick_name;
            cc.find("Sprite_Bg/Node_PlayerData/Node_Player" + k + "/Label_Score", this.node).getComponent(cc.Label).string = params.users[k-1].point;
        }
    },

});