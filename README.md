# Todo Application

A production-ready Todo application built with React, TypeScript, Redux Toolkit, and Tailwind CSS.

## Features

### Core Todo Features
- ✅ Add new todos with text input
- ✅ Mark todos as complete/incomplete with checkbox
- ✅ Edit existing todos (inline editing)
- ✅ Delete individual todos
- ✅ Each todo includes:
  - Unique ID
  - Text content
  - Completion status
  - Creation timestamp
  - Priority level (low/medium/high)
  - Optional due date

### State Management
- Redux Toolkit for centralized state management
- TypeScript types for all state, actions, and reducers
- Proper type safety with `RootState` and `AppDispatch`

### Data Persistence
- In-memory storage solution (mimics localStorage behavior)
- Automatically saves state on every change
- Loads saved state on app initialization
- Handles edge cases: corrupted data, missing data

### Filtering & Sorting
- **Filter options:**
  - All todos
  - Active todos
  - Completed todos
  - By Priority (high priority only)
- **Sort options:**
  - By date created (newest first)
  - By priority (high to low)
  - Alphabetically
- **Search:** Filter todos by text content with 300ms debouncing

### UI/UX Features
- Clean, modern, minimalist interface
- Priority color coding:
  - High: Red
  - Medium: Yellow
  - Low: Green
- Smooth transitions and hover effects
- Visual feedback for all interactions
- Responsive design (mobile and desktop)
- Empty state message when no todos exist
- Completed todos have strikethrough text and reduced opacity
- Overdue todos are highlighted in red

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Project Structure

```
ToDo-App/
├── TodoApp.tsx          # Main application component (single file)
├── src/
│   ├── main.tsx         # Application entry point
│   └── index.css        # Tailwind CSS imports
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── postcss.config.js    # PostCSS configuration
```

## Usage

### Adding a Todo
1. Type your todo text in the input field
2. (Optional) Select a priority level
3. (Optional) Set a due date
4. Click "Add" or press Enter

### Editing a Todo
- Click on the todo text to enter edit mode
- Make your changes
- Press Enter to save or Escape to cancel

### Managing Todos
- **Complete/Uncomplete:** Click the checkbox
- **Change Priority:** Use the dropdown in the todo item
- **Set Due Date:** Click the calendar icon
- **Delete:** Click the trash icon

### Filtering and Sorting
- Use the filter dropdown to show All, Active, Completed, or By Priority
- Use the sort dropdown to sort by Date, Priority, or Alphabetically
- Use the search bar to filter todos by text content

### Bulk Actions
- Click "Clear Completed" in the footer to remove all completed todos

## Technical Details

### Redux Actions
- `addTodo` - Add a new todo
- `editTodo` - Edit todo text
- `deleteTodo` - Delete a todo
- `toggleTodo` - Toggle completion status
- `updatePriority` - Update todo priority
- `updateDueDate` - Update or clear due date
- `setFilter` - Set active filter
- `setSort` - Set sort order
- `setSearchQuery` - Set search query
- `clearCompleted` - Remove all completed todos


### Storage Implementation
The app uses an in-memory storage solution that mimics localStorage behavior. This is designed for environments where browser localStorage is not available (such as claude.ai artifacts).

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server

## License

MIT
