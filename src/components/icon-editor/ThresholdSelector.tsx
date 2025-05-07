
import { Button } from "@/components/ui/button";
import { ThresholdLevel } from "@/types/icon-editor";

interface ThresholdSelectorProps {
  thresholdLevel: ThresholdLevel;
  setThresholdLevel: (level: ThresholdLevel) => void;
}

export function ThresholdSelector({ thresholdLevel, setThresholdLevel }: ThresholdSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <Button
            key={level}
            variant={thresholdLevel === level ? "default" : "outline"}
            onClick={() => setThresholdLevel(level as ThresholdLevel)}
            className="relative p-1 h-16"
          >
            <div className="text-xs mb-1">Stufe {level}</div>
            <div 
              className="w-full h-2 rounded-sm" 
              style={{
                background: `linear-gradient(to right, black ${(level/5)*100}%, white ${(level/5)*100}%)`
              }}
            ></div>
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Stufe 1: Mehr dunkle Bereiche | Stufe 5: Mehr helle Bereiche
      </p>
    </div>
  );
}
