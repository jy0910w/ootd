## ADDED Requirements

### Requirement: Tailwind CSS Design System
`apps/web` SHALL use Tailwind CSS v4 as the sole styling solution, with brand tokens defined in `tailwind.config.ts`. Hand-crafted CSS classes in `globals.css` SHALL be removed.

#### Scenario: Brand token applied
- **WHEN** a developer uses a color utility (e.g. `text-brand-600`)
- **THEN** it resolves to the brand color derived from `#2f7a56`

### Requirement: Wardrobe Image Upload Flow
The wardrobe page SHALL provide a drag-and-drop upload modal that allows users to upload an image from their device, preview it immediately, and complete a multi-step categorization form before saving.

#### Scenario: Successful image upload
- **WHEN** a user drops or selects an image file
- **THEN** a preview is shown immediately and the file is uploaded to `POST /api/v1/upload/image`
- **AND** the returned URL is stored with the wardrobe item

#### Scenario: Unsupported file type
- **WHEN** a user uploads a non-image file
- **THEN** an inline error message is shown and the file is rejected

### Requirement: Outfit Composer Upgrade
The `/outfits/new` page SHALL present a two-panel layout: a filterable wardrobe item panel on the left and a composition canvas on the right, with a bottom action bar for saving and AI-fill actions.

#### Scenario: Item selection
- **WHEN** a user clicks a wardrobe item in the left panel
- **THEN** it is added to the composition canvas on the right

#### Scenario: Save outfit
- **WHEN** a user clicks Save in the action bar
- **THEN** the selected items are submitted to `POST /api/v1/outfits`
