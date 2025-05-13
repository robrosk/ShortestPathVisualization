# PathFinder

A visual pathfinding algorithm demonstration tool that allows users to interactively create mazes and visualize different pathfinding algorithms in action.

## Features

- **Interactive Grid**: Create custom mazes by placing walls, start points, and end points
- **Multiple Algorithms**: Visualize different pathfinding algorithms:
  - A* Search
  - Dijkstra's Algorithm
  - Breadth-First Search (BFS)
  - Depth-First Search (DFS)
- **Random Maze Generation**: Generate random mazes with guaranteed valid paths
- **Real-time Visualization**: Watch algorithms explore the grid in real-time
- **Responsive Design**: Works on both desktop and mobile devices
- **Dark Mode Support**: Automatically adapts to system dark mode preferences

## How to Use

1. **Setup**:
   - Clone the repository
   - Open `index.html` in a web browser

2. **Creating a Maze**:
   - Use the mode selector to choose between:
     - Place Wall: Create barriers
     - Place Start: Set the starting point
     - Place End: Set the destination point
   - Click and drag to create walls
   - Click once to place start/end points

3. **Running Algorithms**:
   - Click any of the algorithm buttons to start visualization:
     - A*: Optimal path finding with heuristic
     - Dijkstra: Shortest path without heuristic
     - BFS: Breadth-first exploration
     - DFS: Depth-first exploration
   - Use "Clear Grid" to reset the board
   - Use "Generate Maze" to create a random maze

## Technical Details

- Built with JavaScript, HTML, and CSS
- Uses a priority queue implementation for A* and Dijkstra's algorithms
- Implements responsive design for various screen sizes
- Features smooth animations and transitions
- Includes abort functionality for running algorithms

## Browser Support

Works on all modern browsers that support:
- CSS Grid
- CSS Flexbox
- ES6+ JavaScript features
- CSS Custom Properties
