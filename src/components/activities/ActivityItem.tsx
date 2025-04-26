
import { Activity } from "@/lib/types/database";
import { format } from "date-fns";
import { Phone, Calendar, CheckCircle, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const activityTypeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
};

interface ActivityItemProps {
  activity: Activity;
  onClick?: () => void;
}

export function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/activities/${activity.id}`);
    }
  };

  return (
    <div
      className="border rounded-md p-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1 rounded-full">
            {activityTypeIcons[activity.type] || <Circle className="h-4 w-4" />}
          </div>
          <span className="font-medium">{activity.subject}</span>
        </div>
        <div className="flex items-center gap-2">
          {activity.status === "done" ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-xs text-muted-foreground">
            {activity.status.toUpperCase()}
          </span>
        </div>
      </div>
      {activity.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {activity.description}
        </p>
      )}
      <div className="flex text-xs text-muted-foreground">
        {activity.scheduled_at && (
          <div className="flex items-center gap-1 mr-4">
            <Calendar className="h-3 w-3" />
            {format(new Date(activity.scheduled_at), "MMM d, yyyy")}
          </div>
        )}
      </div>
    </div>
  );
}
