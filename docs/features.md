# Features

## Interactive Card Editor

The core of DnD Card Maker is a **real-time card editor** with a linked live preview.

### Elements

Cards are built from two element types:

**Text Elements**

- Rich-text editing powered by [Slate.js](https://www.slatejs.org/)
- Bold and italic formatting
- Adjustable font size
- Configurable line height
- Text alignment (start, center, end)
- Width control with a numeric input
- Two background variants:
  - **Banner** — a solid bar spanning the card width
  - **Box** — a bordered rectangle with padding

**Image Elements**

- Source from URL or local file upload
- Adjustable corner radius
- Width control
- Source URL tooltip on hover

### Element Controls

Hover over any element in the editor to reveal a floating action menu with:

| Control          | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| **Move Up/Down** | Reorder elements within the card                            |
| **Grow to Fill** | Toggle vertical expansion to fill available space           |
| **Alignment**    | Align element to start, center, or end                      |
| **Settings**     | Open type-specific settings (font size, image source, etc.) |
| **Delete**       | Remove the element                                          |

### Color Themes

Customize every color on your card with the **Color Settings** dialog:

- **Fill** — card background color
- **Banner Fill** — banner text element background
- **Box Fill** — box text element background
- **Stroke** — border and ornament color
- **Banner Text** — text color on banner elements
- **Box Text** — text color on box elements

The app can also **extract a color palette from an image** to automatically generate a matching theme.

### Real-time Preview

The preview panel renders your card exactly as it will appear when exported — complete with:

- Themed SVG background pattern
- Corner ornaments
- Scaled element layout
- Proper text wrapping and rendering

## Deck Management

### Local Deck

- **Auto-save** — your deck is automatically persisted and restored when you return
  - Logged-in users: saved to the server and synced across devices
  - Guest users: saved locally in the browser
  - Loaded cloud decks also get auto-saved so work is never lost
- **Add cards** to a local deck with the **+** button
- **Browse cards** with an animated stacked card interface (Framer Motion)
- **Edit** any deck card by loading it back into the editor
- **Copy** or **delete** cards from the deck
- **Download individual cards** as high-resolution PNG images

### Full-Screen Grid View

- Toggle a full-screen sortable grid of your deck
- **Drag and drop** to reorder cards (powered by [dnd-kit](https://dndkit.com/))
- Quick actions on hover: edit, copy, delete, download

### Import / Export

- **Export** your entire deck to a JSON file for backup or sharing
- **Import** a previously exported deck JSON file
- All data is validated with Zod schemas on import

### PDF Export

Select cards from your deck and export them as a multi-page PDF:

- Cards rendered at 2.5" x 3.5" (standard card size)
- 4 cards per row, landscape US letter pages
- Choose which cards to include via a selection grid

## Cloud Sync

Create an account to unlock cloud features:

### Save to Cloud

- Save any card to your cloud account
- Cards are stored with their full element data, theme, and a rendered thumbnail image
- **Batch upload** for large decks — cards are uploaded in groups of 10 to avoid request size limits

### My Cards & Decks

- **My Cards** — grid view of all your saved cards
  - Load cards into the editor for further editing
  - Copy cards to create variants
  - Toggle cloud save status per card
- **Decks** — organize cards into named decks
  - Create, rename, and delete decks
  - Move cards between decks
  - Each user gets a default "My Cards" deck

### Progressive Image Loading

Card thumbnails load using a **progressive blur technique**:

1. A tiny (0.1x scale) blurred version loads instantly
2. A higher quality (0.6x scale) version replaces it with a smooth fade
3. This provides immediate visual feedback while full images load

## Sharing

Share cards and decks publicly with two permission modes:

| Mode            | Description                                    |
| --------------- | ---------------------------------------------- |
| **View Only**   | Anyone with the link can view the card/deck    |
| **View & Copy** | Viewers can copy cards to their own local deck |

Each shared item gets a unique 8-character URL-safe slug. Share URLs take the form:

- Cards: `{base}/share/{slug}`
- Decks: `{base}/share/deck/{slug}`

### Unsharing

Remove a share link at any time from the cloud card or deck view. The link immediately stops working.

## Authentication

- **Email + password** registration with verification
- JWT-based authentication with access tokens (15 min) and refresh tokens (7 days)
- Automatic token refresh via Axios interceptors — no manual re-login needed
- **Password reset** flow via email
- **Account settings**: change password, update email, delete account
- Optional **Cloudflare Turnstile CAPTCHA** on registration

## Responsive Design

The app adapts to different screen sizes:

- Cards render internally at a fixed 400px width
- CSS `zoom` scaling adjusts to available viewport height
- Below a 0.65 width-to-height ratio, the layout switches to a **stacked column** mode suitable for mobile

## Keyboard Shortcuts

| Shortcut           | Action                          |
| ------------------ | ------------------------------- |
| `Ctrl+S` / `Cmd+S` | Save current card to local deck |

## Dev Tools (optional)

When `DEV_MAIL_ENABLED=true`:

- **`/mail`** — view sent emails (verification, password reset) directly in the browser
- **`/admin`** — browse database tables, inspect cards and decks

These routes are only available when the dev flag is enabled and should **never be enabled in production**. Access requires an `X-Dev-Auth` header matching the server's `JWT_SECRET`.
