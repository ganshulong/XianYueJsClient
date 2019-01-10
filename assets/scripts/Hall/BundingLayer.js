let GData = require( "GameData");
var GNet = require( 'GameNet' );
let GConfig = require("GameConfig");
let Util = require( "Util");

cc.Class({
    extends: require("WindowBase"),

    properties: {

    },
    OnLoaded: function( params )
    {
        var self = this; 
        var xhr = new XMLHttpRequest();
        // xhr.open("POST", GConfig.HttpRequesAddress + "/v1/user_bind_info/");
        xhr.open("POST", GConfig.HttpRequesAddressForBind + "/v1/user_bind_info/");         
        xhr.onreadystatechange = function () {
            cc.log("Bind Post Response");
            if (xhr.readyState == 4 && xhr.status == 200) {
                var result = JSON.parse(xhr.responseText);
                cc.log("result.errno = " + result.errno);
                cc.log("result.errmsg = " + result.errmsg);
                cc.log("xhr.response = " + xhr.response);
                cc.log("xhr.response = " + xhr.responseText);
                if (result && result.errno)
                {
                    if (result.errno == 0)
                    {
                        if (result.data && result.data.bind_id > 0)
                        {
                            Util.ShowTooltip("你已经绑定代理!");
                            self.node.getChildByName("Bund_Btn").getComponent(cc.Button).interactable = false;
                           // self.node.getChildByName("Bund_Btn").getChildByName("BindBtnTxt").color = new cc.Color(125, 125, 125);
                        }
                    }else if (result.errmsg)
                    {
                        Util.ShowTooltip(result.errmsg);
                    } else
                    {
                        Util.ShowTooltip("查询异常!");
                    }
                }else
                {
                    Util.ShowTooltip("查询失败!");
                }
            }
        };
        var userId = GData.GetProfile().user_id;
        var secretTokentmp = GData.GetProfile().secretToken;
        var paramsList = {game_id:GConfig.GlobalGameId,user_id:userId,bind_type:2,secretToken:secretTokentmp};
        var paramStr = Util.GetMd5EncryptStr(paramsList);
        xhr.send(paramStr);
    },
    // 绑定按钮回调
    OnBund_Btn:function()
    {
        var str = this.node.getChildByName("Bounding_Edit").getComponent(cc.EditBox).string;
        var isNumber = this.isNumberOrCharacter(str);
        if (isNumber)
        {
            var self = this; 
            var xhr = new XMLHttpRequest();
            // xhr.open("POST", GConfig.HttpRequesAddress + "/v1/user_bind/");
            xhr.open("POST", GConfig.HttpRequesAddressForBind + "/v1/user_bind/");        
            xhr.onreadystatechange = function () {
                cc.log("Bind Post Response");
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var result = JSON.parse(xhr.responseText);
                    if (result && result.errno)
                    {
                        if (result.errno == 0)
                        {
                            Util.ShowTooltip( result.errmsg);
                        }else if ( result.errmsg)
                        {
                            Util.ShowTooltip( result.errmsg);
                        }else
                        {
                            Util.ShowTooltip("提交异常！");
                        }
                    }
                }
            };
            var userId = GData.GetProfile().user_id;
            var secretTokentmp = GData.GetProfile().secretToken;
            var paramsList = {game_id:GConfig.GlobalGameId, user_id:userId,bind_type:2,bind_id:str,secretToken:secretTokentmp};
            var paramStr = Util.GetMd5EncryptStr(paramsList);
            xhr.send(paramStr);
        }else
        {
            this.node.getChildByName("Bounding_Edit").getComponent(cc.EditBox).string = "";
        }
    },
    isNumberOrCharacter: function(_string) { 
        var charecterCount = 0;  
        if (_string.length == 0)
        {
            cc.log("输入内容不能为空！");
            Util.ShowTooltip("输入内容不能为空！");
            return false; 
        }
        for(var i=0; i < _string.length; i++){  
            var character = _string.substr(i,1);  
            var temp = character.charCodeAt();  
            if (48 <= temp && temp <= 57){  
                
            }else{  
                cc.log("输入包含非数字、字母的字符,清重新输入！");
                Util.ShowTooltip("输入包含非数字、字母的字符,清重新输入！"); 
                return false;
            }  
        } 
        cc.log("输入符合条件");
        return true;
    },  
    // onLoad () {},
    OnBund_Close:function()
    {
        this.CloseSelf();
    },
    start () {

    },

    // update (dt) {},
});
