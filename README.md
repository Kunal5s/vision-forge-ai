# Imagen BrainAi - A Next.js Web Application

This is a Next.js application built with Firebase Studio. It features a modern frontend built with React, Tailwind CSS, and ShadCN UI components.

## Key Features

- **Frontend**: Next.js, React, Tailwind CSS, ShadCN UI
- **AI-Powered Content**: Articles are generated automatically by AI.
- **Deployment**: Ready for Vercel with CRON-based updates.

## Getting Started

### 1. Environment Setup

First, you need to set up your environment variables. Create a file named `.env` in the root of the project and add your API keys:

```
OPENROUTER_API_KEY=your_open_router_api_key

# Optional: For CRON job regeneration on Vercel
CRON_SECRET=your_cron_secret
VERCEL_DEPLOY_HOOK_URL=your_vercel_deploy_hook_url

# Optional: For saving articles to a GitHub repo
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_repo_name
```

### 2. Install Dependencies

Install the necessary packages using npm:

```bash
npm install
```

### 3. One-Time Article Generation (Crucial First Step)

Before you run the development server for the first time, you must generate the initial set of articles for all categories. This script uses the `OPENROUTER_API_KEY` from your `.env` file.

Run the following command:

```bash
npm run generate-articles
```

This will create `.json` files in the `src/articles` directory. This might take a few minutes as it's generating content for all categories.

### 4. Run the Development Server

Now you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The main application logic can be found in `src/app/page.tsx`.

## Automatic Updates (CRON Job)

The application includes a CRON job that automatically regenerates the "Featured" articles daily. To enable this on Vercel, you need to:

1.  Set the `CRON_SECRET` and `VERCEL_DEPLOY_HOOK_URL` environment variables in your Vercel project settings.
2.  Configure a CRON job in `vercel.json` or the Vercel dashboard to send a POST request to `/api/cron/regenerate-articles` daily.
