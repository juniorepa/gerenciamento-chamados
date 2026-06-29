/**
 * Hook customizado para permitir seleção de Câmera ou Galeria
 * Detecta o ambiente (mobile vs desktop) e oferece as opções apropriadas
 */

export const useCameraGalleryPicker = () => {
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const openCameraPicker = () => {
    if (isMobileDevice()) {
      // Mobile: abre câmera
      cameraInputRef.current?.click();
    } else {
      // Desktop: abre galeria por padrão
      galleryInputRef.current?.click();
    }
  };

  const showMediaOptions = (): Promise<'camera' | 'gallery'> => {
    return new Promise((resolve) => {
      if (!isMobileDevice()) {
        // Desktop: vai direto para galeria
        resolve('gallery');
        return;
      }

      // Mobile: mostra menu de seleção
      const options = confirm(
        '📸 Escolha a origem:\n\n✓ OK = Usar Câmera\n✗ Cancelar = Galeria'
      );

      resolve(options ? 'camera' : 'gallery');
    });
  };

  const handleMediaSelection = async (
    callback: (source: 'camera' | 'gallery') => void
  ) => {
    const source = await showMediaOptions();
    callback(source);
    
    if (source === 'camera') {
      cameraInputRef.current?.click();
    } else {
      galleryInputRef.current?.click();
    }
  };

  return {
    cameraInputRef,
    galleryInputRef,
    openCameraPicker,
    handleMediaSelection,
    isMobileDevice: isMobileDevice(),
  };
};
