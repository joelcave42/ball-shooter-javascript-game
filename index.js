const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const pointsEl = document.querySelector('#pointsEl')
const startButton = document.querySelector('#startButton')
const modalEl = document.querySelector('#modalEl')
const bigScoreEl = document.querySelector('#bigScoreEl')

class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }
    
    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }
}

//create a projectile that will shoot from the player
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }
    
    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }
    
    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }
    
    draw() {
        ctx.beginPath() 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }
    
    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

const friction = 0.98
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }
    
    draw() {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.beginPath() 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }
    
    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01
    }
}

const x = canvas.width / 2
const y = canvas.height / 2

//creates player object, projectiles array, and enemies array
let player = new Player(x, y, 10, 'gold')
let projectiles = []
let enemies = []
let particles = []

function init() {
    player = new Player(x, y, 10, 'gold')
    projectiles = []
    enemies = []
    particles = []
    pointsEl.innerHTML = score
    bigScoreEl.innerHTML = score
}

//spawns enemies
function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (30 - 4) + 4
        let x
        let y
        if(Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height
        } else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        }
        //make const color a random color not just green
        const color = `hsl(${Math.random() * 180 + 90}, 100%, 50%)`
        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 1000)
}

let animationId
let score = 0
function animate() {
    animationId = requestAnimationFrame(animate)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    player.draw()
    //draw particles on hit and gets rid of them
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update()
        }
    })
    //draw projectiles and gets rid of them when they go off screen
    projectiles.forEach((projectile, index) => {
        projectile.update()

        if (projectile.x - projectile.radius < 0 || projectile.x - projectile.radius > canvas.width || projectile.y - projectile.radius < 0 || projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }
    })

    enemies.forEach((enemy, index) => {
        enemy.update()
        //check for end of game (player touch enemy)
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId)
            modalEl.style.display = 'flex'
            bigScoreEl.innerHTML = score
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)

            //projectiles touch enemy
            if (dist - enemy.radius - projectile.radius < 1) {
                //create explosions of particles
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }))
                }
                //shrinks enemy on hit or destroys
                if (enemy.radius - 11 > 5) {
                    gsap.to(enemy, {
                        radius: enemy.radius - 11
                    })
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                } else {
                    score += 100
                    pointsEl.innerHTML = score
                    setTimeout(() => {
                        enemies.splice(index, 1)
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                }
            }
        })
    })
}

let shootingInterval;

window.addEventListener('mousedown', (event) => {
    window.addEventListener('mousemove', updateMousePosition);

    shootingInterval = setInterval(() => {
        const angle = shootingAngle; // Use the updated shootingAngle
        const velocity = {
            x: 3 * Math.cos(angle),
            y: 3 * Math.sin(angle)
        };
        projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'gold', velocity));
    }, 500); // 100 milliseconds interval
});

window.addEventListener('mouseup', () => {
    clearInterval(shootingInterval);
    window.removeEventListener('mousemove', updateMousePosition);
});

let shootingAngle = 0; // Initialize shootingAngle

function updateMousePosition(event) {
    // Update the mouse position for calculating the angle in the setInterval
    event.clientX = event.clientX || event.touches[0].clientX; // For touch events
    event.clientY = event.clientY || event.touches[0].clientY; // For touch events
    shootingAngle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
}

startButton.addEventListener('click', () => {
    init()
    animate()
    spawnEnemies()
    modalEl.style.display = 'none'
})