
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg mb-8">Die angeforderte Seite wurde nicht gefunden.</p>
      <Button asChild>
        <Link to="/">Zurück zur Startseite</Link>
      </Button>
    </div>
  );
};

export default NotFound;
