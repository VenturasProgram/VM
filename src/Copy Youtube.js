const { ipcRenderer } = require('electron');

// Variável global para armazenar o nome da música selecionada na biblioteca
let targetFileName = null;

// Escuta o nome enviado pelo processo principal (Main) quando você clica em "Baixar Versão em Vídeo"
ipcRenderer.on('target-filename', (event, fileName) => {
    targetFileName = fileName;
    console.log("Nome do alvo definido como:", targetFileName);
});

// Função auxiliar para limpar a URL
function limparLink(url) {
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.delete('list');
        urlObj.searchParams.delete('index');
        urlObj.searchParams.delete('start_radio');
        return urlObj.toString();
    } catch (err) {
        console.error("Erro ao limpar URL:", err);
        return url;
    }
}

function injectShareButton() {
    const actionsBar = document.querySelector('.ytp-overlay-top-right');
    const player = document.querySelector('#movie_player');

    if (actionsBar && !document.getElementById('custom-protocol-share-btn')) {
        const btn = document.createElement('button');
        btn.id = 'custom-protocol-share-btn';
        btn.innerText = 'Share to VM';
        
        Object.assign(btn.style, {
            background: '#ff0000',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '18px',
            cursor: 'pointer',
            marginLeft: '8px',
            fontWeight: 'bold',
            zIndex: '999',
            transition: 'opacity 0.25s cubic-bezier(0, 0, 0.2, 1)'
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const videoUrl = limparLink(window.location.href);
            
            // AGORA ENVIAMOS UM OBJETO COM A URL E O NOME ALVO
            ipcRenderer.invoke('download-video', { 
                url: videoUrl, 
                fileName: targetFileName 
            });
            
            const originalText = btn.innerText;
            btn.innerText = 'Enviado!';
            setTimeout(() => btn.innerText = originalText, 2000);
        });

        actionsBar.appendChild(btn);
        syncVisibility(player, btn);
    }
}

// ... (Função syncVisibility permanece a mesma)
function syncVisibility(player, btn) {
    if (!player || !btn) return;
    const visibilityObserver = new MutationObserver(() => {
        if (player.classList.contains('ytp-autohide')) {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
        } else {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    });
    visibilityObserver.observe(player, { attributes: true, attributeFilter: ['class'] });
}

// Observer para injetar botão
if (document.body) {
    const mainObserver = new MutationObserver(() => injectShareButton());
    mainObserver.observe(document.body, { childList: true, subtree: true });
    injectShareButton();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        const mainObserver = new MutationObserver(() => injectShareButton());
        mainObserver.observe(document.body, { childList: true, subtree: true });
        injectShareButton();
    });
}

// Escuta cliques adicionais (como no botão de compartilhar do YouTube)
window.addEventListener('click', (e) => {
    const target = e.target.closest('tp-yt-paper-item, #primary-entry, .ytd-menu-service-item-download-renderer');
    
    if (target) {
        setTimeout(() => {
            const shareInput = document.querySelector('input#share-url.yt-copy-link-renderer');
            let finalLink = shareInput?.value || window.location.href;
            
            if (finalLink) {
                const linkLimpo = limparLink(finalLink);
                // TAMBÉM ENVIAMOS O NOME AQUI
                ipcRenderer.invoke('download-video', { 
                    url: linkLimpo, 
                    fileName: targetFileName 
                });
            }
        }, 300); 
    }
}, true);