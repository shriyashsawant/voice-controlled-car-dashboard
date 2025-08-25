"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Table as TableIcon, 
  ChartLine, 
  Gauge, 
  Car, 
  FileChartLine,
  ChevronsLeftRightEllipsis
} from "lucide-react";

interface Trip {
  id: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  distance: number; // miles
  avgSpeed: number; // mph
  fuelConsumed: number; // gallons
  mpg: number;
  notes: string;
  tags: string[];
  vehicleProfile: string;
  ecoScore: number;
}

interface TripAnalysis {
  harshBraking: number;
  harshAcceleration: number;
  idleTime: number; // minutes
  fuelEfficiencyTips: string[];
}

const mockTrips: Trip[] = [
  {
    id: "TRP-001",
    startLocation: "Home",
    endLocation: "Downtown Office",
    startTime: "2024-01-15T08:30:00",
    endTime: "2024-01-15T09:15:00",
    duration: 45,
    distance: 18.5,
    avgSpeed: 24.7,
    fuelConsumed: 0.8,
    mpg: 23.1,
    notes: "Heavy traffic on I-85",
    tags: ["commute", "business"],
    vehicleProfile: "Honda Civic",
    ecoScore: 85
  },
  {
    id: "TRP-002",
    startLocation: "Downtown Office",
    endLocation: "Client Meeting",
    startTime: "2024-01-15T14:00:00",
    endTime: "2024-01-15T14:25:00",
    duration: 25,
    distance: 8.2,
    avgSpeed: 19.7,
    fuelConsumed: 0.4,
    mpg: 20.5,
    notes: "Construction delays",
    tags: ["business"],
    vehicleProfile: "Honda Civic",
    ecoScore: 72
  },
  {
    id: "TRP-003",
    startLocation: "Shopping Center",
    endLocation: "Home",
    startTime: "2024-01-14T16:45:00",
    endTime: "2024-01-14T17:20:00",
    duration: 35,
    distance: 12.3,
    avgSpeed: 21.1,
    fuelConsumed: 0.6,
    mpg: 20.5,
    notes: "Stopped for gas",
    tags: ["personal"],
    vehicleProfile: "Honda Civic",
    ecoScore: 78
  }
];

export default function TripSummaryAndHistory() {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const tripsPerPage = 5;

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalTrips = trips.length;
    const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);
    const totalFuel = trips.reduce((sum, trip) => sum + trip.fuelConsumed, 0);
    const avgMPG = totalFuel > 0 ? totalDistance / totalFuel : 0;
    const avgEcoScore = trips.reduce((sum, trip) => sum + trip.ecoScore, 0) / totalTrips;

    return {
      totalTrips,
      avgMPG: avgMPG.toFixed(1),
      totalDistance: totalDistance.toFixed(1),
      avgEcoScore: Math.round(avgEcoScore)
    };
  }, [trips]);

  // Filter and paginate trips
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = searchTerm === "" || 
        trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.startLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.endLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVehicle = vehicleFilter === "" || vehicleFilter === "all-vehicles" || trip.vehicleProfile === vehicleFilter;
      const matchesTag = tagFilter === "" || tagFilter === "all-tags" || trip.tags.includes(tagFilter);
      
      return matchesSearch && matchesVehicle && matchesTag;
    });
  }, [trips, searchTerm, vehicleFilter, tagFilter]);

  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * tripsPerPage;
    return filteredTrips.slice(startIndex, startIndex + tripsPerPage);
  }, [filteredTrips, currentPage]);

  const totalPages = Math.ceil(filteredTrips.length / tripsPerPage);

  const handleTripSelect = useCallback((tripId: string, checked: boolean) => {
    setSelectedTrips(prev => 
      checked ? [...prev, tripId] : prev.filter(id => id !== tripId)
    );
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedTrips(checked ? paginatedTrips.map(trip => trip.id) : []);
  }, [paginatedTrips]);

  const handleBatchExport = useCallback(async () => {
    if (selectedTrips.length === 0) {
      toast.error("Please select trips to export");
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Simulate CSV generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Exported ${selectedTrips.length} trips to CSV`);
      setSelectedTrips([]);
    } catch (error) {
      toast.error("Failed to export trips");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [selectedTrips]);

  const handleAnalyzeTrip = useCallback(async (tripId: string) => {
    setIsAnalyzing(tripId);
    try {
      // Simulate trip analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockAnalysis: TripAnalysis = {
        harshBraking: 3,
        harshAcceleration: 2,
        idleTime: 8,
        fuelEfficiencyTips: [
          "Maintain steady speeds to improve fuel efficiency",
          "Reduce idle time by turning off engine during long stops",
          "Accelerate gradually to avoid harsh acceleration events"
        ]
      };

      toast.success("Trip analysis complete", {
        description: `Found ${mockAnalysis.harshBraking} harsh braking events and ${mockAnalysis.harshAcceleration} harsh accelerations`
      });
    } catch (error) {
      toast.error("Failed to analyze trip");
    } finally {
      setIsAnalyzing(null);
    }
  }, []);

  const handleEditNotes = useCallback((tripId: string, newNotes: string) => {
    setTrips(prev => prev.map(trip => 
      trip.id === tripId ? { ...trip, notes: newNotes } : trip
    ));
    toast.success("Trip notes updated");
  }, []);

  const handleDeleteTrip = useCallback((tripId: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== tripId));
    toast.success("Trip deleted permanently");
  }, []);

  const uniqueVehicles = useMemo(() => 
    [...new Set(trips.map(trip => trip.vehicleProfile))], [trips]
  );

  const uniqueTags = useMemo(() => 
    [...new Set(trips.flatMap(trip => trip.tags))], [trips]
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getEcoScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-primary" />
            Trip Summary & History
          </CardTitle>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Trips</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {summaryStats.totalTrips}
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg MPG</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {summaryStats.avgMPG}
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <ChartLine className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Distance</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {summaryStats.totalDistance}mi
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileChartLine className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Eco Score</span>
            </div>
            <div className={`text-2xl font-bold ${getEcoScoreColor(summaryStats.avgEcoScore)}`}>
              {summaryStats.avgEcoScore}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-40 bg-input border-border">
                <SelectValue placeholder="Vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-vehicles">All Vehicles</SelectItem>
                {uniqueVehicles.map(vehicle => (
                  <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-32 bg-input border-border">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-tags">All Tags</SelectItem>
                {uniqueTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedTrips.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <span className="text-sm text-muted-foreground">
              {selectedTrips.length} trip{selectedTrips.length === 1 ? '' : 's'} selected
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBatchExport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? "Exporting..." : "Export CSV"}
              </Button>
              <Button variant="outline" size="sm">
                Create Report
              </Button>
              <Button variant="outline" size="sm">
                Reconcile Expenses
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trip Table */}
        <div className="border border-border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTrips.length === paginatedTrips.length && paginatedTrips.length > 0}
                    indeterminate={selectedTrips.length > 0 && selectedTrips.length < paginatedTrips.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Avg Speed</TableHead>
                <TableHead>MPG</TableHead>
                <TableHead>Eco Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.map((trip) => (
                <Collapsible key={trip.id} asChild>
                  <>
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedTrips.includes(trip.id)}
                          onCheckedChange={(checked) => handleTripSelect(trip.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {trip.id.split('-')[1]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{trip.id}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateTime(trip.startTime).date}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-foreground">
                            {trip.startLocation} → {trip.endLocation}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(trip.startTime).time} - {formatDateTime(trip.endTime).time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatDuration(trip.duration)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {trip.distance.toFixed(1)} mi
                      </TableCell>
                      <TableCell className="text-foreground">
                        {trip.avgSpeed.toFixed(1)} mph
                      </TableCell>
                      <TableCell className="text-foreground">
                        {trip.mpg.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getEcoScoreColor(trip.ecoScore)}`}>
                          {trip.ecoScore}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedTrip(
                                expandedTrip === trip.id ? null : trip.id
                              )}
                            >
                              <ChevronsLeftRightEllipsis className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                ⋮
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem onClick={() => handleAnalyzeTrip(trip.id)}>
                                {isAnalyzing === trip.id ? "Analyzing..." : "Analyze Trip"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Notes</DropdownMenuItem>
                              <DropdownMenuItem>Add Tags</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Download CSV</DropdownMenuItem>
                              <DropdownMenuItem>Anonymize Data</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteTrip(trip.id)}
                              >
                                Delete Trip
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>

                    <CollapsibleContent asChild>
                      <TableRow className="border-border bg-muted/20">
                        <TableCell colSpan={9} className="p-6">
                          <div className="space-y-4">
                            {/* Trip Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium text-foreground">Trip Details</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vehicle:</span>
                                    <span className="text-foreground">{trip.vehicleProfile}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fuel Used:</span>
                                    <span className="text-foreground">{trip.fuelConsumed.toFixed(2)} gal</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tags:</span>
                                    <div className="flex gap-1">
                                      {trip.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-medium text-foreground">Performance</h4>
                                <div className="space-y-2">
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-muted-foreground">Eco Score</span>
                                      <span className={getEcoScoreColor(trip.ecoScore)}>
                                        {trip.ecoScore}/100
                                      </span>
                                    </div>
                                    <Progress 
                                      value={trip.ecoScore} 
                                      className="h-2"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-medium text-foreground">Notes</h4>
                                <p className="text-sm text-muted-foreground">
                                  {trip.notes || "No notes"}
                                </p>
                              </div>
                            </div>

                            {/* Mini Map Placeholder */}
                            <div className="bg-secondary/50 rounded-lg p-4 h-32 flex items-center justify-center">
                              <span className="text-muted-foreground text-sm">
                                Route Map (Preview)
                              </span>
                            </div>

                            {/* Speed Graph Placeholder */}
                            <div className="bg-secondary/50 rounded-lg p-4 h-24 flex items-center justify-center">
                              <span className="text-muted-foreground text-sm">
                                Speed & Telemetry Graph
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * tripsPerPage) + 1}-{Math.min(currentPage * tripsPerPage, filteredTrips.length)} of {filteredTrips.length} trips
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}