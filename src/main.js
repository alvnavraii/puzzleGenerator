import { PuzzleGenerator } from './PuzzleGenerator.js';

document.addEventListener('DOMContentLoaded', () => {
    const puzzleContainer = document.getElementById('puzzleContainer');
    const piecesXInput = document.getElementById('piecesX');
    const piecesYInput = document.getElementById('piecesY');
    const generateButton = document.getElementById('generateButton');
    const startButton = document.createElement('button');
    startButton.textContent = 'Comenzar Puzzle';
    startButton.style.display = 'none';

    generateButton.addEventListener('click', () => {
        const img = new Image();
        img.onload = () => {
            puzzleContainer.innerHTML = '';
            
            const generator = new PuzzleGenerator(
                img, 
                parseInt(piecesXInput.value), 
                parseInt(piecesYInput.value)
            );
            
            generator.initialize();
            
            // Mostrar primero el patrón
            const patron = generator.mostrarPatron();
            puzzleContainer.appendChild(patron);
            
            // Mostrar el botón para comenzar el puzzle
            startButton.style.display = 'block';
            puzzleContainer.appendChild(startButton);
            
            startButton.onclick = () => {
                puzzleContainer.innerHTML = '';
                const puzzle = generator.generarPuzzle();
                puzzleContainer.appendChild(puzzle);
            };
        };

        img.src = 'src/game_over.jpg';
    });
});