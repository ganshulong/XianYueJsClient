module.exports = {
    // 游戏自定义消息写在这里
    ProGetUserPropResponse : "ProGetUserPropResponse",
    ProLoginSuccessResponse : "ProLoginSuccessResponse",
    ProGetUserPropResponse : "ProGetUserPropResponse",

    // 重新进入桌子消息
    ReEnterDesk : "ReEnterDesk",

    OnGameEvent( eventID, handler ){
        cc.director.getScene().on( eventID, handler );
    },
    DispatchEvent( eventID, userData ){
        var ev = new cc.Event.EventCustom(eventID, true);
        ev.setUserData( userData );
        cc.director.getScene().dispatchEvent( ev );
    }
};