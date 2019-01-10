
cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( params )
    {
        this.parent = params;
    },
    start () {
        this.JXMJBtn = cc.find("Sprite_Bg1/Sprite_BtnBg/ScrollView_items/view/content/Button_JXMJ", this.node).getComponent( cc.Button );
        this.NameLabel = cc.find("Sprite_Bg1/Sprite_RuleBg/Label_GameName", this.node).getComponent(cc.Label);
        this.JXMJRuleNode = cc.find("Sprite_Bg1/Sprite_RuleBg/ScrollView_Rule/view/content_JXMJRule", this.node);
        this.OnButton_JXMJ();
    },
    OnButton_JXMJ: function(){   
        this.JXMJBtn.interactable = false;
        this.NameLabel.string="进贤麻将"
        this.JXMJRuleNode.active = true;
    },
    OnButton_Close: function( event ){   
        this.CloseSelf();
    },
});