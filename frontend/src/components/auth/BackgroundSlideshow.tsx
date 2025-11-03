import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';

// Import imagens do diretório assets (na raiz do frontend)
// Caminho relativo a partir de src/components/auth
import img1 from '../../../assets/fachada-ministerio-da-saude.jpg';
import img2 from '../../../assets/53663734902_4a87468b1b_h.jpg';
import img3 from '../../../assets/ministerio-da-saude-49702074856.jpg';

interface BackgroundSlideshowProps {
  intervalMs?: number;
  dimOpacity?: number; // 0 a 1
}

const BackgroundSlideshow: React.FC<BackgroundSlideshowProps> = ({ intervalMs = 7000, dimOpacity = 0.55 }) => {
  const images = useMemo(() => [img1, img2, img3], []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {images.map((src, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'opacity 1s ease-in-out',
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}
      {/* Camada de ofuscamento */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0,0,0,${dimOpacity})`,
        }}
      />
    </Box>
  );
};

export default BackgroundSlideshow;
