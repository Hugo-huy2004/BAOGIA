import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function OptimizedInput({ value, onChange, delay = 300, className, ...props }) {
  const [localValue, setLocalValue] = useState(value || '');
  const timerRef = useRef(null);

  // Sync with external value if it changes externally (e.g. initial load)
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setLocalValue(newVal);

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Set new debounce timer
    timerRef.current = setTimeout(() => {
      onChange({ target: { value: newVal, name: props.name } });
    }, delay);
  };

  const handleBlur = (e) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange({ target: { value: localValue, name: props.name } });
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}
