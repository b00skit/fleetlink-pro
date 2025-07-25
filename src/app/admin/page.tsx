
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { syncFleetData, getAdminData, updateAdminData } from "@/app/actions";
import type { AdminData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const [adminData, setAdminData] = useState<AdminData>({
    publicMessage: "",
    showPublicMessage: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Allows for providing token via query param for ease of use
    const tokenFromQuery = searchParams.get("token");
    if (tokenFromQuery) {
      handleTokenSubmit(tokenFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      getAdminData().then(setAdminData);
    }
  }, [isAuthenticated]);

  const handleTokenSubmit = (submittedToken: string) => {
    // In a real app, this would be a fetch call to a backend endpoint.
    // For this prototype, we'll just check against an environment variable.
    // This is not secure for production.
    if (submittedToken === process.env.ADMIN_TOKEN) {
      setIsAuthenticated(true);
      toast({ title: "Authentication successful." });
    } else {
      toast({
        variant: "destructive",
        title: "Authentication failed.",
        description: "The provided token is incorrect.",
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncFleetData({ isAdmin: true });
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
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
        await updateAdminData(adminData);
        toast({
            title: "Settings Saved",
            description: "Public message settings have been updated.",
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save settings.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Admin Access</CardTitle>
                <CardDescription>Please enter the admin token to continue.</CardDescription>
            </CardHeader>
            <CardContent>
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleTokenSubmit(token);
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="admin-token">Admin Token</Label>
                        <Input
                            id="admin-token"
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Enter token..."
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Authenticate
                    </Button>
                </form>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <div className="space-y-8">
        <h1 className="font-headline text-4xl font-bold">Admin Dashboard</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Force Data Sync</CardTitle>
                <CardDescription>Bypass the 24-hour limit and sync data from the Google Sheet immediately.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleSync} disabled={isSyncing}>
                    {isSyncing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync Now
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Public Message</CardTitle>
                <CardDescription>Set a message that will appear at the top of the main page for all users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="public-message">Message</Label>
                    <Textarea
                        id="public-message"
                        placeholder="Enter public message here..."
                        value={adminData.publicMessage}
                        onChange={(e) => setAdminData({ ...adminData, publicMessage: e.target.value })}
                        rows={4}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="show-public-message"
                        checked={adminData.showPublicMessage}
                        onCheckedChange={(checked) => setAdminData({ ...adminData, showPublicMessage: checked })}
                    // />
                    <Label htmlFor="show-public-message">Show message on public page</Label>
                </div>
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Settings
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
