
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder = "Start typing...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const [html, setHtml] = useState(value);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  
  // Sync with external value changes
  useEffect(() => {
    setHtml(value);
  }, [value]);

  const editorRef = React.useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      // Update the local state
      setHtml(editorRef.current.innerHTML);
      // Call the onChange callback
      onChange(editorRef.current.innerHTML);
    }
    // Focus back on the editor
    editorRef.current?.focus();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setHtml(editorRef.current.innerHTML);
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      const displayText = linkText || linkUrl;
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
      handleContentChange();
      setShowLinkDialog(false);
      setLinkUrl("");
      setLinkText("");
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      const altText = imageAlt || "Image";
      const imgHtml = `<img src="${imageUrl}" alt="${altText}" style="max-width: 100%;" />`;
      document.execCommand('insertHTML', false, imgHtml);
      handleContentChange();
      setShowImageDialog(false);
      setImageUrl("");
      setImageAlt("");
    }
  };

  return (
    <>
      <div className={cn("border rounded-md flex flex-col", className)}>
        <div className="bg-muted/50 p-2 border-b flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand('bold')}
            title="Bold"
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand('italic')}
            title="Italic"
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowLinkDialog(true)}
            title="Insert Link"
            type="button"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowImageDialog(true)}
            title="Insert Image"
            type="button"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand('justifyLeft')}
            title="Align Left"
            type="button"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand('justifyCenter')}
            title="Align Center"
            type="button"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand('justifyRight')}
            title="Align Right"
            type="button"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          className="p-3 flex-1 overflow-auto focus:outline-none"
          style={{ minHeight }}
          onInput={handleContentChange}
          onBlur={handleContentChange}
          dangerouslySetInnerHTML={{ __html: html || "" }}
        />
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="text">Display Text</Label>
              <Input
                id="text"
                placeholder="Link text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={insertLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                placeholder="Image description"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={insertImage}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
