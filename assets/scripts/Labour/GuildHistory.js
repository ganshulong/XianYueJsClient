let GData = require( "GameData");
let GConfig = require( "GameConfig" );
let Util = require( "Util");
let self = null;

cc.Class({
    extends: require("WindowBase"),

    OnLoaded: function(params){
        self = this;
        this.params=params;
        var profile = GData.GetProfile();
        this.dateLabel = cc.find("Image_DateBg/Text_DateTimes", this.node).getComponent(cc.Label);  //日期
        this.historyScroll = cc.find("ScrollView_History", this.node).getComponent(cc.ScrollView);  //战绩ScrollView
        this.historyNum = cc.find("Text_NumberOfAchie", this.node).getComponent(cc.Label);

        this.curData = new Date();
        var year = this.curData.getFullYear();
        var month = this.curData.getMonth() + 1;
        var day = this.curData.getDate();

        this.checkDate = year + "-" + month + "-" + day;
        this.dateLabel.string = this.checkDate;
        this.HistoryRequest();
    },

    //返回
    OnButton_Back: function(event){
        this.CloseSelf();
    },

    //前一天
    OnButton_BeforeDay: function(event){
        this.curData.setDate(this.curData.getDate() - 1);
        var year = this.curData.getFullYear();
        var month = this.curData.getMonth() + 1;
        var day = this.curData.getDate();
        this.checkDate = year + "-" + month + "-" + day;
        this.dateLabel.string = this.checkDate;
        this.HistoryRequest();
    },

    //后一天
    OnButton_NextDay: function(event){
        this.curData.setDate(this.curData.getDate() + 1);
        var year = this.curData.getFullYear();
        var month = this.curData.getMonth() + 1;
        var day = this.curData.getDate();
        this.checkDate = year + "-" + month + "-" + day;
        this.dateLabel.string = this.checkDate;
        this.HistoryRequest();
    },

    HistoryRequest: function(){
        self.historyNum.string = 0;
        var xhr = new XMLHttpRequest();
        xhr.responseType="json";
        xhr.open("POST", GConfig.HttpRequesAddress + "/new/ncmj_inning_master_log/");
        xhr.onreadystatechange = function(){
            cc.info("xhr.readyState = " + xhr.readyState + ", xhr.status = " + xhr.status);
            if (xhr.readyState == 4 && xhr.status == 200) {
                self.historyScroll.content.removeAllChildren();
                var historyData = JSON.parse(xhr.responseText);
                cc.info(historyData);
                self.historyNum.string = historyData.length;

                if(historyData.length > 0){
                    cc.loader.loadRes("Labour/GuildHistoryItem", function(err, itemPrefab){
                        if(err){
                            cc.error(err.message || err);
                            return;
                        }

                        for(let i = 0; i < historyData.length; i++){
                            var item = cc.instantiate(itemPrefab);
                            self.historyScroll.content.addChild(item);

                            var sc = item.getComponent("GuildHistoryItem");
                            sc.UpdateUI(historyData[i]);
                        }
                    });
                }
            }
        };

        var paramsList = {game_id:GConfig.GlobalGameId, master_user_id:self.params.guildID, record_type: 2, log_date: self.checkDate,secretToken:GData.GetProfile().secretToken,user_id:GData.GetProfile().user_id};
        var paramStr = Util.GetMd5EncryptStr(paramsList);
        xhr.send(paramStr);
    }
});
