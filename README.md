# CHRIST FLOW — C-powered campus flow prototype

## The idea
Students repeatedly make everyday campus decisions without knowing the current crowd level, queue length or alternative options. CHRIST FLOW is a prototype that turns a campus snapshot into a recommendation: where to eat, print, study or move with less waiting.

## Architecture
- **C:** core decision engine (`c-engine/pulse_engine.c`)
- **Node.js:** tiny local bridge/server (`server.js`) that calls the C executable
- **HTML/CSS/JavaScript:** glassmorphism interface + scrollytelling landing page
- **JSON:** prototype campus snapshot (`data/campus.json`)

No React or frontend framework is required. The web stack is deliberately lightweight so the C logic remains the academic centre of the project.

## C concepts demonstrated
- Variables and data types
- Tokens / identifiers / constants
- `printf` / console I/O
- Header libraries (`stdio.h`, `stdlib.h`, `string.h`)
- Operators
- `if / else if / else`
- `switch`
- Functions
- Strings
- Arrays / repeated option processing
- `for` loops

## Run on Windows
1. Install GCC (MinGW-w64 / MSYS2) and make sure `gcc` works in PowerShell:
   `gcc --version`
2. Open this folder in VS Code.
3. Run:
   `node server.js`
4. Open `http://localhost:5173`.

The Node server automatically tries to compile `pulse_engine.c` into `c-engine/pulse_engine.exe` when it starts if the executable is missing.

## Run on Linux/macOS
1. Install GCC/Clang.
2. `gcc --version`
3. `node server.js`
4. Open `http://localhost:5173`.

The server will compile `pulse_engine` automatically if missing.

## If automatic compilation fails
Windows:
`gcc c-engine/pulse_engine.c -O2 -o c-engine/pulse_engine.exe`

Linux/macOS:
`gcc c-engine/pulse_engine.c -O2 -o c-engine/pulse_engine`

Then restart `node server.js`.

## Demo flow for presentation
1. Start with the scrollytelling problem: “How much of college do we spend waiting?”
2. Ask the class whether they know which canteen / printing point is crowded right now.
3. Reveal CHRIST FLOW.
4. Show the C engine pipeline.
5. Select **Eat** and change the available minutes.
6. Click “I’ve seen this too” to show live signal updates.
7. Explain that the current campus numbers are prototype data; real deployment could collect anonymous, voluntary signals, QR check-ins or sensor data.

## Academic note
This is a prototype, not a claim of real-time data from CHRIST University. The sample campus data is intentionally simulated for demonstration.
