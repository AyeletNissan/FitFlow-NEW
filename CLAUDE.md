# FitFlow Project Guidelines

## Project Overview
FitFlow is a Next.js TypeScript application for planning workouts and running plans with AI-powered coaching.

## Tech Stack
- **Framework**: Next.js with TypeScript
- **Database**: Prisma ORM
- **Authentication**: Auth.js with Google OAuth
- **AI**: Anthropic API for Run Coach features
- **Calendar Integration**: Google Calendar API (backend routes only)

## Development Guidelines

### Code Style
- Write clean, simple, and readable code
- Use TypeScript for type safety
- Follow Next.js conventions and best practices
- Keep components focused and single-purpose

### Communication
- Explain all changes clearly
- Before implementing large or complex changes, create a short plan
- Use the TodoWrite tool for multi-step tasks

### Important Constraints
- **Do NOT implement MCP (Model Context Protocol)**
- **Google Calendar API**: Only use in backend routes (API routes or Server Actions), never in client components
- **Authentication**: All auth logic must use Auth.js

### Database
- Use Prisma for all database operations
- Run migrations before schema changes go live
- Keep models well-defined with proper relations

### API Integration
- Anthropic API calls should be made from backend routes only
- Google Calendar API calls must only happen server-side
- Handle API errors gracefully with user-friendly messages

### Before Starting Work
- Read relevant Next.js documentation in `node_modules/next/dist/docs/` if working with unfamiliar Next.js features
- Understand the context before making changes
- For large features, outline the approach first

@AGENTS.md
