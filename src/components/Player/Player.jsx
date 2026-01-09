import React, { useState, useRef, useEffect } from 'react';
import { Visualizar } from '../../Visualizer/Visualizar';

export function Player({ src, trackTitle, onNext, onPrev, capa, cantor, isShuffle, toggleShuffle }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioData, setAudioData] = useState(new Uint8Array(0));

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

    // --- LÓGICA DE CONTROLE ---

    const togglePlayPause = () => {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        audioRef.current.volume = val;
    };
    // Dentro do seu componente Player
        useEffect(() => {
            if (trackTitle && window.electronAPI.AtualizarDiscord) {
                console.log("Enviando para o Discord:", trackTitle);
                window.electronAPI.AtualizarDiscord({
                    title: trackTitle,
                    artist: cantor,
                    img: capa
                });
            }
        }, [trackTitle, cantor, capa]); // Toca sempre que a música mudar

    const handleSongEnd = () => {
        if (repeatMode === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
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
            <audio 
                ref={audioRef} 
                src={src} 
                crossOrigin="anonymous"
                onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)} 
                onLoadedMetadata={() => setDuration(audioRef.current.duration)}
                onEnded={handleSongEnd}
            />

            <div className='info'>
                <div className="capa-wrapper" onClick={togglePlayPause}>
                    <Visualizar audioData={audioData} imageSrc={capa}/>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-shuffle" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5"/>
                            <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192"/>
                        </svg>
                    </button>

                    <button onClick={onPrev} className='navButton back'><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-skip-backward-fill" viewBox="0 0 16 16"><path d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5"/></svg></button>
                    
                    <button onClick={togglePlayPause} className='playButton'>
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    
                    <button onClick={onNext} className='navButton forw'><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-skip-forward-fill" viewBox="0 0 16 16"><path d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5"/></svg></button>

                    {/* Botão Repetir */}
                    <button 
                        onClick={() => setRepeatMode(repeatMode === 'one' ? 'none' : 'one')} 
                        className={`extraButton ${repeatMode === 'one' ? 'active' : ''}`}
                        id='Repetir'
                        title="Repetir uma"
                    >
                        {repeatMode === 'one' ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-repeat" viewBox="0 0 16 16"><path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5.001v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223Z"/><path d="M9 5.5a.5.5 0 0 0-.854-.354l-1.75 1.75a.5.5 0 1 0 .708.708L8 6.707V10.5a.5.5 0 0 0 1 0z"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-repeat" viewBox="0 0 16 16"><path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z"/></svg>}
                    </button>
                </div>

                <div className='progressArea'>
                    <span>{formatTime(currentTime)}</span>
                    <input 
                        type="range" 
                        min="0" 
                        max={duration || 0} 
                        value={currentTime} 
                        onChange={(e) => audioRef.current.currentTime = e.target.value}
                        className='progressBar'
                        style={{
                            background: `linear-gradient(to right, #E19F41 0%, #E19F41 ${percentual}%, #00050e ${percentual}%, #00050e 100%)`
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
                        background: `linear-gradient(to right, #E19F41 0%, #E19F41 ${percentual_vol}%, #00050e ${percentual_vol}%, #00050e 100%)`
                    }}
                />
                <span className='Icon_vol'>{volume === 0 ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-volume down" viewBox="0 0 16 16"><path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06m7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-volume" viewBox="0 0 16 16"><path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/><path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06"/></svg>}</span>
            </div>
        </div>
    );
}