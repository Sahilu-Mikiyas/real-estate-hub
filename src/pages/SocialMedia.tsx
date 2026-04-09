import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const postsData = [
  { id: 1, platform: "Facebook", property: "Villa Royale", date: "Apr 8", notes: "Featured post with video tour" },
  { id: 2, platform: "Instagram", property: "Plot 24 Phase 2", date: "Apr 7", notes: "Carousel post" },
  { id: 3, platform: "Telegram", property: "Shop 12 Block A", date: "Apr 7", notes: "Group share" },
  { id: 4, platform: "Facebook", property: "Flat 3B Luxury", date: "Apr 6", notes: "Live tour announcement" },
  { id: 5, platform: "Instagram", property: "Villa 7", date: "Apr 5", notes: "Story + Reel" },
];

const platformColors: Record<string, string> = {
  Facebook: "bg-blue-100 text-blue-700",
  Instagram: "bg-pink-100 text-pink-700",
  Telegram: "bg-sky-100 text-sky-700",
};

const SocialMedia = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Social Media</h1>
          <p className="text-sm text-muted-foreground">Log and track your marketing posts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-orange-light btn-press">
              <Plus className="w-4 h-4 mr-1.5" /> Log Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Social Post</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Platform</Label>
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Property</Label><Input placeholder="Property name" className="mt-1" /></div>
              <div><Label>Date</Label><Input type="date" className="mt-1" /></div>
              <div><Label>Notes</Label><Input placeholder="Optional notes..." className="mt-1" /></div>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-orange-light" onClick={() => setOpen(false)}>Save Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Platform</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Property</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {postsData.map((post, i) => (
              <motion.tr
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border last:border-0 hover:bg-orange-subtle/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${platformColors[post.platform]}`}>
                    {post.platform}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{post.property}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{post.date}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{post.notes}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SocialMedia;
