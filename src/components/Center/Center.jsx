import React, { useEffect, useState } from 'react'
import { Library } from '../Library/Library'
import { Player } from '../Player/Player'
import { Downloader } from '../Downloader/Downloader'

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
    // Dentro do seu componente Center
    const [isShuffle, setIsShuffle] = useState(false);
    
    // 1. Estado para controlar a visibilidade do Downloader
    const [isDownloaderVisible, setIsDownloaderVisible] = useState(false);
    const [userCss, setUserCss] = useState('');

    const isPlayerOpen = currentIndex !== null;
    useEffect(() => {
        const carregarCssInicial = async () => {
            const css = await window.electronAPI.getUserCss();
            setUserCss(css);
        };
        carregarCssInicial();

        window.electronAPI.onUpdateCss((css) => {
            setUserCss(css);
        });
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

    if (currentIndex !== null && songs[currentIndex]) {
        const song = songs[currentIndex];
        currentTitle = song.title;
        currentIMG = song.player;
        currentCantor = song.artist;
        const cleanName = sanitizeFileName(currentTitle);
        safeSrc = song.path;
    }

    return (
        <>
        <style>{userCss}</style>
        <div id="background"></div>
        <div className='app-container'>
            {/* 2. Botão com o ícone para abrir/fechar */}
<button 
    onClick={toggleDownloader} 
    className="toggle-downloader-btn"
>
    {isDownloaderVisible ? (<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
    </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-download" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
    </svg>)}
</button>

            {/* 3. Renderização condicional do Downloader */}
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
                onPlayStateChange={(state) => setPlayerActive(state)}
                className="Player"
                isShuffle={isShuffle}
                toggleShuffle={() => setIsShuffle(!isShuffle)}
            />
        </div>
        </>
    );
};