// frontend/src/hooks/useOptimizedState.js
import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for optimized state management with memoized setters
 * Prevents unnecessary re-renders in child components
 */
export const useOptimizedState = (initialState) => {
  const [state, setState] = useState(initialState);

  const memoizedSetState = useCallback((newState) => {
    setState(prevState => 
      typeof newState === 'function' ? newState(prevState) : newState
    );
  }, []);

  return [state, memoizedSetState];
};

/**
 * Hook for optimized form state management
 */
export const useFormState = (initialState) => {
  const [formData, setFormData] = useOptimizedState(initialState);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [setFormData, initialState]);

  const isFormValid = useMemo(() => {
    return Object.values(formData).every(value => 
      value !== null && value !== undefined && value !== ''
    );
  }, [formData]);

  return {
    formData,
    updateField,
    resetForm,
    isFormValid,
    setFormData
  };
};

/**
 * Hook for optimized list operations
 */
export const useOptimizedList = (initialList = []) => {
  const [list, setList] = useOptimizedState(initialList);

  const addItem = useCallback((item) => {
    setList(prev => [...prev, item]);
  }, [setList]);

  const removeItem = useCallback((id) => {
    setList(prev => prev.filter(item => item.id !== id));
  }, [setList]);

  const updateItem = useCallback((id, updates) => {
    setList(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, [setList]);

  const filteredList = useMemo(() => {
    return (searchTerm, filterFn) => {
      if (!searchTerm && !filterFn) return list;
      
      let filtered = list;
      
      if (searchTerm) {
        filtered = filtered.filter(item => 
          JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (filterFn) {
        filtered = filtered.filter(filterFn);
      }
      
      return filtered;
    };
  }, [list]);

  return {
    list,
    setList,
    addItem,
    removeItem,
    updateItem,
    filteredList
  };
};