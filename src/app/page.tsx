"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Car,
  ClipboardCopy,
  Copy,
  Loader2,
  Sparkles,
  Star,
  RefreshCw,
} from "lucide-react";
import { getColumns } from "@/components/fleet/columns";
import { DataTable } from "@/components/fleet/data-table";
import { RecommendationDialog } from "@/components/fleet/recommendation-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { syncFleetData } from "@/app/actions";
import type { Vehicle, Assignment, FleetData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const ANY_VALUE = "any-value-placeholder";


export default function Home() {
  const { toast } = useToast();
  const [fleetData, setFleetData] = useLocalStorage<FleetData | null>(
    "fleetData",
    null
  );
  const [lastSync, setLastSync] = useLocalStorage<string | null>(
    "lastSync",
    null
  );
  const [favoriteVehicleIds, setFavoriteVehicleIds] = useLocalStorage<Set<string>>(
    "favoriteVehicleIds",
    new Set()
  );
  const [favoriteAssignmentIds, setFavoriteAssignmentIds] = useLocalStorage<Set<string>>(
    "favoriteAssignmentIds",
    new Set()
  );

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string>(ANY_VALUE);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(ANY_VALUE);
  const [prefixToCopy, setPrefixToCopy] = useState<string>("");
  const [activeAssignmentPill, setActiveAssignmentPill] = useState<string>("");

  const canSync = useMemo(() => {
    if (!lastSync) return true;
    return new Date().getTime() - new Date(lastSync).getTime() > ONE_DAY_IN_MS;
  }, [lastSync]);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const data = await syncFleetData();
      setFleetData(data);
      setLastSync(new Date().toISOString());
      toast({
        title: "Success",
        description: "Fleet data synced successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sync fleet data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!fleetData) {
      handleSync();
    }
  }, [fleetData]);

  const toggleFavoriteVehicle = (vehicleId: string) => {
    const newFavorites = new Set(favoriteVehicleIds);
    if (newFavorites.has(vehicleId)) {
      newFavorites.delete(vehicleId);
    } else {
      newFavorites.add(vehicleId);
    }
    setFavoriteVehicleIds(newFavorites);
  };
  
  const toggleFavoriteAssignment = (assignmentId: string) => {
    const newFavorites = new Set(favoriteAssignmentIds);
    if (newFavorites.has(assignmentId)) {
      newFavorites.delete(assignmentId);
    } else {
      newFavorites.add(assignmentId);
    }
    setFavoriteAssignmentIds(newFavorites);
     if (activeAssignmentPill === assignmentId && !newFavorites.has(assignmentId)) {
      setActiveAssignmentPill("");
    }
  };

  const favoriteAssignments = useMemo(
    () =>
      fleetData?.assignments.filter((a) => favoriteAssignmentIds.has(a.id)) ||
      [],
    [fleetData?.assignments, favoriteAssignmentIds]
  );

  const favoriteVehicles = useMemo(
    () =>
      fleetData?.vehicles.filter((v) => favoriteVehicleIds.has(v.id)) || [],
    [fleetData?.vehicles, favoriteVehicleIds]
  );
  
  const handleAssignmentChange = (value: string) => {
    setSelectedAssignment(value);
    setSelectedVehicle(ANY_VALUE);
    setActiveAssignmentPill("");
    if (value && value !== ANY_VALUE) {
      const prefix = `1${value.substring(1, 4)}00`;
      setPrefixToCopy(prefix);
    } else {
      setPrefixToCopy("");
    }
  };

  const handlePillClick = (assignmentId: string) => {
     if (activeAssignmentPill === assignmentId) {
       setActiveAssignmentPill("");
       setSelectedAssignment(ANY_VALUE);
       setPrefixToCopy("");
     } else {
       setActiveAssignmentPill(assignmentId);
       setSelectedAssignment(assignmentId);
       const prefix = `1${assignmentId.substring(1, 4)}00`;
       setPrefixToCopy(prefix);
     }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(prefixToCopy);
    toast({
      title: "Copied!",
      description: `${prefixToCopy} has been copied to your clipboard.`,
    });
  };

  const availableVehicles = useMemo(() => {
    if (!selectedAssignment || selectedAssignment === ANY_VALUE || !fleetData) return [];
    const assignmentCode = selectedAssignment.substring(1);
    const vehiclesInAssignment = fleetData.vehicles.filter(v => (v.ol || v.plate).startsWith(`1${assignmentCode}`));
    return [...new Set(vehiclesInAssignment.map(v => v.makeModel))].sort();
  }, [selectedAssignment, fleetData]);

  const filteredMainData = useMemo(() => {
    if (!fleetData) return [];
    
    let data = fleetData.vehicles;

    if (activeAssignmentPill) {
        const assignmentCode = activeAssignmentPill.substring(1);
        data = data.filter(v => (v.ol).startsWith(`1${assignmentCode}`));
    } else if (selectedAssignment && selectedAssignment !== ANY_VALUE) {
        const assignmentCode = selectedAssignment.substring(1);
        data = data.filter(v => (v.ol).startsWith(`1${assignmentCode}`));
        if (selectedVehicle && selectedVehicle !== ANY_VALUE) {
            data = data.filter(v => v.makeModel === selectedVehicle);
        }
    } else {
        return [];
    }

    return data;
  }, [fleetData, selectedAssignment, selectedVehicle, activeAssignmentPill]);

  const columns = useMemo(
    () => getColumns(favoriteVehicleIds, toggleFavoriteVehicle),
    [favoriteVehicleIds]
  );
  const favoriteColumns = useMemo(
    () => getColumns(favoriteVehicleIds, toggleFavoriteVehicle, true, favoriteAssignmentIds, toggleFavoriteAssignment),
    [favoriteVehicleIds, favoriteAssignmentIds]
  );

  if (!fleetData && isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Syncing fleet data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-2xl font-bold tracking-tighter">
              FleetLink Pro
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <RecommendationDialog 
              allAssignments={fleetData?.assignments || []} 
              allVehicles={fleetData?.vehicles || []}
              favoriteAssignments={favoriteAssignments}
              favoriteVehicles={favoriteVehicles}
              onFavoriteVehicleToggle={toggleFavoriteVehicle}
              onFavoriteAssignmentToggle={toggleFavoriteAssignment}
            />
            <Button onClick={handleSync} disabled={!canSync || isLoading} size="sm">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Data
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid gap-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-xl">
                  <Star className="text-yellow-400" /> Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteVehicles.length > 0 ? (
                  <DataTable columns={favoriteColumns} data={favoriteVehicles} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No favorite vehicles yet.</p>
                    <p className="text-sm">Click the star icon on a vehicle to add it here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-xl">
                  Fleet Roster
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                         <span className="text-sm font-medium text-muted-foreground">Favorite Assignments:</span>
                        {favoriteAssignments.length > 0 ? favoriteAssignments.map(a => (
                             <Badge 
                                key={a.id} 
                                variant={activeAssignmentPill === a.id ? "default" : "secondary"}
                                className="cursor-pointer"
                                onClick={() => handlePillClick(a.id)}
                            >
                                {a.name}
                            </Badge>
                        )) : <span className="text-sm text-muted-foreground italic">None</span>}
                    </div>
                 <Separator />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Assignment</label>
                      <Select
                        onValueChange={handleAssignmentChange}
                        value={selectedAssignment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an assignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ANY_VALUE}>Any</SelectItem>
                          {fleetData?.assignments.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {prefixToCopy && (
                        <div className="flex items-center gap-2 rounded-md border bg-muted p-2 text-sm">
                           <span className="font-mono text-muted-foreground">Prefix: {prefixToCopy}</span>
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
                             <Copy className="h-4 w-4" />
                           </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-medium">Vehicle</label>
                       <Select onValueChange={setSelectedVehicle} value={selectedVehicle} disabled={!selectedAssignment || selectedAssignment === ANY_VALUE}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select a vehicle" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value={ANY_VALUE}>Any</SelectItem>
                           {availableVehicles.map(v => (
                             <SelectItem key={v} value={v}>{v}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {(filteredMainData.length > 0) ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <DataTable columns={columns} data={filteredMainData} />
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No vehicles match the current filter.</p>
                      <p className="text-sm">Select an assignment to view vehicles.</p>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
