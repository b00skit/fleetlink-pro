"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRecommendations } from "@/app/actions";
import type { RecommendVehiclesAssignmentsOutput } from "@/ai/flows/recommend-vehicles-assignments";
import type { Vehicle, Assignment } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface RecommendationDialogProps {
  allVehicles: Vehicle[];
  allAssignments: Assignment[];
  favoriteVehicles: Vehicle[];
  favoriteAssignments: Assignment[];
  onFavoriteVehicleToggle: (vehicleId: string) => void;
  onFavoriteAssignmentToggle: (assignmentId: string) => void;
}

export function RecommendationDialog({
  allVehicles,
  allAssignments,
  favoriteVehicles,
  favoriteAssignments,
  onFavoriteVehicleToggle,
  onFavoriteAssignmentToggle,
}: RecommendationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] =
    useState<RecommendVehiclesAssignmentsOutput | null>(null);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setRecommendations(null);
    try {
      const result = await getRecommendations({
        allVehicleIds: allVehicles.map((v) => v.id),
        allAssignmentIds: allAssignments.map((a) => a.id),
        favoriteVehicleIds: favoriteVehicles.map((v) => v.id),
        favoriteAssignmentIds: favoriteAssignments.map((a) => a.id),
      });
      setRecommendations(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get recommendations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recommendedVehicleDetails = recommendations?.recommendedVehicles
    .map((id) => allVehicles.find((v) => v.id === id))
    .filter(Boolean) as Vehicle[];
    
  const recommendedAssignmentDetails = recommendations?.recommendedAssignments
    .map((id) => allAssignments.find((a) => a.id === id))
    .filter(Boolean) as Assignment[];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Get AI Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline">AI Recommendations</DialogTitle>
          <DialogDescription>
            Based on your favorites, here are some suggestions you might like.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {recommendations && (
            <ScrollArea className="h-72">
                <div className="grid gap-4 pr-6">
                    <div>
                        <h4 className="font-bold mb-2">Recommended Vehicles</h4>
                        {recommendedVehicleDetails.length > 0 ? recommendedVehicleDetails.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <div>
                                    <p className="font-medium">{v.makeModel} ({v.id})</p>
                                    <p className="text-sm text-muted-foreground">{v.plate}</p>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => onFavoriteVehicleToggle(v.id)}>
                                    <Star className="mr-2 h-4 w-4" /> Add to Favorites
                                </Button>
                            </div>
                        )) : <p className="text-sm text-muted-foreground">No vehicle recommendations at this time.</p>}
                    </div>

                    <Separator />
                    
                    <div>
                        <h4 className="font-bold mb-2">Recommended Assignments</h4>
                        {recommendedAssignmentDetails.length > 0 ? recommendedAssignmentDetails.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <p className="font-medium">{a.name}</p>
                                <Button size="sm" variant="ghost" onClick={() => onFavoriteAssignmentToggle(a.id)}>
                                    <Star className="mr-2 h-4 w-4" /> Add to Favorites
                                </Button>
                            </div>
                        )) : <p className="text-sm text-muted-foreground">No assignment recommendations at this time.</p>}
                    </div>
                </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleGetRecommendations} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate New Suggestions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
