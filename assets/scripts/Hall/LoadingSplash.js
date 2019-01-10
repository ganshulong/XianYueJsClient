let GNet = require( 'GameNet' );
let Util = require( "Util");

cc.Class({
    extends: cc.Component,

    properties: {

    },

    start () {
        var self = this;
            GNet.init( "test.connect.bbwork.cn", 443, ()=>{
            GNet.send( "ProConnectRequest", { connectType: 1 } );
        }, ()=>{
            Util.ShowTooltip( "网络连接断开，正在重新连接" );
        } );
        this.LoadRes();
    },
    LoadRes(){
        var self = this;
        function callback()
        {

            cc.loader.loadResDir( "/", null, function( completedCount, totalCount, item ){
                var loadCtl = cc.find( "Canvas/Loading_Bg/PB_Loading" ).getComponent( cc.ProgressBar ).progress = completedCount / totalCount;
            }, function( error, assets, urls ){
                if( error )
                    self.LoadRes();
                else
                    cc.director.loadScene("Game_Hall/HomeScene");
            } );
        }
        Util.performWithDelay(this.node,callback, 1);// 一次性定时器
    },

    onLoad(){
        cc.game.addPersistRootNode(this.node);
    }

});
