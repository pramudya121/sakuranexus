import { useEffect } from 'react';

const SakuraFalling = () => {
  useEffect(() => {
    const createPetal = () => {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';
      
      // Random position across screen
      petal.style.left = `${Math.random() * 100}%`;
      
      // Random animation duration (10-30 seconds)
      const fallDuration = 10 + Math.random() * 20;
      petal.style.animationDuration = `${fallDuration}s, ${2 + Math.random() * 2}s`;
      
      // Random delay
      petal.style.animationDelay = `${Math.random() * 5}s`;
      
      // Random size
      const size = 15 + Math.random() * 10;
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      
      document.body.appendChild(petal);
      
      // Remove petal after animation
      setTimeout(() => {
        petal.remove();
      }, fallDuration * 1000 + 5000);
    };

    // Create initial petals
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        createPetal();
      }, i * 200);
    }

    // Continuously create petals
    const interval = setInterval(() => {
      createPetal();
    }, 1500);

    return () => {
      clearInterval(interval);
      // Clean up petals
      document.querySelectorAll('.sakura-petal').forEach(petal => petal.remove());
    };
  }, []);

  return null;
};

export default SakuraFalling;
