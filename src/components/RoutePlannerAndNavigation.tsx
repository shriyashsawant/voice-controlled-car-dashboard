"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { 
  Route, 
  Navigation, 
  Car, 
  ArrowRight, 
  CarFront, 
  Forward,
  CornerUpRight,
  Waypoints,
  Navigation2
} from "lucide-react";

interface RouteOptions {
  type: "fastest" | "eco" | "shortest";
  avoidHighways: boolean;
  avoidTolls: boolean;
  departureTime: "now" | "later";
  vehicleProfile: "car" | "truck" | "ev";
}

interface RouteResult {
  id: string;
  distance: string;
  duration: string;
  eta: string;
  fuelConsumption?: string;
  chargingStops?: Array<{
    name: string;
    estimatedSoc: string;
    chargingTime: string;
  }>;
  instructions: Array<{
    id: string;
    instruction: string;
    distance: string;
    eta: string;
  }>;
}

interface RouteData {
  origin: string;
  destination: string;
  waypoints: string[];
  options: RouteOptions;
  results: RouteResult[];
  selectedRoute: number;
}

export default function RoutePlannerAndNavigation() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [waypoint, setWaypoint] = useState("");
  const [routeOptions, setRouteOptions] = useState<RouteOptions>({
    type: "fastest",
    avoidHighways: false,
    avoidTolls: false,
    departureTime: "now",
    vehicleProfile: "car"
  });
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [sendingToVehicle, setSendingToVehicle] = useState(false);
  const [expandedInstructions, setExpandedInstructions] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Simulate network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    if (typeof window !== "undefined") {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
    }
    
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) {
      toast.error("Please enter both origin and destination");
      return;
    }

    setIsCalculating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults: RouteResult[] = [
        {
          id: "route-1",
          distance: "24.5 km",
          duration: "32 min",
          eta: "3:45 PM",
          fuelConsumption: routeOptions.vehicleProfile === "ev" ? "18 kWh" : "2.1L",
          chargingStops: routeOptions.vehicleProfile === "ev" ? [
            { name: "Tesla Supercharger - Downtown", estimatedSoc: "75%", chargingTime: "15 min" }
          ] : undefined,
          instructions: [
            { id: "1", instruction: "Head north on Main Street", distance: "0.5 km", eta: "3:15 PM" },
            { id: "2", instruction: "Turn right onto Highway 101", distance: "15.2 km", eta: "3:28 PM" },
            { id: "3", instruction: "Take exit 42A toward Downtown", distance: "2.8 km", eta: "3:32 PM" },
            { id: "4", instruction: "Continue straight on Oak Avenue", distance: "4.1 km", eta: "3:40 PM" },
            { id: "5", instruction: "Turn left onto destination street", distance: "1.9 km", eta: "3:45 PM" }
          ]
        },
        {
          id: "route-2",
          distance: "26.8 km",
          duration: "29 min",
          eta: "3:42 PM",
          fuelConsumption: routeOptions.vehicleProfile === "ev" ? "16 kWh" : "1.9L",
          instructions: [
            { id: "1", instruction: "Head south on Pine Street", distance: "1.2 km", eta: "3:16 PM" },
            { id: "2", instruction: "Merge onto Interstate 5", distance: "18.5 km", eta: "3:30 PM" },
            { id: "3", instruction: "Take exit 15B", distance: "7.1 km", eta: "3:42 PM" }
          ]
        },
        {
          id: "route-3", 
          distance: "22.1 km",
          duration: "41 min",
          eta: "3:54 PM",
          fuelConsumption: routeOptions.vehicleProfile === "ev" ? "15 kWh" : "1.7L",
          instructions: [
            { id: "1", instruction: "Head west on Elm Street", distance: "3.4 km", eta: "3:20 PM" },
            { id: "2", instruction: "Turn right onto Scenic Route", distance: "12.8 km", eta: "3:35 PM" },
            { id: "3", instruction: "Continue to destination", distance: "5.9 km", eta: "3:54 PM" }
          ]
        }
      ];

      const newRouteData: RouteData = {
        origin,
        destination,
        waypoints: waypoint ? [waypoint] : [],
        options: routeOptions,
        results: mockResults,
        selectedRoute: 0
      };

      setRouteData(newRouteData);
      toast.success("Route calculated successfully");
    } catch (error) {
      toast.error("Failed to calculate route");
    } finally {
      setIsCalculating(false);
    }
  }, [origin, destination, waypoint, routeOptions]);

  const sendToVehicle = useCallback(async () => {
    if (!routeData) return;
    
    setSendingToVehicle(true);
    
    try {
      // Simulate sending to vehicle
      toast.loading("Sending route to vehicle...", { id: "send-route" });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Route queued for delivery", { id: "send-route" });
      
      // Simulate delivery states
      setTimeout(() => {
        toast.success("Route delivered to vehicle", { id: "delivery-status" });
      }, 3000);
      
      setTimeout(() => {
        toast.success("Route accepted by navigation system", { id: "delivery-status" });
      }, 5000);
      
    } catch (error) {
      toast.error("Failed to send route to vehicle", { id: "send-route" });
    } finally {
      setSendingToVehicle(false);
    }
  }, [routeData]);

  const exportRoute = useCallback((format: "pdf" | "gpx") => {
    if (!routeData) return;
    
    // Simulate export
    toast.success(`Route exported as ${format.toUpperCase()}`);
  }, [routeData]);

  const shareRoute = useCallback(() => {
    if (!routeData) return;
    
    // Simulate share link generation
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      const shareUrl = `https://dashboard.app/route/${Date.now()}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard");
    }
  }, [routeData]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Route className="w-5 h-5 text-primary" />
          Route Planner & Navigation
          {!isOnline && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Offline Mode
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Address Entry Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label htmlFor="origin" className="text-sm font-medium">From</Label>
              <div className="relative">
                <CarFront className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="origin"
                  placeholder="Enter origin address"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="destination" className="text-sm font-medium">To</Label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="destination"
                  placeholder="Enter destination address"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="waypoint" className="text-sm font-medium">Via (Optional)</Label>
              <div className="relative">
                <Waypoints className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="waypoint"
                  placeholder="Add waypoint"
                  value={waypoint}
                  onChange={(e) => setWaypoint(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Route Options */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select
              value={routeOptions.type}
              onValueChange={(value) => 
                setRouteOptions(prev => ({ ...prev, type: value as RouteOptions['type'] }))
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fastest">Fastest</SelectItem>
                <SelectItem value="eco">Eco</SelectItem>
                <SelectItem value="shortest">Shortest</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={routeOptions.vehicleProfile}
              onValueChange={(value) => 
                setRouteOptions(prev => ({ ...prev, vehicleProfile: value as RouteOptions['vehicleProfile'] }))
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="ev">EV</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={routeOptions.departureTime}
              onValueChange={(value) => 
                setRouteOptions(prev => ({ ...prev, departureTime: value as RouteOptions['departureTime'] }))
              }
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Now</SelectItem>
                <SelectItem value="later">Later</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={routeOptions.avoidHighways ? "default" : "outline"}
              size="sm"
              onClick={() => setRouteOptions(prev => ({ ...prev, avoidHighways: !prev.avoidHighways }))}
            >
              Avoid Highways
            </Button>
            <Button
              variant={routeOptions.avoidTolls ? "default" : "outline"}
              size="sm"
              onClick={() => setRouteOptions(prev => ({ ...prev, avoidTolls: !prev.avoidTolls }))}
            >
              Avoid Tolls
            </Button>
          </div>
          
          <Button 
            onClick={calculateRoute} 
            disabled={isCalculating || !origin || !destination}
            className="w-full"
          >
            {isCalculating ? "Calculating..." : "Calculate Route"}
          </Button>
        </div>

        {/* Results Pane */}
        {routeData && (
          <div className="space-y-4">
            <Tabs value={routeData.selectedRoute.toString()} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {routeData.results.map((route, index) => (
                  <TabsTrigger 
                    key={route.id} 
                    value={index.toString()}
                    onClick={() => setRouteData(prev => prev ? { ...prev, selectedRoute: index } : null)}
                    className="text-xs"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{route.duration}</span>
                      <span className="text-muted-foreground">{route.distance}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {routeData.results.map((route, index) => (
                <TabsContent key={route.id} value={index.toString()} className="space-y-4">
                  {/* Map Thumbnail Placeholder */}
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Navigation2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Route Preview</p>
                    </div>
                  </div>
                  
                  {/* Route Summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold">{route.duration}</p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{route.distance}</p>
                      <p className="text-xs text-muted-foreground">Distance</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{route.eta}</p>
                      <p className="text-xs text-muted-foreground">Arrival</p>
                    </div>
                  </div>
                  
                  {/* EV Charging Info */}
                  {routeOptions.vehicleProfile === "ev" && route.chargingStops && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Charging Stops</h4>
                      {route.chargingStops.map((stop, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                          <span>{stop.name}</span>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>SOC: {stop.estimatedSoc}</span>
                            <span>{stop.chargingTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Turn-by-turn Instructions */}
                  <Collapsible open={expandedInstructions} onOpenChange={setExpandedInstructions}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        Turn-by-turn Directions
                        <Forward className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2">
                      {route.instructions.map((instruction, idx) => (
                        <div key={instruction.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{instruction.instruction}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                              <span>{instruction.distance}</span>
                              <span>ETA: {instruction.eta}</span>
                            </div>
                          </div>
                          <CornerUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </TabsContent>
              ))}
            </Tabs>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                onClick={sendToVehicle}
                disabled={sendingToVehicle}
                className="w-full"
              >
                <Car className="w-4 h-4 mr-2" />
                {sendingToVehicle ? "Sending..." : "Send to Vehicle"}
              </Button>
              
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => exportRoute("pdf")}>
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportRoute("gpx")}>
                  Export GPX
                </Button>
                <Button variant="outline" size="sm" onClick={shareRoute}>
                  Share Link
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}