
let _MusicVolume = 0.5;
let _SoundVolume = 0.5;
let _MusicID = null;

let _MusicPath = null;

module.exports = {
    PlayMusic( strPath )
    {
        if( strPath != _MusicPath )
        {
            _MusicPath = strPath;
            if( _MusicID != null )
                cc.audioEngine.stop( _MusicID );
            _MusicID = cc.audioEngine.play( cc.url.raw(strPath), true, _MusicVolume );
        }
    },
    PlaySound( strPath )
    {
        cc.audioEngine.play( cc.url.raw(strPath), false, _SoundVolume );
    },
    SetMusicVolume( volume )
    {
        _MusicVolume = volume;
        if( _MusicID != null )
            cc.audioEngine.setVolume(_MusicID, volume);
    },
    SetSoundVolume( volume )
    {
        _SoundVolume = volume;
    },
    GetMusicVolume()
    {
        return _MusicVolume;
    },
    GetSoundVolume()
    {
        return _SoundVolume;
    }
};