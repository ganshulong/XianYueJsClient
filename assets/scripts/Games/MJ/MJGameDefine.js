let GNet = require( 'GameNet' );

module.exports = {
    GAMENAME            : "东乡麻将",

    //动作标志
    WIK_NULL            : 0x0000,								//没有类型
    WIK_LEFT            : 0x0001,								//左吃类型
    WIK_CENTER          : 0x0002,								//中吃类型
    WIK_RIGHT           : 0x0004,								//右吃类型
    WIK_PENG            : 0x0008,								//碰牌类型
    WIK_GANG            : 0x0010,								//杠牌类型
    WIK_CHI_HU          : 0x0020,								//吃胡类型
    WIK_DNBL            : 0x0040,								//东南北左
    WIK_DNBC            : 0x0080,								//东南北中
    WIK_DNBR            : 0x0100,								//东南北右
    WIK_DXBL            : 0x0200,								//东西北左	
    WIK_DXBC            : 0x0400,								//东西北中	
    WIK_DXBR            : 0x0800,								//东西北右	

    OperationList: {
        0: { key: 0x0000, path: "btn_pass" },
        1: { key: 0x0020, path: "btn_hu" },
        2: { key: 0x0010, path: "btn_gang" },
        3: { key: 0x0008, path: "btn_peng" },
        4: { key: 0x0001, path: "btn_chi" },
        5: { key: 0x0002, path: "btn_chi" },
        6: { key: 0x0004, path: "btn_chi" },
        7: { key: 0x0040, path: "btn_chi" },
        8: { key: 0x0080, path: "btn_chi" },
        9: { key: 0x0100, path: "btn_chi" },
        10: { key: 0x0200, path: "btn_chi" },
        11: { key: 0x0400, path: "btn_chi" },
        12: { key: 0x0800, path: "btn_chi" },
    },


    //胡牌定义

    //非胡类型
    CHK_NULL					: 0x0000,								//非胡类型
    
    //胡牌类型
    CHK_JI_HU					: 0x0001,								//基本胡
    CHK_QI_DUI					: 0x0002,								//七对
    CHK_THIRTEEN				: 0x0004,								//13乱
    CHK_SERVEN					: 0x0008,								//七星
    CHK_GERMAN_SERVEN			: 0x0010,								//德国七星
    CHK_PENG_PENG				: 0x0020,								//大七对（碰碰胡）
    
    CHK_MIX						: 0x0040,								//混一色
    CHK_SAME					: 0x0080,								//清一色
    CHK_MIX_QI					: 0x0102,								//混一色七对
    CHK_SAME_QI					: 0x0202,								//清一色七对
    CHK_MIX_DA_QI				: 0x0120,								//混一色碰碰胡
    CHK_SAME_DA_QI				: 0x0220,								//清一色碰碰胡
    
    CHK_SAME_JIA				: 0x0440,
    CHK_ZI						: 0x0800,
    CHK_ZI_QI					: 0x0802,
    CHK_ZI_DA_QI				: 0x0820,
    CHK_ZI_JIA					: 0x0840,
    
    //胡牌权位
    CHR_ZI_MO					: 0x0001,								//自摸权位
    CHR_QIANG_GANG				: 0x0002,								//抢杠权位
    CHR_GANG_FLOWER				: 0x0004,								//杠上开花
    CHR_KING_WAIT				: 0x0008,								//精吊权位
    CHR_GERMAN					: 0x0010,								//德国权位
    CHR_GERMAN_GERMAN			: 0x0020,								//德中德	
    CHR_TIAN					: 0x0040,								//天胡权位	
    CHR_DI						: 0x0080,								//地胡权位
    
    CHR_GANG_WAIT				: 0x000c,								//杠吊
    CHR_YOU_BAO					: 0x001c,								//有宝
    
    CHR_SAME_COLOR				: 0x0100,								//清一色
    CHR_MIX_COLOR				: 0x0200,								//混一色
    CHR_DOUBLE_GANG_WAIT		: 0x0400,								//双杠吊
    CHR_TRIPLE_GANG_WAIT		: 0x0800,								//三杠吊
    CHR_ULTRA_GANG_WAIT			: 0x1000,								//四杠吊
    CHR_ZI_COLOR				: 0x8000,
    
    CHR_SI_GUI_YI				: 0x2000,
    CHR_BA_GUI_YI				: 0x4000,
    
    CHR_HUAN_YUAN				: 0x8001,								//还原
    GetRuleConfigName:function(){
        return "ProMJGameRuleConfig";
    },

    GetPlayFlag:function(){
        return 0x0000;
    },
    GetGameType:function(){
        return 0;
    },

    RuleParseFromString:function(RuleConfig)
    {
        var ProMJGameRuleConfig = GNet.Decode("ProMJGameRuleConfig",RuleConfig);
        return ProMJGameRuleConfig;
    },
    ConfigString:function(RuleConfig , isDescription)
    {
        var ProMJGameRuleConfig = GNet.Decode("ProMJGameRuleConfig",RuleConfig);
        var s = "";
        if (isDescription)
        {
            if (ProMJGameRuleConfig.bHaveKing)
            {
                s = s + "精吊玩法 ";
            }else
            {
                s = s + "放炮玩法 ";
            }
            if (ProMJGameRuleConfig.bHaveKing && ProMJGameRuleConfig.havePengpeng)
            {
                s = s + "大七对 ";
            }
            if (ProMJGameRuleConfig.bHaveKing && ProMJGameRuleConfig.haveBaosanqiu)
            {
                s = s + "包三丘 ";
            }

            if (!ProMJGameRuleConfig.bHaveKing)
            {
                if (ProMJGameRuleConfig.haveSiguiyi)
                {
                    s = s + "四归一 ";
                }
                if (ProMJGameRuleConfig.haveZhuangjiafanbei)
                {
                    s = s + "庄家翻倍 ";
                }

                if (ProMJGameRuleConfig.nJiangMaCounts == 0)
                {
                    s = s + "不买码 ";
                }else if (ProMJGameRuleConfig.nJiangMaCounts == 1)
                {
                    s = s + "买1码 ";
                }
                else if (ProMJGameRuleConfig.nJiangMaCounts == 2)
                {
                    s = s + "买2码 ";
                }
                else if (ProMJGameRuleConfig.nJiangMaCounts == 4)
                {
                    s = s + "买4码 ";
                }
                else if (ProMJGameRuleConfig.nJiangMaCounts == 8)
                {
                    s = s + "买8码 ";
                }
                else if (ProMJGameRuleConfig.nJiangMaCounts == 12)
                {
                    s = s + "买12码 ";
                }
            }

        }else
        {
            s = s + "[东乡麻将]";
            if (ProMJGameRuleConfig.gameRound)
            {
                s = s + ProMJGameRuleConfig.gameRound + "局,";
            }
            if (ProMJGameRuleConfig.nPlayerNum)
            {
                s = s + ProMJGameRuleConfig.nPlayerNum + "人场\n";
            }
        }

        return s;
    },
   
};
