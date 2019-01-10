let GAudio = require( "GameAudio" )
let GConfig = require('GameConfig');

cc.Class({
    extends: require("WindowBase"),

    properties: {
    },

    OnLoaded () {
        
        
        // 初始化音效 滑动条百分比
        var SoundVolume = GAudio.GetSoundVolume();
        this.node.getChildByName("EffectSlider").getComponent(cc.Slider).progress = SoundVolume;
        var greenBar = this.node.getChildByName("EffectSlider").getChildByName("greenBar");
        greenBar.width = 550*SoundVolume;
       
        // 初始化音乐 滑动条百分比
        var GMusicVolume = GAudio.GetMusicVolume();
        this.node.getChildByName("MusicSlider").getComponent(cc.Slider).progress = GMusicVolume;
        var greenBar1 = this.node.getChildByName("MusicSlider").getChildByName("greenBar");
        greenBar1.width = 550*GMusicVolume;

        //同步方言按钮状态
        var fangYanTag = GConfig.IsFangYan;
        if (fangYanTag)
        {
            this.node.getChildByName("fangYanToggle").getChildByName("toggle1").getComponent( cc.Toggle ).check();
        }else
        {
            this.node.getChildByName("fangYanToggle").getChildByName("toggle1").getComponent( cc.Toggle ).uncheck();
        }
    },
    //音效回调
    EffectSliderCallBack:function(slider, customEventData)
    {
        // 设置滑动条的显示范围
        var percent = slider.getComponent(cc.Slider).progress;
        var greenBar = this.node.getChildByName("EffectSlider").getChildByName("greenBar");
        greenBar.width = 550*percent;
        GAudio.SetSoundVolume(percent);
    },
    //音乐回调
    MusicSliderCallBack:function(slider, customEventData)
    {
        // 设置滑动条的显示范围
        var percent = slider.getComponent(cc.Slider).progress;
        var greenBar = this.node.getChildByName("MusicSlider").getChildByName("greenBar");
        greenBar.width = 550*percent;
        GAudio.SetMusicVolume(percent);
    },
    // 方言按钮回调
    FangYanCallBack:function(toggle, customEventData){
        var ischecked = toggle.getComponent( cc.Toggle ).isChecked;
        // do something....
        GConfig.IsFangYan = ischecked;
    },
    OnHallSetting_Close:function()
    {
        this.CloseSelf();
    },
    start () {

    },

    // update (dt) {},
});
