let GNet = require( 'GameNet' );
let GData = require( "GameData");
let GConfig = require("GameConfig");
let selectPosX = -20;
let selectTxtPosX = -2;
cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( params )
    {
        this.params = params;
        this.AddGames( GConfig.GetGames() );
        this.SelectGame( 0 );
    },

    SelectGame: function( nGame )
    {
        var cont = cc.find( "Sprite_CreateBg/SView_items/view/content", this.node );
        for( var key in cont.children )
        {
            if( cont.children[key].gameID == nGame )
            {
                cont.children[key].getComponent( cc.Button ).interactable = false;
                cont.children[key].x = selectPosX+ 13;
                cont.children[key].getChildByName( "New Label" ).color = new cc.Color(255, 252, 235);
                cont.children[key].getChildByName( "New Label" ).x = selectTxtPosX - 13;
            }
            else
            {
                cont.children[key].getComponent( cc.Button ).interactable = true;
                cont.children[key].x = selectPosX ;
                cont.children[key].getChildByName( "New Label" ).color = new cc.Color(186, 89, 0);
                cont.children[key].getChildByName( "New Label" ).x = selectTxtPosX;
            }
        }
        var ruleNode = cc.find( "Sprite_CreateBg/Node_Rules", this.node );
        ruleNode.removeAllChildren();
        this.OpenWindow( GConfig.GetRuleScene( nGame ), null, ruleNode );
    },

    AddGames: function( Games )
    {
        var template = this.node.getChildByName( "Button_Item" );
        var cont = cc.find( "Sprite_CreateBg/SView_items/view/content", this.node );
        var self = this;
        var i = 0;
        Games.forEach( function(e)
        {
            var btn = cc.instantiate( template );
            btn.active = true;
            cont.addChild( btn );
            btn.setPosition( -20, -btn.height * (0.5 + i) - 8 * (i + 1) );
            btn.getChildByName( "New Label" ).getComponent(cc.Label).string = e.GameName;
            btn.gameID = e.GameID;
            btn.on( 'touchend', function(){
                this.SelectGame( e.GameID );
            }, self );
            i++;
        } );
    },

    OnButton_Readys: function( event )
    {
        //cc.director.loadScene( "Game_Stage/MJ/GameScene", null );//Node_CreateRoom/
        var nod = cc.find("Sprite_CreateBg/Node_Rules",this.node);
        var ruleNode = nod.children[0];
        var scrpt = undefined;
        //var profile = GData.GetProfile();
        scrpt = ruleNode.getComponent(cc.Component);
        
        if (scrpt != undefined)
        {// spawnCreate = nil 普通房 1 替人开房 2 公会房
            if (this.params.spawnCreate === 3 && this.params.setGuildRule)
            {
                var rule_flag = GNet.Encode(scrpt.GetRuleConfigName(),scrpt.GetRuleConfig());
                this.params.setGuildRule(scrpt.GetGameType(),rule_flag);
            }else{
                GData.SendBuildDesk( scrpt.GetNeedRoomCard(), scrpt.GetPlayFlag(), scrpt.GetGameType(), scrpt.GetRuleConfigName(), 
                    scrpt.GetRuleConfig(), this.params.spawnCreate, this.params.guildID );
            }
        }

        if (this.params.spawnCreate)
        {
            this.OnButton_Close();
        }
    },
    OnButton_Close: function( event )
    {
        if (this.params.RequestRoomList)
        {
            this.params.RequestRoomList();
        }
        this.CloseSelf();
    }
});
