import React from "react";

const InputField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  return (
    <input
      ref={ref}
      className="w-full border px-4 py-2 rounded-lg outline-none"
      {...props}
    />
  );
});

export default InputField;