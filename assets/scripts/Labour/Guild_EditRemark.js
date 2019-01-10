let GNet = require( 'GameNet' );
let GData = require( "GameData");
let GConfig = require( "GameConfig" );

cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function(params){
        this.params=params;

        this.NameInput = cc.find("minbg/InputBg/Input_TextField", this.node).getComponent(cc.EditBox);
        this.NameInput.string = params.otherName;
    },

    OnButton_Clear: function(event){
        this.NameInput.string = "";
    },

    OnButton_OK: function(event){
        var profile = GData.GetProfile();
        var ProDealOrganizeMemberRequest = {
            dealUserId: this.params.userId,
            userId: profile.user_id,
            gameId: GConfig.GlobalGameId,
            dealType: 3,
            organizeId: this.params.organizeId,
            otherName: this.NameInput.string
        };

        GNet.send( "ProDealOrganizeMemberRequest", ProDealOrganizeMemberRequest );
        if(this.params.comNode){
            if(this.NameInput.string.length != 0){
                this.params.comNode.SetRemarkName("(" + this.NameInput.string + ")");
            }else{
                this.params.comNode.SetRemarkName("");
            }
        }
        this.CloseSelf();
    }

});
