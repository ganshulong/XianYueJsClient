let GData = require( "GameData");
let GConfig = require("GameConfig");
let Util = require( "Util");

cc.Class({
    extends: require("WindowBase"),

    properties: {

    },

    OnLoaded: function(){
        if( false /*cc.sys.browserType == cc.sys.BROWSER_TYPE_WECHAT_GAME*/ )
        {
            var self = this
            var secretTokentmp = GData.GetProfile().secretToken;
            var paramsList = {user_id:GData.GetProfile().user_id, game_id:GConfig.GlobalGameId,secretToken:secretTokentmp};
            var paramStr = Util.GetMd5EncryptStr(paramsList);
            wx.request( {
                url:GConfig.HttpRequesAddress + "/new/pop_up_activity/",
                method:"POST",
                data:paramStr,
                success: function( res ){
                    for (const key in res.data) {
                        const childObject = res.data[key];
                        cc.log( res.data );
                        Util.ShowTooltip( childObject );
                        if (childObject.img_url) {
                            self.LoadUrlImg( cc.find("Sprite_GongGaoRequest", self.node), childObject.img_url + "?a=a.jpg" );
                            break;
                        }
                    }
                },
                fail: function( res ){
                    var msg = "";
                    for( const key in res )
                    {
                        msg += res[key];
                    }
                    Util.ShowTooltip( "fail123 " + msg );
                },
            } );
        }
        else
        {

            var self = this
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.open("POST", GConfig.HttpRequesAddress + "/new/pop_up_activity/");
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    //设置公告图片
                    var parentObject = JSON.parse(xhr.responseText);
                    for (const key in parentObject) {
                        const childObject = parentObject[key];
                        if (childObject.img_url) {
                            self.LoadUrlImg( cc.find("Sprite_GongGao", self.node), childObject.img_url + "?a=a.jpg" );
                            break;
                        }
                    }
                }
            };
            var paramsList = {user_id:GData.GetProfile().user_id, game_id:GConfig.GlobalGameId,secretToken:GData.GetProfile().secretToken};
            var paramStr = Util.GetMd5EncryptStr(paramsList);
            xhr.send(paramStr);
        }
    },
    OnButton_Close:function()
    {
        this.CloseSelf();
    },
});
