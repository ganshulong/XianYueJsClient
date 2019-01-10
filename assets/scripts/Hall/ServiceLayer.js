let Util = require( "Util");

cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( params )
    {
        this.parent = params;
    },
    start () {
        // cc.find("Sprite_bg/Sprite_Bg2/Sprite_ConsultBg/Label_ConsultWX", this.node).getComponent(cc.Label).string = "123";
        // cc.find("Sprite_bg/Sprite_Bg2/Sprite_RegisterBg/Label_RegisterWX", this.node).getComponent(cc.Label).string = "456";
    },
    OnButton_ConsultWXCopy: function(){   
        var ConsultWXStr = cc.find("Sprite_bg/Sprite_Bg2/Sprite_ConsultBg/Label_ConsultWX", this.node).getComponent(cc.Label).string;
        Util.SetClipboardStr(ConsultWXStr);
    },
    OnButton_RegisterWXCopy: function(){   
        var RegisterWXStr = cc.find("Sprite_bg/Sprite_Bg2/Sprite_RegisterBg/Label_RegisterWX", this.node).getComponent(cc.Label).string;
        Util.SetClipboardStr(RegisterWXStr);
    },
    OnButton_Close: function( event ){   
        this.CloseSelf();
    },
});