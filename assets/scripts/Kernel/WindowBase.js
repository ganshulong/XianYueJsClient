"use strict";

/*------------------------------------------------------------
窗口基类，主要变量以及方法
可重载的方法
this.OnLoaded( params ) 加载完成之后时候被调用, params为OpenWindow传入的用户参数
this.OnClose() 关闭时会被调用

this.CloseSelf() 关闭窗口
this.OpenWindow( name, params, node ) 打开窗口，node 默认挂载到根节点, params为用户参数

------------------------------------------------------------*/

cc.Class({
    extends: cc.Component,

    properties: {
        // 模态对话框，该窗口后面界面将无法点击
        Modal: {default: true, tooltip:"模态对话框，该窗口后面的界面将无法点击"},
        // 点击窗口外面自动关闭
        OutsideClose: {default: true, tooltip:"点击窗口外面自动关闭，模态对话框才有效"},
        // 模态对话框背景蒙板颜色
        ModalColor:{default:cc.color(0, 0, 0, 128), tooltip:"模态对话框背景蒙板颜色" },
        // 弹出效果
        OpenEffect:{ default: false, tooltip:"窗口弹出效果"},
    },

    _ProcessBind( node, Window )
    {
        var nodes = node.children;
        for( var i = 0; i < nodes.length; i ++ )
        {
            this._ProcessBind( nodes[i], Window );
        }
        if( node.getComponent(cc.Button) )
        {
            var funcName = "On"+node.name;
            if( Window[funcName] && Window[funcName] instanceof Function )
            {
    //            node.on( "click", Window[funcName], Window );
                var clickEventHandler = new cc.Component.EventHandler();
                clickEventHandler.target = Window.node;
                clickEventHandler.component = Window.__classname__
                clickEventHandler.handler = funcName;
    
                var button = node.getComponent(cc.Button);
                //button.clickEvents.push(clickEventHandler);
                button.clickEvents[0] = clickEventHandler;
            }
        }
    },

    onLoad() 
    {
        if( this.node == null )
        {
            cc.log( "Root node not found!" );
            return;
        }
        // init button handler
        this._ProcessBind( this.node, this );
        // 添加蒙板
        if( this.Modal )
        {
            var nodeModal = new cc.Node( "Modal_Mask" );
            this.node.addChild( nodeModal, -1 );
            nodeModal.width = 1280*2;
            nodeModal.height = 720*2;
            nodeModal.color = this.ModalColor;
            nodeModal.opacity = this.ModalColor.a;
            var sp = nodeModal.addComponent(cc.Sprite);
            nodeModal.addComponent(cc.BlockInputEvents);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            cc.loader.loadRes( "singleColor", cc.SpriteFrame, function( err, tex ){
                sp.spriteFrame = tex;
            } );
            if( this.OutsideClose )
            {
                var bt = nodeModal.addComponent(cc.Button);
                var clickEventHandler = new cc.Component.EventHandler();
                clickEventHandler.target = this.node;
                clickEventHandler.component = this.__classname__
                clickEventHandler.handler = "_MaskClick";

                bt.clickEvents.push(clickEventHandler);
            }
        }
        if( this.OpenEffect )
        {
            this.node.scaleX = 0;
            this.node.scaleY = 0;
            var action = cc.scaleTo( 0.5, 1 );
            action.easing( cc.easeBackOut() );
            this.node.runAction( action );
        }

        // 处理node下所有结点，能通过根节点直接访问
        this.dealChildren(this.node,this);
    },

    OnLoaded( params ){
        this.params=params;
    },

    start () 
    {
    },

    OpenWindow( name, params, node )
    {
        var nodeParams = params;
        var nodeAttach = node;
        if( nodeAttach == null )
            nodeAttach = this.node;
        cc.loader.loadRes( name, function( error, perfab ) {
            if( error )
            {
                cc.error( error.message );
                return;
            }
            var node = cc.instantiate( perfab );
            nodeAttach.addChild( node );
            var sc = node.getComponent(cc.Component);
            if( sc && sc.OnLoaded )
            {
                sc.OnLoaded( nodeParams );
            }
        } );
    },
    CloseSelf()
    {
        this.node.destroy();
        this.OnClose()
    },
    _MaskClick( event )
    {
        var window = this.node;
        var bound = window.getBoundingBox();
        var localPoint =  window.convertTouchToNodeSpace(event.touch);
        if( this.OutsideClose && (!cc.rect( 0, 0, window.width, window.height ).contains( localPoint )) )
        {
            this.CloseSelf();
        }
        event.stopPropagation();

    },
    LoadUrlImg( node, url )
    {
        if( node && url )
        {
            var spr = node.getComponent( cc.Sprite );
            if( spr && url )
            {
                cc.loader.load( url, function( err, texture ){
                    spr.spriteFrame = new cc.SpriteFrame(texture);
                } );
            }
        }
    },

    OnClose(){},


    LoadPrefab( perfab ,parent = null )
    {
        var parentNode = parent || this.node;
        var node = cc.instantiate( perfab );
        parentNode.addChild( node );
        this._ProcessBind( this.node, this );
        //预制体通过预制体的根节点去访问 不绑定到脚本类上
        this.dealChildren(node);

        return node;
    },

    // 处理parent下所有结点可以直接通过“root.”访问
    // 注：节点重名导致的未正确访问节点可通过全路径访问
    // 如: root.node1.node1_1.leaf_node
    //     root.node2.node2_1.leaf_node
    dealChildren( parent,root = null )
    {
        root = root || parent;
        if(!parent.getChildren)return;
        var children = parent.getChildren();
        for(var key in children)
        {
            var value = children[key];
            parent[value.name] = value;
            root[value.name] = value;
            this.dealChildren(value,root);
        }
    },

    backToHall()
    {
        cc.director.loadScene("HomeScene");

        if (this.SendLogoutRoom)
            this.SendLogoutRoom();
        if (this.ClearRoomUsers)
            this.ClearRoomUsers();
    },

    ShowTipsLayer(args) {
        var self = this;

        if(self.TipsLayer){
            self.TipsLayer.removeFromParent();
            delete self.TipsLayer;
        }

        function OnLoadResult( error, perfab )
        {
            if( error )
            {
                cc.error( error.message );
                return;
            }
            var node = this.LoadPrefab(perfab);


            node.active = false;
            node.getComponent("TipsLayer").OnLoaded(args);
            node.setLocalZOrder(999);
            self.TipsLayer = node;
        };
        cc.loader.loadRes( "public/TipsLayer", OnLoadResult.bind(this) );
    },
    // update (dt) {},
});
