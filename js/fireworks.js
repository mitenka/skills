class Fireworks {
    constructor() {
        this.colors = ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
    }

    createFirework(x, y) {
        const container = document.createElement('div');
        container.className = 'firework-container';
        document.body.appendChild(container);

        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = x + 'px';
        firework.style.top = y + 'px';
        firework.style.backgroundColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        container.appendChild(firework);

        // Create particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            
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

        // Create multiple fireworks
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const x = Math.random() * width;
                const y = height - (Math.random() * height * 0.3 + height * 0.2);
                this.createFirework(x, y);
            }, i * 200);
        }
    }
}

// Export for use in other files
window.Fireworks = Fireworks;
