import { useEffect } from 'react';

const SakuraFalling = () => {
  useEffect(() => {
    const createPetal = () => {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';
      petal.style.left = Math.random() * 100 + 'vw';
      petal.style.animationDuration = (Math.random() * 4 + 6) + 's';
      petal.style.animationDelay = Math.random() * 2 + 's';
      
      // Random size for variety
      const size = Math.random() * 10 + 15; // 15-25px
      petal.style.width = size + 'px';
      petal.style.height = size + 'px';
      
      document.body.appendChild(petal);

      setTimeout(() => {
        petal.remove();
      }, 12000);
    };

    // Create petals more frequently for more visible effect
    const interval = setInterval(createPetal, 150);
    
    // Create initial burst of petals
    for (let i = 0; i < 30; i++) {
      setTimeout(createPetal, i * 50);
    }

    return () => {
      clearInterval(interval);
      document.querySelectorAll('.sakura-petal').forEach(petal => petal.remove());
    };
  }, []);

  return null;
};

export default SakuraFalling;
