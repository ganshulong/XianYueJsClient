let GNet = require( 'GameNet' );
let GData = require( "GameData");
let GConfig = require( "GameConfig" );

cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function(params){
        this.params=params;

        this.NameInput = cc.find("Text_GuildName", this.node).getComponent(cc.Label);
        this.NameInput.string = params.nickName;
    },

    OnButton_OK: function(event){
        var profile = GData.GetProfile();
        var ProDealOrganizeMemberRequest = {
            dealUserId: this.params.userId,
            userId: profile.user_id,
            gameId: GConfig.GlobalGameId,
            dealType: 2,
            organizeId: this.params.organizeId
        };

        GNet.send( "ProDealOrganizeMemberRequest", ProDealOrganizeMemberRequest );

        this.params.MemberReqFun(this.params.organizeId);

        this.CloseSelf();
    },

    OnButton_Cancel: function(event){
        this.CloseSelf();
    }
});
