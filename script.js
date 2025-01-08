let gridInstance;

class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.startCell = null;
        this.endCell = null;
        this.gridElement = document.getElementById('grid');
        
        // Make grid responsive
        this.gridElement.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        this.gridElement.style.gridTemplateRows = `repeat(${height}, 1fr)`;
        
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
        let validMaze = false;
        
        while (!validMaze) {
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
            
            // Generate maze using DFS
            this.dfsMazeGeneration(startRow, 0);
            
            // Check if path exists between start and end
            validMaze = this.hasValidPath();
            
            if (!validMaze) {
                console.log('Generated maze has no valid path, regenerating...');
            }
        }
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
        
        // Check if end is reachable
        if (!came_from[`${end[0]},${end[1]}`] && end !== this.startCell) {
            console.log('No valid path exists');
            return null;
        }
        
        while (current !== null) {
            try {
                path.unshift(current);
                const key = `${current[0]},${current[1]}`;
                current = came_from[key];
            } catch (error) {
                console.error('Error in path reconstruction:', error);
                break;
            }
        }
        
        // Only visualize if we have a valid path
        if (path.length > 0) {
            path.forEach(([row, col], index) => {
                const cell = this.grid[row][col];
                if (cell !== this.startCell && cell !== this.endCell) {
                    setTimeout(() => {
                        cell.classList.remove('exploring');
                        cell.classList.add('path');
                    }, index * 50); // Stagger the animation
                }
            });
        }
        
        return path;
    }

    clearVisualization() {
        // Get all cells with either class
        const cells = this.gridElement.getElementsByClassName('cell');
        Array.from(cells).forEach(cell => {
            cell.classList.remove('exploring');
            cell.classList.remove('path');
        });
    }

    async findPathAStar() {         
        if (!this.startCell || !this.endCell) {
            alert('Please set both start and end points');
            return;
        }
        
        // Clear ALL previous visualizations before starting
        this.clearVisualization();
        
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

    async findPathDijkstra() {
        if (!this.startCell || !this.endCell) {
            alert('Please set both start and end points');
            return;
        }
        
        // Clear ALL previous visualizations before starting
        this.clearVisualization();
        
        // Get start and end positions
        const [startRow, startCol] = this.startCell.dataset.pos.split(',').map(Number);
        const [endRow, endCol] = this.endCell.dataset.pos.split(',').map(Number);

        const dist = {};
        const prev = {};
        const pq = new PriorityQueue();
        const visited = new Set();

        // Initialize distances
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (!this.grid[row][col].classList.contains('wall')) {
                    dist[`${row},${col}`] = Infinity;
                    prev[`${row},${col}`] = null;
                }
            }
        }

        dist[`${startRow},${startCol}`] = 0;
        pq.enqueue([startRow, startCol], 0);

        while (!pq.isEmpty()) {
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

            const neighbors = this.getNeighbors(currentRow, currentCol);
            for (const neighbor of neighbors) {
                const [neighborRow, neighborCol] = neighbor;
                if (visited.has(`${neighborRow},${neighborCol}`)) continue;

                const tentative_dist = dist[`${currentRow},${currentCol}`] + 1;
                if (tentative_dist < dist[`${neighborRow},${neighborCol}`]) {
                    dist[`${neighborRow},${neighborCol}`] = tentative_dist;
                    prev[`${neighborRow},${neighborCol}`] = current;
                    pq.enqueue([neighborRow, neighborCol], tentative_dist);
                }
            }
        }

        const path = this.reconstructPath(prev, [endRow, endCol]);
        if (path) return path;

        return null;
    }

    async findPathBFS() {
        if (!this.startCell || !this.endCell) {
            alert('Please set both start and end points');
            return;
        }
        
        // Clear previous visualization
        this.clearVisualization();
        
        const [startRow, startCol] = this.startCell.dataset.pos.split(',').map(Number);
        const [endRow, endCol] = this.endCell.dataset.pos.split(',').map(Number);
        
        const queue = [[startRow, startCol]];
        const visited = new Set();
        const came_from = {};
        came_from[`${startRow},${startCol}`] = null;
        
        while (queue.length > 0) {
            const current = queue.shift();
            const [currentRow, currentCol] = current;
            const currentKey = `${currentRow},${currentCol}`;
            
            if (visited.has(currentKey)) continue;
            
            visited.add(currentKey);
            
            // Visualize current cell being explored
            if (this.grid[currentRow][currentCol] !== this.startCell && 
                this.grid[currentRow][currentCol] !== this.endCell) {
                this.grid[currentRow][currentCol].classList.add('exploring');
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            if (currentRow === endRow && currentCol === endCol) {
                const path = this.reconstructPath(came_from, [endRow, endCol]);
                return path;
            }
            
            const neighbors = this.getNeighbors(currentRow, currentCol);
            for (const neighbor of neighbors) {
                const [neighborRow, neighborCol] = neighbor;
                const neighborKey = `${neighborRow},${neighborCol}`;
                
                if (!visited.has(neighborKey)) {
                    came_from[neighborKey] = current;
                    queue.push(neighbor);
                }
            }
        }
        
        return null;
    }

    async findPathDFS() {
        if (!this.startCell || !this.endCell) {
            alert('Please set both start and end points');
            return;
        }
        
        // Clear previous visualization
        this.clearVisualization();
        
        const [startRow, startCol] = this.startCell.dataset.pos.split(',').map(Number);
        const [endRow, endCol] = this.endCell.dataset.pos.split(',').map(Number);
        
        const stack = [[startRow, startCol]];
        const visited = new Set();
        const came_from = {};
        came_from[`${startRow},${startCol}`] = null;
        
        while (stack.length > 0) {
            const current = stack.pop();
            const [currentRow, currentCol] = current;
            const key = `${currentRow},${currentCol}`;
            
            if (!visited.has(key)) {
                visited.add(key);
                
                // Visualize current cell being explored
                if (this.grid[currentRow][currentCol] !== this.startCell && 
                    this.grid[currentRow][currentCol] !== this.endCell) {
                    this.grid[currentRow][currentCol].classList.add('exploring');
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                if (currentRow === endRow && currentCol === endCol) {
                    const path = this.reconstructPath(came_from, [endRow, endCol]);
                    return path;
                }
                
                const neighbors = this.getNeighbors(currentRow, currentCol);
                // Randomize neighbors for more interesting DFS paths
                this.shuffleArray(neighbors);
                
                for (const neighbor of neighbors) {
                    const [neighborRow, neighborCol] = neighbor;
                    const neighborKey = `${neighborRow},${neighborCol}`;
                    
                    if (!visited.has(neighborKey)) {
                        came_from[neighborKey] = current;
                        stack.push(neighbor);
                    }
                }
            }
        }
        
        return null;
    }

    // Helper method to check if a valid path exists
    hasValidPath() {
        const [startRow, startCol] = this.startCell.dataset.pos.split(',').map(Number);
        const [endRow, endCol] = this.endCell.dataset.pos.split(',').map(Number);
        
        const visited = new Set();
        const queue = [[startRow, startCol]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            const key = `${row},${col}`;
            
            if (row === endRow && col === endCol) {
                return true;
            }
            
            if (!visited.has(key)) {
                visited.add(key);
                
                const neighbors = this.getNeighbors(row, col);
                queue.push(...neighbors);
            }
        }
        
        return false;
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
        const astarButton = document.getElementById('astar');
        const dijkstraButton = document.getElementById('dijkstra');
        const bfsButton = document.getElementById('bfs');
        const dfsButton = document.getElementById('dfs');
        const randomizeButton = document.getElementById('randomize');
        
        clearButton.addEventListener('click', () => {
            requestAnimationFrame(() => gridInstance.clearGrid());
        });

        astarButton.addEventListener('click', () => {
            requestAnimationFrame(async () => await gridInstance.findPathAStar());
        });

        dijkstraButton.addEventListener('click', () => {
            requestAnimationFrame(async () => await gridInstance.findPathDijkstra());
        });

        bfsButton.addEventListener('click', () => {
            requestAnimationFrame(async () => await gridInstance.findPathBFS());
        });

        dfsButton.addEventListener('click', () => {
            requestAnimationFrame(async () => await gridInstance.findPathDFS());
        });

        randomizeButton.addEventListener('click', () => {
            requestAnimationFrame(() => gridInstance.generateRandomMaze());
        });
    });
}); 