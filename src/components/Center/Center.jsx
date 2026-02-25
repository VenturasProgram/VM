import React, { useEffect, useRef, useState } from 'react'
import { Library } from '../Library/Library'
import { Player } from '../Player/Player'
import { Downloader } from '../Downloader/Downloader'
import { WindowControls } from '../controls_page/controls'

const sanitizeFileName = (name) => {
    if (!name) return "";
    return name
        .trim()
        .replace(/\?/g, '？')
        .replace(/[:*?"<>|]/g, (match) => {
            const replacements = {
                ':': '：', '*': '＊', '"': '＂',
                '<': '＜', '>': '＞', '|': '｜'
            };
            return replacements[match] || "";
        });
};

export const Center = () => {
    const [songs, setSongs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [PlayerActive, setPlayerActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    // Dentro do seu componente Center
    const [isShuffle, setIsShuffle] = useState(false);
    
    // 1. Estado para controlar a visibilidade do Downloader
    const [isDownloaderVisible, setIsDownloaderVisible] = useState(false);
    const [userCss, setUserCss] = useState('');

    const videoRef = useRef(null);

    const isPlayerOpen = currentIndex !== null;
    useEffect(() => {
        window.electronAPI.onUpdateCss((css) => {
            setUserCss(css);
        });
    }, []);
    useEffect(() => {
        // Escuta o aviso de que a biblioteca mudou (novo download concluído)
        const unsubscribe = window.electronAPI.onLibraryUpdated(() => {
            console.log("Biblioteca atualizada! Recarregando dados...");
            refreshLibrary();
        });

        refreshLibrary(); // Carga inicial

        return () => unsubscribe(); // Limpa o listener ao fechar o componente
    }, []);
    const refreshLibrary = async () => {
        const data = await window.electronAPI.getLibrary();
        setSongs(data);
    };
    

    const nextSong = () => {
        if (currentIndex === null || songs.length === 0) return;

        if (isShuffle) {
            let nextIndex;
            if (songs.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * songs.length);
                } while (nextIndex === currentIndex);
            } else {
                nextIndex = 0;
            }
            setCurrentIndex(nextIndex);
        } else {
            // Lógica de Loop: Se for a última, volta para a 0
            if (currentIndex >= songs.length - 1) {
                setCurrentIndex(0);
            } else {
                setCurrentIndex(currentIndex + 1);
            }
        }
    };

    // 3. NOVA FUNÇÃO PREV (Substitua a antiga por esta)
    const prevSong = () => {
        if (currentIndex === null || songs.length === 0) return;

        // Lógica de Loop: Se for a primeira, vai para a última
        if (currentIndex <= 0) {
            setCurrentIndex(songs.length - 1);
        } else {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handlePlaySong = (index) => {
        setCurrentIndex(index);
        setPlayerActive(true);
    }

    // Alterna a visibilidade do downloader
    const toggleDownloader = () => {
        setIsDownloaderVisible(!isDownloaderVisible);
    };

    let safeSrc = "";
    let currentTitle = "";
    let currentIMG = "";
    let currentCantor = "";
    let currentVideo = "";

    if (currentIndex !== null && songs[currentIndex]) {
        const song = songs[currentIndex];
        currentTitle = song.title;
        currentIMG = song.player;
        currentCantor = song.artist;
        const cleanName = sanitizeFileName(currentTitle);
        safeSrc = song.path;
        currentVideo = song.videoPath ? song.videoPath : "";
    }
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && videoRef.current && PlayerActive) {
                // Força o vídeo a ir para o tempo exato da música ao voltar para a tela
                videoRef.current.currentTime = currentTime;
                videoRef.current.play().catch(() => {});
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [currentTime, PlayerActive]);
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !currentVideo) return;

        videoElement.load(); // Força o vídeo a carregar o novo SRC (o arquivo que acabou de surgir)
        if (PlayerActive) {
            videoElement.play().catch(e => console.log("Aguardando interação..."));
        }
    }, [currentVideo]); // Toda vez que o path do vídeo deixar de ser null, isso dispara
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (PlayerActive) {
            // Sincroniza o tempo antes de dar o play
            videoElement.currentTime = currentTime;
            videoElement.play().catch(err => {
                console.warn("Autoplay impedido:", err);
            });
        } else {
            videoElement.pause();
        }
    }, [PlayerActive, currentVideo]);

    useEffect(() => {
        if (videoRef.current && PlayerActive) {
            // Sincronização contínua leve: 
            // Só ajusta se a diferença for maior que 0.3 segundos para evitar "engasgos"
            if (Math.abs(videoRef.current.currentTime - currentTime) > 0.3) {
                videoRef.current.currentTime = currentTime;
            }
        }
    }, [currentTime]);
    return (
        <>
        <style>{userCss}</style>
        {currentVideo ? (
            <video
                ref={videoRef}
                id="video-background"
                src={currentVideo}
                autoPlay
                
                muted
                playsInline
            />
        ) : (
            <div id="background"></div>
        )}
        <WindowControls />
        <div className='app-container'>
            <button 
                onClick={window.electronAPI.openYoutubeMusic} 
                className="toggle-downloader-btn"
            >   <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                </svg>
            </button>

            {isDownloaderVisible && (
                <Downloader onDownloadComplete={refreshLibrary} className="Downloader"/>
            )}

            <Library 
                onPlaySong={handlePlaySong} 
                setSongsList={setSongs} 
                songs={songs}
                refreshLibrary={refreshLibrary}
                isPlayerActive={isPlayerOpen}
                isPlaying={PlayerActive}
                className="Library"
            />

            <Player 
                src={safeSrc} 
                trackTitle={currentTitle}
                onNext={nextSong}
                onPrev={prevSong}
                capa={currentIMG}
                cantor={currentCantor}
                onPlayStateChange={(state) => {
                    console.log("Estado do Player mudou para:", state);
                    setPlayerActive(state);}}
                className="Player"
                isShuffle={isShuffle}
                toggleShuffle={() => setIsShuffle(!isShuffle)}
                Time={setCurrentTime}
            />
        </div>
        </>
    );
};