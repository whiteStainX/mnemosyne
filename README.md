# Mnemosyne

Mnemosyne is an interactive, self-entertaining "fake" operating system. The user experience is centered around exploration and discovery within a system that feels genuine yet has surreal, intentionally broken boundaries. The goal is to create a visually impressive and deeply intriguing environment that rewards curiosity.

## Core Components

-   **The Museum (Frontend):** A retro Mac OS environment forked from [infinite-mac](https://github.com/mihaip/infinite-mac). This is the visual shell the user interacts with.
-   **The Portal (Terminal):** A React component using xterm.js that acts as a bridge to the backend "Core".
-   **The Core (Backend OS):** A custom Docker Image based on Alpine Linux, containing a unique filesystem, custom commands, and narrative events.
-   **The Broker (Backend Server):** A Node.js server that manages user sessions and communication between the frontend and the Core OS.

## Technology Stack

-   **Monorepo:** [Turborepo](https://turbo.build/repo)
-   **Frontend (Museum):** [Preact](https://preactjs.com/) / [Next.js](https://nextjs.org/)
-   **Backend (Broker):** [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Socket.io](https://socket.io/), [TypeScript](https://www.typescriptlang.org/)
-   **Core OS:** [Docker](https://www.docker.com/), [Alpine Linux](https://alpinelinux.org/)

## Repository Structure

```
/mnemosyne
├── apps/
│   ├── frontend/         // Fork of infinite-mac (Next.js/Preact)
│   └── backend/          // The Node.js "Broker" server
├── packages/
│   ├── mnemosyne-os/     // The "Core" OS definition (Docker)
│   └── ui/               // Shared React components
├── package.json          // Root package.json
└── turborepo.json        // Monorepo configuration
```

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/whiteStainX/mnemosyne.git
    cd mnemosyne
    ```

2.  **Set up the frontend subtree (if not already present):**
    The frontend is included as a Git subtree. If you are cloning for the first time, it should be there. If not, you can add it with:
    ```bash
    git subtree add --prefix=apps/frontend https://github.com/whiteStainX/infinite-mac.git main --squash
    ```

3.  **Install dependencies:**
    This is a monorepo, so you need to install dependencies at the root and in each workspace.
    ```bash
    # Install root dependencies
    npm install

    # Install dependencies for all workspaces (requires npm 7+)
    npm install --workspaces
    ```
    Alternatively, you can install dependencies for each workspace individually:
    ```bash
    # Install backend dependencies
    npm install --workspace=backend

    # Install frontend dependencies
    npm install --workspace=frontend
    ```

4.  **Run the development servers:**
    From the root of the project, run:
    ```bash
    npm run dev
    ```
    This will use Turborepo to start the development servers for both the `frontend` and `backend` applications.
