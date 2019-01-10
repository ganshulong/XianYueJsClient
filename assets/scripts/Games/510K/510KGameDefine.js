let GNet = require( 'GameNet' );

module.exports = {
    GAMENAME            :   "东乡510K",
    GamePlayerNum       :   4,
    CardWidth           :   126,
    CardHeight          :   174,

    CARD_TYPE_ERROR     :   0,  //错误类型
    CARD_TYPE_SINGLE    :   1,  //单牌
    CARD_TYPE_DOUBLE    :   2,  //对子
    CARD_TYPE_THREE     :   3,  //三牌
    CARD_TYPE_SERISE    :   4,  //顺子
    CARD_TYPE_BOOM      :   5,  //四炸

    SERIES_SINGLE       :   1,  //单顺
    SERIES_DOULE        :   2,  //双顺  
    SERIES_THREE        :   3,  //连续三带

    GetRuleConfigName:function(){
        return "ProPKGameRuleConfig";
    },

    GetPlayFlag:function(){
        return 0x0000;
    },

    GetGameType:function(){
        return 1;
    },

    RuleParseFromString:function(RuleConfig)
    {
        var ProPKGameRuleConfig = GNet.Decode("ProPKGameRuleConfig",RuleConfig);
        return ProPKGameRuleConfig;
    },

    ConfigString:function(RuleConfig , isDescription)
    {
        var ProPKGameRuleConfig = GNet.Decode("ProPKGameRuleConfig",RuleConfig);
        var s = "";
        if (isDescription)
        {
            if (ProPKGameRuleConfig.haveAnZhao)
            {
                s = s + "暗找队友";
            }else
            {
                s = s + "明找队友";
            }
        }else
        {
            s = s + "[东乡510K]";
            if (ProPKGameRuleConfig.gameRound)
            {
                s = s + ProPKGameRuleConfig.gameRound + "局,";
            }
            if (ProPKGameRuleConfig.nPlayerNum)
            {
                s = s + ProPKGameRuleConfig.nPlayerNum + "人场\n";
            }
        }
        return s;
    },
    
};
