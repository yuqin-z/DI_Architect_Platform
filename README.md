# DI Architect Platform (Spatial Annotation Tool)

A web-based platform for spatial annotation and architectural design intent analysis, built with React, Three.js, and TypeScript.

## Features

- **3D Visualization**: Interactive 3D views using `@react-three/fiber`.
- **Spatial Annotation**: Tools to annotate nodes, edges, corridors, and floors.
- **Floor Navigation**: Navigate through different building levels.
- **Project Management**: Manage project IDs and metadata.
- **Modern UI**: Styled with Tailwind CSS and Lucide React icons.
- **State Management**: Powered by Zustand for efficient state handling.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **3D Graphics**: [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yuqin-z/DI_Architect_Platform.git
   ```

2. Navigate to the project directory:
   ```bash
   cd DI_Architect_Platform
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

Start the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

[MIT](LICENSE)
