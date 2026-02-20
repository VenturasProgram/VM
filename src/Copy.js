const { ipcRenderer } = require('electron');

// Função auxiliar para limpar a URL (remove playlist e index)
function limparLink(url) {
    try {
        const urlObj = new URL(url);
        // Remove os parâmetros que indicam playlist ou posição na fila
        urlObj.searchParams.delete('list');
        urlObj.searchParams.delete('index');
        urlObj.searchParams.delete('start_radio');
        return urlObj.toString();
    } catch (err) {
        console.error("Erro ao limpar URL:", err);
        return url; // Retorna original em caso de erro
    }
}

// Escuta cliques na janela do YouTube Music
window.addEventListener('click', (e) => {
    // Tenta encontrar o botão de copiar ou o botão de download
    const target = e.target.closest('tp-yt-paper-item, #primary-entry, .ytmusic-menu-service-item-download-renderer');
    
    if (target) {
        console.log("Botão de interação detectado!");

        // Aguarda o painel abrir e o input ser renderizado
        setTimeout(() => {
            const shareInput = document.querySelector('input#share-url.yt-copy-link-renderer');
            
            let finalLink = "";

            if (shareInput && shareInput.value) {
                console.log("Link extraído do input:", shareInput.value);
                finalLink = shareInput.value;
            } else {
                // Caso o input ainda não tenha valor, usamos a URL da barra
                console.log("Input não encontrado ou vazio, usando URL da barra.");
                finalLink = window.location.href;
            }

            // AQUI ESTÁ A MÁGICA: Limpamos o link antes de enviar
            if (finalLink) {
                const linkLimpo = limparLink(finalLink);
                console.log("Enviando link limpo (apenas a música):", linkLimpo);
                ipcRenderer.send('url-detectada-pelo-copy', linkLimpo);
            }

        }, 300); 
    }
}, true);