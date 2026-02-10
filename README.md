# DnD Card Maker

A powerful and interactive web application for creating custom tabletop RPG cards (like Dungeons & Dragons or Magic: The Gathering). Built with React, TypeScript, and Material UI, this tool allows you to design, preview, and organize your custom cards with ease.

## Features

- **Interactive Editor**:
  - **Add Elements**: Easily add text blocks or images to your card.
  - **Customization**: 
    - **Text**: Adjust font size, style (bold/italic), alignment, width, and choose between "Banner" or "Box" backgrounds.
    - **Images**: Upload local images or paste URLs, adjust corner radius, and resize width.
  - **Layout Control**: Reorder elements, toggle vertical growth to fill space, and align items.
- **Real-time Preview**: See exactly what your card will look like as you edit, complete with thematic SVG backgrounds.
- **Deck Management**:
  - Save created cards to a local "Deck".
  - Browse through your collection with a beautiful stacked card interface (powered by Framer Motion).
  - **Edit**: Reload any card from your deck back into the editor.
  - **Export/Import**: Save your entire deck to a JSON file and load it back later.
  - **Download**: Export individual cards as high-quality PNG images.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **UI Component Library**: [Material UI (MUI)](https://mui.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Image Generation**: [html-to-image](https://github.com/bubkoo/html-to-image)
- **Validation**: [Zod](https://zod.dev/)

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jlwoolf/dnd-card-maker.git
   cd dnd-card-maker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Usage

1. **Editing a Card**:
   - Use the menu below the editor card to add **Text** or **Image** elements.
   - Hover over an element in the editor to reveal its controls:
     - **Move**: Arrows to reorder up/down.
     - **Grow**: Toggle whether the element expands to fill available vertical space.
     - **Align**: Align the element to the start, center, or end.
     - **Settings**: Open specific settings (font size, image source, etc.).
     - **Delete**: Remove the element.

2. **Managing the Deck**:
   - Click the **Add** (+) button on the preview card to add the current design to your deck.
   - Click the **Save** (Floppy Disk) button to update an existing card if you are editing one.
   - The **Deck** widget in the bottom right allows you to cycle through your saved cards.
   - Hover over the active card in the deck to Edit, Delete, or Download it.
   - Use the controls at the bottom of the deck to Import/Export your collection.

## Project Structure

- `src/components/Card`: Core logic for the card editor, elements, and rendering.
- `src/components/Card/Element`: Individual element definitions (Text, Image) and their schema/behavior.
- `src/components/Card/Preview`: The read-only preview component used for generating the final image.
- `src/components/Deck.tsx`: The deck visualization and management component.
- `src/components/useExportCards.ts` & `useElementRegistry.ts`: Zustand stores for managing application state.