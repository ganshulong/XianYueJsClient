var GNet = require( 'GameNet' )
let GData = require( "GameData");

cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( params )
    {
        this.enterNumber = [];
    },
    num1:function() {
        this.enterNum("1");
    },
    num2:function() {
        this.enterNum("2");
    },
    num3:function() {
        this.enterNum("3");
    },
    num4:function() {
        this.enterNum("4");
    },
    num5:function() {
        this.enterNum("5");
    },
    num6:function() {
        this.enterNum("6");
    },
    num7:function() {
        this.enterNum("7");
    },
    num8:function() {
        this.enterNum("8");
    },
    num9:function() {
        this.enterNum("9");
    },
    num0:function() {
        this.enterNum("0");
    },
    OnCloseBtn:function(){
        this.CloseSelf();
    },
    resetNum:function() {
        this.clearNums();
        this.enterNumber.length = 0;
    },
    deletNum:function() {
        if (this.enterNumber.length > 0)
        {
            this.enterNumber.length = this.enterNumber.length - 1;
        }
        this.reFlashNum();
    },
    clearNums:function(){
        for (i = 1;i <= 6;i++)
        {
            this.node.getChildByName("Lable_Input" + i).getComponent(cc.Label).string = "";
        }
    },
    reFlashNum:function(){
        this.clearNums();
        if (this.enterNumber.length >= 1)
        {
            this.node.getChildByName("Lable_Input1").getComponent(cc.Label).string = this.enterNumber[0];
        }
        if (this.enterNumber.length >= 2)
        {
            this.node.getChildByName("Lable_Input2").getComponent(cc.Label).string = this.enterNumber[1];
        }
        if (this.enterNumber.length >= 3)
        {
            this.node.getChildByName("Lable_Input3").getComponent(cc.Label).string = this.enterNumber[2];
        }
        if (this.enterNumber.length >= 4)
        {
            this.node.getChildByName("Lable_Input4").getComponent(cc.Label).string = this.enterNumber[3];
        }
        if (this.enterNumber.length >= 5)
        {
            this.node.getChildByName("Lable_Input5").getComponent(cc.Label).string = this.enterNumber[4];
        }
        if (this.enterNumber.length >= 6)
        {
            this.node.getChildByName("Lable_Input6").getComponent(cc.Label).string = this.enterNumber[5];
        }
    },
    enterNum:function(inputnum) {
        var count = this.enterNumber.length;
        if (count >= 6)
        {
            return;
        } 
        this.enterNumber.push(inputnum);
        var num = "";
        for (var i = 0;i < this.enterNumber.length;i++)
        {
            num = num + this.enterNumber[i];
        }

        this.reFlashNum();

        if (this.enterNumber.length >= 6)
        {
            cc.log("EnterRoomNumber!!!!!!!!!!!!!")
            var profile = GData.GetProfile();
            GNet.send( "ProGameUserEnterDeskRequest", {userId:profile.user_id,deskId:Number(num),playFlag:0xFFFFFFFF} );
        }

    },
});
