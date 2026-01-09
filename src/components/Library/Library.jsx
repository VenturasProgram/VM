import React,{ useEffect, useState } from "react";

export function Library({ onPlaySong, setSongsList, songs, refreshLibrary , isPlayerActive, isPlaying }) {
    const [caminhoLeitura, setCaminhoLeitura] = useState('');
    const libraryClass = `library-container ${isPlayerActive ? 'player-on' : 'player-off'}`;

    useEffect(() => {
        window.electronAPI.onMenuPlay((index) => {
            onPlaySong(index);
        })
    }, [onPlaySong]);
    useEffect(() => { 
        refreshLibrary(); // Usa a função vinda do pai ao montar o componente
    }, []);
    const carregarMusicas = async () => {
        const data = await window.electronAPI.getLibrary();
        console.log("Músicas carregadas:", data);
        setSongsList(data); // Salva a lista globalmente para o player conhecer os vizinhos
    };

    useEffect(() => { carregarMusicas(); 
        window.electronAPI.onLibraryUpdated(() => {
            console.log("Biblioteca atualizada!");
            carregarMusicas();
        });
        return () => window.electronAPI.removeLibraryListener();
    }, []);
    const handleContextMenu = (e, index, filePath) => {
        e.preventDefault();
        window.electronAPI.showContextMenu({ index, filePath });
    }

    return (
        <div className={libraryClass}>
            <h1 className="Titulo_library">Suas Musicas</h1>
            <div className="song-grid">
                {songs.map((song, index) => (
                    <div className="song-card" key={song.id} onClick={() => onPlaySong(index)} onContextMenu={(e) => handleContextMenu(e, index, song.path)}> 
                        <img src={`${song.player}`} alt="Capa" className="Capa-song" />
                        <div>
                            <h3 className="Song-title">{song.title}</h3>
                            <p className="Song-Artista">{song.artist}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}