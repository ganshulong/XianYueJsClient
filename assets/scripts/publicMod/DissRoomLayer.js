let game = null;
let Util = require( "Util");
let GNet = require( 'GameNet' );

cc.Class({
    extends: require("WindowBase"),

    
    OnLoaded( params ){
        this.params=params;
        game = this.params.game;

        this.Init();
    },

    Init()
    {
        this.node.active = true;

        //解散状态
        var brokenStatus = this.params.brokenStatus;
        var users = game.GetRoomUsers();
        for (let i = 0; i < 6; i++) {
            var panel = this["Panel_Player" + i];
            if(panel){
                if(users[i]){
                    panel.active = true;
                    this.setStatus(i,brokenStatus[i]);

                    panel.Text_PlayerName.getComponent(cc.Label).string = users[i].nickName;
                }else{
                    panel.active = false;
                }
            }
        }

        if(brokenStatus[game.m_MySeat_id]){
            this.btn_agree.active = false;
            this.btn_disagree.active = false;
        }

        //解散发起者名字
        if(users[this.params.brokenSeat]){
            this.Text_BrokenName.getComponent(cc.Label).string = users[this.params.brokenSeat].nickName;
        }



        //倒计时
        this.TimeCount = this.params.time || 120;
        this.Text_Time.getComponent(cc.Label).string = this.TimeCount + "秒后自动同意";

        if(!this.Timers){
            var self = this;
            function callback()
            {
                self.TimeCount--;
                self.Text_Time.getComponent(cc.Label).string = self.TimeCount + "秒后自动同意";
            }
            this.Timers = Util.MySchedule(this.node,callback,1);
        }
    },

    setStatus( idx,status )
    {
        var panel = this["Panel_Player" + idx];
        panel.agree.active = false;
        panel.wait.active = false;
        panel.disagree.active = false;
        if(status){
            panel.agree.active = true;
        }else{
            panel.wait.active = true;
        }
    },

    Onbtn_agree()
    {
        GNet.send(game.BrokenProtoNames.Operate,{seatId:game.m_MySeat_id,result:1});
    },
    Onbtn_disagree()
    {
        GNet.send(game.BrokenProtoNames.Operate,{seatId:game.m_MySeat_id,result:0});
    },
});