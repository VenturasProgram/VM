import React, { useState, useEffect } from 'react';

export function Downloader({onDownloadComplete}) {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Escuta as atualizações de progresso vindas do Electron
        window.electronAPI.onProgress((value) => {
            setProgress(value);
        });
    }, []);

    const handleDownload = async () => {
        if (!url) return alert("Coloque uma URL!");
        
        setStatus("Baixando...");
        setProgress(0); // Reseta a barra

        try {
            const caminho =await window.electronAPI.baixarMusica(url); // nome da sua função no bridge
            setStatus(`Download Concluído! ${caminho}`);
            setProgress(100);
            if (typeof onDownloadComplete === 'function') {
                onDownloadComplete();
            }
        } catch (error) {
            setStatus("Erro: " + error);
        }
    };

    return (
        <div className='Downloader'>
            <h1>Music Downloader</h1>
            <input 
                type="text" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="Link do YouTube..."
                className='Barra_de_Link'
            />
            <button onClick={handleDownload} className='Botão_Download'>
                Baixar MP3
            </button>

            {/* Barra de Progresso */}
            <div>
                <p className='Status'>Status: {status}</p>
                <div>
                    <div className='Barra_de_processo'>
                        {progress > 0 ? `${progress}%` : ''}
                    </div>
                </div>
            </div>
        </div>
    );
}