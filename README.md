# Imagen BrainAi - A Next.js Web Application

This is a Next.js application built with Firebase Studio. It features a modern frontend built with React, Tailwind CSS, and ShadCN UI components.

## Key Features

- **Frontend**: Next.js, React, Tailwind CSS, ShadCN UI
- **AI-Powered Content**: Articles are generated automatically by AI.
- **Deployment**: Ready for Vercel deployment.

## Getting Started

### 1. Environment Setup

First, you need to set up your environment variables. Create a file named `.env` in the root of the project.

**Required:**

```
OPENROUTER_API_KEY=your_open_router_api_key
```

**Optional (for syncing articles to a GitHub repository):**

```
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

This will create `.json` files in the `src/articles` directory. This might take a few minutes as it's generating content for all categories. If GitHub variables are set, it will also commit these files to your repository.

### 4. Run the Development Server

Now you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The main application logic can be found in `src/app/page.tsx`.
