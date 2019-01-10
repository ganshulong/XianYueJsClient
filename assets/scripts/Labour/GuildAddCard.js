let GData = require( "GameData");
let GConfig = require( "GameConfig" );
let GNet = require( 'GameNet' );
let encoding = require( "encoding" );

cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function(params){
        this.params = params;
    },

    OnButton_Buy1: function(event){
        this.AddCard(50);
    },

    OnButton_Buy2: function(event){
        this.AddCard(100);
    },

    OnButton_Buy3: function(event){
        this.AddCard(200);
    },

    OnButton_Buy4: function(event){
        this.AddCard(500);
    },

    OnButton_Back: function(event){
        this.CloseSelf();
    },

    AddCard: function(num){
        var guild = GData.GetGuild(this.params.guildID);
        if(!guild){
            return;
        }

        var sureCallBack = function(){
            var ProDealAddRoomCardRequest = {
                userId: guild.masterId,
                organizeId: guild.organizeId,
                count: num,
                type: 0,
                gameId: GConfig.GlobalGameId
            };

            GNet.send( "ProDealAddRoomCardRequest", ProDealAddRoomCardRequest );
        }

        this.OpenWindow("Labour/Guild_CardMove", {GuildName: new encoding.TextDecoder("utf-8").decode(guild.organizeName), CardNums: num, sureCallBack: sureCallBack});
    }
});
