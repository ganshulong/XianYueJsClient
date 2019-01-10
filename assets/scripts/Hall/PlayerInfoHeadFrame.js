let GData = require( "GameData");
let Util = require( "Util");

cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( params )
    {
        this.parent = params;
        var profile = GData.GetProfile();
        if( profile.avatar_file ){
            this.LoadUrlImg( cc.find("Sprite_Bg/Sprite_HeadFrame/Sprite_Head", this.node), profile.avatar_file + "?a=a.jpg" );
        }
        cc.find("Sprite_Bg/Node_Info/Sprite_NameBg/Label_Name", this.node).getComponent(cc.Label).string = profile.nickname;
        cc.find("Sprite_Bg/Node_Info/Sprite_IDBg/Label_ID", this.node).getComponent(cc.Label).string = profile.user_id;
        cc.find("Sprite_Bg/Node_Info/Sprite_IPBg/Label_IP", this.node).getComponent(cc.Label).string = profile.user_iP;
        cc.find("Sprite_Bg/Sprite_AddressBg/Label_Address", this.node).getComponent(cc.Label).string = profile.address;
    },
    // OnButton_CopyID: function()
    // {
    //     var IDString =cc.find("Sprite_Bg/Sprite_InfoFrame/Label_ID", this.node).getComponent(cc.Label).string;
    //     Util.SetClipboardStr(IDString);
    // },
    OnPlayerInfoHead_copyBtn:function()
    {
        var IDString =cc.find("Sprite_Bg/Node_Info/Sprite_IDBg/Label_ID", this.node).getComponent(cc.Label).string;
        Util.SetClipboardStr(String(IDString));
        // Util.ShowTooltip("复制成功");
    },
    OnButton_Close: function()
    {
        this.CloseSelf();
    },
});