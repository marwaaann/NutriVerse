import { useState, type ReactNode } from "react";

const positions = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

function Tooltip({
  content,
  position = "top",
  children,
}:{content:string,position:"bottom"|"top"|"left"|"right",children:ReactNode}) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}

      {show && (
        <div
          role="tooltip"
          className={`
            absolute z-50
            ${positions[position]}
            rounded-md px-3 py-1.5 text-xs
            shadow-lg whitespace-nowrap
            transition-opacity

            bg-gray-100 text-gray-900
            dark:bg-gray-900 dark:text-gray-100
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;