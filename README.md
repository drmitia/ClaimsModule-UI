# ClaimsModule UI

Frontend for the Claims Module — a fullstack insurance claims management system. Built with Angular 18 and Angular Material.

---

## Live Application

| Resource | URL |
|---|---|
| **Frontend** | https://zealous-ocean-089476703.7.azurestaticapps.net |

---

## Tech Stack

- Angular 18
- Angular Material
- Reactive Forms
- RxJS
- TypeScript

---

## Prerequisites

- [Node.js 22+](https://nodejs.org)
- Angular CLI is used via `npx` — no global install required

---

## Project Structure

```
src/app/
├── core/
│   ├── interceptors/     # Auth HTTP interceptor
│   ├── models/           # TypeScript interfaces (DTOs)
│   └── services/         # API service layer
├── features/
│   ├── claims-list/      # Claims dashboard (lazy-loaded)
│   ├── claim-detail/     # Claim detail 6-tab screen (lazy-loaded)
│   └── fnol/             # FNOL 3-step form (lazy-loaded)
└── shared/
    ├── components/       # Reusable components and dialogs
    └── material/         # Angular Material module
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/drmitia/ClaimsModule-UI.git
cd ClaimsModule-UI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the API URL

Open `src/environments/environment.ts` and set the backend URL:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7222'
};
```

Replace `7222` with the actual port your local API is running on (check the API terminal output).

### 4. Make sure the backend is running

The frontend requires the .NET API to be running locally. See the [ClaimsModule-API](https://github.com/YOUR_USERNAME/ClaimsModule-API) repository for setup instructions.

### 5. Start the development server

```bash
npx ng serve
```

The app starts at `http://localhost:4200` and hot-reloads on file changes.

---

## Mock Authentication

Switch users using the dropdown in the top navigation bar. No login required.

| User | Role | What they can do |
|---|---|---|
| John Handler | Handler | Create claims, add parties, submit reserves, upload documents |
| Jane Supervisor | Supervisor | All handler permissions + approve/reject reserves up to $100,000 |
| Bob Manager | Manager | All supervisor permissions + approve reserves of any amount |

Every API request automatically includes an `X-User` header with the current user's role key (`handler`, `supervisor`, or `manager`).

---

## Environment Configuration

### Local development — src/environments/environment.ts

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7222'
};
```

### Production — src/environments/environment.prod.ts

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://claims-module-api-ada7hxafdse6arc5.polandcentral-01.azurewebsites.net'
};
```

The production environment file is automatically used when building with `--configuration production`.

---

## Building for Production

```bash
npx ng build --configuration production
```

Output goes to `dist/claims-module-ui/browser/`.

---

## Azure Deployment

Deployed via GitHub Actions to Azure Static Web App — see `.github/workflows/deploy-ui.yml`.

To trigger manually: **Actions** → **Deploy UI to Azure Static Web App** → **Run workflow**

The pipeline:
1. Installs dependencies
2. Builds Angular with production configuration
3. Deploys to Azure Static Web App

Angular routing is handled by `staticwebapp.config.json` which redirects all routes to `index.html`.

---

## Key Screens

### Claims List Dashboard (`/claims`)
- Paginated table with claim number, policy, client, loss date, cause of loss, status badge, total reserve
- Filter by status, search by claim number or client name
- Click any row to open the claim detail

### FNOL Form (`/fnol`)
3-step form to log a new claim:
- **Step 1** — Policy search (typeahead with in-force badge), loss details, cause of loss
- **Step 2** — Add parties (Claimant required), add risk objects
- **Step 3** — Optional initial reserve with real-time authority indicator, review summary

### Claim Detail (`/claims/:id`)
6-tab detail view:
- **Overview** — loss event details, reported date, notes
- **Risk Objects** — damaged assets with add form
- **Parties** — involved parties with add form
- **Reserves** — reserve history table, add reserve panel, approve/reject/retract actions
- **Documents** — upload files, download via Azure Blob SAS URL
- **Audit Log** — immutable event history in reverse chronological order