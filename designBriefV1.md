# PourOver Design Brief V1

## Product Direction

PourOver is a mobile-first, local-first pour over brewing appliance hosted directly by the ESP32. It should work without internet, expose the app over local Wi-Fi using `.local` / Bonjour, and store shared brewing data on the ESP32 so everyone using the physical brewer sees the same coffees, recipes, and history.

The phone/browser is the interface. The ESP32 is the device, data store, local server, and sensor source.

The product should feel like a calm, premium brewing appliance: precise, quiet, trustworthy, and focused on the brew rather than on operating software.

## Target Users

### Newbie

A first-time brewer needs a guided, forgiving experience.

- Choose or create a local user profile.
- Choose experience level during onboarding.
- Select brewer/device and coffee.
- Follow a generated beginner-safe recipe.
- See plain-language brew instructions with clear scale targets.
- Receive guidance for common mistakes such as pouring too fast, pouring too slow, wrong grind direction, or missed target weights.
- Give simple taste feedback after brewing: sour, bitter, weak, strong, or balanced.

### Everyday Brewer

A repeat brewer needs speed, consistency, and low friction.

- Open the app and quickly start a favorite or recent recipe.
- Select the current coffee.
- Make small edits without entering a full expert editor.
- Track coffee bag remaining weight automatically.
- Compare today's brew against recent brews.
- Keep all data local to the device and local network.

### Professional

A professional or competition brewer needs control, repeatability, and evidence.

- Use full recipe variables: dose, water, ratio, temperature, grind, pours, bloom, flow rate, agitation, and drawdown.
- Track target vs actual brew behavior from sensor data.
- Review history by coffee, recipe, user, day, and week.
- Later versions should support charts for pour timing, flow rate, cumulative water, drawdown, and taste outcomes.

## Device Model

The ESP32 is a two-stage weighing scale and local web server.

### Scale 1: Dripper Scale

The dripper scale sits under the V60 and measures the coffee bed, poured water, and water retained in the dripper over time.

### Scale 2: Carafe Scale

The carafe scale sits under the brewed coffee and measures extracted beverage weight over time.

Together, these two live streams allow the app to understand:

- Target pour weight.
- Actual pour weight.
- Current step timing.
- Next step hint.
- Drawdown progress.
- Final beverage weight.
- Difference between water poured and beverage produced.
- Coffee bag deduction after brew completion.

## Connectivity

The ESP32 hosts the web app locally.

- The app must not depend on internet access.
- The ESP32 can connect to local Wi-Fi.
- Clients should be able to connect using a `.local` hostname through Bonjour / mDNS.
- The app should remain usable on the local network even when the internet is unavailable.

## Storage Model

### ESP32 Storage

Shared product data should live on the ESP32 so all local brewers using the same physical device see the same coffees, recipes, and history.

Store on the ESP32:

- User profiles.
- Coffee inventory.
- Remaining coffee bag weights.
- Saved recipes.
- Brew history.
- Device calibration.
- Sensor traces where storage allows, or summarized traces if full traces are too large.

### Browser Local Storage

Use browser `localStorage` for small interface preferences:

- Last selected user.
- Theme.
- Onboarding completed.
- UI preferences.
- Last connected device hostname.

### Browser IndexedDB

Use browser `IndexedDB` for optional local cache and larger browser-side data:

- Cached ESP32 data.
- Imported recipe files before saving to device.
- Offline UI cache if needed.

Avoid cookies except for a small session or active-profile hint if needed. Cookies are not the right storage layer for brew history, recipes, coffee inventory, or sensor traces.

## V1 Product Scope

V1 should prioritize guided brewing and local device setup.

Primary V1 goals:

1. ESP32-hosted mobile UI shell.
2. Local profile and onboarding.
3. Device setup, scale tare, and calibration flow.
4. Coffee inventory.
5. Guided fullscreen brew mode.
6. Save brew history to ESP32.
7. Recipe import, export, and sharing.
8. Driver.js tutorial.
9. Lightweight animations for weight goal, brew progress, and timer states.

Professional analytics are not the main V1 goal. V1 should capture clean sensor data first so later charts and comparisons are trustworthy.

## Information Architecture

### Onboarding

- Choose or create user profile.
- Choose experience level: Newbie, Everyday, or Professional.
- Connect to the ESP32 at `.local`.
- Calibrate and tare both scales.
- Offer a guided Driver.js tour after setup.

### Brew

- Select user.
- Select coffee.
- Select recipe.
- Tare both scales.
- Start brew.
- Enter fullscreen brew mode.

### Coffee

- Add coffee bag.
- Select previous coffee.
- Track roaster, origin, process, roast date, tasting notes, starting bag weight, and remaining weight.
- Subtract the recipe dose from remaining bag weight after a completed brew.

### Recipes

- Saved recipes.
- Imported recipes.
- Shared recipes.
- Duplicate and edit recipes.
- Export recipe as JSON or brew file.
- Import recipe JSON or brew file into saved recipes.
- Use Web Share API where supported.

### History

- Daily brew history.
- Weekly brew summaries.
- Coffee used.
- Recipe used.
- Dose.
- Final beverage output.
- Brew time.
- Notes.
- Taste feedback.

### Device

- ESP32 connection status.
- Hostname / `.local` address.
- Scale calibration.
- Tare controls.
- Sensor health.

### Settings

- User profile.
- Experience level.
- Theme.
- Audio and haptics.
- Fullscreen preference.
- Data import and export.
- Device management.

## Guided Brew Flow

1. Select user profile.
2. Select coffee.
3. Select or create recipe.
4. Tare both scales.
5. Add coffee to the V60.
6. Start guided brew.
7. Fullscreen mode shows:
   - Current timer.
   - Current target weight.
   - Live dripper weight.
   - Live carafe weight.
   - Current step.
   - Next step hint.
8. End brew.
9. Subtract dose from selected coffee bag remaining weight.
10. Save brew result to history.

## Fullscreen Brew Mode

Fullscreen mode should be the main active brewing surface.

It should show:

- Current weight.
- Timer.
- Current brew step.
- Current target weight.
- Next step as a hint.
- Dripper scale reading.
- Carafe scale reading.
- Ahead/behind target feedback where possible.

The UI should be calm, glanceable, and usable while the brewer's hands are busy.

## Sensor-First Brew Data

Each completed brew should save:

- Recipe target values.
- Timestamped dripper weight readings.
- Timestamped carafe weight readings.
- Target vs actual step timing.
- Coffee used.
- Dose used.
- Final beverage weight.
- Drawdown time.
- User notes.
- Taste feedback.

Later versions can derive:

- Pour rate.
- Drawdown curve.
- Retained water.
- Extraction consistency proxy.
- Recipe repeatability.
- Bean usage over time.

## Animation Principles

Use animations where they clarify brewing state:

- Weight approaching target.
- Timer phase changes.
- Brew progress.
- Step transitions.
- Successful tare or calibration.

Avoid repeating multiple animations on the same frame or page. Motion should feel like an appliance responding to state, not decorative movement.

## Design Principles

- Progressive disclosure: newbies see guidance, everyday brewers see speed, professionals see data.
- Mobile first: the primary use case is a phone beside the brewer.
- Local first: no cloud dependency.
- Sensor first: assume the scale data is the source of truth.
- Shared device state: coffees, recipes, history, and profiles live on the ESP32 for all local users.
- Calm premium appliance: quiet UI, clear hierarchy, high trust, minimal clutter.

