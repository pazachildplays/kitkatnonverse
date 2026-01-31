# KitKat Universe

Welcome to the KitKat Universe! This project is a viewer and admin panel for KitKat's content, featuring games like Uno and Chess.

## Deployment

This project is configured for deployment on **Render**. If configuring manually, use:

- **Build Command:** `mix deps.get --only prod && mix compile && mix assets.deploy`
- **Start Command:** `mix phx.server`
- **Root Directory:** If your `mix.exs` is in a subfolder, specify the folder name here.

> **Troubleshooting:** If the build fails with `phx.digest not found`, ensure the **Build Command** in Render settings matches the one above. The default command (`mix phx.digest`) will fail because dependencies are not yet installed.

### Prerequisites

- Elixir
- Firebase Service Account

### Setup

1. Install dependencies:
   ```bash
   mix deps.get
   ```

2. Start the server:
   ```bash
   mix phx.server
   ```