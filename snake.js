// ---------------------- Variables Importantes ------------------------------------
const cellSize = 25; //Tamaño de las casillas del tablero
const FPS = 1000 / 10; //El juego corre a 15 FPS
let lastFrame = 0; //Ultimo frame

//Objeto que guarda los estados de las teclas
const keyState = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};
Object.seal(keyState); //Esta linea impide que se agreguen mas propiedades al objeto

// ---------------------- CLASE SERPIENTE -----------------------------------------
class Snake {
  constructor() {
    this.snakeBoxes = [
      { x: 0, y: 11 },
      { x: 1, y: 11 },
      { x: 2, y: 11 },
    ];
    this.dx = 0;
    this.dy = 0;
  }

  // Imprime la serpiente en pantalla
  drawSnake(ctx) {
    this.snakeBoxes.forEach((snakeBox) => {
      drawBox(ctx, '#cbff52', snakeBox.x * cellSize, snakeBox.y * cellSize);
    });
  }

  // Modifica el movimiento de la serpiente dependiendo de la tecla presionada
  keyPressed() {
    const keyPressed = Object.entries(keyState).filter(([key, value]) => {
      return value === true;
    });
    if (keyPressed.length === 1) {
      const key = keyPressed[0][0];
      switch (key) {
        case 'ArrowUp':
          if (this.dy !== 1) {
            this.dx = 0;
            this.dy = -1;
          }
          break;
        case 'ArrowDown':
          if (this.dy !== -1) {
            this.dx = 0;
            this.dy = 1;
          }
          break;
        case 'ArrowLeft':
          if (this.dx !== 1) {
            this.dx = -1;
            this.dy = 0;
          }
          break;
        case 'ArrowRight':
          if (this.dx !== -1) {
            this.dx = 1;
            this.dy = 0;
          }
          break;
        default:
          break;
      }
    }
  }

  // Actualiza los cuadritos de la serpiente
  updateSnake(ctx) {
    if (!(this.dx === 0 && this.dy === 0)) {
      const head = this.snakeBoxes.slice(-1)[0];
      const x = head['x'] + this.dx;
      const y = head['y'] + this.dy;
      this.snakeBoxes.push({ x, y });
      const removedTail = this.snakeBoxes.shift();
      const color =
        (removedTail['x'] + removedTail['y']) % 2 === 0 ? '#3c6eb1' : '#6497dd';
      drawBox(
        ctx,
        color,
        removedTail['x'] * cellSize,
        removedTail['y'] * cellSize
      );
    }
  }

  // Accion de comer de la serpierte
  eat(ctx, food) {
    const head = this.snakeBoxes.slice(-1)[0];
    const foodX = food['x'] / cellSize;
    const foodY = food['y'] / cellSize;
    if (head['x'] === foodX && head['y'] === foodY) {
      const tail = this.snakeBoxes[0];
      const x = tail['x'] - this.dx;
      const y = tail['y'] - this.dy;
      this.snakeBoxes.unshift({ x, y });
      food.spawn(ctx, this.snakeBoxes);
    }

    const imageData = ctx.getImageData(food.x, food.y, cellSize, cellSize);
    const color = imageData.data;
    if (color[0] !== 255 && color[1] !== 0 && color[2] !== 0) {
      console.log(`rgb(${color[0]}, ${color[1]}, ${color[2]}`);
      // drawBox(ctx, 'red', food.x, food.y);
      food.spawn(ctx, this.snakeBoxes);
    }
  }

  // Mueve la serpiente en pantalla
  moveSnake = (ctx, food, timestamp) => {
    this.keyPressed();
    // Calcula la diferencia de tiempo desde el ultimo frame
    const deltaTime = timestamp - lastFrame;

    // Checa si a pasado el suficiente tiempo para renderizar el frame
    if (deltaTime > FPS) {
      this.eat(ctx, food);
      this.updateSnake(ctx);
      this.drawSnake(ctx);

      // Actualiza el tiempo del ultimo frame
      lastFrame = timestamp - (deltaTime % FPS);
    }

    // Con bind hacemos que el metodo moveSnake se ponga dentro del ambito de la clase Snake
    // Solicita el siguiente frame
    requestAnimationFrame(this.moveSnake.bind(this, ctx, food));
  };
}

// -------------------------------- MANZANA ------------------------------------------
function Food() {
  this.x = 0;
  this.y = 0;
}

// Obtiene un numero aleatorio para las coordenadas de la manzana
function getRandomNumbers() {
  let x = Math.floor(Math.random() * (22 - 0) + 0) * cellSize;
  let y = Math.floor(Math.random() * (22 - 0) + 0) * cellSize;
  return { x, y };
}

// Verifica que las coordenadas no coincidan con la de la serpiente
function collision(snakeBoxes, x, y) {
  for (let snakeBox of snakeBoxes) {
    if (snakeBox.x === x && snakeBox.y === y) {
      return true;
    }
  }
  return false;
}

// Asigna las coordernadas a la manzana
Food.prototype.assignCoords = function (snakeBoxes) {
  let coords = getRandomNumbers();
  while (collision(snakeBoxes, coords['x'], coords['y'])) {
    coords = getRandomNumbers();
  }
  this.x = coords['x'];
  this.y = coords['y'];
};

// Funcion que spawnea la manzana
Food.prototype.spawn = function (ctx, snakeBoxes) {
  this.assignCoords(snakeBoxes);
  drawBox(ctx, 'red', this.x, this.y);
};

// ----------------------------- TABLERO --------------------------------------------
// Colorea una casilla del tablero
function drawBox(ctx, color, x, y) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, cellSize, cellSize);
}

// Imprime el tablero en pantalla
function drawBoard(ctx) {
  for (let i = 0; i < 23; i++) {
    for (let j = 0; j < 23; j++) {
      const x = i * cellSize;
      const y = j * cellSize;
      let color = (i + j) % 2 === 0 ? '#3c6eb1' : '#6497dd';
      drawBox(ctx, color, x, y);
    }
  }
}

// ------------------  Imprime el cuadro cuando el DOM este listo -----------------
document.addEventListener('DOMContentLoaded', () => {
  const board = document.querySelector('#snake-board');
  const ctx = board.getContext('2d');
  board.height = 575;
  board.width = 575;
  drawBoard(ctx);
  const apple = new Food();
  const snake = new Snake();

  window.addEventListener('keydown', (e) => {
    keyState[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    keyState[e.key] = false;
  });

  apple.spawn(ctx, snake.snakeBoxes);
  snake.drawSnake(ctx);
  snake.moveSnake(ctx, apple);
});
