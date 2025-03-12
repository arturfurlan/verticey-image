'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { EmojiClickData } from 'emoji-picker-react';

const ImageEditor = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [stretchFactor, setStretchFactor] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const textBarRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageLoaded(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Limitar o texto a 50 caracteres para evitar problemas de layout
    if (e.target.value.length <= 50) {
      setText(e.target.value);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    // Verificar se adicionar o emoji não excederá o limite de 50 caracteres
    if (text.length < 50) {
      setText((prevText) => prevText + emojiData.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleStretchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStretchFactor(parseFloat(e.target.value));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Função para ajustar a altura da barra de texto com base na imagem
  useEffect(() => {
    if (selectedImage && imageRef.current && textBarRef.current) {
      const adjustTextBar = () => {
        const imageHeight = imageRef.current?.offsetHeight || 0;
        // Garantir que a barra de texto não ocupe mais de 20% da altura da imagem
        const maxTextBarHeight = Math.max(50, Math.min(80, imageHeight * 0.2));
        textBarRef.current!.style.height = `${maxTextBarHeight}px`;
      };

      // Ajustar quando a imagem carregar
      const img = imageRef.current;
      if (img.complete) {
        adjustTextBar();
        setImageLoaded(true);
      } else {
        img.onload = () => {
          adjustTextBar();
          setImageLoaded(true);
        };
      }

      // Ajustar quando a janela for redimensionada
      window.addEventListener('resize', adjustTextBar);
      return () => {
        window.removeEventListener('resize', adjustTextBar);
      };
    }
  }, [selectedImage]);

  // Função para fazer o download da imagem editada
  const downloadImage = () => {
    if (!selectedImage || !imageRef.current || !textBarRef.current) return;
    
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Calcular as dimensões do canvas
        const textBarHeight = textBarRef.current!.offsetHeight;
        const imgWidth = img.width * stretchFactor;
        const imgHeight = img.height;
        
        canvas.width = imgWidth;
        canvas.height = imgHeight + textBarHeight;
        
        // Desenhar a barra de texto
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, textBarHeight);
        
        // Desenhar o texto
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Limitar o tamanho do texto para caber na barra
        const displayText = text || 'Adicione um texto aqui';
        const maxWidth = canvas.width * 0.9; // 90% da largura do canvas
        
        // Ajustar o tamanho da fonte se necessário
        let fontSize = 24;
        ctx.font = `bold ${fontSize}px Arial`;
        while (ctx.measureText(displayText).width > maxWidth && fontSize > 12) {
          fontSize -= 2;
          ctx.font = `bold ${fontSize}px Arial`;
        }
        
        ctx.fillText(displayText, canvas.width / 2, textBarHeight / 2, maxWidth);
        
        // Desenhar a imagem esticada
        ctx.drawImage(img, 0, textBarHeight, imgWidth, imgHeight);
        
        // Criar link de download
        const link = document.createElement('a');
        link.download = 'imagem-editada.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        setTimeout(() => {
          setIsDownloading(false);
        }, 1000);
      };
      
      img.onerror = () => {
        console.error('Erro ao carregar a imagem para download');
        setIsDownloading(false);
      };
      
      img.src = selectedImage;
    } catch (error) {
      console.error('Erro ao processar o download:', error);
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Verticey Editor</h1>
      
      {!selectedImage ? (
        <div className="w-full">
          <button
            onClick={triggerFileInput}
            className="w-full py-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-500">Clique para selecionar uma imagem</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      ) : (
        <div className="w-full space-y-6">
          <div className="relative border border-gray-200 rounded-lg overflow-hidden">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            <div 
              ref={textBarRef}
              className="bg-white py-3 px-4 text-center flex items-center justify-center absolute top-0 left-0 right-0 z-10 border-b border-gray-200"
              style={{ minHeight: '50px' }}
            >
              <p className="text-lg font-medium truncate">{text || 'Adicione um texto aqui'}</p>
            </div>
            <div className="overflow-hidden" style={{ marginTop: textBarRef.current?.offsetHeight || '50px' }}>
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Imagem selecionada"
                className="w-full object-contain"
                style={{ 
                  transform: `scaleX(${stretchFactor})`,
                  transformOrigin: 'center',
                  maxHeight: '500px'
                }}
                onLoad={handleImageLoad}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Digite seu texto aqui"
                  className="w-full p-2 border border-gray-300 rounded"
                  maxLength={50}
                />
                <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                  {text.length}/50
                </div>
              </div>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                😊
              </button>
            </div>

            {showEmojiPicker && (
              <div className="relative z-20">
                <div className="absolute right-0">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Esticar imagem: {stretchFactor.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={stretchFactor}
                onChange={handleStretchChange}
                className="w-full"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setText('');
                  setStretchFactor(1);
                  setImageLoaded(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={isDownloading}
              >
                Cancelar
              </button>
              <button
                onClick={downloadImage}
                className={`px-4 py-2 text-white rounded flex items-center justify-center ${isDownloading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                disabled={isDownloading || !imageLoaded}
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  'Baixar Imagem'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Canvas oculto para processamento da imagem */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageEditor; 