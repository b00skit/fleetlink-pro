"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Car,
  ClipboardCopy,
  Copy,
  Loader2,
  Sparkles,
  Star,
  RefreshCw,
  Info,
} from "lucide-react";
import { getColumns } from "@/components/fleet/columns";
import { DataTable } from "@/components/fleet/data-table";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { syncFleetData, getSyncStatus, getAdminData } from "@/app/actions";
import type { Vehicle, Assignment, FleetData, AdminData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ANY_VALUE = "any-value-placeholder";

export default function Home() {
  const { toast } = useToast();
  const [fleetData, setFleetData] = useState<FleetData | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [canSync, setCanSync] = useState(false);
  const [
    favoriteVehicleIds,
    setFavoriteVehicleIds,
  ] = useLocalStorage<Set<string>>("favoriteVehicleIds", new Set());
  const [
    favoriteAssignmentIds,
    setFavoriteAssignmentIds,
  ] = useLocalStorage<Set<string>>("favoriteAssignmentIds", new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [prefixToCopy, setPrefixToCopy] = useState<string>("");
  const [activeAssignmentPill, setActiveAssignmentPill] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    try {
        const status = await getSyncStatus();
        setCanSync(status.canSync);
    } catch (error) {
        console.error("Failed to fetch sync status:", error);
        setCanSync(false);
    }
  }, []);

  const fetchAdminData = useCallback(async () => {
    try {
        const data = await getAdminData();
        setAdminData(data);
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
    }
  }, []);


  const loadData = async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/data/fleetData.json?v=' + new Date().getTime());
        if (!response.ok) {
            if (response.status === 404) {
                await handleSync({ initialSync: true });
            } else {
                 throw new Error(`Failed to load data: ${response.statusText}`);
            }
        } else {
            const data = await response.json();
            setFleetData(data);
        }

    } catch (error) {
        console.error("Failed to load fleet data from JSON, attempting sync.", error);
        await handleSync({ initialSync: true });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSync = async ({ initialSync = false } = {}) => {
    if (!canSync && !initialSync) {
        toast({
            variant: "destructive",
            title: "Sync Limit",
            description: "You can only sync once every 24 hours.",
        });
        return;
    }
    setIsSyncing(true);
    try {
      const data = await syncFleetData();
      setFleetData(data);
      setCanSync(false);
      toast({
        title: "Success",
        description: "Fleet data synced successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sync fleet data.",
      });
      await fetchSyncStatus();
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if(isClient) {
        fetchSyncStatus();
        fetchAdminData();
        loadData();
    }
  }, [isClient, fetchSyncStatus, fetchAdminData]);


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
  
  const handleAssignmentChange = (value?: string) => {
    const newValue = value || "";
    setSelectedAssignment(newValue);
    setSelectedVehicle(""); 
    if (newValue) {
      const assignment = fleetData?.assignments.find(a => a.id === newValue);
      const prefix = assignment ? assignment.id.substring(0, 3) + "00" : "";
      setPrefixToCopy(prefix);
    } else {
      setPrefixToCopy("");
    }
  };

  const handlePillClick = (assignmentId: string) => {
     if (activeAssignmentPill === assignmentId) {
       setActiveAssignmentPill(""); 
     } else {
       setActiveAssignmentPill(assignmentId);
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
    if (!selectedAssignment || !fleetData) return [];
    
    const assignment = fleetData.assignments.find(a => a.id === selectedAssignment);
    if(!assignment) return [];

    const prefix = assignment.id.substring(0, 3);
    const vehiclesInAssignment = fleetData.vehicles.filter(v => {
        const olMatch = v.ol.startsWith(prefix);
        const platePrefixMatch = v.plate.startsWith(prefix);
        return olMatch || platePrefixMatch;
    });

    return [...new Set(vehiclesInAssignment.map(v => v.makeModel))].sort();
  }, [selectedAssignment, fleetData]);

  const favoritesTableData = useMemo(() => {
    if (!fleetData) return [];

    if (activeAssignmentPill) {
        const assignment = fleetData.assignments.find(a => a.id === activeAssignmentPill);
        if(!assignment) return [];
        const prefix = assignment.id.substring(0, 3);
        return fleetData.vehicles.filter(v => {
            const olMatch = v.ol.startsWith(prefix);
            const platePrefixMatch = v.plate.startsWith(prefix);
            return olMatch || platePrefixMatch;
        });
    }
    return favoriteVehicles;
  }, [fleetData, activeAssignmentPill, favoriteVehicles]);


  const mainTableData = useMemo(() => {
    if (!fleetData) return [];
    
    const assignmentId = selectedAssignment ? selectedAssignment : null;

    if (!assignmentId) {
        return [];
    }
    
    const assignment = fleetData.assignments.find(a => a.id === assignmentId);
    if(!assignment) return [];

    const prefix = assignment.id.substring(0, 3);
    let data = fleetData.vehicles.filter(v => {
         const olMatch = v.ol.startsWith(prefix);
         const platePrefixMatch = v.plate.startsWith(prefix);
         return olMatch || platePrefixMatch;
    });

    if (selectedVehicle && selectedVehicle !== ANY_VALUE) {
        data = data.filter(v => v.makeModel === selectedVehicle);
    }
    return data;

  }, [fleetData, selectedAssignment, selectedVehicle]);
  
  const columns = useMemo(
    () => getColumns(favoriteVehicleIds, toggleFavoriteVehicle),
    [favoriteVehicleIds]
  );
  
  const favoriteColumns = useMemo(
    () => getColumns(favoriteVehicleIds, toggleFavoriteVehicle, true),
    [favoriteVehicleIds]
  );
  
  const assignmentOptions = useMemo(() =>
    fleetData?.assignments.map(a => ({ value: a.id, label: a.name })) || []
  , [fleetData?.assignments]);

  const vehicleOptions = useMemo(() => [
        { value: ANY_VALUE, label: "Any" },
        ...availableVehicles.map(v => ({ value: v, label: v }))
  ], [availableVehicles]);


  if (isLoading && !fleetData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading fleet data...</p>
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
            <Button onClick={() => handleSync()} disabled={!canSync || isSyncing || !isClient} size="sm">
              {isSyncing ? (
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
            {adminData?.showPublicMessage && adminData.publicMessage && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Public Announcement</AlertTitle>
                  <AlertDescription>
                    {adminData.publicMessage}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-xl">
                  <Star className="text-yellow-400" /> Favorites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Favorite Assignments</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        {favoriteAssignments.length > 0 ? favoriteAssignments.map(a => (
                             <Badge 
                                key={a.id} 
                                variant={activeAssignmentPill === a.id ? "default" : "secondary"}
                                className="cursor-pointer"
                                onClick={() => handlePillClick(a.id)}
                            >
                                {a.name}
                            </Badge>
                        )) : <span className="text-sm text-muted-foreground italic">No favorite assignments yet. Star one from the dropdown below.</span>}
                    </div>
                 </div>
                 <Separator />
                {favoritesTableData.length > 0 ? (
                  <DataTable columns={favoriteColumns} data={favoritesTableData} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    {activeAssignmentPill ? (
                        <p>No vehicles found for this assignment.</p>
                    ) : (
                        <>
                            <p>No favorite vehicles yet.</p>
                            <p className="text-sm">Click the star icon on a vehicle to add it here.</p>
                        </>
                    )}
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Assignment</label>
                      <SearchableSelect
                        value={selectedAssignment}
                        onChange={handleAssignmentChange}
                        options={assignmentOptions}
                        placeholder="Select an assignment..."
                        searchPlaceholder="Search assignments..."
                        emptyPlaceholder="No assignments found."
                        onFavoriteToggle={toggleFavoriteAssignment}
                        favoriteIds={favoriteAssignmentIds}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-medium">Vehicle</label>
                       <SearchableSelect
                          value={selectedVehicle}
                          onChange={(value) => setSelectedVehicle(value || "")}
                          options={vehicleOptions}
                          placeholder="Select a vehicle..."
                          searchPlaceholder="Search vehicles..."
                          emptyPlaceholder="No vehicles found."
                          disabled={!selectedAssignment}
                        />
                    </div>
                  </div>
                   {prefixToCopy && (
                      <div className="flex items-center justify-center gap-4 rounded-lg border bg-muted/50 p-6 text-center">
                          <span className="text-lg text-muted-foreground">Use the vehicle plate prefix:</span>
                          <span 
                              className="text-5xl font-bold font-mono bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text"
                              style={{ textShadow: '0 0 1px hsl(var(--foreground) / 0.2)' }}
                            >
                              {prefixToCopy}
                            </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="group relative h-10 w-10" 
                            onClick={copyToClipboard}
                          >
                            <Copy className="h-5 w-5" />
                          </Button>
                      </div>
                    )}
                </div>

                <AnimatePresence>
                  {mainTableData.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <DataTable columns={columns} data={mainTableData} />
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      {!selectedAssignment ? (
                        <>
                          <p>Please select an assignment to view vehicles.</p>
                        </>
                      ) : (
                         <>
                          <p>No vehicles to display for this selection.</p>
                          <p className="text-sm">Try a different assignment or filter.</p>
                        </>
                      )}
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