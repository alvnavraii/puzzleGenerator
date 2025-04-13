export class PuzzleGenerator {
    constructor(imagen, filas = 4, columnas = 4) {
        if (typeof imagen === 'string') {
            const img = new Image();
            img.src = imagen;
            this.imagen = img;
        } else if (imagen instanceof HTMLImageElement) {
            this.imagen = imagen;
        } else {
            throw new Error('La imagen debe ser una URL o un elemento HTMLImageElement');
        }

        this.rows = filas;
        this.cols = columnas;
        this.piezas = [];
        this.grupos = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bordesPiezas = [];
        this.paths = [];
    }
  
    initialize() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Manejar la carga de la imagen
        const cargarImagen = () => {
            canvas.width = this.imagen.naturalWidth;
            canvas.height = this.imagen.naturalHeight;
            ctx.drawImage(this.imagen, 0, 0);
            this.crearPiezas(canvas);
        };

        // Si la imagen ya está cargada
        if (this.imagen.complete) {
            cargarImagen();
        } else {
            // Si la imagen aún se está cargando
            this.imagen.onload = cargarImagen;
        }
    }
  
    crearPiezas(canvas) {
        this.canvas.width = this.imagen.width;
        this.canvas.height = this.imagen.height;
        this.ctx.drawImage(this.imagen, 0, 0);
        
        this.pieceWidth = Math.floor(this.imagen.width / this.cols);
        this.pieceHeight = Math.floor(this.imagen.height / this.rows);
        
        // Inicializar todos los bordes a 0
        this.bordesPiezas = Array(this.rows).fill().map(() => 
            Array(this.cols).fill().map(() => ({
                arriba: 0,
                derecha: 0,
                abajo: 0,
                izquierda: 0
            }))
        );

        // Generar bordes aleatorios asegurando que encajen
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
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
                if (x < this.cols - 1) {
                    this.bordesPiezas[y][x].derecha = Math.random() < 0.5 ? 1 : -1;
                }
                if (y < this.rows - 1) {
                    this.bordesPiezas[y][x].abajo = Math.random() < 0.5 ? 1 : -1;
                }
            }
        }

        // Establecer bordes rectos en los extremos
        for (let x = 0; x < this.cols; x++) {
            this.bordesPiezas[0][x].arriba = 0;
            this.bordesPiezas[this.rows-1][x].abajo = 0;
        }
        for (let y = 0; y < this.rows; y++) {
            this.bordesPiezas[y][0].izquierda = 0;
            this.bordesPiezas[y][this.cols-1].derecha = 0;
        }

        // Guardar los paths
        this.paths = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
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
      if (x === this.cols - 1) {
          ctx.lineTo(offsetX + this.pieceWidth, offsetY + this.pieceHeight);
      } else {
          ctx.lineTo(offsetX + this.pieceWidth, offsetY + (this.pieceHeight - tabWidth) / 2);
          ctx.arc(offsetX + this.pieceWidth, offsetY + this.pieceHeight / 2,
                 tabSize, -Math.PI/2, Math.PI/2, false);
          ctx.lineTo(offsetX + this.pieceWidth, offsetY + this.pieceHeight);
      }
      
      // Borde inferior
      if (y === this.rows - 1) {
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
          this.imagen,
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
      const puzzleWidth = this.pieceWidth * this.cols;
      const puzzleHeight = this.pieceHeight * this.rows;
      
      const contenedor = document.createElement('div');
      contenedor.style.position = 'relative';
      contenedor.style.width = (puzzleWidth + 400) + 'px';
      contenedor.style.height = (puzzleHeight + 200) + 'px';
      contenedor.style.background = 'transparent';
      
      // Guardar la referencia al contenedor
      this.contenedor = contenedor;
      
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
          
          // Si es un grupo (2 o más piezas), restringir al área de juego
          if (elementoActivo.classList.contains('grupo') && elementoActivo.children.length >= 2) {
              const areaJuegoRect = areaJuego.getBoundingClientRect();
              const grupoRect = elementoActivo.getBoundingClientRect();
              const contenedorRect = contenedor.getBoundingClientRect();
              
              // Calcular los límites absolutos del área de juego
              const limiteIzquierdo = areaJuegoRect.left - contenedorRect.left;
              const limiteSuperior = areaJuegoRect.top - contenedorRect.top;
              
              // Calcular los límites máximos considerando el padding del área
              const limiteDerecho = areaJuegoRect.right - contenedorRect.left - grupoRect.width;
              const limiteInferior = areaJuegoRect.bottom - contenedorRect.top - grupoRect.height;
              
              // Calcular la nueva posición
              const newX = Math.max(limiteIzquierdo, Math.min(limiteDerecho, e.clientX - contenedorRect.left - offsetX));
              const newY = Math.max(limiteSuperior, Math.min(limiteInferior, e.clientY - contenedorRect.top - offsetY));
              
              // Actualizar la posición del grupo
              elementoActivo.style.left = `${newX}px`;
              elementoActivo.style.top = `${newY}px`;
              
              // Asegurarse de que todas las piezas del grupo mantengan sus posiciones relativas
              Array.from(elementoActivo.children).forEach(pieza => {
                  const x = parseInt(pieza.dataset.x);
                  const y = parseInt(pieza.dataset.y);
                  const refX = Math.min(...Array.from(elementoActivo.children).map(p => parseInt(p.dataset.x)));
                  const refY = Math.min(...Array.from(elementoActivo.children).map(p => parseInt(p.dataset.y)));
                  
                  pieza.style.left = `${(x - refX) * this.pieceWidth}px`;
                  pieza.style.top = `${(y - refY) * this.pieceHeight}px`;
              });
          } else {
              // Para piezas individuales, movimiento libre
              elementoActivo.style.left = `${e.clientX - contenedor.getBoundingClientRect().left - offsetX}px`;
              elementoActivo.style.top = `${e.clientY - contenedor.getBoundingClientRect().top - offsetY}px`;
          }
          
          // Feedback visual
          const sobreAreaJuego = e.clientX >= areaJuego.getBoundingClientRect().left && 
                                e.clientX <= areaJuego.getBoundingClientRect().right && 
                                e.clientY >= areaJuego.getBoundingClientRect().top && 
                                e.clientY <= areaJuego.getBoundingClientRect().bottom;
          
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
          
          // Calcular el offset basado en la posición actual del ratón y la posición del elemento
          const elementRect = elementoActivo.getBoundingClientRect();
          offsetX = e.clientX - elementRect.left;
          offsetY = e.clientY - elementRect.top;
          
          elementoActivo.style.zIndex = '1000';
          e.preventDefault();
      });
      
      // Evento mouseup - Ahora en el document para capturar siempre
      document.addEventListener('mouseup', (e) => {
          if (!isDragging || !elementoActivo) return;
          
          isDragging = false;
          const areaRect = areaJuego.getBoundingClientRect();
          
          // Verificar si el elemento está sobre el área de juego
          const sobreAreaJuego = e.clientX >= areaRect.left && 
                                e.clientX <= areaRect.right && 
                                e.clientY >= areaRect.top && 
                                e.clientY <= areaRect.bottom;
          
          if (sobreAreaJuego) {
              const elementos = Array.from(contenedor.children).filter(el => 
                  el !== elementoActivo && (el.hasAttribute('data-x') || el.classList.contains('grupo'))
              );

              // Guardar la posición actual del elemento activo
              const posicionActualLeft = parseFloat(elementoActivo.style.left);
              const posicionActualTop = parseFloat(elementoActivo.style.top);

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
                      
                      const numPiezas = otroElemento.classList.contains('grupo') ? 
                          otroElemento.children.length : 1;
                      const distanciaMaxima = Math.max(
                          this.pieceWidth,
                          this.pieceHeight
                      ) * (2 + Math.log(numPiezas));
                      
                      if (distanciaActual < distanciaMaxima) {
                          const grupo = this.conectarPiezas(elementoActivo, otroElemento);
                          if (grupo) {
                              // Restaurar la posición original del grupo
                              grupo.style.left = `${posicionActualLeft}px`;
                              grupo.style.top = `${posicionActualTop}px`;
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
      for (let y = 0; y < this.rows; y++) {
          for (let x = 0; x < this.cols; x++) {
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
        canvas.width = this.imagen.width;
        canvas.height = this.imagen.height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(this.imagen, 0, 0);
        
        const tabSize = this.pieceWidth * 0.2;
        const tabWidth = this.pieceWidth * 0.4;
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
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
  
    conectarPiezas(elemento1, elemento2) {
        console.log('Iniciando conexión de piezas');
        
        if (!elemento1 || !elemento2 || !this.contenedor) {
            console.error('Error: Elementos o contenedor inválidos');
            return null;
        }

        // Crear nuevo grupo
        const grupoNuevo = document.createElement('div');
        grupoNuevo.className = 'grupo';
        grupoNuevo.style.position = 'absolute';
        
        // Usar la posición del primer elemento como referencia
        const rect1 = elemento1.getBoundingClientRect();
        const containerRect = this.contenedor.getBoundingClientRect();
        
        // Posicionar el nuevo grupo donde está el primer elemento
        grupoNuevo.style.left = `${rect1.left - containerRect.left}px`;
        grupoNuevo.style.top = `${rect1.top - containerRect.top}px`;
        
        this.contenedor.appendChild(grupoNuevo);

        // Función para mover piezas al nuevo grupo
        const moverAlGrupo = (elemento) => {
            const piezas = elemento.classList.contains('grupo') ? 
                Array.from(elemento.children) : [elemento];
            
            piezas.forEach(pieza => {
                const piezaRect = pieza.getBoundingClientRect();
                grupoNuevo.appendChild(pieza);
                pieza.style.left = `${piezaRect.left - rect1.left}px`;
                pieza.style.top = `${piezaRect.top - rect1.top}px`;
            });
            
            if (elemento.classList.contains('grupo')) {
                elemento.remove();
            }
        };

        // Mover ambos elementos al nuevo grupo
        moverAlGrupo(elemento1);
        moverAlGrupo(elemento2);

        console.log('Grupo creado con', grupoNuevo.children.length, 'piezas');
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

    verificarPuzzleCompleto() {
        try {
            // Si hay más de un grupo o piezas sueltas, no está completo
            const elementos = Array.from(this.contenedor.children)
                .filter(el => !el.classList.contains('imagen-completa'));
            
            if (elementos.length !== 1 || !elementos[0].classList.contains('grupo')) {
                return false;
            }

            const grupo = elementos[0];
            if (!grupo || !grupo.children || grupo.children.length === 0) {
                console.log('Grupo inválido o sin piezas');
                return false;
            }

            const piezas = Array.from(grupo.children);
            
            // Verificar que tenemos todas las piezas
            const coordX = piezas.map(p => parseInt(p.dataset.x));
            const coordY = piezas.map(p => parseInt(p.dataset.y));
            const minX = Math.min(...coordX);
            const maxX = Math.max(...coordX);
            const minY = Math.min(...coordY);
            const maxY = Math.max(...coordY);
            const rows = maxY - minY + 1;
            const cols = maxX - minX + 1;
            const totalEsperado = rows * cols;

            if (piezas.length !== totalEsperado) {
                return false;
            }

            // Mantener la posición del grupo al conectar piezas
            const rect = grupo.getBoundingClientRect();
            const containerRect = this.contenedor.getBoundingClientRect();
            const offsetY = rect.top - containerRect.top;
            
            if (offsetY > 0) {
                const currentTop = parseInt(grupo.style.top) || 0;
                grupo.style.top = `${currentTop - offsetY}px`;
            }

            // Verificar posiciones relativas
            const pieceWidth = piezas[0].offsetWidth;
            const pieceHeight = piezas[0].offsetHeight;
            
            const todasEnPosicion = piezas.every(pieza => {
                const x = parseInt(pieza.dataset.x);
                const y = parseInt(pieza.dataset.y);
                const expectedX = (x - minX) * pieceWidth;
                const expectedY = (y - minY) * pieceHeight;
                
                const actualX = parseFloat(pieza.style.left);
                const actualY = parseFloat(pieza.style.top);
                
                return Math.abs(actualX - expectedX) < 5 && Math.abs(actualY - expectedY) < 5;
            });

            if (todasEnPosicion && piezas.length === this.rows * this.cols) {
                this.mostrarImagenCompleta();
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error al verificar el puzzle:', error);
            return false;
        }
    }

    mostrarImagenCompleta() {
        // Remover imagen completa anterior si existe
        const imagenAnterior = this.contenedor.querySelector('.imagen-completa');
        if (imagenAnterior) {
            imagenAnterior.remove();
        }

        // Crear un div para la imagen completa
        const imagenCompleta = document.createElement('div');
        imagenCompleta.classList.add('imagen-completa');
        imagenCompleta.style.position = 'absolute';
        imagenCompleta.style.left = '0';
        imagenCompleta.style.top = '0';
        imagenCompleta.style.width = '100%';
        imagenCompleta.style.height = '100%';
        imagenCompleta.style.background = `url(${this.imagen.src}) no-repeat center center`;
        imagenCompleta.style.backgroundSize = 'contain';
        imagenCompleta.style.opacity = '0';
        imagenCompleta.style.transition = 'opacity 1s ease-in-out';
        imagenCompleta.style.zIndex = '1000';
        
        // Añadir la imagen al contenedor
        this.contenedor.appendChild(imagenCompleta);
        
        // Mostrar la imagen con una animación
        requestAnimationFrame(() => {
            imagenCompleta.style.opacity = '1';
            
            // Añadir mensaje de felicitación
            const mensaje = document.createElement('div');
            mensaje.style.position = 'absolute';
            mensaje.style.left = '50%';
            mensaje.style.top = '50%';
            mensaje.style.transform = 'translate(-50%, -50%)';
            mensaje.style.background = 'rgba(0, 0, 0, 0.8)';
            mensaje.style.color = 'white';
            mensaje.style.padding = '20px';
            mensaje.style.borderRadius = '10px';
            mensaje.style.fontSize = '24px';
            mensaje.style.textAlign = 'center';
            mensaje.style.zIndex = '1001';
            mensaje.innerHTML = '¡Felicitaciones!<br>Has completado el puzzle';
            
            this.contenedor.appendChild(mensaje);
            
            // Hacer que el mensaje desaparezca después de unos segundos
            setTimeout(() => {
                mensaje.style.opacity = '0';
                mensaje.style.transition = 'opacity 1s ease-out';
                setTimeout(() => mensaje.remove(), 1000);
            }, 3000);
        });
    }
}