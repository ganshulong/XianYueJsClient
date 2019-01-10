let GData = require( "GameData");
let GConfig = require("GameConfig");

cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( params, parent)
    {
        this.params = params;
        this.parent = parent;
        this.localPlayerIndex = -1;
        cc.find("Sprite_Bg/Label_RoomNum", this.node).getComponent(cc.Label).string=params.room_id;
        cc.find("Sprite_Bg/Label_Time", this.node).getComponent(cc.Label).string=params.datetime;
        cc.find("Sprite_Bg/Label_GameName", this.node).getComponent(cc.Label).string="("+GConfig.GetGameName(params.room_rule)+")";
        for (let index = 0; index < params.users.length; index++) {
            if (GData.GetProfile().user_id==params.users[index].user_id) {
                this.localPlayerIndex = index;
            }

            var nameNode = cc.find("Sprite_Bg/Node_PlayerData/Node_Player" + (index + 1) + "/Label_Name", this.node)
            nameNode.active=true;
            var playerName = params.users[index].nick_name;
            if (playerName.length>5) {
                playerName=playerName.substr(0, 6);
            }
            nameNode.getComponent(cc.Label).string = playerName;
            if (this.localPlayerIndex==index) {
                nameNode.color = new cc.Color(241, 111, 111);
            }

            var scoreNode = cc.find("Sprite_Bg/Node_PlayerData/Node_Player" + (index + 1) + "/Label_Score", this.node)
            scoreNode.active=true;
            scoreNode.getComponent(cc.Label).string = params.users[index].point;
            if (this.localPlayerIndex==index) {
                scoreNode.color = new cc.Color(241, 111, 111);
            }
        }
        for (let index = params.users.length; index < 4; index++) {
            cc.find("Sprite_Bg/Node_PlayerData/Node_Player" + (index + 1), this.node).active = false;
        }
    },
    OnButton_Detail: function()
    {
        var paramsList = {
            roomcard_id: this.params.roomcard_id,
            localPlayerIndex: this.localPlayerIndex,
            room_id: this.params.room_id,
            datetime: this.params.datetime,
            room_rule: this.params.room_rule
        }
        this.parent.ShowDetail(paramsList);
    },
});