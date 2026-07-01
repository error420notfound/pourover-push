# PourOver — Precision Brew

**PourOver** is a minimalist, high-precision brew calculator and timer designed for coffee enthusiasts. It translates your preferred coffee-to-water ratio into a structured, step-by-step pouring schedule, complete with an interactive timer to ensure consistency in every cup.

**you can clone and use it on you system and tweak as you like it ***
flowrate feature comming soon .......

## ✨ Features

- **Dynamic Ratio Calculator**: Adjust coffee mass, water volume, or ratio, and the app automatically balances the remaining variables.
- **Automated Pour Scheduling**: Calculates bloom volume and distributes remaining water across multiple pours based on your desired brew time.
- **Interactive Brew Timer**: A visual countdown and progress ring that guides you through each step of the recipe in real-time.
- **Grind Size Guide**: Integrated tips for various grind settings (Coarse to Fine) with suggested ratios and brew times.
- **Brew History**: Save your favorite recipes locally to replicate successful extractions.
- **Yield Estimation**: Predicts the final liquid volume in your cup by accounting for water absorption.

## ☕ How to Use

1. **Set Your Parameters**: Enter your coffee weight and desired ratio (e.g., 1:16).
2. **Choose Your Grind**: Select your grind size to see recommended timing and ratio adjustments.
3. **Review the Schedule**: The "Pour Schedule" updates automatically to show exactly when to pour and how much water to add.
4. **Start Brewing**: Hit **Start Brewing** and follow the live prompts. The timer will highlight the current action (Bloom, Pour, or Drawdown).
5. **Save**: If the cup tastes great, use the **Save Recipe** button to store it in your Brew History.

## 🛠️ Tech Stack

- **HTML5/CSS3**: Utilizes a clean, modern "coffee-house" aesthetic with custom properties for easy theming.
- **Vanilla JavaScript**: All calculations, timer logic, and state management are handled without external dependencies.
- **Local Storage**: Brew history is persisted locally in your browser.
- **Typography**: Features *DM Serif Display* for elegance and *DM Mono* for technical precision.

## GitHub Pages Deployment

This project is a Vite app and must be deployed from the production build in `dist/`, not from the repository root.

In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**. The workflow in
`.github/workflows/deploy.yml` runs `npm run build` and publishes the generated `dist/` artifact.

---
*Precision is the secret ingredient to the perfect cup.*

