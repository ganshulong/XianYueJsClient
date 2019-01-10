let GNet = require( 'GameNet' );
let GDefine = require( "GameDefine" );

let game = null;

cc.Class({
    extends: require("WindowBase"),


    OnLoaded( params ){
        this.node.active = true;

        game = params.game;
        var user = params.user;
        this.params = params;

        //性别
        if(!user.gender)
        {
            this.man.active = false;
        }else{
            this.woman.active = false;
        }

        this.Text_Name.getComponent(cc.Label).string = user.nickName || "";
        this.Text_IP.getComponent(cc.Label).string = user.ip || "";
        this.Text_Adress.getComponent(cc.Label).string = "位置：" + (user.strLocation || "未知");

        if(this.Img_Head)
        {
            this.LoadUrlImg(this.Img_Head,user.avatarFile);
        }

        var posList = [
            {x:-360,y:-70},
            {x:276,y:27},
            {x:94,y:170},
            {x:-300,y:124},
        ];

        var nSeat = game.Seat2Local(this.params.SeatId);
        if(game.m_PlayerNum != 4 && nSeat === game.m_PlayerNum - 1){
            nSeat++;
        }
        this.node.setPosition(posList[nSeat]);
    },

    prop(idx)
    {
        GNet.send("ProQuickSoundRequest",{
            soundId:GDefine.SOUND_ITEM + idx,
            seatId:game.m_MySeat_id,
            deskId:this.params.SeatId
        });
    },

    Onbtn_prop1()
    {
        this.prop(1);
    },
    Onbtn_prop2()
    {
        this.prop(2);
    },
    Onbtn_prop3()
    {
        this.prop(3);
    },
    Onbtn_prop4()
    {
        this.prop(4);
    },
    Onbtn_prop5()
    {
        this.prop(5);
    },
});