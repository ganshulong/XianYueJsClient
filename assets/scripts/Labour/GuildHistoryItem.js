
cc.Class({
    extends: cc.Component,

    onLoad: function(){
        for(let i = 0; i < 5; i++){
            cc.find("player" + i).getComponent(cc.Label).string = "";
            cc.find("ImIDBg" + i).active = false;
            cc.find("ImIDBg" + i + "/player" + i + "ID").getComponent(cc.Label).string = ""; 
            cc.find("player" + i + "_Score").getComponent(cc.Label).string = "";
        }
    },

    UpdateUI: function(data){
        cc.find("Atlas_RoomNum", this.node).getComponent(cc.Label).string = data.room_id; 
        cc.find("Text_Times", this.node).getComponent(cc.Label).string = data.datetime; 

        for(let i = 0; i < data.users.length; i++){
            if(cc.find("player" + i)){
                cc.find("player" + i).getComponent(cc.Label).string = data.users[i].nick_name;
                cc.find("ImIDBg" + i).active = true;
                cc.find("ImIDBg" + i + "/player" + i + "ID").getComponent(cc.Label).string = "ID:" + data.users[i].user_id; 
                cc.find("player" + i + "_Score").getComponent(cc.Label).string = data.users[i].point;
            }
        }
        
        cc.find("player_Card").getComponent(cc.Label).string = data.config_cost_card_nums;
    }
});
