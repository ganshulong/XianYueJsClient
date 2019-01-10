let GNet = require( 'GameNet' );
let GData = require( 'GameData' );
let GDefine = require( "GameDefine" );

let game = null;


cc.Class({
    extends: require("WindowBase"),

    OnLoaded( params ){
        this.node.active = true;

        game = params.game;
        this.TalkList = game.GetTalkList();

        this.SetInfoStr();
        this.OnButton_info();
    },

    SetInfoStr()
    {
        let infoContent = this.Panel_Content.view.content;
        let msgLength = this.TalkList.length;
        let nodeNum = infoContent.children.length;

        for (let i = 0; i < msgLength; i++) {
            infoContent["Text_Msg" + (i + 1)].active = true;
            infoContent["Text_Msg" + (i + 1)].getComponent(cc.Label).string = this.TalkList[i];
        }
        for (let i = msgLength ; i < nodeNum; i++) {
            infoContent["Text_Msg" + (i + 1)].active = false;
        }
    },

    //重写关闭
    CloseSelf()
    {
        this.node.active = false;       //只隐藏
    },

    OnButton_info()
    {
        this.Button_info.getComponent(cc.Button).interactable = false;
        this.Button_Expression.getComponent(cc.Button).interactable = true;

        this.Panel_Content.active = true;
        this.Panel_Expression.active = false;
    },

    OnButton_Expression()
    {
        this.Button_info.getComponent(cc.Button).interactable = true;
        this.Button_Expression.getComponent(cc.Button).interactable = false;

        this.Panel_Content.active = false;
        this.Panel_Expression.active = true;
    },

    OnButton_Send()
    {
        var str = this.input_box.getComponent(cc.EditBox).string;
        if(!str || str == "")return;

        GNet.send("ProQuickSoundRequest",{
            deskId:GData.GetRoomID(),
            seatId:game.m_MySeat_id,
            text:str,
            soundId:GDefine.SOUND_TEXT
        });

        this.input_box.getComponent(cc.EditBox).string = "";
        this.CloseSelf();
    },

    sendTalkDefine(idx)
    {
        idx-=1;
        GNet.send("ProQuickSoundRequest",{
            deskId:GData.GetRoomID(),
            seatId:game.m_MySeat_id,
            soundId:idx
        });

        this.CloseSelf();
    },

    sendTalkBiaoQing(idx)
    {
        GNet.send("ProQuickSoundRequest",{
            seatId:game.m_MySeat_id,
            soundId:idx + GDefine.SOUND_DEFINED_MAX
        });

        this.CloseSelf();
    },

    OnText_Msg1()
    {
        this.sendTalkDefine(1);
    },
    OnText_Msg2()
    {
        this.sendTalkDefine(2);
    },
    OnText_Msg3()
    {
        this.sendTalkDefine(3);
    },
    OnText_Msg4()
    {
        this.sendTalkDefine(4);
    },
    OnText_Msg5()
    {
        this.sendTalkDefine(5);
    },
    OnText_Msg6()
    {
        this.sendTalkDefine(6);
    },
    OnText_Msg7()
    {
        this.sendTalkDefine(7);
    },
    OnText_Msg8()
    {
        this.sendTalkDefine(8);
    },
    OnText_Msg9()
    {
        this.sendTalkDefine(9);
    },
    OnText_Msg10()
    {
        this.sendTalkDefine(10);
    },
    OnText_Msg11()
    {
        this.sendTalkDefine(11);
    },
    OnText_Msg12()
    {
        this.sendTalkDefine(12);
    },
    OnText_Msg13()
    {
        this.sendTalkDefine(13);
    },


    OnBtn_EE1()
    {
        this.sendTalkBiaoQing(1);
    },
    OnBtn_EE2()
    {
        this.sendTalkBiaoQing(2);
    },
    OnBtn_EE3()
    {
        this.sendTalkBiaoQing(3);
    },
    OnBtn_EE4()
    {
        this.sendTalkBiaoQing(4);
    },
    OnBtn_EE5()
    {
        this.sendTalkBiaoQing(5);
    },
    OnBtn_EE6()
    {
        this.sendTalkBiaoQing(6);
    },
    OnBtn_EE7()
    {
        this.sendTalkBiaoQing(7);
    },
    OnBtn_EE8()
    {
        this.sendTalkBiaoQing(8);
    },
    OnBtn_EE9()
    {
        this.sendTalkBiaoQing(9);
    },
    OnBtn_EE10()
    {
        this.sendTalkBiaoQing(10);
    },
    OnBtn_EE11()
    {
        this.sendTalkBiaoQing(11);
    },
    OnBtn_EE12()
    {
        this.sendTalkBiaoQing(12);
    },
    OnBtn_EE13()
    {
        this.sendTalkBiaoQing(13);
    },
    OnBtn_EE14()
    {
        this.sendTalkBiaoQing(14);
    },
    OnBtn_EE15()
    {
        this.sendTalkBiaoQing(15);
    },
    OnBtn_EE16()
    {
        this.sendTalkBiaoQing(16);
    },
});