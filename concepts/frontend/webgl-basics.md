---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

WebGL is what you use when Canvas 2D runs out of headroom — particle systems, real-time data visualizations, 3D scenes, GPU-accelerated image processing. The API maps almost 1:1 to OpenGL ES 2.0, which means you're talking directly to the GPU driver with minimal abstraction.

**The core mental model**

Canvas 2D has an implicit state machine: you call `fillRect()` and the browser figures out the GPU work. WebGL inverts this — you are responsible for every step of the rendering pipeline.

The pipeline has two mandatory stages you write yourself, as GLSL shader programs:

- **Vertex shader**: runs once per vertex. Takes raw coordinate data and outputs clip-space positions (`gl_Position`).
- **Fragment shader**: runs once per pixel fragment. Outputs a color (`gl_FragColor`).

Between those, the GPU handles rasterization (converting triangles to pixel fragments) automatically.

Everything else is setup: you allocate buffers on the GPU, upload your geometry data into them, compile and link shaders into a program, bind textures, set uniforms (per-draw constants like a transformation matrix), and then issue a draw call like `gl.drawArrays(gl.TRIANGLES, 0, 6)`.

**Concrete example**

Drawing a rectangle in Canvas 2D: 1 line. In WebGL, a rectangle is two triangles, so you need 6 vertices. You write a Float32Array of coordinates, create a buffer, bind it, upload it, write a vertex shader that reads each position, write a fragment shader that outputs a color, link them into a program, configure how the buffer data maps to the shader's input attribute, and then call draw. That's 40–60 lines before you see anything.

This isn't bureaucracy for its own sake — every step controls something meaningful. That buffer configuration step (`vertexAttribPointer`) lets you pack multiple attributes (position, UV, normal) into one buffer with offsets and strides, which matters a lot for GPU memory bandwidth.

**When you actually reach for it**

- **Frontend**: You mostly won't touch raw WebGL — you'll use Three.js, Babylon.js, or REGL as an abstraction layer. But knowing WebGL means you can debug shader performance, write custom post-processing effects, or understand why a Three.js scene is bottlenecked on draw calls vs. fill rate.
- **Fullstack**: If you're building a data visualization tool (think Mapbox, deck.gl-style), custom WebGL gives you control Canvas 2D can't offer — rendering millions of points at 60fps, GPU-side picking, custom blending modes.

The common pitfall is treating WebGL like a more verbose Canvas. It's not — it's a different paradigm where the CPU's job is to orchestrate GPU work, not perform it. State management (what's currently bound, what program is active) is implicit and global, which causes subtle bugs when you have multiple rendering passes.
