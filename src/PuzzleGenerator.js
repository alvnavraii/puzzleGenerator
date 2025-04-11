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
      let elementoActivo = null;
      let offsetX = 0;
      let offsetY = 0;
      
      // Manejadores de eventos a nivel de contenedor
      contenedor.addEventListener('mousedown', (e) => {
          const elemento = e.target.closest('div[data-x]') || e.target.closest('div[style*="position: absolute"]');
          if (!elemento || e.button !== 0) return;
          
          elementoActivo = elemento;
          const rect = elemento.getBoundingClientRect();
          offsetX = e.clientX - rect.left;
          offsetY = e.clientY - rect.top;
          elemento.style.zIndex = '1000';
          e.preventDefault();
      });
      
      document.addEventListener('mousemove', (e) => {
          if (!elementoActivo) return;
          
          const rect = contenedor.getBoundingClientRect();
          elementoActivo.style.left = (e.clientX - rect.left - offsetX) + 'px';
          elementoActivo.style.top = (e.clientY - rect.top - offsetY) + 'px';
          
          // Verificar conexiones
          piezas.forEach(otraPieza => {
              if (otraPieza !== elementoActivo) {
                  const adyacencia = sonAdyacentes(elementoActivo, otraPieza);
                  if (adyacencia) {
                      const rect1 = elementoActivo.getBoundingClientRect();
                      const rect2 = otraPieza.getBoundingClientRect();
                      
                      let expectedX = rect2.left;
                      let expectedY = rect2.top;
                      
                      if (adyacencia.x1 > adyacencia.x2) {
                          expectedX = rect2.left + this.pieceWidth;
                      } else if (adyacencia.x1 < adyacencia.x2) {
                          expectedX = rect2.left - this.pieceWidth;
                      }
                      
                      if (adyacencia.y1 > adyacencia.y2) {
                          expectedY = rect2.top + this.pieceHeight;
                      } else if (adyacencia.y1 < adyacencia.y2) {
                          expectedY = rect2.top - this.pieceHeight;
                      }
                      
                      const distancia = Math.hypot(
                          rect1.left - expectedX,
                          rect1.top - expectedY
                      );
                      
                      if (distancia < 20) {
                          elementoActivo.style.left = (parseInt(elementoActivo.style.left) + (expectedX - rect1.left)) + 'px';
                          elementoActivo.style.top = (parseInt(elementoActivo.style.top) + (expectedY - rect1.top)) + 'px';
                          
                          const temp = elementoActivo;
                          elementoActivo = null;
                          conectarPiezas(temp, otraPieza);
                      }
                  }
              }
          });
      });
      
      document.addEventListener('mouseup', () => {
          if (elementoActivo) {
              elementoActivo.style.zIndex = '1';
              elementoActivo = null;
          }
      });
      
      // Función para verificar si dos elementos son adyacentes
      const sonAdyacentes = (elem1, elem2) => {
          // Obtener todas las coordenadas del primer elemento
          const coords1 = elem1.querySelectorAll('div[data-x]');
          const coords2 = elem2.querySelectorAll('div[data-x]');
          
          // Si no hay elementos con coordenadas, usar el elemento mismo
          const elementos1 = coords1.length ? coords1 : [elem1];
          const elementos2 = coords2.length ? coords2 : [elem2];
          
          // Verificar si alguna pieza del primer elemento es adyacente a alguna del segundo
          for (const el1 of elementos1) {
              const x1 = parseInt(el1.dataset.x);
              const y1 = parseInt(el1.dataset.y);
              
              for (const el2 of elementos2) {
                  const x2 = parseInt(el2.dataset.x);
                  const y2 = parseInt(el2.dataset.y);
                  
                  if ((Math.abs(x1 - x2) === 1 && y1 === y2) || 
                      (Math.abs(y1 - y2) === 1 && x1 === x2)) {
                      return {
                          pieza1: el1,
                          pieza2: el2,
                          x1, y1, x2, y2
                      };
                  }
              }
          }
          return false;
      };
      
      // Función para conectar piezas
      const conectarPiezas = (pieza1, pieza2) => {
          const grupoContainer = document.createElement('div');
          grupoContainer.style.position = 'absolute';
          grupoContainer.style.cursor = 'move';
          grupoContainer.style.userSelect = 'none';
          
          // Calcular las posiciones basadas en la cuadrícula
          const x1 = parseInt(pieza1.dataset.x);
          const y1 = parseInt(pieza1.dataset.y);
          const x2 = parseInt(pieza2.dataset.x);
          const y2 = parseInt(pieza2.dataset.y);
          
          // Posicionar el grupo usando la pieza2 como referencia
          const rect2 = pieza2.getBoundingClientRect();
          const contenedorRect = contenedor.getBoundingClientRect();
          grupoContainer.style.left = (rect2.left - contenedorRect.left) + 'px';
          grupoContainer.style.top = (rect2.top - contenedorRect.top) + 'px';
          
          // Función auxiliar para posicionar una pieza en el grupo
          const posicionarPieza = (pieza, xPos, yPos) => {
              pieza.style.position = 'absolute';
              pieza.style.left = ((xPos - x2) * this.pieceWidth) + 'px';
              pieza.style.top = ((yPos - y2) * this.pieceHeight) + 'px';
              grupoContainer.appendChild(pieza);
          };
          
          // Mover todas las piezas del grupo 1 (si existe)
          if (pieza1.parentElement !== contenedor) {
              Array.from(pieza1.parentElement.children).forEach(p => {
                  const xp = parseInt(p.dataset.x);
                  const yp = parseInt(p.dataset.y);
                  posicionarPieza(p, xp, yp);
              });
              piezas.splice(piezas.indexOf(pieza1.parentElement), 1);
              pieza1.parentElement.remove();
          } else {
              posicionarPieza(pieza1, x1, y1);
          }
          
          // Mover todas las piezas del grupo 2 (si existe)
          if (pieza2.parentElement !== contenedor) {
              Array.from(pieza2.parentElement.children).forEach(p => {
                  const xp = parseInt(p.dataset.x);
                  const yp = parseInt(p.dataset.y);
                  posicionarPieza(p, xp, yp);
              });
              piezas.splice(piezas.indexOf(pieza2.parentElement), 1);
              pieza2.parentElement.remove();
          } else {
              posicionarPieza(pieza2, x2, y2);
          }
          
          // Añadir el nuevo grupo al contenedor
          contenedor.appendChild(grupoContainer);
          
          // Actualizar el array de piezas
          if (pieza1.parentElement === contenedor) {
              piezas.splice(piezas.indexOf(pieza1), 1);
          }
          if (pieza2.parentElement === contenedor) {
              piezas.splice(piezas.indexOf(pieza2), 1);
          }
          piezas.push(grupoContainer);
          
          // Guardar las coordenadas del grupo
          grupoContainer.dataset.piezas = JSON.stringify(
              Array.from(grupoContainer.children).map(p => ({
                  x: parseInt(p.dataset.x),
                  y: parseInt(p.dataset.y)
              }))
          );
      };
      
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
              
              wrapper.appendChild(pieza);
              contenedor.appendChild(wrapper);
              piezas.push(wrapper);
          }
      }
      
      // Desordenar las piezas
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