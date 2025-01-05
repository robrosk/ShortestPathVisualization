let gridInstance;

class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.startCell = null;
        this.endCell = null;
        // Cache DOM elements
        this.gridElement = document.getElementById('grid');
        this.modeSelector = document.querySelector('input[name="mode"]:checked');
        // Use DocumentFragment for better performance
        this.initializeGrid();
        this.setupEventListeners();
    }

    initializeGrid() {
        this.gridElement.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        for (let row = 0; row < this.height; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.width; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                // Use data attributes more efficiently
                cell.dataset.pos = `${row},${col}`;
                fragment.appendChild(cell);
                this.grid[row][col] = cell;
            }
        }
        this.gridElement.appendChild(fragment);
    }

    setupEventListeners() {
        let isMouseDown = false;
        let lastCell = null; // Prevent redundant cell operations

        // Use event delegation more efficiently
        this.gridElement.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });

        // Use passive listeners for better scroll performance
        this.gridElement.addEventListener('mouseover', (e) => {
            if (isMouseDown && e.target.classList.contains('cell') && e.target !== lastCell) {
                lastCell = e.target;
                this.handleCellClick(e.target);
            }
        }, { passive: true });

        // Combine mouse events
        ['mouseup', 'mouseleave'].forEach(event => {
            this.gridElement.addEventListener(event, () => {
                isMouseDown = false;
                lastCell = null;
            }, { passive: true });
        });
    }

    handleCellClick(cell) {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        
        // Use switch for better performance than multiple if statements
        switch(mode) {
            case 'wall':
                cell.classList.toggle('wall');
                break;
            case 'start':
                if (this.startCell) {
                    this.startCell.className = 'cell';
                }
                cell.className = 'cell start';
                this.startCell = cell;
                break;
            case 'end':
                if (this.endCell) {
                    this.endCell.className = 'cell';
                }
                cell.className = 'cell end';
                this.endCell = cell;
                break;
        }
    }

    clearGrid() {
        // Use more efficient clearing method
        const cells = this.gridElement.getElementsByClassName('cell');
        // Convert to array for faster iteration
        Array.from(cells).forEach(cell => cell.className = 'cell');
        this.startCell = null;
        this.endCell = null;
    }

    getManhattanDistance(row1, col1, row2, col2) {
        return Math.abs(row1 - row2) + Math.abs(col1 - col2);
    }

    async findPath() {
        if (!this.startCell || !this.endCell) {
            alert('Please set both start and end points');
            return;
        }
        
        // Clear any previous exploration visualization
        const cells = this.gridElement.getElementsByClassName('exploring');
        Array.from(cells).forEach(cell => cell.classList.remove('exploring'));
        
        const [startRow, startCol] = this.startCell.dataset.pos.split(',').map(Number);
        const [endRow, endCol] = this.endCell.dataset.pos.split(',').map(Number);
        
        console.log('Finding path from', [startRow, startCol], 'to', [endRow, endCol]);

        const pq = new PriorityQueue();
        const visited = new Set();
        const f_score = {};
        const g_score = {};

        // Initialize all distances to Infinity
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                f_score[`${row},${col}`] = Infinity;
                g_score[`${row},${col}`] = Infinity;
            }
        }

        g_score[`${startRow},${startCol}`] = 0;
        f_score[`${startRow},${startCol}`] = g_score[`${startRow},${startCol}`] + 
            this.getManhattanDistance(startRow, startCol, endRow, endCol);

        const came_from = {};
        came_from[`${startRow},${startCol}`] = null;

        pq.enqueue([startRow, startCol], f_score[`${startRow},${startCol}`]);

        while(pq.values.length) {
            const { element: current } = pq.dequeue();
            const [currentRow, currentCol] = current;

            // Visualize current cell being explored
            if (this.grid[currentRow][currentCol] !== this.startCell && 
                this.grid[currentRow][currentCol] !== this.endCell) {
                this.grid[currentRow][currentCol].classList.add('exploring');
                // Add small delay to see the exploration
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            visited.add(`${currentRow},${currentCol}`);
            if (currentRow === endRow && currentCol === endCol) {
                console.log('Path found!');
                const path = this.reconstructPath(came_from, [endRow, endCol]);
                return path;
            }

            const neighbors = this.getNeighbors(currentRow, currentCol);
            for (const neighbor of neighbors) {
                const [neighborRow, neighborCol] = neighbor;
                if (visited.has(`${neighborRow},${neighborCol}`)) continue;

                const tentative_g_score = g_score[`${currentRow},${currentCol}`] + 1;

                if (tentative_g_score < g_score[`${neighborRow},${neighborCol}`]) {
                    came_from[`${neighborRow},${neighborCol}`] = current;
                    g_score[`${neighborRow},${neighborCol}`] = tentative_g_score;
                    f_score[`${neighborRow},${neighborCol}`] = g_score[`${neighborRow},${neighborCol}`] + 
                        this.getManhattanDistance(neighborRow, neighborCol, endRow, endCol);
                    pq.enqueue([neighborRow, neighborCol], f_score[`${neighborRow},${neighborCol}`]);
                }
            }
        }
        return null;
    }

    generateRandomMaze() {
        // Clear the grid first
        this.clearGrid();
        
        // Set random start point on left edge
        const startRow = Math.floor(Math.random() * this.height);
        this.startCell = this.grid[startRow][0];
        this.startCell.className = 'cell start';
        
        // Set random end point on right edge
        const endRow = Math.floor(Math.random() * this.height);
        this.endCell = this.grid[endRow][this.width - 1];
        this.endCell.className = 'cell end';
        
        // Initialize all cells as walls
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (this.grid[row][col] !== this.startCell && 
                    this.grid[row][col] !== this.endCell) {
                    this.grid[row][col].classList.add('wall');
                }
            }
        }
        
        // Start DFS from the start cell
        this.dfsMazeGeneration(startRow, 0);
    }

    dfsMazeGeneration(row, col) {
        // Mark current cell as path (remove wall)
        if (this.grid[row][col] !== this.startCell && 
            this.grid[row][col] !== this.endCell) {
            this.grid[row][col].classList.remove('wall');
        }
        
        // Get neighbors in random order
        const directions = [
            [0, 2],  // right
            [2, 0],  // down
            [0, -2], // left
            [-2, 0]  // up
        ];
        this.shuffleArray(directions);
        
        // Try each direction
        for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            
            // Check if new position is within bounds and is a wall
            if (newRow >= 0 && newRow < this.height && 
                newCol >= 0 && newCol < this.width && 
                this.grid[newRow][newCol].classList.contains('wall')) {
                
                // Carve through the wall between current cell and new cell
                const wallRow = row + dx/2;
                const wallCol = col + dy/2;
                this.grid[wallRow][wallCol].classList.remove('wall');
                
                // Continue DFS from new cell
                this.dfsMazeGeneration(newRow, newCol);
            }
        }
    }

    // Helper function to shuffle array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Add this method to get valid neighbors
    getNeighbors(row, col) {
        // Define the four possible directions a cell can move
        const directions = [
            [-1, 0],  // up    (decrease row by 1)
            [1, 0],   // down  (increase row by 1)
            [0, -1],  // left  (decrease column by 1)
            [0, 1]    // right (increase column by 1)
        ];
        
        return directions
            // Step 1: Map each direction to new coordinates
            .map(([dx, dy]) => [row + dx, col + dy])
            // Step 2: Filter out invalid moves
            .filter(([newRow, newCol]) => 
                // Check if within grid bounds
                newRow >= 0 && newRow < this.height &&
                newCol >= 0 && newCol < this.width &&
                // Check if not a wall
                !this.grid[newRow][newCol].classList.contains('wall')
            );
    }

    reconstructPath(came_from, end) {
        let current = end;
        const path = [];
        
        while (current !== null) {
            path.push(current);
            current = came_from[`${current[0]},${current[1]}`];
        }
        path.reverse()
        return path
    }
}

class PriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(element, priority) {
        this.values.push({ element, priority });
        this.bubbleUp();
    }

    dequeue() {
        if (this.values.length === 0) return null;
        
        const min = this.values[0];
        const end = this.values.pop();
        
        if (this.values.length > 0) {
            this.values[0] = end;
            this.bubbleDown();
        }
        
        return min;
    }

    bubbleUp() {
        let idx = this.values.length - 1;
        const element = this.values[idx];

        while (idx > 0) {
            let parentIdx = Math.floor((idx - 1) / 2);
            let parent = this.values[parentIdx];

            if (element.priority >= parent.priority) break;
            
            this.values[parentIdx] = element;
            this.values[idx] = parent;
            idx = parentIdx;
        }
    }

    bubbleDown() {
        let idx = 0;
        const length = this.values.length;
        const element = this.values[0];

        while (true) {
            let leftChildIdx = 2 * idx + 1;
            let rightChildIdx = 2 * idx + 2;
            let leftChild, rightChild;
            let swap = null;

            if (leftChildIdx < length) {
                leftChild = this.values[leftChildIdx];
                if (leftChild.priority < element.priority) {
                    swap = leftChildIdx;
                }
            }

            if (rightChildIdx < length) {
                rightChild = this.values[rightChildIdx];
                if (
                    (swap === null && rightChild.priority < element.priority) || 
                    (swap !== null && rightChild.priority < leftChild.priority)
                ) {
                    swap = rightChildIdx;
                }
            }

            if (swap === null) break;

            this.values[idx] = this.values[swap];
            this.values[swap] = element;
            idx = swap;
        }
    }

    isEmpty() {
        return this.values.length === 0;
    }
}

// Use requestAnimationFrame for smoother initialization
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        gridInstance = new Grid(20, 20);
        
        const clearButton = document.getElementById('clearGrid');
        const findPathButton = document.getElementById('findPath');
        const randomizeButton = document.getElementById('randomize');
        
        clearButton.addEventListener('click', () => {
            requestAnimationFrame(() => gridInstance.clearGrid());
        });

        findPathButton.addEventListener('click', () => {
            requestAnimationFrame(async () => await gridInstance.findPath());
        });

        randomizeButton.addEventListener('click', () => {
            requestAnimationFrame(() => gridInstance.generateRandomMaze());
        });
    });
}); 