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

    findPath() {
        if (!this.startCell || !this.endCell) {
            alert('Please set both start and end points');
            return;
        }
        
        // Get coordinates from the data-pos attribute
        const [startRow, startCol] = this.startCell.dataset.pos.split(',').map(Number);
        const [endRow, endCol] = this.endCell.dataset.pos.split(',').map(Number);
        
        console.log('Finding path from', [startRow, startCol], 'to', [endRow, endCol]);
        // You can implement the A* algorithm here

        pq = new PriorityQueue() 
        pq.enqueue([startRow, startCol], 0)

        let distances = {}

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                distances[`${row},${col}`] = Infinity
            }
        }

        distances[`${startRow},${startCol}`] = 0
        let previous = {}
        previous[`${startRow},${startCol}`] = null

        while(pq.values.length) {
            current = pq.dequeue().value
            
        }


        


       
        

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
        
        clearButton.addEventListener('click', () => {
            requestAnimationFrame(() => gridInstance.clearGrid());
        });

        findPathButton.addEventListener('click', () => {
            requestAnimationFrame(() => gridInstance.findPath());
        });
    });
}); 