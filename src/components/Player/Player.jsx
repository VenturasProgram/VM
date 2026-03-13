import React, { useState, useRef, useEffect } from 'react';
import { Visualizar } from '../../Visualizer/Visualizar';

export function Player({ src, trackTitle, onNext, onPrev, capa, cantor, isShuffle, toggleShuffle, onPlayStateChange, Time, Repeat }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioData, setAudioData] = useState(new Uint8Array(0));
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

    // NOVOS ESTADOS
    const [volume, setVolume] = useState(1); // 0 a 1
    const [repeatMode, setRepeatMode] = useState('none'); // 'none' | 'one'

    const analyzerRef = useRef(null);
    const animationRef = useRef(null);
    const audioContextRef = useRef(null);
    const sourceRef = useRef(null);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.play().catch(e => console.log("Autoplay bloqueado"));
        setIsPlaying(true);

        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
            const analyzer = audioContextRef.current.createAnalyser();
            analyzer.fftSize = 1024;
            analyzer.smoothingTimeConstant = 0.75;
            analyzerRef.current = analyzer;

            const source = audioContextRef.current.createMediaElementSource(audioRef.current);
            source.connect(analyzer);
            analyzer.connect(audioContextRef.current.destination);
            sourceRef.current = source;
        }

        const updateData = () => {
            if (analyzerRef.current) {
                const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
                analyzerRef.current.getByteFrequencyData(dataArray);
                setAudioData(dataArray);
            }
            animationRef.current = requestAnimationFrame(updateData);
        };
        updateData();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [src]);

    useEffect(() => {
        setIsMetadataLoaded(false);
    }, [src]);
    // --- LÓGICA DE CONTROLE ---
    useEffect(() => {
        const handleKeyUp = (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                togglePlayPause();
            }
        };

        document.addEventListener('keyup', handleKeyUp);
        return () => document.removeEventListener('keyup', handleKeyUp);
    }, [isPlaying]);
    const togglePlayPause = () => {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
        onPlayStateChange(!isPlaying);

    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        audioRef.current.volume = val;
    };
    // Dentro do seu componente Player
    const atualizarStatusDiscord = (tempoManual = null) => {
        if (trackTitle && isMetadataLoaded && window.electronAPI.AtualizarDiscord) {
            window.electronAPI.AtualizarDiscord({
                title: trackTitle,
                artist: cantor,
                img: capa,
                currentTime: tempoManual !== null ? tempoManual : (audioRef.current ? audioRef.current.currentTime : 0),
                duration: audioRef.current ? audioRef.current.duration : 0,
                time_duration: duration,
                isPaused: !isPlaying
            });
        }
    }
    useEffect(() => {
        atualizarStatusDiscord();
    }, [trackTitle, isPlaying, isMetadataLoaded]);

    const handleSongEnd = () => {
        if (repeatMode === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            Time(0);

            atualizarStatusDiscord(0);
        } else {
            onNext(); // O componente pai deve lidar com o Shuffle se isShuffle estiver ativo
        }
    };

    const formatTime = (time) => {
        if (!time) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    const percentual = duration ? (currentTime / duration) * 100 : 0;
    const percentual_vol = volume ? (volume / 1) * 100 : 0;
    return (
        <div className='playerContainer'>
            <LiquidFilter_Circle />
            <audio
                ref={audioRef}
                src={src}
                crossOrigin="anonymous"
                onTimeUpdate={() => {
                    setCurrentTime(audioRef.current.currentTime);
                    if (Time) Time(audioRef.current.currentTime);

                }}
                onLoadedMetadata={() => {
                    setDuration(audioRef.current.duration);
                    setIsMetadataLoaded(true);
                }}
                onEnded={handleSongEnd}
            />

            <div className='info'>
                <div className="capa-wrapper" onClick={togglePlayPause}>
                    <Visualizar audioData={audioData} imageSrc={capa} />
                </div>
                <div className='Informação'>
                    <span className='title'>{trackTitle || "Nenhuma musica..."}</span>
                    <span className='Cantor'>{cantor || "N/A"}</span>
                </div>
            </div>

            <div className='controls'>
                <div className='buttonGroup'>
                    {/* Botão Aleatório */}
                    <button
                        onClick={toggleShuffle}
                        className={`extraButton ${isShuffle ? 'active' : ''}`}
                        id='Aleatorio'
                        title="Aleatório"
                    >
                        <div className='Glass_button'></div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-shuffle" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5" />
                            <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192" />
                        </svg>
                    </button>

                    <button onClick={onPrev} className='navButton back'><div className='Glass_button'></div><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-skip-backward-fill" viewBox="0 0 16 16"><path d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5" /></svg></button>

                    <button onClick={togglePlayPause} className='playButton'>
                        {isPlaying ? '⏸' : '▶'}
                    </button>

                    <button onClick={onNext} className='navButton forw'><div className='Glass_button'></div><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-skip-forward-fill" viewBox="0 0 16 16"><path d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5" /></svg></button>

                    {/* Botão Repetir */}
                    <button
                        onClick={() => setRepeatMode(repeatMode === 'one' ? 'none' : 'one')}
                        className={`extraButton ${repeatMode === 'one' ? 'active' : ''}`}
                        id='Repetir'
                        title="Repetir uma"
                    >
                        <div className='Glass_button'></div>
                        {repeatMode === 'one' ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-repeat" viewBox="0 0 16 16"><path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5.001v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223Z" /><path d="M9 5.5a.5.5 0 0 0-.854-.354l-1.75 1.75a.5.5 0 1 0 .708.708L8 6.707V10.5a.5.5 0 0 0 1 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-repeat" viewBox="0 0 16 16"><path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" /></svg>}
                    </button>
                </div>

                <div className='progressArea'>
                    <span>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => {
                            audioRef.current.currentTime = e.target.value;
                            Time(e.target.value);
                            atualizarStatusDiscord(audioRef.current.currentTime);
                        }}
                        className='progressBar'
                        style={{
                            background: `linear-gradient(to right, #E19F41 0%, #E19F41 ${percentual}%, #0000000d ${percentual}%, #0000000d 100%)`,
                            backdropFilter: `blur(5px)`,
                            WebkitBackdropFilter: `blur(5px)`
                        }}
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div className='volumeControl'>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className='volumeBar'
                    style={{
                        background: `linear-gradient(to right, #E19F41 0%, #E19F41 ${percentual_vol}%, #0000000d ${percentual_vol}%, #0000000d 100%)`,
                        backdropFilter: `blur(5px)`,
                        WebkitBackdropFilter: `blur(5px)`
                    }}
                />
                <span className='Icon_vol'>{volume === 0 ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-volume down" viewBox="0 0 16 16"><path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06m7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-volume" viewBox="0 0 16 16"><path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z" /><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z" /><path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06" /></svg>}</span>
            </div>
        </div>
    );
}
const IMG_Circle = "data:image/png;base64,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";
const LiquidFilter_Circle = () => (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="liquid-Circle">
            {/* Slight blur of the source */}
            <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="1"
                result="blurred_source"
            />

            {/* Displacement map image */}
            <feImage
                href={IMG_Circle}
                x="0"
                y="0"
                width={606}
                height={1028.89}
                result="displacement_map"
            />

            {/* Apply displacement */}
            <feDisplacementMap
                in="blurred_source"
                in2="displacement_map"
                scale="55"
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
            />
        </filter>

    </svg>
);