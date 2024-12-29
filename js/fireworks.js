class Fireworks {
    constructor() {
        this.colors = [
            '#ff3333', // Яркий красный
            '#ff9933', // Яркий оранжевый
            '#ffff33', // Яркий желтый
            '#33ff33', // Яркий зеленый
            '#33ffff', // Яркий голубой
            '#3333ff', // Яркий синий
            '#ff33ff'  // Яркий розовый
        ];
    }

    createFirework(x, y) {
        const container = document.createElement('div');
        container.className = 'firework-container';
        document.body.appendChild(container);

        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = x + 'px';
        firework.style.top = y + 'px';
        firework.style.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        container.appendChild(firework);

        // Create particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.color = this.colors[Math.floor(Math.random() * this.colors.length)];
            
            const angle = (i * 12) * Math.PI / 180;
            const velocity = 50 + Math.random() * 50;
            particle.style.setProperty('--x', Math.cos(angle) * velocity + 'px');
            particle.style.setProperty('--y', Math.sin(angle) * velocity + 'px');
            
            container.appendChild(particle);
        }

        // Remove container after animation
        setTimeout(() => {
            container.remove();
        }, 1000);
    }

    celebrate() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Запускаем красивую волну салютов
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const x = Math.random() * width;
                const y = Math.random() * height * 0.8;
                this.createFirework(x, y);
            }, i * 150);
        }
    }
}

// Export for use in other files
window.Fireworks = Fireworks;
