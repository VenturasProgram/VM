import React, { useRef, useEffect, useState } from 'react';

export function Visualizar({ audioData, imageSrc }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(new Image());
    const [colors, setColors] = useState({ primary: '#91662a', secondary: '#FCCB6F' });
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        const img = imgRef.current;
        img.crossOrigin = "Anonymous"; // Evita problemas de CORS ao ler pixels
        img.src = imageSrc;
        
        img.onload = () => {
            extractColors(img);
            setIsImageLoaded(true);
        };
    }, [imageSrc]);

    // Função para extrair cores dominantes da imagem
    const extractColors = (img) => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 50; // Tamanho pequeno para performance
        tempCanvas.height = 50;
        tempCtx.drawImage(img, 0, 0, 50, 50);
        
        const data = tempCtx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0;
        
        // Média simples de cores para encontrar a cor predominante
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        
        const count = data.length / 4;
        const avgR = Math.floor(r / count);
        const avgG = Math.floor(g / count);
        const avgB = Math.floor(b / count);

        setColors({
            primary: `rgb(${avgR}, ${avgG}, ${avgB})`,
            secondary: `rgb(${Math.min(avgR + 50, 255)}, ${Math.min(avgG + 50, 255)}, ${Math.min(avgB + 50, 255)})`
        });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !audioData || audioData.length === 0) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const displaySize = 900;

        if (canvas.width !== displaySize * dpr) {
            canvas.width = displaySize * dpr;
            canvas.height = displaySize * dpr;
            canvas.style.width = `${displaySize}px`;
            canvas.style.height = `${displaySize}px`;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, displaySize, displaySize);

        const centerX = displaySize / 2;
        const centerY = displaySize / 2;
        const radius = 250;

        // Cálculo de Intensidade
        const bassPart = audioData.slice(0, Math.floor(audioData.length * 0.1));
        const bassAverage = bassPart.reduce((a, b) => a + b, 0) / (bassPart.length || 1);
        const bassIntensity = bassAverage / 255;
        const pulse = Math.pow(bassIntensity, 2) * 1.2;

        // --- 1. DEFINIR GRADIENTE DINÂMICO (O EFEITO DE FADE) ---
        const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + 100);
        gradient.addColorStop(0, colors.primary);
        // O "fade" acontece aqui: a opacidade da segunda cor reage ao pulso
        gradient.addColorStop(1, colors.secondary.replace('rgb', 'rgba').replace(')', `, ${0.2 + (bassIntensity * 0.8)})`));

        // --- 2. DESENHO DA FORMA ---
        ctx.beginPath();
        const totalPoints = audioData.length;
        for (let i = 0; i < totalPoints; i++) {
            const index = i < totalPoints / 2 ? i : totalPoints - 1 - i;
            const dynamicRadius = radius + (pulse * 30);
            const amplitude = (audioData[index] / 255) * 70;
            const angle = (i * 2 * Math.PI) / totalPoints;
            const x = centerX + (dynamicRadius + amplitude) * Math.cos(angle);
            const y = centerY + (dynamicRadius + amplitude) * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // --- 3. RENDERIZAÇÃO ---
        ctx.save();
        ctx.clip();
        if (isImageLoaded) {
            const img = imgRef.current;
            const baseSize = radius * 3.2; 
            const drawSize = baseSize + (pulse * 60);
            const imgRatio = img.width / img.height;
            
            let renderW = drawSize, renderH = drawSize;
            if (imgRatio > 1) renderW = drawSize * imgRatio;
            else renderH = drawSize / imgRatio;

            ctx.drawImage(img, centerX - (renderW/2), centerY - (renderH/2), renderW, renderH);
        }
        ctx.restore();

        // --- 4. ESTILO DA LINHA (FADE E BRILHO) ---
        ctx.lineWidth = 5;
        ctx.strokeStyle = gradient; // Usa o gradiente extraído da imagem
        ctx.shadowBlur = 15 + (pulse * 40);
        ctx.shadowColor = colors.primary;
        ctx.stroke();

        // Flash de batida forte
        if (bassIntensity > 0.65) {
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 7;
            ctx.stroke();
        }

    }, [audioData, isImageLoaded, colors]);

    return <canvas ref={canvasRef} className="visualizer-overlay" />;
}