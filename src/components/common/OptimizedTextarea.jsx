import React, { useState, useEffect, useRef } from 'react';

export default React.forwardRef(function OptimizedTextarea({ value, onChange, delay = 300, className, ...props }, ref) {
  const [localValue, setLocalValue] = useState(value || '');
  const timerRef = useRef(null);
  
  // Keep internal ref if external ref is not provided
  const internalRef = useRef(null);
  const textareaRef = ref || internalRef;

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setLocalValue(newVal);

    if (timerRef.current) clearTimeout(timerRef.current);

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
    <textarea
      {...props}
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
});
