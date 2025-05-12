
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Image, Brush } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function CreateIconButton() {
  const navigate = useNavigate();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="md" icon={<Image />}>
          Icon erstellen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate("/settings/icons/upload")}>
          <Image className="h-4 w-4 mr-2" />
          Standard-Upload
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings/icons/create")}>
          <Brush className="h-4 w-4 mr-2" />
          Erweiterter Editor
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
