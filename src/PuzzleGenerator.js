export class PuzzleGenerator {
    constructor(image, piecesX, piecesY) {
      this.image = image;
      this.piecesX = piecesX;
      this.piecesY = piecesY;
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.bordesPiezas = [];
      this.paths = []; // Aquí guardaremos los paths de cada pieza
    }
  
    initialize() {
      this.canvas.width = this.image.width;
      this.canvas.height = this.image.height;
      this.ctx.drawImage(this.image, 0, 0);
      
      this.pieceWidth = Math.floor(this.image.width / this.piecesX);
      this.pieceHeight = Math.floor(this.image.height / this.piecesY);
      
      // Inicializar todos los bordes a 0
      this.bordesPiezas = Array(this.piecesY).fill().map(() => 
          Array(this.piecesX).fill().map(() => ({
              arriba: 0,
              derecha: 0,
              abajo: 0,
              izquierda: 0
          }))
      );

      // Generar bordes aleatorios asegurando que encajen
      for (let y = 0; y < this.piecesY; y++) {
          for (let x = 0; x < this.piecesX; x++) {
              // Si no es el borde superior, el borde superior es opuesto al inferior de la pieza de arriba
              if (y > 0) {
                  this.bordesPiezas[y][x].arriba = -this.bordesPiezas[y-1][x].abajo;
              } else {
                  // Primera fila, generamos aleatoriamente
                  this.bordesPiezas[y][x].arriba = 0;
              }
              
              // Si no es el borde izquierdo, el borde izquierdo es opuesto al derecho de la pieza de la izquierda
              if (x > 0) {
                  this.bordesPiezas[y][x].izquierda = -this.bordesPiezas[y][x-1].derecha;
              } else {
                  // Primera columna, generamos aleatoriamente
                  this.bordesPiezas[y][x].izquierda = 0;
              }
              
              // Generar aleatoriamente los bordes derecho e inferior si no son bordes externos
              if (x < this.piecesX - 1) {
                  this.bordesPiezas[y][x].derecha = Math.random() < 0.5 ? 1 : -1;
              }
              if (y < this.piecesY - 1) {
                  this.bordesPiezas[y][x].abajo = Math.random() < 0.5 ? 1 : -1;
              }
          }
      }

      // Establecer bordes rectos en los extremos
      for (let x = 0; x < this.piecesX; x++) {
          this.bordesPiezas[0][x].arriba = 0;
          this.bordesPiezas[this.piecesY-1][x].abajo = 0;
      }
      for (let y = 0; y < this.piecesY; y++) {
          this.bordesPiezas[y][0].izquierda = 0;
          this.bordesPiezas[y][this.piecesX-1].derecha = 0;
      }

      // Guardar los paths
      this.paths = [];
      for (let y = 0; y < this.piecesY; y++) {
          for (let x = 0; x < this.piecesX; x++) {
              const path = new Path2D();
              const startX = x * this.pieceWidth;
              const startY = y * this.pieceHeight;
              
              path.moveTo(startX, startY);
              
              // Dibujar borde superior
              if (this.bordesPiezas[y][x].arriba === 0) {
                  path.lineTo(startX + this.pieceWidth, startY);
              } else {
                  const puntos = this.generarCurvaBezier(
                      startX, startY,
                      startX + this.pieceWidth, startY,
                      this.bordesPiezas[y][x].arriba
                  );
                  puntos.forEach(p => path.lineTo(p.x, p.y));
              }
              
              // Dibujar borde derecho
              if (this.bordesPiezas[y][x].derecha === 0) {
                  path.lineTo(startX + this.pieceWidth, startY + this.pieceHeight);
              } else {
                  const puntos = this.generarCurvaBezier(
                      startX + this.pieceWidth, startY,
                      startX + this.pieceWidth, startY + this.pieceHeight,
                      this.bordesPiezas[y][x].derecha
                  );
                  puntos.forEach(p => path.lineTo(p.x, p.y));
              }
              
              // Dibujar borde inferior
              if (this.bordesPiezas[y][x].abajo === 0) {
                  path.lineTo(startX, startY + this.pieceHeight);
              } else {
                  const puntos = this.generarCurvaBezier(
                      startX + this.pieceWidth, startY + this.pieceHeight,
                      startX, startY + this.pieceHeight,
                      this.bordesPiezas[y][x].abajo
                  );
                  puntos.forEach(p => path.lineTo(p.x, p.y));
              }
              
              // Dibujar borde izquierdo
              if (this.bordesPiezas[y][x].izquierda === 0) {
                  path.lineTo(startX, startY);
              } else {
                  const puntos = this.generarCurvaBezier(
                      startX, startY + this.pieceHeight,
                      startX, startY,
                      this.bordesPiezas[y][x].izquierda
                  );
                  puntos.forEach(p => path.lineTo(p.x, p.y));
              }
              
              path.closePath();
              this.paths.push({x, y, path});
          }
      }
    }
  
    generarCurvaBezier(x1, y1, x2, y2, tipo) {
      const longitud = Math.abs(x2 - x1) || Math.abs(y2 - y1);
      const esHorizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);
      
      if (esHorizontal) {
          const puntoMedioX = (x1 + x2) / 2;
          const anchoLengua = longitud * 0.25;  // Aumentado para más redondez
          const altoLengua = longitud * 0.25;   // Aumentado para más redondez
          
          if (tipo === 1) { // Lengüeta
              return [
                  {x: x1, y: y1, tipo: 'lineTo'},
                  {x: puntoMedioX - anchoLengua, y: y1, tipo: 'lineTo'},
                  {x: puntoMedioX, y: y1 - altoLengua, tipo: 'quadraticCurveTo', 
                   cpx: puntoMedioX - anchoLengua/2, cpy: y1 - altoLengua},
                  {x: puntoMedioX + anchoLengua, y: y1, tipo: 'quadraticCurveTo',
                   cpx: puntoMedioX + anchoLengua/2, cpy: y1 - altoLengua},
                  {x: x2, y: y2, tipo: 'lineTo'}
              ];
          } else if (tipo === -1) { // Muesca
              return [
                  {x: x1, y: y1, tipo: 'lineTo'},
                  {x: puntoMedioX - anchoLengua, y: y1, tipo: 'lineTo'},
                  {x: puntoMedioX, y: y1 + altoLengua, tipo: 'quadraticCurveTo',
                   cpx: puntoMedioX - anchoLengua/2, cpy: y1 + altoLengua},
                  {x: puntoMedioX + anchoLengua, y: y1, tipo: 'quadraticCurveTo',
                   cpx: puntoMedioX + anchoLengua/2, cpy: y1 + altoLengua},
                  {x: x2, y: y2, tipo: 'lineTo'}
              ];
          }
      } else {
          const puntoMedioY = (y1 + y2) / 2;
          const anchoLengua = longitud * 0.25;
          const altoLengua = longitud * 0.25;
          
          if (tipo === 1) { // Lengüeta
              return [
                  {x: x1, y: y1, tipo: 'lineTo'},
                  {x: x1, y: puntoMedioY - altoLengua, tipo: 'lineTo'},
                  {x: x1 - anchoLengua, y: puntoMedioY, tipo: 'quadraticCurveTo',
                   cpx: x1 - anchoLengua, cpy: puntoMedioY - altoLengua/2},
                  {x: x1, y: puntoMedioY + altoLengua, tipo: 'quadraticCurveTo',
                   cpx: x1 - anchoLengua, cpy: puntoMedioY + altoLengua/2},
                  {x: x1, y: y2, tipo: 'lineTo'}
              ];
          } else if (tipo === -1) { // Muesca
              return [
                  {x: x1, y: y1, tipo: 'lineTo'},
                  {x: x1, y: puntoMedioY - altoLengua, tipo: 'lineTo'},
                  {x: x1 + anchoLengua, y: puntoMedioY, tipo: 'quadraticCurveTo',
                   cpx: x1 + anchoLengua, cpy: puntoMedioY - altoLengua/2},
                  {x: x1, y: puntoMedioY + altoLengua, tipo: 'quadraticCurveTo',
                   cpx: x1 + anchoLengua, cpy: puntoMedioY + altoLengua/2},
                  {x: x1, y: y2, tipo: 'lineTo'}
              ];
          }
      }
      
      return [{x: x1, y: y1, tipo: 'lineTo'}, {x: x2, y: y2, tipo: 'lineTo'}];
    }
  
    generarPieza(x, y) {
      const canvas = document.createElement('canvas');
      canvas.width = this.pieceWidth * 1.5;
      canvas.height = this.pieceHeight * 1.5;
      canvas.style.border = 'none';
      canvas.style.background = 'transparent';
      const ctx = canvas.getContext('2d');
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const offsetX = this.pieceWidth * 0.25;
      const offsetY = this.pieceHeight * 0.25;
      const tabSize = this.pieceWidth * 0.2;
      const tabWidth = this.pieceWidth * 0.4;
      
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      
      // Borde superior
      if (y === 0) {
          ctx.lineTo(offsetX + this.pieceWidth, offsetY);
      } else {
          ctx.lineTo(offsetX + (this.pieceWidth - tabWidth) / 2, offsetY);
          ctx.arc(offsetX + this.pieceWidth / 2, offsetY, 
                 tabSize, Math.PI, 0, false);
          ctx.lineTo(offsetX + this.pieceWidth, offsetY);
      }
      
      // Borde derecho
      if (x === this.piecesX - 1) {
          ctx.lineTo(offsetX + this.pieceWidth, offsetY + this.pieceHeight);
      } else {
          ctx.lineTo(offsetX + this.pieceWidth, offsetY + (this.pieceHeight - tabWidth) / 2);
          ctx.arc(offsetX + this.pieceWidth, offsetY + this.pieceHeight / 2,
                 tabSize, -Math.PI/2, Math.PI/2, false);
          ctx.lineTo(offsetX + this.pieceWidth, offsetY + this.pieceHeight);
      }
      
      // Borde inferior
      if (y === this.piecesY - 1) {
          ctx.lineTo(offsetX, offsetY + this.pieceHeight);
      } else {
          ctx.lineTo(offsetX + (this.pieceWidth + tabWidth) / 2, offsetY + this.pieceHeight);
          ctx.arc(offsetX + this.pieceWidth / 2, offsetY + this.pieceHeight,
                 tabSize, 0, Math.PI, true);
          ctx.lineTo(offsetX, offsetY + this.pieceHeight);
      }
      
      // Borde izquierdo
      if (x === 0) {
          ctx.lineTo(offsetX, offsetY);
      } else {
          ctx.lineTo(offsetX, offsetY + (this.pieceHeight + tabWidth) / 2);
          ctx.arc(offsetX, offsetY + this.pieceHeight / 2,
                 tabSize, Math.PI/2, -Math.PI/2, true);
          ctx.lineTo(offsetX, offsetY);
      }
      
      ctx.closePath();
      
      // Aplicar el clip y dibujar la imagen
      ctx.save();
      ctx.clip();
      
      // Calculamos el área extra necesaria para las lengüetas
      const sourceX = Math.max(0, x * this.pieceWidth - tabSize);
      const sourceY = Math.max(0, y * this.pieceHeight - tabSize);
      const sourceWidth = this.pieceWidth + (x === 0 ? tabSize : tabSize * 2);
      const sourceHeight = this.pieceHeight + (y === 0 ? tabSize : tabSize * 2);
      
      // Ajustamos la posición de destino para mantener la alineación
      const destX = offsetX - (x === 0 ? 0 : tabSize);
      const destY = offsetY - (y === 0 ? 0 : tabSize);
      
      ctx.drawImage(
          this.image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          destX,
          destY,
          sourceWidth,
          sourceHeight
      );
      
      ctx.restore();
      
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      return canvas;
    }
  
    generarPuzzle() {
      const contenedor = document.createElement('div');
      contenedor.style.position = 'relative';
      contenedor.style.width = (this.canvas.width + 100) + 'px';
      contenedor.style.height = (this.canvas.height + 100) + 'px';
      contenedor.style.background = 'transparent';
      
      const piezas = [];
      
      // Generar todas las piezas
      for (let y = 0; y < this.piecesY; y++) {
        for (let x = 0; x < this.piecesX; x++) {
          const pieza = this.generarPieza(x, y);
          const wrapper = document.createElement('div');
          
          wrapper.style.position = 'absolute';
          wrapper.style.cursor = 'move';
          wrapper.style.userSelect = 'none';
          wrapper.style.background = 'transparent';
          
          let offsetX = 0;
          let offsetY = 0;
          
          const onMouseDown = (e) => {
            const rect = wrapper.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            wrapper.style.zIndex = '1000';
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          };
          
          const onMouseMove = (e) => {
            const contenedorRect = contenedor.getBoundingClientRect();
            const x = e.clientX - contenedorRect.left - offsetX;
            const y = e.clientY - contenedorRect.top - offsetY;
            
            wrapper.style.left = x + 'px';
            wrapper.style.top = y + 'px';
          };
          
          const onMouseUp = () => {
            wrapper.style.zIndex = '1';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          
          wrapper.addEventListener('mousedown', onMouseDown);
          wrapper.addEventListener('dragstart', (e) => e.preventDefault());
          
          wrapper.appendChild(pieza);
          contenedor.appendChild(wrapper);
          piezas.push(wrapper);
        }
      }
      
      // Solo desordenar la posición, sin rotar
      piezas.forEach(wrapper => {
        const randomX = Math.random() * (contenedor.offsetWidth - this.pieceWidth);
        const randomY = Math.random() * (contenedor.offsetHeight - this.pieceHeight);
        
        wrapper.style.left = randomX + 'px';
        wrapper.style.top = randomY + 'px';
      });

      return contenedor;
    }
  
    mostrarPatron() {
        const canvas = document.createElement('canvas');
        canvas.width = this.image.width;
        canvas.height = this.image.height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(this.image, 0, 0);
        
        const tabSize = this.pieceWidth * 0.2;
        const tabWidth = this.pieceWidth * 0.4;
        
        for (let y = 0; y < this.piecesY; y++) {
            for (let x = 0; x < this.piecesX; x++) {
                const startX = x * this.pieceWidth;
                const startY = y * this.pieceHeight;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                
                // Borde superior
                if (this.bordesPiezas[y][x].arriba === 0) {
                    ctx.lineTo(startX + this.pieceWidth, startY);
                } else if (this.bordesPiezas[y][x].arriba === 1) {
                    // Lengüeta
                    ctx.lineTo(startX + (this.pieceWidth - tabWidth) / 2, startY);
                    ctx.bezierCurveTo(
                        startX + (this.pieceWidth - tabWidth) / 2, startY - tabSize,
                        startX + (this.pieceWidth + tabWidth) / 2, startY - tabSize,
                        startX + (this.pieceWidth + tabWidth) / 2, startY
                    );
                    ctx.lineTo(startX + this.pieceWidth, startY);
                } else {
                    // Muesca
                    ctx.lineTo(startX + (this.pieceWidth - tabWidth) / 2, startY);
                    ctx.bezierCurveTo(
                        startX + (this.pieceWidth - tabWidth) / 2, startY + tabSize,
                        startX + (this.pieceWidth + tabWidth) / 2, startY + tabSize,
                        startX + (this.pieceWidth + tabWidth) / 2, startY
                    );
                    ctx.lineTo(startX + this.pieceWidth, startY);
                }
                
                // Borde derecho
                if (this.bordesPiezas[y][x].derecha === 0) {
                    ctx.lineTo(startX + this.pieceWidth, startY + this.pieceHeight);
                } else if (this.bordesPiezas[y][x].derecha === 1) {
                    // Lengüeta
                    ctx.lineTo(startX + this.pieceWidth, startY + (this.pieceHeight - tabWidth) / 2);
                    ctx.bezierCurveTo(
                        startX + this.pieceWidth + tabSize, startY + (this.pieceHeight - tabWidth) / 2,
                        startX + this.pieceWidth + tabSize, startY + (this.pieceHeight + tabWidth) / 2,
                        startX + this.pieceWidth, startY + (this.pieceHeight + tabWidth) / 2
                    );
                    ctx.lineTo(startX + this.pieceWidth, startY + this.pieceHeight);
                } else {
                    // Muesca
                    ctx.lineTo(startX + this.pieceWidth, startY + (this.pieceHeight - tabWidth) / 2);
                    ctx.bezierCurveTo(
                        startX + this.pieceWidth - tabSize, startY + (this.pieceHeight - tabWidth) / 2,
                        startX + this.pieceWidth - tabSize, startY + (this.pieceHeight + tabWidth) / 2,
                        startX + this.pieceWidth, startY + (this.pieceHeight + tabWidth) / 2
                    );
                    ctx.lineTo(startX + this.pieceWidth, startY + this.pieceHeight);
                }
                
                // Borde inferior
                if (this.bordesPiezas[y][x].abajo === 0) {
                    ctx.lineTo(startX, startY + this.pieceHeight);
                } else if (this.bordesPiezas[y][x].abajo === 1) {
                    // Lengüeta
                    ctx.lineTo(startX + (this.pieceWidth + tabWidth) / 2, startY + this.pieceHeight);
                    ctx.bezierCurveTo(
                        startX + (this.pieceWidth + tabWidth) / 2, startY + this.pieceHeight + tabSize,
                        startX + (this.pieceWidth - tabWidth) / 2, startY + this.pieceHeight + tabSize,
                        startX + (this.pieceWidth - tabWidth) / 2, startY + this.pieceHeight
                    );
                    ctx.lineTo(startX, startY + this.pieceHeight);
                } else {
                    // Muesca
                    ctx.lineTo(startX + (this.pieceWidth + tabWidth) / 2, startY + this.pieceHeight);
                    ctx.bezierCurveTo(
                        startX + (this.pieceWidth + tabWidth) / 2, startY + this.pieceHeight - tabSize,
                        startX + (this.pieceWidth - tabWidth) / 2, startY + this.pieceHeight - tabSize,
                        startX + (this.pieceWidth - tabWidth) / 2, startY + this.pieceHeight
                    );
                    ctx.lineTo(startX, startY + this.pieceHeight);
                }
                
                // Borde izquierdo
                if (this.bordesPiezas[y][x].izquierda === 0) {
                    ctx.lineTo(startX, startY);
                } else if (this.bordesPiezas[y][x].izquierda === 1) {
                    // Lengüeta
                    ctx.lineTo(startX, startY + (this.pieceHeight + tabWidth) / 2);
                    ctx.bezierCurveTo(
                        startX - tabSize, startY + (this.pieceHeight + tabWidth) / 2,
                        startX - tabSize, startY + (this.pieceHeight - tabWidth) / 2,
                        startX, startY + (this.pieceHeight - tabWidth) / 2
                    );
                    ctx.lineTo(startX, startY);
                } else {
                    // Muesca
                    ctx.lineTo(startX, startY + (this.pieceHeight + tabWidth) / 2);
                    ctx.bezierCurveTo(
                        startX + tabSize, startY + (this.pieceHeight + tabWidth) / 2,
                        startX + tabSize, startY + (this.pieceHeight - tabWidth) / 2,
                        startX, startY + (this.pieceHeight - tabWidth) / 2
                    );
                    ctx.lineTo(startX, startY);
                }
                
                ctx.closePath();
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        return canvas;
    }
  }