import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch, TypedUseSelectorHook } from 'react-redux';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export type Priority = 'low' | 'medium' | 'high';
export type FilterType = 'all' | 'active' | 'completed' | 'priority';
export type SortType = 'date' | 'priority' | 'alphabetical';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
  dueDate?: number;
}

interface TodoState {
  todos: Todo[];
  filter: FilterType;
  sort: SortType;
  searchQuery: string;
}

// ============================================================================
// localStorage Utility Functions
// ============================================================================

const STORAGE_KEY = 'todo-app-state'

const loadFromStorage = (): TodoState | undefined => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.todos)) {
      return parsed
    }
  } catch (e) {
    console.error(e)
  }
  return undefined
}

const saveToStorage = (state: TodoState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error(e)
  }
}

// ============================================================================
// Redux Slice
// ============================================================================

const initialState: TodoState = {
  todos: [],
  filter: 'all',
  sort: 'date',
  searchQuery: '',
}

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action: PayloadAction<Omit<Todo, 'id' | 'createdAt'>>) => {
      state.todos.push({
        ...action.payload,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      })
    },
    editTodo: (state, action: PayloadAction<{ id: string; text: string }>) => {
      const t = state.todos.find(t => t.id === action.payload.id)
      if (t) t.text = action.payload.text
    },
    deleteTodo: (state, action: PayloadAction<string>) => {
      state.todos = state.todos.filter(t => t.id !== action.payload)
    },
    toggleTodo: (state, action: PayloadAction<string>) => {
      const t = state.todos.find(t => t.id === action.payload)
      if (t) t.completed = !t.completed
    },
    updatePriority: (state, action: PayloadAction<{ id: string; priority: Priority }>) => {
      const t = state.todos.find(t => t.id === action.payload.id)
      if (t) t.priority = action.payload.priority
    },
    updateDueDate: (state, action: PayloadAction<{ id: string; dueDate?: number }>) => {
      const t = state.todos.find(t => t.id === action.payload.id)
      if (t) t.dueDate = action.payload.dueDate
    },
    setFilter: (state, action: PayloadAction<FilterType>) => {
      state.filter = action.payload
    },
    setSort: (state, action: PayloadAction<SortType>) => {
      state.sort = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    clearCompleted: state => {
      state.todos = state.todos.filter(t => !t.completed)
    },
    
  },
})

const {
  addTodo,
  editTodo,
  deleteTodo,
  toggleTodo,
  updatePriority,
  updateDueDate,
  setFilter,
  setSort,
  setSearchQuery,
  clearCompleted,
  
} = todoSlice.actions

// ============================================================================
// Redux Store
// ============================================================================

const persistedState = loadFromStorage()

const store = configureStore({
  reducer: {
    todos: todoSlice.reducer,
  },
  preloadedState: persistedState
    ? { todos: persistedState }
    : undefined,
})



// 🔥 Persist on every change
store.subscribe(() => {
  saveToStorage(store.getState().todos)
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector


// ============================================================================
// Selectors
// ============================================================================

const selectTodos = (state: RootState) => state.todos.todos;
const selectFilter = (state: RootState) => state.todos.filter;
const selectSort = (state: RootState) => state.todos.sort;
const selectSearchQuery = (state: RootState) => state.todos.searchQuery;

// ============================================================================
// Components
// ============================================================================

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    high: 'bg-red-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-green-500 text-white',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[priority]} transition-all duration-200`}
    >
      {priority.toUpperCase()}
    </span>
  );
};

const TodoItem: React.FC<{ todo: Todo }> = ({ todo }) => {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleEdit = useCallback(() => {
    if (isEditing && editText.trim() && editText !== todo.text) {
      dispatch(editTodo({ id: todo.id, text: editText.trim() }));
    }
    setIsEditing(!isEditing);
  }, [isEditing, editText, todo.text, todo.id, dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEdit();
      } else if (e.key === 'Escape') {
        setEditText(todo.text);
        setIsEditing(false);
      }
    },
    [handleEdit, todo.text]
  );

  const handleDelete = useCallback(() => {
    dispatch(deleteTodo(todo.id));
  }, [dispatch, todo.id]);

  const handleToggle = useCallback(() => {
    dispatch(toggleTodo(todo.id));
  }, [dispatch, todo.id]);

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch(updatePriority({ id: todo.id, priority: e.target.value as Priority }));
    },
    [dispatch, todo.id]
  );

  const handleDueDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value ? new Date(e.target.value).getTime() : undefined;
      dispatch(updateDueDate({ id: todo.id, dueDate: date }));
      setShowDatePicker(false);
    },
    [dispatch, todo.id]
  );

  const formatDate = useCallback((timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const isOverdue = useMemo(() => {
    if (!todo.dueDate || todo.completed) return false;
    return todo.dueDate < Date.now();
  }, [todo.dueDate, todo.completed]);

  return (
    <div
      className={`group flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
        todo.completed ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-gray-800 cursor-pointer hover:text-blue-600 transition-colors ${
                todo.completed ? 'line-through' : ''
              }`}
              onClick={() => setIsEditing(true)}
            >
              {todo.text}
            </span>
            <PriorityBadge priority={todo.priority} />
            {todo.dueDate && (
              <span
                className={`text-xs px-2 py-1 rounded ${
                  isOverdue
                    ? 'bg-red-100 text-red-700 font-semibold'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Due: {formatDate(todo.dueDate)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <select
          value={todo.priority}
          onChange={handlePriorityChange}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Set due date"
          >
            📅
          </button>
          {showDatePicker && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-300 rounded shadow-lg p-2">
              <input
                type="date"
                value={todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''}
                onChange={handleDueDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {todo.dueDate && (
                <button
                  onClick={() => {
                    dispatch(updateDueDate({ id: todo.id, dueDate: undefined }));
                    setShowDatePicker(false);
                  }}
                  className="mt-1 text-xs text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
          title="Delete todo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

const SearchBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(localQuery));
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, dispatch]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search todos..."
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
};

const FilterSortControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const filter = useAppSelector(selectFilter);
  const sort = useAppSelector(selectSort);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Filter:</label>
        <select
          value={filter}
          onChange={(e) => dispatch(setFilter(e.target.value as FilterType))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="priority">By Priority</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Sort:</label>
        <select
          value={sort}
          onChange={(e) => dispatch(setSort(e.target.value as SortType))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
        >
          <option value="date">By Date</option>
          <option value="priority">By Priority</option>
          <option value="alphabetical">Alphabetically</option>
        </select>
      </div>
    </div>
  );
};

const TodoApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const todos = useAppSelector(selectTodos);
  const filter = useAppSelector(selectFilter);
  const sort = useAppSelector(selectSort);
  const searchQuery = useAppSelector(selectSearchQuery);

  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<Priority>('medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');

  const filteredAndSortedTodos = useMemo(() => {
    let filtered = [...todos];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((todo) => todo.text.toLowerCase().includes(query));
    }

    // Apply status filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter((todo) => !todo.completed);
        break;
      case 'completed':
        filtered = filtered.filter((todo) => todo.completed);
        break;
      case 'priority':
        filtered = filtered.filter((todo) => todo.priority === 'high' && !todo.completed);
        break;
      default:
        break;
    }

    // Apply sorting
    switch (sort) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return a.text.localeCompare(b.text);
        });
        break;
      case 'date':
      default:
        filtered.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return b.createdAt - a.createdAt;
        });
        break;
    }

    return filtered;
  }, [todos, filter, sort, searchQuery]);

  const stats = useMemo(() => {
    const total = todos.length;
    const active = todos.filter((t) => !t.completed).length;
    const completed = todos.filter((t) => t.completed).length;
    return { total, active, completed };
  }, [todos]);

  const handleAddTodo = useCallback(() => {
    if (newTodoText.trim()) {
      dispatch(
        addTodo({
          text: newTodoText.trim(),
          completed: false,
          priority: newTodoPriority,
          dueDate: newTodoDueDate ? new Date(newTodoDueDate).getTime() : undefined,
        })
      );
      setNewTodoText('');
      setNewTodoDueDate('');
      setNewTodoPriority('medium');
    }
  }, [dispatch, newTodoText, newTodoPriority, newTodoDueDate]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddTodo();
      }
    },
    [handleAddTodo]
  );

  const handleClearCompleted = useCallback(() => {
    dispatch(clearCompleted());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Todo App</h1>
          <div className="flex justify-center gap-4 text-sm text-gray-600">
            <span className="font-semibold">Total: {stats.total}</span>
            <span className="font-semibold text-blue-600">Active: {stats.active}</span>
            <span className="font-semibold text-green-600">Completed: {stats.completed}</span>
          </div>
        </header>

        {/* Add Todo Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddTodo}
                disabled={!newTodoText.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Priority:</label>
                <select
                  value={newTodoPriority}
                  onChange={(e) => setNewTodoPriority(e.target.value as Priority)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Due Date:</label>
                <input
                  type="date"
                  value={newTodoDueDate}
                  onChange={(e) => setNewTodoDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar />
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-4">
          <FilterSortControls />
        </div>

        {/* Todo List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {filteredAndSortedTodos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium">
                {searchQuery.trim() || filter !== 'all'
                  ? 'No todos match your filters'
                  : 'No todos yet. Add one above!'}
            </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {stats.completed > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {stats.completed} completed {stats.completed === 1 ? 'todo' : 'todos'}
            </span>
            <button
              onClick={handleClearCompleted}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
            >
              Clear Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// App Entry Point
// ============================================================================

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <TodoApp />
    </Provider>
  );
};

export default App;
