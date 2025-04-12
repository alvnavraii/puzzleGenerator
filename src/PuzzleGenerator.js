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
      const puzzleWidth = this.pieceWidth * this.piecesX;
      const puzzleHeight = this.pieceHeight * this.piecesY;
      
      const contenedor = document.createElement('div');
      contenedor.style.position = 'relative';
      contenedor.style.width = (puzzleWidth + 400) + 'px';
      contenedor.style.height = (puzzleHeight + 200) + 'px';
      contenedor.style.background = 'transparent';
      
      const areaJuego = document.createElement('div');
      areaJuego.style.position = 'absolute';
      areaJuego.style.left = '50px';
      areaJuego.style.top = '50px';
      areaJuego.style.width = puzzleWidth + 'px';
      areaJuego.style.height = puzzleHeight + 'px';
      areaJuego.style.border = '2px dashed #666';
      areaJuego.style.background = 'rgba(200, 200, 200, 0.2)';
      contenedor.appendChild(areaJuego);
      
      const piezas = [];
      let elementoActivo = null;
      let offsetX = 0;
      let offsetY = 0;
      let isDragging = false;  // Nueva variable para controlar el arrastre
      
      // Función para mover elementos
      const moverElemento = (e) => {
          if (!isDragging || !elementoActivo) return;
          
          const rect = contenedor.getBoundingClientRect();
          const areaRect = areaJuego.getBoundingClientRect();
          const newX = e.clientX - rect.left - offsetX;
          const newY = e.clientY - rect.top - offsetY;
          
          // Limitar el movimiento al área visible
          const maxX = contenedor.offsetWidth - elementoActivo.offsetWidth;
          const maxY = contenedor.offsetHeight - elementoActivo.offsetHeight;
          
          elementoActivo.style.left = Math.max(0, Math.min(maxX, newX)) + 'px';
          elementoActivo.style.top = Math.max(0, Math.min(maxY, newY)) + 'px';
          
          // Feedback visual del área de juego
          const sobreAreaJuego = e.clientX >= areaRect.left && 
                                e.clientX <= areaRect.right && 
                                e.clientY >= areaRect.top && 
                                e.clientY <= areaRect.bottom;
          
          areaJuego.style.background = sobreAreaJuego ? 
              'rgba(200, 200, 200, 0.4)' : 
              'rgba(200, 200, 200, 0.2)';
      };
      
      // Evento mousedown
      contenedor.addEventListener('mousedown', (e) => {
          const elemento = e.target.closest('div[data-x], div.grupo');
          if (!elemento || e.button !== 0) return;
          
          isDragging = true;
          elementoActivo = elemento;
          
          // Si el elemento clickeado es parte de un grupo, usar el grupo como elemento activo
          if (!elemento.classList.contains('grupo')) {
              const grupoParent = elemento.closest('.grupo');
              if (grupoParent) {
                  elementoActivo = grupoParent;
              }
          }
          
          const rect = elementoActivo.getBoundingClientRect();
          offsetX = e.clientX - rect.left;
          offsetY = e.clientY - rect.top;
          elementoActivo.style.zIndex = '1000';
          e.preventDefault();
      });
      
      // Evento mouseup - Ahora en el document para capturar siempre
      document.addEventListener('mouseup', (e) => {
          if (!isDragging || !elementoActivo) return;
          
          isDragging = false;
          const areaRect = areaJuego.getBoundingClientRect();
          
          const sobreAreaJuego = e.clientX >= areaRect.left && 
                                e.clientX <= areaRect.right && 
                                e.clientY >= areaRect.top && 
                                e.clientY <= areaRect.bottom;
          
          if (sobreAreaJuego) {
              const elementos = Array.from(contenedor.children).filter(el => 
                  el !== elementoActivo && (el.hasAttribute('data-x') || el.classList.contains('grupo'))
              );

              // Ordenar elementos por distancia al elemento activo
              const elementoActRect = elementoActivo.getBoundingClientRect();
              elementos.sort((a, b) => {
                  const rectA = a.getBoundingClientRect();
                  const rectB = b.getBoundingClientRect();
                  const distA = Math.hypot(
                      rectA.left - elementoActRect.left,
                      rectA.top - elementoActRect.top
                  );
                  const distB = Math.hypot(
                      rectB.left - elementoActRect.left,
                      rectB.top - elementoActRect.top
                  );
                  return distA - distB;
              });

              for (const otroElemento of elementos) {
                  if (this.sonAdyacentes(elementoActivo, otroElemento)) {
                      const rect1 = elementoActivo.getBoundingClientRect();
                      const rect2 = otroElemento.getBoundingClientRect();
                      
                      const centro1 = {
                          x: rect1.left + rect1.width/2,
                          y: rect1.top + rect1.height/2
                      };
                      const centro2 = {
                          x: rect2.left + rect2.width/2,
                          y: rect2.top + rect2.height/2
                      };
                      
                      const distanciaActual = Math.hypot(
                          centro1.x - centro2.x,
                          centro1.y - centro2.y
                      );
                      
                      // Aumentar la tolerancia para grupos grandes
                      const numPiezas = otroElemento.classList.contains('grupo') ? 
                          otroElemento.children.length : 1;
                      const distanciaMaxima = Math.max(
                          this.pieceWidth,
                          this.pieceHeight
                      ) * (2 + Math.log(numPiezas));
                      
                      console.log('Distancia:', distanciaActual, 'Máxima permitida:', distanciaMaxima);
                      
                      if (distanciaActual < distanciaMaxima) {
                          console.log('¡Conectando piezas!');
                          const grupo = this.conectarPiezas(elementoActivo, otroElemento);
                          if (grupo) {
                              console.log('Grupo actualizado:', grupo.children.length, 'piezas');
                          }
                          break;
                      }
                  }
              }
          }
          
          if (elementoActivo) {
              elementoActivo.style.zIndex = '1';
          }
          elementoActivo = null;
          areaJuego.style.background = 'rgba(200, 200, 200, 0.2)';
      });
      
      // Evento mousemove en el document
      document.addEventListener('mousemove', moverElemento);
      
      // Generar piezas individuales
      for (let y = 0; y < this.piecesY; y++) {
          for (let x = 0; x < this.piecesX; x++) {
              const pieza = this.generarPieza(x, y);
              const wrapper = document.createElement('div');
              
              wrapper.style.position = 'absolute';
              wrapper.style.cursor = 'move';
              wrapper.style.userSelect = 'none';
              wrapper.dataset.x = x;
              wrapper.dataset.y = y;
              
              const randomX = puzzleWidth + 100 + Math.random() * 250;
              const randomY = 50 + Math.random() * (contenedor.offsetHeight - this.pieceHeight - 100);
              wrapper.style.left = randomX + 'px';
              wrapper.style.top = randomY + 'px';
              
              wrapper.appendChild(pieza);
              contenedor.appendChild(wrapper);
              piezas.push(wrapper);
          }
      }
      
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
  
    conectarPiezas(pieza1, pieza2) {
        console.log('Iniciando conexión de piezas');
        
        // Encontrar el contenedor principal
        let contenedor = pieza1.parentElement;
        while (contenedor && contenedor.classList.contains('grupo')) {
            contenedor = contenedor.parentElement;
        }
        
        if (!contenedor) {
            console.error('No se pudo encontrar el contenedor');
            return null;
        }
        
        // Función para obtener la posición absoluta de un elemento
        const obtenerPosicionAbsoluta = (elemento) => {
            let rect = elemento.getBoundingClientRect();
            let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            return {
                x: rect.left + scrollLeft,
                y: rect.top + scrollTop
            };
        };
        
        // Recolectar todas las piezas y sus posiciones actuales
        const piezasInfo = new Map();
        
        const recolectarPiezas = (elemento) => {
            if (!elemento) return;
            if (elemento.hasAttribute('data-x')) {
                const pos = obtenerPosicionAbsoluta(elemento);
                piezasInfo.set(elemento, {
                    x: parseInt(elemento.dataset.x),
                    y: parseInt(elemento.dataset.y),
                    posActual: pos
                });
            } else if (elemento.classList.contains('grupo')) {
                Array.from(elemento.children).forEach(child => recolectarPiezas(child));
            }
        };
        
        recolectarPiezas(pieza1);
        recolectarPiezas(pieza2);
        
        // Encontrar los límites de la cuadrícula y la posición más a la izquierda/arriba
        let minX = Infinity, minY = Infinity;
        let minPosX = Infinity, minPosY = Infinity;
        
        piezasInfo.forEach((info, pieza) => {
            minX = Math.min(minX, info.x);
            minY = Math.min(minY, info.y);
            minPosX = Math.min(minPosX, info.posActual.x);
            minPosY = Math.min(minPosY, info.posActual.y);
        });
        
        // Crear nuevo grupo en la posición correcta
        const grupoNuevo = document.createElement('div');
        grupoNuevo.style.position = 'absolute';
        grupoNuevo.style.cursor = 'move';
        grupoNuevo.style.userSelect = 'none';
        grupoNuevo.classList.add('grupo');
        
        // Convertir posición absoluta a relativa al contenedor
        const contenedorRect = contenedor.getBoundingClientRect();
        const posicionGrupo = {
            x: minPosX - contenedorRect.left,
            y: minPosY - contenedorRect.top
        };
        
        grupoNuevo.style.left = posicionGrupo.x + 'px';
        grupoNuevo.style.top = posicionGrupo.y + 'px';
        
        // Añadir el grupo al contenedor
        contenedor.appendChild(grupoNuevo);
        
        // Mover cada pieza al nuevo grupo
        piezasInfo.forEach((info, pieza) => {
            // Calcular la posición relativa al nuevo grupo
            const nuevaPosX = (info.x - minX) * this.pieceWidth;
            const nuevaPosY = (info.y - minY) * this.pieceHeight;
            
            // Remover la pieza de su grupo actual si existe
            if (pieza.parentElement && pieza.parentElement.classList.contains('grupo')) {
                const grupoAntiguo = pieza.parentElement;
                pieza.parentElement.removeChild(pieza);
                
                if (grupoAntiguo.children.length === 0) {
                    grupoAntiguo.parentElement?.removeChild(grupoAntiguo);
                }
            }
            
            // Posicionar la pieza en el nuevo grupo
            pieza.style.left = nuevaPosX + 'px';
            pieza.style.top = nuevaPosY + 'px';
            grupoNuevo.appendChild(pieza);
        });
        
        console.log('Grupo creado con', piezasInfo.size, 'piezas');
        return grupoNuevo;
    }
  
    sonAdyacentes(elemento1, elemento2) {
        // Función auxiliar para obtener todas las piezas de un elemento
        const obtenerPiezas = (elemento) => {
            if (elemento.hasAttribute('data-x')) {
                return [elemento];
            } else if (elemento.classList.contains('grupo')) {
                return Array.from(elemento.children);
            }
            return [];
        };

        // Obtener todas las piezas de ambos elementos
        const piezas1 = obtenerPiezas(elemento1);
        const piezas2 = obtenerPiezas(elemento2);

        // Crear mapas de las posiciones ocupadas por cada grupo
        const mapaGrupo1 = new Map(piezas1.map(p => [
            `${p.dataset.x},${p.dataset.y}`,
            { x: parseInt(p.dataset.x), y: parseInt(p.dataset.y) }
        ]));
        const mapaGrupo2 = new Map(piezas2.map(p => [
            `${p.dataset.x},${p.dataset.y}`,
            { x: parseInt(p.dataset.x), y: parseInt(p.dataset.y) }
        ]));

        console.log('Verificando adyacencia:',
            'Grupo 1:', Array.from(mapaGrupo1.keys()),
            'Grupo 2:', Array.from(mapaGrupo2.keys()));

        // Comprobar cada pieza del primer grupo
        for (const [_, pos1] of mapaGrupo1) {
            // Generar todas las posiciones adyacentes posibles
            const posicionesAdyacentes = [
                { x: pos1.x + 1, y: pos1.y }, // derecha
                { x: pos1.x - 1, y: pos1.y }, // izquierda
                { x: pos1.x, y: pos1.y + 1 }, // abajo
                { x: pos1.x, y: pos1.y - 1 }  // arriba
            ];

            // Comprobar cada posición adyacente
            for (const posAdyacente of posicionesAdyacentes) {
                const key = `${posAdyacente.x},${posAdyacente.y}`;
                if (mapaGrupo2.has(key)) {
                    console.log(`¡Adyacencia encontrada! (${pos1.x},${pos1.y}) con ${key}`);
                    return true;
                }
            }
        }

        return false;
    }
  }