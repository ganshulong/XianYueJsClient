/*----------------------------------------------
-- 添加子游戏在这里加配置
----------------------------------------------*/
//游戏类型
let GAME_TYPE_MJ		=	0;		//东乡麻将
let GAME_TYPE_510K		=	1;		//510K
let GAME_TYPE_DXKT		=	2;		//27w
let GAME_TYPE_DXPDK		=	3;		//斗地主
// let GAME_TYPE_GP		=	4;		//关牌
// let GAME_TYPE_WL		=	6;		//窝龙
// let GAME_TYPE_JDDDZ		=	3;		//经典斗地主

let _Games = [];
_Games[GAME_TYPE_MJ] = { GameID:GAME_TYPE_MJ, GameName:"东乡麻将", SceneName:"Game_Stage/MJ/GameScene", RuleScene:"Hall/RuleNode/Node_MJGameRule", GameDefine:"MJGameDefine"};
_Games[GAME_TYPE_510K] = { GameID:GAME_TYPE_510K, GameName:"五十K", SceneName:"Game_Stage/510K/GameScene", RuleScene:"Hall/RuleNode/Node_510KGameRule", GameDefine:"510KGameDefine"};


module.exports = {
    //TestAccount : "xykj4",     
    GlobalGameId : 5,
    IsFangYan: false, // 记录设置里面的方言开启状态
    IsFirstIntoGame:true,// 记录游戏是否刚打开 用来标记是否需要弹出公告 用
    HttpRequesAddress : "https://test.connect.jxxykj.cn",
    HttpRequesAddressForBind:"https://connect.jxxykj.cn",//绑定的http请求连接正式服务器用的
    RECHARGE_URL:"http://conf2.jxxykj.cn/qipai/order/user/wappay/?", // 充值界面网址
    ShareImgURL:"https://images-1253650513.cos.ap-guangzhou.myqcloud.com/dxfx.jpg",
    GetGames()
    {
        return _Games;
    },

    GetGameScene( nGameType )
    {
        return _Games[nGameType].SceneName;
    },

    GetRuleScene( nGameType )
    {
        return _Games[nGameType].RuleScene;
    },

    GetGameDefine(nGameType){
        return _Games[nGameType].GameDefine;
    },

    GetGameName(nGameType){
        return _Games[nGameType].GameName;
    },
};