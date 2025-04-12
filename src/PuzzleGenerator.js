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
          console.log('Soltando pieza:', elementoActivo);

          const areaRect = areaJuego.getBoundingClientRect();
          
          const sobreAreaJuego = e.clientX >= areaRect.left && 
                                e.clientX <= areaRect.right && 
                                e.clientY >= areaRect.top && 
                                e.clientY <= areaRect.bottom;
          
          if (sobreAreaJuego) {
              // Buscar grupos o piezas cercanas
              const elementos = Array.from(contenedor.children).filter(el => 
                  el !== elementoActivo && (el.hasAttribute('data-x') || el.classList.contains('grupo'))
              );

              for (const otroElemento of elementos) {
                  if (this.sonAdyacentes(elementoActivo, otroElemento)) {
                      const pos1 = {
                          x: parseFloat(elementoActivo.style.left),
                          y: parseFloat(elementoActivo.style.top)
                      };
                      const pos2 = {
                          x: parseFloat(otroElemento.style.left),
                          y: parseFloat(otroElemento.style.top)
                      };

                      // Calcular la distancia entre los elementos
                      const distanciaActual = Math.sqrt(
                          Math.pow(pos1.x - pos2.x, 2) + 
                          Math.pow(pos1.y - pos2.y, 2)
                      );

                      // Usar el tamaño de pieza más grande para la tolerancia
                      const distanciaMaxima = Math.max(this.pieceWidth, this.pieceHeight) * 1.5;

                      if (distanciaActual < distanciaMaxima) {
                          console.log('¡Piezas o grupos cercanos! Intentando conectar...');
                          const grupo = this.conectarPiezas(elementoActivo, otroElemento);
                          console.log('¿Grupo creado/actualizado?', grupo);
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
        
        // Encontrar el contenedor principal (el primer ancestro que no sea un grupo)
        let contenedor = pieza1.parentElement;
        while (contenedor && contenedor.classList.contains('grupo')) {
            contenedor = contenedor.parentElement;
        }
        
        if (!contenedor) {
            console.error('No se pudo encontrar el contenedor');
            return null;
        }
        
        // Recolectar todas las piezas involucradas
        const piezasAgrupar = new Set();
        
        // Función para recolectar piezas recursivamente
        const recolectarPiezas = (elemento) => {
            if (!elemento) return;
            if (elemento.hasAttribute('data-x')) {
                piezasAgrupar.add(elemento);
            } else if (elemento.classList.contains('grupo')) {
                Array.from(elemento.children).forEach(child => recolectarPiezas(child));
            }
        };
        
        // Recolectar piezas de ambos elementos
        recolectarPiezas(pieza1);
        recolectarPiezas(pieza2);
        
        // Convertir a array y ordenar por posición
        const piezasOrdenadas = Array.from(piezasAgrupar);
        
        // Encontrar los límites de la cuadrícula
        let minX = Infinity, minY = Infinity;
        piezasOrdenadas.forEach(pieza => {
            const x = parseInt(pieza.dataset.x);
            const y = parseInt(pieza.dataset.y);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
        });
        
        // Crear nuevo grupo
        const grupoNuevo = document.createElement('div');
        grupoNuevo.style.position = 'absolute';
        grupoNuevo.style.cursor = 'move';
        grupoNuevo.style.userSelect = 'none';
        grupoNuevo.classList.add('grupo');
        
        // Calcular posición base del grupo
        const posBase = {
            x: parseFloat(pieza1.style.left) + (pieza1.closest('.grupo')?.style.left ? parseFloat(pieza1.closest('.grupo').style.left) : 0),
            y: parseFloat(pieza1.style.top) + (pieza1.closest('.grupo')?.style.top ? parseFloat(pieza1.closest('.grupo').style.top) : 0)
        };
        
        grupoNuevo.style.left = posBase.x + 'px';
        grupoNuevo.style.top = posBase.y + 'px';
        
        // Primero crear el nuevo grupo y añadirlo al contenedor
        contenedor.appendChild(grupoNuevo);
        
        // Luego mover cada pieza al nuevo grupo
        piezasOrdenadas.forEach(pieza => {
            const x = parseInt(pieza.dataset.x);
            const y = parseInt(pieza.dataset.y);
            
            // Calcular posición relativa
            const posRelativa = {
                x: (x - minX) * this.pieceWidth,
                y: (y - minY) * this.pieceHeight
            };
            
            // Si la pieza está en un grupo, removerla primero
            if (pieza.parentElement && pieza.parentElement.classList.contains('grupo')) {
                const grupoAntiguo = pieza.parentElement;
                pieza.parentElement.removeChild(pieza);
                
                // Si el grupo queda vacío, eliminarlo
                if (grupoAntiguo.children.length === 0) {
                    grupoAntiguo.parentElement?.removeChild(grupoAntiguo);
                }
            }
            
            // Establecer nueva posición y añadir al grupo
            pieza.style.left = posRelativa.x + 'px';
            pieza.style.top = posRelativa.y + 'px';
            grupoNuevo.appendChild(pieza);
        });
        
        console.log('Grupo creado con', piezasOrdenadas.length, 'piezas');
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

        // Comprobar adyacencia entre todas las combinaciones de piezas
        for (const pieza1 of piezas1) {
            for (const pieza2 of piezas2) {
                const x1 = parseInt(pieza1.dataset.x);
                const y1 = parseInt(pieza1.dataset.y);
                const x2 = parseInt(pieza2.dataset.x);
                const y2 = parseInt(pieza2.dataset.y);

                console.log(`Comprobando adyacencia entre (${x1},${y1}) y (${x2},${y2})`);

                // Son adyacentes si:
                // - Están en la misma fila y sus columnas difieren en 1, o
                // - Están en la misma columna y sus filas difieren en 1
                const sonAdyacentesHorizontal = y1 === y2 && Math.abs(x1 - x2) === 1;
                const sonAdyacentesVertical = x1 === x2 && Math.abs(y1 - y2) === 1;

                if (sonAdyacentesHorizontal || sonAdyacentesVertical) {
                    console.log('¡Son adyacentes!');
                    return true;
                }
            }
        }

        return false;
    }
  }