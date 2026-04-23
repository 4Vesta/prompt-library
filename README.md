# Prompt Library

Personal prompt organizer. Built with Vite + React + Tailwind, deployed as a static site.

## Philosophy

This isn't a prompt hoarder. It's a tool for generating detailed, tailored prompts instead of generic copy-paste. Every prompt in the library should earn its parameters — the goal is fewer, better prompts that produce better output, not a massive collection of generic templates.

Guiding principles:
- Quality over quantity. A library of 15 well-parameterized prompts beats 100 generic ones.
- Parameters should reflect real decisions that meaningfully change the output. If a value never varies in practice, bake it into the template instead.
- When adding a prompt, think about the specific situations it'll be used in. The variation between those situations is where the parameters come from.

## How to add prompts

1. Find a prompt you want to add.
2. Ask Claude to format it as a JSON entry for the library.
3. Open `public/prompts.json` on GitHub, click the pencil icon to edit.
4. Paste the new entry inside the `"prompts": [ ... ]` array (add a comma after the previous entry).
5. Commit. The site redeploys in ~1 minute.

## How to add resources

Same workflow, but edit `public/resources.json` instead.

## Data structure

**`public/prompts.json`** — categories and prompts. Each prompt has:
- `id` (unique, kebab-case)
- `name`, `source`, `sourceType` (`reddit` | `external` | `custom`)
- `category` (must match a category id)
- `tags` (array of lowercase strings)
- `useCase` (1-2 sentences)
- `parameters` (array — see below)
- `template` (the prompt text with `[PLACEHOLDERS]`)

**Parameter types:**
- `text` — single line. Fields: `key`, `type`, `hint` (optional)
- `textarea` — multi-line. Same fields as text.
- `dropdown` — select from options. Fields: `key`, `type`, `options` (array)
- `checkbox` — toggle. Fields: `key`, `type`, `label`, `ifTrue`, `ifFalse`

**`public/resources.json`** — list of places to find new prompts. Each has:
- `id`, `name`, `url`
- `type` (`library` | `reddit` | `reference` | `skip`)
- `description` (optional — can be empty string)
- `notes` (optional)

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`. Cloudflare Pages / Vercel builds this automatically on push.
