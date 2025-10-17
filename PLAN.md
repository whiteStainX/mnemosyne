# Mnemosyne Project Plan

This document outlines the development plan for Mnemosyne, broken down into four distinct phases. The approach is to build a solid technical foundation first, then layer on the frontend and immersive content.

---

### Phase 1: The Core System (Backend Foundation)

**Goal:** Achieve a functional, direct connection from a simple test webpage to a custom Docker container. This phase focuses purely on the backend plumbing.

**Tasks:**

1.  **Define the `mnemosyne-os` Image:**
    *   Create the `Dockerfile` in `packages/mnemosyne-os`.
    *   Base it on `alpine:latest`.
    *   Add a custom Message of the Day (`motd`).
    *   Add a simple test script at `/usr/local/bin/mnemosyne-test`.
    *   Ensure the container runs as a non-root user for basic security.

2.  **Build the `backend` Broker Server:**
    *   Set up the Node.js project in `apps/backend` with Express and Socket.io.
    *   Add a Docker interaction library (e.g., `dockerode`).
    *   Externalize configuration (ports, Docker socket path) using environment variables.

3.  **Implement Connection & Container Lifecycle Logic:**
    *   On a new WebSocket connection, use the broker to spawn a new container from the `mnemosyne-os` image.
    *   Attach to the container's shell (`ash`).
    *   Pipe all I/O between the WebSocket and the container's shell.
    *   **On WebSocket disconnect, ensure the corresponding Docker container is stopped and removed to prevent resource leaks.**

4.  **Create a Barebones Test Client:**
    *   Create a `test.html` file with `xterm.js` to connect to the broker and verify the end-to-end functionality.

---

### Phase 2: The Museum Shell (Frontend Foundation)

**Goal:** Set up the `infinite-mac` fork and prepare it for our modifications.

**Tasks:**

1.  **Fork and Integrate:**
    *   Use the `git subtree` process to integrate the `infinite-mac` fork into `apps/frontend`.

2.  **Run the Base Frontend:**
    *   Install all dependencies and get the standard `infinite-mac` project running locally.

3.  **Analyze and Prepare for Customization:**
    *   **Investigate and document the `infinite-mac` build process (Next.js/Webpack) to understand how to best inject custom code and styles.**
    *   Integrate Tailwind CSS into the project's build configuration.
    *   (Optional) Identify and remove any `infinite-mac` features or disk images that are not needed for Mnemosyne to streamline the experience.

---

### Phase 3: The Portal (Connecting Frontend & Backend)

**Goal:** Seamlessly integrate the terminal from Phase 1 into the retro UI from Phase 2.

**Tasks:**

1.  **Build the "Portal" React Component:**
    *   Inside `apps/frontend`, create a new React component that renders the `xterm.js` terminal.
    *   Make the component's window draggable.
    *   Style the component to look like a native System 7 window (window chrome, scrollbars, etc.).

2.  **Design State Management:**
    *   **Implement a simple state management solution (e.g., using React Context) to handle the Portal's state (visibility, position, etc.) across the application.**

3.  **Implement the "Injection" Trigger:**
    *   Modify the System 7 disk image to include a dummy application (e.g., `Mnemosyne.app`).
    *   Write code in the frontend to intercept the "open" event for this dummy app.

4.  **Render the Portal as an Overlay:**
    *   When the trigger event is fired, use the state management solution to render the "Portal" React component as an HTML overlay on top of the emulator canvas.

5.  **Wire up the Connection:**
    *   Connect the Portal component's WebSocket to the backend broker.

---

### Phase 4: The Mnemosyne Experience (Content & Polish)

**Goal:** Transform the working technical prototype into the immersive, explorable world of Mnemosyne.

**Tasks:**

1.  **Populate the Core OS:**
    *   Flesh out the `mnemosyne-os` Docker image with the secret filesystem, lore files, and user accounts.
    *   Create custom commands and shell scripts for narrative-driven events (e.g., `multiverse_check`).
    *   Install and configure "hacker" CLI tools (e.g., `cmatrix`, `neofetch`).

2.  **Refine the Frontend:**
    *   Add authentic sound effects (startup chimes, error beeps).
    *   Pixel-perfect the UI/UX of the Portal window and its interaction with the emulated OS.
    *   Add any other easter eggs or visual details to the "Museum" environment.

3.  **Ensure Stability:**
    *   **Develop a manual test plan outlining key user flows. Regularly test against this plan as new content is added to ensure the core experience remains stable and bug-free.**
