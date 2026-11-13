# NyX UI Editor - By MorveX ( @delnazok )

A visual UI editor for creating game interfaces (especially useful for MTA:SA / FiveM style UIs).  
Drag & drop components, customize properties, align/distribute elements, and export ready-to-use Lua + images.

**Languages:** English · فارسی · العربية

---

## Features

- Drag & drop shapes, buttons, labels, progress bars, icons, images
- Multi-select, align, distribute, equal gap tools
- Layers panel with reordering
- Undo / Redo
- Custom resolution (720p → 8K) with optional UI scaling
- AI Generate (prompt-based UI generation)
- Export options:
  - **Export Lua** – pure Lua code
  - **Export Image** – high-quality PNG of the design
  - **Export Lua + Images** – ZIP with `client.lua` + individual PNG layers + `meta.xml` (ready for MTA)
- Save / Open projects (`.nyx` format)
- Auto-save to browser localStorage
- Upload custom icons & images
- Full RTL support (Persian / Arabic)

---

## How to use

### Online (recommended)
Just open `index.html` in a modern browser (Chrome / Edge / Firefox).

### Local
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/nyx-ui-editor.git
cd nyx-ui-editor

# Serve with any static server (example with Python)
python -m http.server 8080
# then open http://localhost:8080
```

> Note: Some features (html2canvas, JSZip, Google Fonts) need internet access.

---

## Export for MTA:SA

1. Design your UI
2. Click **Export Lua+Images**
3. You get a ZIP containing:
   - `client.lua`
   - `images/` (one PNG per layer, 3× scale for sharpness)
   - `meta.xml`
4. Put the folder in `resources/` and start the resource

---

## Project structure

```
nyx-ui-editor/
├── index.html      # Main page
├── styles.css      # Styles
├── app.js          # Full application logic
└── README.md
```

---

## Browser support

Works best on Chromium-based browsers (Chrome, Edge, Brave, Opera).  
Firefox is also supported.

---

## Credits

Built with:
- [html2canvas](https://html2canvas.hertzen.com/)
- [JSZip](https://stuk.github.io/jszip/)
- Google Fonts (Inter, Poppins, Vazirmatn, ...)

---

## License

MIT License – feel free to use, modify and distribute.
