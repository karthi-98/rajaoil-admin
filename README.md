# Raja Oil Admin - Firestore Manager

An interactive admin panel for managing Raja Oil products stored in Firestore, built with Next.js, shadcn/ui, and Firebase.

## Features

- **Interactive Dashboard** - View product statistics at a glance
- **Product Management** - Full CRUD operations for Raja Oil products
- **Dynamic Pricing** - Manage multiple product types with different sizes and prices
- **Responsive Sidebar** - Collapsible navigation with green theme
- **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- **Real-time Data** - Direct integration with Firestore

## Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **UI Components**: shadcn/ui (New York style)
- **Styling**: Tailwind CSS v4
- **Database**: Firebase Firestore (rajaoil collection)
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A Firebase project with Firestore enabled
- A Firestore collection named `rajaoil`

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

3. Add your Firebase credentials to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to Project Settings > General
4. Scroll down to "Your apps" and click the web icon (</>)
5. Copy the configuration values to your `.env.local` file
6. Enable Firestore Database in the Firebase Console
7. Create a collection named `rajaoil`

### **IMPORTANT: Configure Firestore Security Rules**

By default, Firestore denies all access. You'll get "Missing or insufficient permissions" errors until you update the rules.

#### Quick Fix (Development):

Go to **Firestore Database** → **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rajaoil/{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **For development only!** See [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) for production-ready security rules.

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the admin panel.

## Project Structure

```
src/
├── app/
│   ├── products/
│   │   └── page.tsx          # Product management page (CRUD)
│   ├── layout.tsx            # Root layout with sidebar
│   ├── page.tsx              # Dashboard (homepage)
│   └── globals.css           # Global styles with green theme
├── components/
│   ├── app-sidebar.tsx       # Sidebar navigation
│   └── ui/                   # shadcn/ui components
└── lib/
    ├── firebase.ts           # Firebase configuration
    └── utils.ts              # Utility functions
```

## Routes

- `/` - Dashboard with statistics
- `/products` - Manage all Raja Oil products

## Color Theme

The admin panel uses a green primary color scheme:
- Primary: `hsl(142 76% 36%)` - Forest green
- Primary (Dark): `hsl(142 70% 45%)` - Lighter green for dark mode

## Firestore Collection Structure

### Collection: `rajaoil`

Each document contains:
```json
{
  "brand": "TSRG MITHRA BRAND",
  "types": [
    {
      "name": "15 KG Tin",
      "price": "2750"
    },
    {
      "name": "5 ltr Can",
      "price": "1000"
    },
    {
      "name": "500 ml Jar",
      "price": "2100"
    }
  ]
}
```

## Usage

### Managing Products

1. Click **Products** from the sidebar
2. View all products from the rajaoil collection
3. Click **Add Product** to create a new product
4. Add brand name and multiple oil types with prices
5. Use the edit (pencil) button to modify existing products
6. Use the delete (trash) button to remove products

### Dashboard

The homepage displays:
- Total number of products
- Total number of product types (sizes)
- Quick link to manage products

## Building for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add your environment variables in Vercel project settings
4. Deploy

## License

MIT
