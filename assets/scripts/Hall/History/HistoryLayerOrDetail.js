let GData = require( "GameData");
let GConfig = require("GameConfig");
let Util = require( "Util");

cc.Class({
    extends: require("WindowBase"),
    
    properties: {
    },

    OnLoaded: function( params ){
        var tempThis = this;
        var parentNode = cc.find("Node_Layer/ScrollView_History/view/content", this.node);

        var xhr = new XMLHttpRequest();
        //xhr.responseType="json";
        xhr.open("POST", GConfig.HttpRequesAddress + "/new/ncmj_inning_log/");
        xhr.onreadystatechange = function () {
            cc.log("test 19 xhr.status:"+xhr.status)
            if (xhr.readyState == 4 && xhr.status == 200) {
                cc.log("test 21 xhr.responseText:"+xhr.responseText)
                cc.find("Node_Layer", tempThis.node).active = true;
                cc.find("Node_Detail", tempThis.node).active = false;
                parentNode.removeAllChildren();
                //设置大局数据
                var historyData = JSON.parse(xhr.responseText);
                parentNode.height = 160 * historyData.length + 10;
                if (historyData.length<=0) {
                    cc.find("Node_Layer/Label_NoHistoryTip", tempThis.node).active = true;
                } else {
                    cc.find("Node_Layer/Label_NoHistoryTip", tempThis.node).active = false;
                    cc.loader.loadRes( "History/Node_HistoryItem", function( error, perfab ) {
                        for (let index = 0; index < historyData.length; index++) {
                            var newNode = cc.instantiate( perfab );
                            parentNode.addChild( newNode );
                            newNode.setPositionY(90 - (index+1)*170);
                            var sc = newNode.getComponent(cc.Component);
                            if( sc && sc.OnLoaded && historyData[index])
                            {
                                sc.OnLoaded(historyData[index], tempThis);
                            }
                        }
                    });
                }
            }
        };
        var userId = GData.GetProfile().user_id;
        if (!userId) {
            userId = 10049797;
        }
        var paramsList = {user_id:userId, game_id:GConfig.GlobalGameId,secretToken:GData.GetProfile().secretToken};
        var paramStr = Util.GetMd5EncryptStr(paramsList);
        xhr.send(paramStr);
        cc.log("test 54 paramStr:"+paramStr)
    },
    AddHistoryItem( newNodeName, offset, params, parentNode ){
        cc.loader.loadRes( newNodeName, function( error, perfab ) {
            var newNode = cc.instantiate( perfab );
            parentNode.addChild( newNode );
            newNode.setPositionY(offset);

            var sc = newNode.getComponent(cc.Component);
            if( sc && sc.OnLoaded && params)
            {
                sc.OnLoaded(params);
            }
        });
    },
    ShowDetail: function(paramsList){
        var tempThis = this;
        var parentNode = cc.find("Node_Detail/ScrollView_Detail/view/content", this.node);
        var tempParamsList = paramsList;

        var xhr = new XMLHttpRequest();
        //xhr.responseType="json";
        xhr.open("POST", GConfig.HttpRequesAddress + "/v1/game_inning_record/get/");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                cc.find("Node_Layer", tempThis.node).active = false;
                cc.find("Node_Detail", tempThis.node).active = true;
                parentNode.removeAllChildren();
                //设置小局数据
                var historyData = JSON.parse(xhr.responseText);
                parentNode.height = 50 * historyData.length + 10;
                cc.loader.loadRes( "History/Node_HistoryDetail", function( error, perfab ) {
                    for (let index = 0; index < historyData.length; index++) {
                        if (0==index) {
                            cc.find("Node_Detail/Sprite_DetailBg/Label_RoomNum", tempThis.node).getComponent(cc.Label).string = tempParamsList.room_id;
                            cc.find("Node_Detail/Sprite_DetailBg/Label_Time", tempThis.node).getComponent(cc.Label).string = tempParamsList.datetime;
                            cc.find("Node_Detail/Sprite_DetailBg/Label_GameName", tempThis.node).getComponent(cc.Label).string="("+GConfig.GetGameName(tempParamsList.room_rule)+")";
                            for (let playerIndex = 0; playerIndex < historyData[0].users.length; playerIndex++) {
                                var nameNode = cc.find("Node_Detail/Sprite_DetailBg/Label_PlayerName" + (playerIndex + 1), tempThis.node);
                                nameNode.active=true;
                                var playerName = historyData[0].users[playerIndex].nick_name;
                                if (playerName.length>5) {
                                    playerName=playerName.substr(0, 6);
                                }
                                nameNode.getComponent(cc.Label).string = playerName;
                                if (tempParamsList.localPlayerIndex==playerIndex) {
                                    nameNode.color = new cc.Color(223, 120, 82);
                                }
                                else{
                                    nameNode.color = new cc.Color(145, 89, 42);
                                }
                            }
                            for (let playerIndex = historyData[0].users.length; playerIndex < 4; playerIndex++) {
                                cc.find("Node_Detail/Sprite_DetailBg/Label_PlayerName" + (playerIndex + 1), tempThis.node).active = false;
                            }
                        }
                    
                        var newNode = cc.instantiate( perfab );
                        parentNode.addChild( newNode );
                        newNode.setPositionY(20 -(index+1)*50);
                        if (1==index%2) {
                            cc.find("Sprite_Bg", newNode).active=false;
                        }
                        var sc = newNode.getComponent(cc.Component);
                        if( sc && sc.OnLoaded && historyData[index])
                        {
                            sc.OnLoaded(historyData[index], tempThis, tempParamsList.localPlayerIndex);
                        }
                    }
                });
            }
        };
        var userId = GData.GetProfile().user_id;
        if (!userId) {
            userId = 10049797;
        }
        var paramsList = {user_id:userId, game_id:GConfig.GlobalGameId, roomcard_id:paramsList.roomcard_id,secretToken:GData.GetProfile().secretToken};
        var paramStr = Util.GetMd5EncryptStr(paramsList);
        xhr.send(paramStr);
    },
    OnButton_Back: function(){   
        cc.find("Node_Layer", this.node).active=true;
        cc.find("Node_Detail", this.node).active =false;
    },
    OnButton_CheckOthersReplay: function(){   
        this.OpenWindow( "History/Node_CheckOthersReplay", "test params" );
    },
    OnButton_Close: function(){   
        this.CloseSelf();
    },
});