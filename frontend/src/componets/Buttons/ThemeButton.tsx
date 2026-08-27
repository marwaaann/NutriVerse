import { Sun,Moon} from "lucide-react";
import { toggleMode } from "../../store/themeSlice";
import { useAppDispatch, useAppSelector } from "../../types/ThemeHookType";

function ToggleButton() {
   const mode = useAppSelector((state) => state.theme.mode); // ✅ fixed
  const dispatch = useAppDispatch();
  return (
    <span>
    <button
      onClick={() => dispatch(toggleMode())}
      className="px-4 py-2 bg-blue-950 dark:bg-yellow-950 text-white dark:text-white rounded"
    >
      {mode === "dark" ? <Sun/>:<Moon/>}
    </button>
    </span>
  );
}

export default ToggleButton;