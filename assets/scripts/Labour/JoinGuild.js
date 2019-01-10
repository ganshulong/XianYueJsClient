let GEvent = require( "GameEvent" );
let GData = require( "GameData");
let GConfig = require( "GameConfig" );
let GNet = require( 'GameNet' );

cc.Class({
    extends: require("WindowBase"),

    OnLoaded( params ){
        this.params=params;
        this.input1 = this.node.getChildByName("Lable_Input1").getComponent(cc.Label);
        this.input2 = this.node.getChildByName("Lable_Input2").getComponent(cc.Label);
        this.input3 = this.node.getChildByName("Lable_Input3").getComponent(cc.Label);
        this.input4 = this.node.getChildByName("Lable_Input4").getComponent(cc.Label);
        this.input5 = this.node.getChildByName("Lable_Input5").getComponent(cc.Label);
        this.input6 = this.node.getChildByName("Lable_Input6").getComponent(cc.Label);

        this.input1.string = "";
        this.input2.string = "";
        this.input3.string = "";
        this.input4.string = "";
        this.input5.string = "";
        this.input6.string = "";
        this.enterNumber = "";
    },

    EnterNum: function(inputNum){
        var count = this.enterNumber.length;
        if(count >= 6) return;
        this.enterNumber += inputNum;
        this.reFlashNum();
        if(this.enterNumber.length >= 6){
            var profile = GData.GetProfile();
            var id = Number(this.enterNumber);
            GNet.send( "ProApplyJoinOrganizeRequest", {userId: profile.user_id, gameId: GConfig.GlobalGameId, organizeId: id} );
            GNet.send( "ProGetOrganizeInfoRequest", { userId: profile.user_id , gameId: GConfig.GlobalGameId} );
            this.CloseSelf();
        }
    },

    reFlashNum: function(){
        this.input1.string = "";
        this.input2.string = "";
        this.input3.string = "";
        this.input4.string = "";
        this.input5.string = "";
        this.input6.string = "";

        if(this.enterNumber.length >= 1){
            this.input1.string = this.enterNumber[0];
        }

        if(this.enterNumber.length >= 2){
            this.input2.string = this.enterNumber[1];
        }

        if(this.enterNumber.length >= 3){
            this.input3.string = this.enterNumber[2];
        }

        if(this.enterNumber.length >= 4){
            this.input4.string = this.enterNumber[3];
        }

        if(this.enterNumber.length >= 5){
            this.input5.string = this.enterNumber[4];
        }

        if(this.enterNumber.length >= 6){
            this.input6.string = this.enterNumber[5];
        }
    },

    OnButton0: function(event){
        this.EnterNum("0");
    },

    OnButton1: function(event){
        this.EnterNum("1");
    },

    OnButton2: function(event){
        this.EnterNum("2");
    },

    OnButton3: function(event){
        this.EnterNum("3");
    },

    OnButton4: function(event){
        this.EnterNum("4");
    },

    OnButton5: function(event){
        this.EnterNum("5");
    },

    OnButton6: function(event){
        this.EnterNum("6");
    },

    OnButton7: function(event){
        this.EnterNum("7");
    },

    OnButton8: function(event){
        this.EnterNum("8");
    },

    OnButton9: function(event){
        this.EnterNum("9");
    },

    OnCloseBtn: function(event){
        this.CloseSelf();
    },

    //重输
    OnButton_Reinput: function(event){
        this.input1.string = "";
        this.input2.string = "";
        this.input3.string = "";
        this.input4.string = "";
        this.input5.string = "";
        this.input6.string = "";
        this.enterNumber = "";
    },

    //删除
    OnButton_Del: function(event){
        this.enterNumber = this.enterNumber.slice(0, this.enterNumber.length - 1);
        this.reFlashNum();
    }
});
