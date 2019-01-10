
cc.Class({
    extends: require("WindowBase"),
    OnLoaded: function( params )
    {
        this.parent = params;
    },
    OnButton_Close: function( event ){   
        this.CloseSelf();
    },
});