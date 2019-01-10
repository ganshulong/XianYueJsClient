
cc.Class({
    extends: require("WindowBase"),

    properties: {

    },

    // onLoad () {},
    OnLoaded: function( params )
    {
        cc.log("ForRoomHistoryLayer Loaded");
        this.param = params;
        var itemCount = params.length;
        if (itemCount > 0)
        {
            this.node.getChildByName("ForRoomHist_TipsLabel").active = false;
        }
        cc.log("ForRoomHistoryLayer  params.length = " + params.length);
        var self = this;
        var scrollContent = this.node.getChildByName("ForRoomHist_Scroll").getChildByName("view").getChildByName("content");
        scrollContent.removeAllChildren();
        var tempItem = this.node.getChildByName("ItemTemp");
        var scrolMaxheight= scrollContent.getContentSize().height;
        var nowTotalheight = itemCount*(tempItem.height + 10);
        if (nowTotalheight > scrolMaxheight)
        {
            scrolMaxheight = nowTotalheight;
        }
        scrollContent.height = scrolMaxheight;
        var startPosY = 0;
        var scrolWidth = scrollContent.getContentSize().width;

        for (var k in params)
        {
            // 加载 Prefab
           // cc.loader.loadRes( "Node_ForRoomHistItem4", OnLoadResult.bind(self) );
           var paramTmp = {startY:startPosY,number:k,datetime:params[k].datetime,room_id:params[k].room_id,users:params[k].users,roomcard_id:params[k].roomcard_id,room_rule:params[k].room_rule,config_cost_card_nums:params[k].config_cost_card_nums};
           if (params[k].config_cost_card_nums >= 6)
           {
                this.OpenWindow("Hall/Node_ForRoomHistItem6",paramTmp,scrollContent);
           }else
           {
                this.OpenWindow("Hall/Node_ForRoomHistItem4",paramTmp,scrollContent);
           }
           
        }
        this.node.getChildByName("ForRoomHist_Scroll").getComponent(cc.ScrollView).scrollToTop(0.1);
    },
    OnForRoomHist_CloseBtn:function()
    {
        this.CloseSelf();
    },
    start () {

    },

    // update (dt) {},
});
