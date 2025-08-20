# ✨ Collaborative Todo App

A real-time collaborative todo app built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

- ✅ Create multiple named todo lists
- ✅ Real-time collaboration with live updates
- ✅ Shareable links for each todo list
- ✅ Beautiful, responsive UI with Tailwind CSS
- ✅ Persistent data storage with Supabase
- ✅ TypeScript for type safety
- ✅ Modern React patterns with hooks

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel/Netlify ready

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd my-todo
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings** → **API**
3. Copy your **Project URL** and **anon public key**

### 3. Configure Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL to create your tables

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see your app!

## 🗄️ Database Schema

The app uses two main tables:

- **`todo_lists`**: Stores todo list metadata
- **`todos`**: Stores individual todo items with references to lists

## 🔗 Sharing & Collaboration

- Each todo list gets a unique URL (e.g., `?list=uuid`)
- Share the URL with others to collaborate
- Real-time updates when multiple people use the same list
- No authentication required (public access for demo)

## 🎨 Customization

### Styling
- All styles use Tailwind CSS classes
- Easy to customize colors, spacing, and layout
- Responsive design built-in

### Features
- Add due dates to todos
- Implement user authentication
- Add todo categories/tags
- Create private vs public lists

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag dist folder to Netlify
```

## 🔧 Development

### Project Structure
```
src/
├── App.tsx          # Main app component
├── supabase.ts      # Supabase client configuration
├── types.ts         # TypeScript interfaces
├── services/        # Database operations
│   └── todoService.ts
└── assets/          # Static assets
```

### Key Functions
- `todoService.createTodoList()` - Create new lists
- `todoService.createTodo()` - Add todos
- `todoService.updateTodo()` - Toggle completion
- Real-time subscriptions for live updates

## 🐛 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env` file exists and has correct values
   - Restart your dev server after adding environment variables

2. **Database connection errors**
   - Verify your Supabase project is active
   - Check your API keys are correct
   - Ensure you've run the database schema SQL

3. **Real-time not working**
   - Check browser console for subscription errors
   - Verify Row Level Security (RLS) policies are set correctly

### Debug Mode
Check the browser console for detailed logs and error messages.

## 📚 Learning Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and building your own apps!

---

**Happy coding! 🎉**
