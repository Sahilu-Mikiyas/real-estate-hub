
## Phase 1: Authentication & RBAC (Foundation)
- Enable Lovable Cloud (database, auth)
- Login / Signup page (email + password)
- User profiles table with role assignment
- User roles table (agent, supervisor, admin) with RLS
- ProtectedRoute component — redirect unauthenticated users
- Role-based route guards (hide pages per role)
- Role-based component visibility (hide buttons/actions per role)
- Password reset flow (forgot password + /reset-password page)

## Phase 2: Dashboard (Role-Aware)
- **Agent Dashboard**: Personal stats (leads, visits, closings, points), count-up animations, tooltips with weekly goals
- **Supervisor Dashboard**: Team stats cards, agent comparison chart (multi-agent bar/line), team leaderboard
- **Admin Dashboard**: Full system metrics, all agents/teams
- Performance chart (weekly/monthly toggle, line draw animation)
- Recent activity panel (scrollable, click → detail modal)
- Reward progress bar + badge grid (sparkle unlock animation)
- Mini leaderboard (top 3, gold/silver/bronze, highlight logged-in user)

## Phase 3: Leads Management
- Leads table with sort, filter, search, pagination, skeleton loader
- Add Lead modal with duplicate detection (name similarity + phone check)
- Lead Detail panel (slide-in) with tabs: History, Visits, Closings, Posts
- Inline edit for agents (if allowed)
- Admin: merge duplicates, override, delete
- RBAC filtering: agent sees own, supervisor sees team, admin sees all

## Phase 4: Visits & Calendar
- Calendar view with highlighted visit dates (orange glow on hover)
- Click day → filtered visit list
- Visit Log modal (Type: Site/Office, Client, Property, Outcome)
- RBAC: agent personal, supervisor team, admin all + override

## Phase 5: Social Media Logging
- Post Log form (platform dropdown, property selector, date picker, notes)
- Weekly posts list table with edit/delete, pagination, filter by week
- RBAC: agent own posts, supervisor team posts, admin full control

## Phase 6: Inventory / Properties
- Property cards (image, price, status badge: green/red/yellow)
- Hover zoom + shadow animation
- Add/Edit Property modal (admin only)
- Auto-update status after closing
- RBAC: agent view available only, supervisor full view, admin full CRUD

## Phase 7: Leaderboard & Rewards
- Top 3 cards (gold/silver/bronze, staggered drop-in animation)
- Full ranking table (sortable, highlight logged-in agent)
- Reward progress bars (orange fill, tooltip: points to next)
- Badge system (circular icons, glow on unlock, sparkle animation)
- Reward cards (name, type, description, hover scale)
- RBAC: agent personal, supervisor team, admin full + manage scoring

## Phase 8: Admin Panel
- User management table (add/edit/delete agents & supervisors)
- System settings panel (scoring rules, reward rules, feature toggles)
- Audit & activity logs table (track all changes, highlight suspicious)
- Admin-only access

## Phase 9: Notifications & Polish
- Slide-in top-right toast notifications (success/info/warning)
- Auto-disappear 3–5s
- Notification history panel
- All micro-interactions: button ripple, hover glow, skeleton loaders
- Responsive: sidebar → bottom nav on mobile, swipeable lists, stacked cards
