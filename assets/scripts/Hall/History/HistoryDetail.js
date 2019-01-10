let Util = require( "Util");

cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( params, parent, LocalPlayerIndex)
    {
        this.params = params;
        this.parent = parent;
        cc.find("Label_SerialNum", this.node).getComponent(cc.Label).string=params.inning_id;
        for (let index = 0; index < params.users.length; index++) {
            var scoreNode = cc.find("Label_PlayerScore" + (index + 1), this.node);
            scoreNode.active=true;
            scoreNode.getComponent(cc.Label).string = params.users[index].point;
            if (index == LocalPlayerIndex) {
                scoreNode.color = new cc.Color(223, 120, 82);
            }
        }
        for (let index = params.users.length; index < 4; index++) {
            cc.find("Label_PlayerScore" + (index + 1), this.node).active = false;
        }
    },
    OnButton_Share: function()
    {
    },
    OnButton_Replay: function()
    {
        Util.ShowTooltip("敬请期待");
    },
});