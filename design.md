# Design Specification & Style Guide

## Brand Palette
| Name | Hex | Usage |
| :--- | :--- | :--- |
| **Primary Blue** | `#0069b1` | Primary actions, headings, active states. |
| **Accent Gold** | `#fdce36` | Table headers, secondary highlights, borders. |
| **Brand Dark** | `#414042` | Primary text, navigation backgrounds. |
| **Success Emerald** | `#10b981` | Sync success indicators. |
| **Background Grey**| `#f8fafc` | Main application body. |

## Typography
- **Primary Font**: `Source Sans Pro`.
- **Weights**: 400 (Regular), 600 (Semi-Bold), 700 (Bold), 900 (Black).
- **Rule**: Use "Black" (900) for all uppercase tracking titles to achieve the institutional look.

## UI Components
### 1. Planning Pipe Tables
- Header: Solid Gold background (`bg-brand-gold`), Black uppercase text.
- Rows: Clean white, `divide-y`, subtle hover states (`hover:bg-slate-50`).
- Text: Links in Blue, metadata in Slate-400 font-bold.

### 2. Filter Panels
- 4-column grid for desktop.
- Section headers use the "Gold Bar" style (Left border-4 in Brand Dark).
- Interactive inputs use thick 2px borders in `brand-grey` and 3xl rounded corners.

### 3. Layout Philosophy
- **Admin**: White backgrounds, slate borders, very clean and utilitarian.
- **Client**: Darker headers, gold accents, high-contrast "Results" view.
