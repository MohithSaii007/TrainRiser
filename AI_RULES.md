# TrainRiser AI Development Rules

## Tech Stack
- **Framework**: React 18 with Vite for high-performance bundling and development.
- **Language**: TypeScript for strict type safety and improved maintainability.
- **Styling**: Tailwind CSS for utility-first, responsive, and consistent design.
- **UI Components**: shadcn/ui (built on Radix UI) for accessible, unstyled base components.
- **Backend & Auth**: Firebase (Authentication & Firestore) for primary user data and booking records.
- **Integrations**: Supabase for Edge Functions (e.g., email notifications) and specific logging tables.
- **Routing**: React Router DOM (v6) for client-side navigation and protected routes.
- **Data Fetching**: TanStack Query (React Query) for efficient server-state management and caching.
- **Forms**: React Hook Form combined with Zod for schema-based validation.
- **Icons**: Lucide React for a consistent and lightweight iconography system.

## Library Usage Rules

### 1. UI & Styling
- **Components**: Always check `src/components/ui/` for existing shadcn components before creating new ones.
- **Icons**: Use `lucide-react` exclusively. Do not import icons from other libraries.
- **Styling**: Use Tailwind CSS classes. Avoid writing raw CSS in `index.css` or using CSS Modules unless it's for complex animations that Tailwind cannot handle.
- **Responsiveness**: All new components must be mobile-first and responsive using Tailwind's `sm:`, `md:`, `lg:`, and `xl:` prefixes.

### 2. State & Data
- **Server State**: Use `useQuery` and `useMutation` from TanStack Query for all API or database interactions.
- **Forms**: Use `react-hook-form` for all inputs. Define validation schemas using `zod` in the same file or a dedicated `types` file.
- **Navigation**: Use `useNavigate` and `Link` from `react-router-dom`. Do not use `window.location`.

### 3. Backend Services
- **Authentication**: Use the `useAuth` hook from `src/contexts/AuthContext.tsx` to access user state.
- **Database**: Use Firebase Firestore for real-time data like user profiles and booking history.
- **Edge Logic**: Use Supabase Edge Functions for server-side tasks like sending emails or processing payments to keep API keys secure.

### 4. Utilities & Feedback
- **Notifications**: Use `toast` from `sonner` for success/error feedback.
- **Class Merging**: Always use the `cn()` utility from `src/lib/utils.ts` when conditionally applying Tailwind classes.
- **Date Handling**: Use `date-fns` for any complex date manipulation or formatting.

### 5. File Structure
- **Pages**: Place top-level route components in `src/pages/`.
- **Components**: Place reusable UI pieces in `src/components/`.
- **Types**: Define shared interfaces in `src/types/` to maintain a single source of truth.