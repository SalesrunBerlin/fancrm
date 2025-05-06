
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { useActions, Action, ActionColor } from "@/hooks/useActions";
import { cn } from "@/lib/utils";

// Map ActionColors to Tailwind classes
const actionColorMap: Record<ActionColor, string> = {
  default: "bg-primary text-primary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "bg-background border border-input text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  ghost: "bg-transparent hover:bg-accent text-foreground",
  link: "text-primary underline-offset-4 hover:underline bg-transparent",
  warning: "bg-amber-500 text-white",
  success: "bg-green-600 text-white",
  cyan: "bg-cyan-500 text-white",
  teal: "bg-teal-500 text-white",
  sky: "bg-sky-500 text-white",
  azure: "bg-sky-600 text-white",
  cobalt: "bg-blue-700 text-white",
  navy: "bg-blue-900 text-white",
  turquoise: "bg-teal-400 text-white",
  seafoam: "bg-green-300 text-gray-900 border border-gray-300",
  emerald: "bg-emerald-500 text-white",
  lime: "bg-lime-500 text-gray-900 border border-gray-300",
  yellow: "bg-yellow-500 text-gray-900 border border-gray-300",
  olive: "bg-yellow-700 text-white",
  forest: "bg-green-800 text-white",
  mint: "bg-green-200 text-gray-900 border border-gray-300",
  sage: "bg-green-200 text-gray-900 border border-gray-300",
  orange: "bg-orange-500 text-white",
  coral: "bg-orange-400 text-white",
  maroon: "bg-red-800 text-white",
  brown: "bg-amber-800 text-white",
  crimson: "bg-red-700 text-white",
  burgundy: "bg-red-900 text-white",
  brick: "bg-red-600 text-white",
  sienna: "bg-amber-700 text-white",
  ochre: "bg-yellow-600 text-white",
  gold: "bg-yellow-400 text-gray-900 border border-gray-300",
  bronze: "bg-amber-600 text-white",
  purple: "bg-purple-600 text-white",
  violet: "bg-violet-600 text-white",
  indigo: "bg-indigo-600 text-white",
  lavender: "bg-purple-300 text-gray-900 border border-gray-300",
  fuchsia: "bg-fuchsia-500 text-white",
  magenta: "bg-pink-600 text-white",
  rose: "bg-rose-500 text-white",
  pink: "bg-pink-500 text-white",
  plum: "bg-purple-800 text-white",
  mauve: "bg-purple-400 text-white",
  slate: "bg-slate-500 text-white",
  silver: "bg-gray-400 text-white",
  charcoal: "bg-gray-700 text-white",
};

export function GlobalActionsNav() {
  const navigate = useNavigate();
  const { actions } = useActions();
  const [globalActions, setGlobalActions] = useState<Action[]>([]);
  
  // Filter for global actions (new_record type)
  useEffect(() => {
    if (actions) {
      const filtered = actions
        .filter(action => action.action_type === 'new_record')
        .slice(0, 8); // Limit to 8 actions max
      setGlobalActions(filtered);
    }
  }, [actions]);

  const handleActionClick = (actionId: string) => {
    navigate(`/actions/execute/${actionId}`);
  };

  // No actions to display
  if (!globalActions || globalActions.length === 0) {
    return null;
  }

  // Split actions into rows (4 per row max)
  const firstRow = globalActions.slice(0, 4);
  const secondRow = globalActions.length > 4 ? globalActions.slice(4) : [];

  return (
    <div className="ml-4">
      <div className="flex flex-col gap-1 max-w-[240px]">
        <div className="flex gap-1">
          {firstRow.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                actionColorMap[action.color]
              )}
              title={action.name}
              aria-label={action.name}
            >
              <Play className="h-3 w-3" />
            </button>
          ))}
        </div>
        
        {secondRow.length > 0 && (
          <div className="flex gap-1">
            {secondRow.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                  actionColorMap[action.color]
                )}
                title={action.name}
                aria-label={action.name}
              >
                <Play className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
