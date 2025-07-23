"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Vehicle } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Star, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const getColumns = (
    favoriteVehicleIds: Set<string>, 
    onToggleFavorite: (vehicleId: string) => void,
    isFavoritesTable: boolean = false,
    favoriteAssignmentIds?: Set<string>,
    onToggleFavoriteAssignment?: (assignmentId: string) => void
    ): ColumnDef<Vehicle>[] => {

    const baseColumns: ColumnDef<Vehicle>[] = [
        {
            id: "favorite",
            header: () => <Star className="h-4 w-4" />,
            cell: ({ row }) => {
                const vehicle = row.original
                const isFavorited = favoriteVehicleIds.has(vehicle.id)
                return (
                    <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(vehicle.id)} className="h-7 w-7">
                        <Star className={`h-4 w-4 ${isFavorited ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    </Button>
                )
            },
            size: 50,
        },
        {
            accessorKey: "id",
            header: "Index",
            size: 60,
        },
        {
            accessorKey: "plate",
            header: "Plate",
            size: 100,
        },
        {
            accessorKey: "makeModel",
            header: "Make/Model",
        },
        {
            accessorKey: "alpr",
            header: "ALPR",
            cell: ({ row }) => {
                const alpr = row.getValue("alpr")
                return <Badge variant={alpr ? "default" : "secondary"}>{alpr ? "YES" : "NO"}</Badge>
            },
            size: 80,
        },
        {
            accessorKey: "ol",
            header: "O/L",
        },
        {
            accessorKey: "authorized",
            header: "Authorized",
        },
        {
            accessorKey: "purpose",
            header: "Purpose",
        },
        {
            accessorKey: "notes",
            header: "Notes",
        },
    ]

    return baseColumns;
}
