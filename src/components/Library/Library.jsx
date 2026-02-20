import React, { useEffect, useState, useMemo } from "react";

// Função auxiliar
const parseArtists = (artistString) => {
    if (!artistString) return ["Desconhecido"];
    return artistString.split(/[,;&]|\s+feat\.\s+/i).map(a => a.trim());
};

export function Library({ onPlaySong, setSongsList, songs, refreshLibrary, isPlayerActive }) {
    // --- ESTADOS ---
    const [fullLibrary, setFullLibrary] = useState([]); 
    const [artistsMap, setArtistsMap] = useState({});
    const [view, setView] = useState('all'); 
    const [selectedData, setSelectedData] = useState(null);
    const [isProcessingArtists, setIsProcessingArtists] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    
    // 1. Carregamento Inicial das Playlists consolidado no useState
    const [playlists, setPlaylists] = useState(() => {
        try {
            const saved = localStorage.getItem('my_music_playlists');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Erro ao carregar playlists do localStorage", e);
            return [];
        }
    });

    const libraryClass = `library-container ${isPlayerActive ? 'player-on' : 'player-off'}`;

    // 2. Persistência: Salvar Playlists sempre que mudarem
    useEffect(() => {
        localStorage.setItem('my_music_playlists', JSON.stringify(playlists));
    }, [playlists]);

    const carregarMusicas = async () => {
        const data = await window.electronAPI.getLibrary();
        setFullLibrary(data); 
        
        if (!songs || songs.length === 0) {
            setSongsList(data); 
        }
    };

    useEffect(() => {
        // Verifica se a prop é realmente uma função antes de chamar
        if (typeof refreshLibrary === 'function') {
            refreshLibrary(); 
        }
        carregarMusicas();

        const removeUpdateListener = window.electronAPI.onLibraryUpdated(() => {
            carregarMusicas();
        });

        const removeAddListener = window.electronAPI.onAddToPlaylist(({ playlistId, songId }) => {
            setPlaylists(prevPlaylists => {
                return prevPlaylists.map(pl => {
                    if (pl.id === playlistId) {
                        if (pl.songIds.includes(songId)) return pl;
                        return { ...pl, songIds: [...pl.songIds, songId] };
                    }
                    return pl;
                });
            });
        });

        // LIMPEZA SEGURA: Só executa se for uma função
        return () => {
            if (typeof removeUpdateListener === 'function') removeUpdateListener();
            if (typeof removeAddListener === 'function') removeAddListener(); 
        };
    }, []);

    useEffect(() => {
        const removePlayListener = window.electronAPI.onMenuPlay((index) => {
            if (typeof onPlaySong === 'function') {
                onPlaySong(index);
            }
        });
        
        // LIMPEZA SEGURA
        return () => {
            if (typeof removePlayListener === 'function') removePlayListener();
        };
    }, [onPlaySong]);

    // Processamento de Artistas
    useEffect(() => {
        if (!fullLibrary || fullLibrary.length === 0) {
            setArtistsMap({});
            return;
        }

        setIsProcessingArtists(true);
        const timer = setTimeout(() => {
            const map = {};
            fullLibrary.forEach(song => {
                if (!song || !song.artist) {
                    const unknown = "Desconhecido";
                    if (!map[unknown]) map[unknown] = [];
                    map[unknown].push(song);
                    return;
                }
                try {
                    const artistNames = parseArtists(song.artist);
                    artistNames.forEach(artistName => {
                        if (!map[artistName]) map[artistName] = [];
                        map[artistName].push(song);
                    });
                } catch (error) { console.error(error); }
            });
            setArtistsMap(map);
            setIsProcessingArtists(false);
        }, 100);
        return () => clearTimeout(timer);
    }, [fullLibrary]);

    const artistList = useMemo(() => Object.keys(artistsMap).sort(), [artistsMap]);

    // --- AÇÕES GERAIS ---
    const handleSavePlaylist = () => {
        if (newPlaylistName.trim() !== "") {
            const newPlaylist = {
                id: Date.now().toString(),
                name: newPlaylistName.trim(),
                songIds: []
            };
            
            setPlaylists([...playlists, newPlaylist]);
            setNewPlaylistName(""); 
            setIsModalOpen(false);  
        }
    };

    const handleContextMenu = (e, song) => {
        e.preventDefault();
        const sId = song.id || song.path; 

        window.electronAPI.showContextMenu({ 
            songId: sId, 
            filePath: song.path, 
            playlists: playlists.map(p => ({ id: p.id, name: p.name }))
        });
    };

    const handlePlayFromList = (songToPlay, currentContextList) => {
        setSongsList(currentContextList);
        const newIndex = currentContextList.findIndex(s => s.id === songToPlay.id);
        if (newIndex >= 0) onPlaySong(newIndex);
    };

    const openArtist = (artistName) => {
        setSelectedData({ type: 'artist', name: artistName, songs: artistsMap[artistName] });
        setView('artist_view');
    };

    // --- AÇÕES DE PLAYLIST ---
    const deletePlaylist = (playlistId) => {
        if (window.confirm("Tem certeza que deseja excluir esta playlist?")) {
            setPlaylists(playlists.filter(p => p.id !== playlistId));
            if (view === 'playlist_view' && selectedData?.id === playlistId) {
                setView('playlists');
            }
        }
    };

    const removeFromPlaylist = (playlistId, songId) => {
        const updatedPlaylists = playlists.map(playlist => {
            if (playlist.id === playlistId) {
                return { ...playlist, songIds: playlist.songIds.filter(id => id !== songId) };
            }
            return playlist;
        });
        setPlaylists(updatedPlaylists);
        
        if (selectedData && selectedData.id === playlistId) {
            setSelectedData(prev => ({ 
                ...prev, 
                songs: prev.songs.filter(s => s.id !== songId) 
            }));
        }
    };

    const openPlaylist = (playlist) => {
        setSelectedData({
            type: 'playlist',
            id: playlist.id,
            name: playlist.name,
            songIds: playlist.songIds
        });
        setView('playlist_view');
    };

    // --- RENDERIZAÇÃO ---
    const renderTabs = () => (
        <div className="Button-tabs">
            <button onClick={() => setView('all')} className={`tab-music ${view === 'all' ? 'active-tab' : ''}`}>Músicas</button>
            <button onClick={() => setView('artists')} className={`tab-artists ${view === 'artists' ? 'active-tab' : ''}`}>Artistas</button>
            <button onClick={() => setView('playlists')} className={`tab-playlists ${view === 'playlists' ? 'active-tab' : ''}`}>Playlists</button>
        </div>
    );

    return (
        <div className={libraryClass}>
            <div className="library-header">
                <h1 className="Titulo_library">Sua Biblioteca</h1>
                {view !== 'all' && view !== 'artists' && view !== 'playlists' && (
                    <button onClick={() => setView(selectedData?.type === 'artist' ? 'artists' : 'playlists')} className="btn-voltar">
                        ← Voltar
                    </button>
                )}
            </div>

            {['all', 'artists', 'playlists'].includes(view) && renderTabs()}

            {/* VIEW: TODAS AS MÚSICAS */}
            {view === 'all' && (
                <div className="song-grid">
                    {fullLibrary.map((song) => (
                        <SongCard 
                            key={song.id} 
                            song={song} 
                            onClick={() => handlePlayFromList(song, fullLibrary)} 
                            // CORREÇÃO: Agora envia a música inteira e corretamente
                            onContextMenu={(e) => handleContextMenu(e, song)}
                        />
                    ))}
                </div>
            )}

            {/* VIEW: ARTISTAS */}
            <div className="artists">
                {view === 'artists' && (
                    <>
                        {isProcessingArtists ? (
                            <div style={{ color: 'white', padding: '20px' }}>Processando artistas...</div>
                        ) : (
                            <div className="artist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                                {artistList.map(artist => (
                                    <div key={artist} className="artist-card" onClick={() => openArtist(artist)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                        <div style={{ width: '100px', height: '100px', background: '#333', borderRadius: '50%', margin: '0 auto' }}></div>
                                        <h3>{artist}</h3>
                                        <p>{artistsMap[artist]?.length || 0} músicas</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* VIEW: LISTA DE PLAYLISTS */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Criar Nova Playlist</h3>
                        <input 
                            type="text" 
                            placeholder="Nome da playlist" 
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)} 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePlaylist();
                            }}
                            autoFocus
                        />
                        <div className="modal-buttons">
                            <button onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancelar</button>
                            <button onClick={handleSavePlaylist} className="btn-confirm">Criar</button>
                        </div>
                    </div>
                </div>
            )}
            {view === 'playlists' && (
                <div className="playlists-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ color: 'white' }}>Minhas Playlists</h2>
                        <button onClick={() => setIsModalOpen(true)} className="btn-create-playlist">
                            + Criar Nova Playlist
                        </button>
                    </div>

                    <div className="playlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                        {playlists.map(pl => (
                            <div 
                                key={pl.id} 
                                className="playlist-card" 
                                onClick={() => openPlaylist(pl)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if(confirm(`Deseja excluir a playlist "${pl.name}"?`)) {
                                        setPlaylists(playlists.filter(p => p.id !== pl.id));
                                    }
                                }}
                                style={{ cursor: 'pointer', background: '#1a1a1a', padding: '15px', borderRadius: '10px', textAlign: 'center' }}
                            >
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                                <h3 style={{ color: 'white', margin: '5px 0' }}>{pl.name}</h3>
                                <p style={{ color: '#888', fontSize: '12px' }}>{pl.songIds.length} músicas</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* VIEW: DETALHE DO ARTISTA OU PLAYLIST */}
            {view === 'artist_view' && selectedData && (
                <div className="artist_songs">
                    <h2>Artista: {selectedData.name}</h2>
                    <div className="song-grid">
                        {selectedData.songs.map((song) => (
                            <SongCard 
                                key={song.id} 
                                song={song} 
                                onClick={() => handlePlayFromList(song, selectedData.songs)} 
                                // CORREÇÃO: Também ajustado aqui
                                onContextMenu={(e) => handleContextMenu(e, song)} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {view === 'playlist_view' && selectedData && (() => {
                const livePlaylist = playlists.find(p => p.id === selectedData.id);
                
                if (!livePlaylist) return <p>Playlist não encontrada.</p>;

                const musicasDaPlaylist = fullLibrary.filter(song => 
                    livePlaylist.songIds.includes(song.id) || livePlaylist.songIds.includes(song.path)
                );

                return (
                    <div className="artist_songs">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: 'white' }}>Playlist: {livePlaylist.name}</h2>
                            <button 
                                onClick={() => deletePlaylist(livePlaylist.id)} 
                                style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Excluir Playlist
                            </button>
                        </div>
                        
                        <div className="song-grid">
                            {musicasDaPlaylist.length === 0 ? (
                                <p style={{ color: '#888' }}>A playlist está vazia. Adicione músicas clicando com o botão direito nelas!</p>
                            ) : (
                                musicasDaPlaylist.map((song) => (
                                    <SongCard 
                                        key={song.id || song.path} 
                                        song={song} 
                                        onClick={() => handlePlayFromList(song, musicasDaPlaylist)} 
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (window.confirm(`Remover "${song.title}"?`)) {
                                                removeFromPlaylist(livePlaylist.id, song.id || song.path);
                                            }
                                        }}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function SongCard({ song, onClick, onContextMenu }) {
    return (
        <div className="song-card" onClick={onClick} onContextMenu={onContextMenu}>
            <img src={`${song.player}`} alt="Capa" className="Capa-song" />
            <div>
                <h3 className="Song-title">{song.title}</h3>
                <p className="Song-Artista">{song.artist}</p>
            </div>
        </div>
    );
}