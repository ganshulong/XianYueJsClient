"use strict";

cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( cardvalue, this510K, bIsHandCard){
        this.cardvalue = cardvalue;
        this.bIsHandCard = bIsHandCard;
        this.bIsSelected = false;
        this.cardResCache = this510K.GetCardResCache();
        this.ShowCard();
    },

    ShowCard: function() {
        if(this.node == null || this.cardvalue == null){   
            return;
        }
    
        let cardNum = this.cardvalue % 16;
        let cardColor = parseInt(this.cardvalue / 16);

        if (4 > cardColor) { //数字牌
            this.Normal.active = true;
            this.King.active = false;
            //牌面 数字
            if (0===cardColor || 2 ===cardColor) {  //red
                this.Normal.Num.getComponent(cc.Sprite).spriteFrame = this.cardResCache ["r_" + cardNum];
            } else {  //black
                this.Normal.Num.getComponent(cc.Sprite).spriteFrame = this.cardResCache ["b_" + cardNum];
            }
            //牌面 类型
            this.Normal.SmallType.getComponent(cc.Sprite).spriteFrame = this.cardResCache ["color_" + cardColor];
            this.Normal.BigType.getComponent(cc.Sprite).spriteFrame = this.cardResCache ["Type" + cardColor];

        } else { //王牌
            this.Normal.active = false;
            this.King.active = true;  
        }

        this.Sprite_SelectMask.active = false;
    },
});