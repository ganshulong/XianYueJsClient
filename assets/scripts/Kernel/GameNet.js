// websocket with proto-buf

let _pb = require( "compiled" );
let encoding = require( "encoding" );
let _addr = "ws://jx.ydmaj.com:8080";
let _ws = null;
let _onOpen = null;
let _msgHandler = {};
let _Dest = 0;
let _onError = null;

function ReConnect()
{
    if( _ws )
        _ws.close();
    _ws = new WebSocket( _addr );
    _ws.onopen = function (e) {
        _ws.binaryType = 'arraybuffer'
        _onOpen(e);

        console.log('Connection to server opened');
        _Dest = 0;
    }
    _ws.onmessage = function( msg )
    {
        var header = new Uint16Array(msg.data.slice( 0, 8 ));
        var msgID = header[2];
        var sbytes = msg.data.slice( 8 );
        
        if( _msgHandler[msgID] )
        {
            var proto = _getproto(_msgHandler[msgID][0]);
            var msg = proto.decode( new Uint8Array(sbytes) );
            _msgHandler[msgID][1]( msg );
        }
        else
        {
            cc.warn( `Unhandled packet ID: ${msgID}` );
        }
    }
    _ws.onerror = function( e )
    {
        if( _onError )
            _onError();
        ReConnect();
    }

    function ParsePacket( pack )
    {
        if (pack.byteLength >= 8)
        {
            var h16 = new Uint16Array(pack);

        }
        
    }
};

function _getproto( strName )
{
    return _pb[strName] || _pb.messages[strName];
};

module.exports = {
    init( strIp, iPort, funcOpen, funcError )
    {
        if( !_onOpen )
        {
            if (443 == iPort)
                _addr = `wss://${strIp}/wss`;
            else
                _addr = `wss://${strIp}:${iPort}/wss`;
            _onOpen = funcOpen;
            ReConnect();
        }
        if( !_onError )
        {
            _onError = funcError;
        }
    },
    send( strName, objParams )
    {
        if( _ws.readyState == WebSocket.CLOSED )
            ReConnect();
        if( _ws.readyState != WebSocket.OPEN )
            return;
        for( var key in objParams )
        {
            if( typeof objParams[key] == "string" )
                objParams[key] = new encoding.TextEncoder("utf-8").encode(objParams[key]);
        }
        var proto = _getproto( strName );
        if( proto )
        {
            var packet = proto.create( objParams );
            var sbytes = proto.encode( packet ).finish();
            var uint16 = new Uint16Array([1, _Dest, proto.MSGID.ID, sbytes.byteLength]);
            var total = new Uint8Array( uint16.byteLength + sbytes.byteLength );
            total.set( new Uint8Array(uint16.buffer) );
            total.set( sbytes, uint16.byteLength );
            _ws.send(total.buffer);
        }
        else
        {
            cc.warn( `proto msg "${strName}" not found!` );
        }
    },
    SetAdepter( strName, func )
    {
        var proto = _getproto( strName );
        if( proto )
        {
            _msgHandler[proto.MSGID.ID] = [ strName, func ];
        }
        else
        {
            cc.warn( `proto message: ${strName} not found` );
        }
    },
    SetDestId( id )
    {
        _Dest = id;
    },
    Encode( strName, objParams )
    {
        for( var key in objParams )
        {
            if( typeof objParams[key] == "string" )
                objParams[key] = new encoding.TextEncoder("utf-8").encode(objParams[key]);
        }
        var proto = _getproto( strName );
        if( proto )
        {
            var packet = proto.create( objParams );
            var sbytes = proto.encode( packet ).finish();
            return sbytes;
        }
        else
        {
            cc.warn( `proto msg "${strName}" not found!` );
            return null;
        }
    },
    Decode( strName, sbytes )
    {
        var proto = _getproto( strName );
        if( proto )
        {
            var msg = proto.decode( new Uint8Array(sbytes) );
            return msg;
        }
        else
        {
            cc.warn( `proto msg "${strName}" not found!` );
            return null;
        }
    },
    ReConnect()
    {
        if( _onError )
            _onError();
        ReConnect();        
    },
};