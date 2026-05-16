---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

WebGL is a JavaScript API that gives you direct access to the GPU from the browser, letting you render 2D and 3D graphics at hardware speeds — the key shift from Canvas 2D is that you're no longer pushing pixels through a CPU-bound abstraction; you're programming the graphics pipeline itself.

## The Core Mechanism

Canvas 2D gives you a stateful painter's model: you call `drawRect`, `drawImage`, etc., and the browser figures out how to render it. WebGL inverts this. You supply two small programs — called **shaders** — written in GLSL (a C-like language), which run directly on the GPU for every vertex and every pixel in parallel.

The pipeline has two stages:

1. **Vertex shader** — runs once per vertex. Takes in attributes (position, UV coords, normals) and outputs clip-space coordinates. You're transforming geometry here.
2. **Fragment shader** — runs once per pixel fragment covered by your geometry. Outputs a color. This is where lighting, textures, and effects happen.

You feed data to these shaders through **buffers** (raw typed arrays uploaded to GPU memory) and **uniforms** (per-draw constants like a transformation matrix). The CPU side is mostly about marshalling data into GPU memory and issuing draw calls; the actual computation happens on the GPU in parallel across thousands of cores.

## Mental Model

Think of it like this: Canvas 2D is like using Photoshop — you ask for operations and it handles the execution. WebGL is like writing a render loop in C that runs on thousands of cores simultaneously. You own the pipeline, which means total control but also total responsibility.

## Concrete Example

To draw a triangle:
- Upload 3 (x, y) vertex positions to a buffer
- Write a vertex shader that passes them through (or transforms them)
- Write a fragment shader that returns a constant red color
- Call `gl.drawArrays(gl.TRIANGLES, 0, 3)`

Every vertex runs through the vertex shader in parallel; every covered pixel runs through the fragment shader in parallel. That parallelism is why WebGL can push millions of triangles at 60fps.

## Practical Scenarios

**Frontend:** Particle systems, data visualizations with hundreds of thousands of points (think D3 at scale), custom map renderers, interactive 3D product viewers. Libraries like Three.js and PixiJS abstract WebGL — understanding the fundamentals tells you why `BufferGeometry` is faster than `Geometry`, why draw call count matters, and how to debug shader artifacts.

**Fullstack:** If you're building a canvas-based collaborative tool (Figma-style) or a game with a Node backend, you'll need to reason about what state lives on the GPU vs. CPU, and how to sync server-side logic with client-side rendering. Server-side rendering of WebGL (via headless Chrome or WebGL in Node) also comes up for generative image pipelines.

The biggest mindset shift: stop thinking sequentially. The GPU is a massively parallel machine and your code needs to reflect that — no loops over pixels, no conditional branching on per-pixel data if you can avoid it.
