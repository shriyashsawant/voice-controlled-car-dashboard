"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import {
  Map,
  Navigation,
  LocateFixed,
  Car,
  Compass,
  MapPin,
  MapPinned,
  Navigation2,
  MapPlus,
  Gauge
} from "lucide-react";

interface LiveMapCardProps {
  className?: string;
}

interface VehicleData {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  rpm: number;
  accuracy: number;
  timestamp: Date;
}

interface MapLayer {
  id: string;
  name: string;
  enabled: boolean;
}

export default function LiveMapCard({ className }: LiveMapCardProps) {
  const [isFollowing, setIsFollowing] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [playbackPosition, setPlaybackPosition] = useState([0]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showVehiclePopup, setShowVehiclePopup] = useState(false);
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    { id: "traffic", name: "Traffic", enabled: false },
    { id: "satellite", name: "Satellite", enabled: false },
    { id: "route", name: "Route", enabled: true }
  ]);

  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock vehicle data
  const [vehicleData] = useState<VehicleData>({
    lat: 37.7749,
    lng: -122.4194,
    heading: 45,
    speed: 35,
    rpm: 2200,
    accuracy: 3.2,
    timestamp: new Date()
  });

  // Mock track data for playback
  const [trackData] = useState<VehicleData[]>([
    { lat: 37.7749, lng: -122.4194, heading: 45, speed: 35, rpm: 2200, accuracy: 3.2, timestamp: new Date(Date.now() - 1800000) },
    { lat: 37.7759, lng: -122.4184, heading: 50, speed: 40, rpm: 2400, accuracy: 2.8, timestamp: new Date(Date.now() - 1200000) },
    { lat: 37.7769, lng: -122.4174, heading: 55, speed: 32, rpm: 2100, accuracy: 3.5, timestamp: new Date(Date.now() - 600000) }
  ]);

  const [networkStatus] = useState<"online" | "poor" | "offline">("online");

  // Map controls
  const handleZoomIn = useCallback(() => {
    console.log("Zoom in");
  }, []);

  const handleZoomOut = useCallback(() => {
    console.log("Zoom out");
  }, []);

  const handleCenterOnVehicle = useCallback(() => {
    setIsFollowing(true);
    console.log("Center on vehicle");
  }, []);

  const toggleLayer = useCallback((layerId: string) => {
    setMapLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
    ));
  }, []);

  // Playback controls
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handlePlaybackPositionChange = useCallback((value: number[]) => {
    setPlaybackPosition(value);
    setIsPlaying(false);
  }, []);

  const handlePlaybackSpeedChange = useCallback((value: number[]) => {
    setPlaybackSpeed(value);
  }, []);

  // Export functions
  const handleExportGPX = useCallback(() => {
    console.log("Export GPX");
    // Implementation would generate and download GPX file
  }, []);

  const handleDownloadSnapshot = useCallback(() => {
    console.log("Download snapshot");
    // Implementation would capture map as PNG
  }, []);

  const formatCoordinates = useCallback((lat: number, lng: number) => {
    if (isPrivacyMode) {
      return "••.••••°, ••.••••°";
    }
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  }, [isPrivacyMode]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour12: false });
  }, []);

  const getNetworkStatusColor = useCallback((status: string) => {
    switch (status) {
      case "online": return "text-green-400";
      case "poor": return "text-yellow-400";
      case "offline": return "text-red-400";
      default: return "text-muted-foreground";
    }
  }, []);

  // Mock canvas drawing for map visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid (placeholder for map tiles)
    ctx.strokeStyle = "#2a2d2f";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw track path
    if (mapLayers.find(l => l.id === "route")?.enabled) {
      ctx.strokeStyle = "#ff8a5a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      trackData.forEach((point, index) => {
        const x = (canvas.width / 2) + (index * 20);
        const y = (canvas.height / 2) - (index * 10);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw vehicle marker
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Vehicle body
    ctx.fillStyle = "#ff8a5a";
    ctx.fillRect(centerX - 8, centerY - 6, 16, 12);

    // Heading arrow
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 12);
    ctx.lineTo(centerX - 6, centerY - 2);
    ctx.lineTo(centerX + 6, centerY - 2);
    ctx.closePath();
    ctx.fill();

    // Speed badge
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(centerX + 12, centerY - 8, 40, 16);
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Inter";
    ctx.textAlign = "center";
    ctx.fillText(`${vehicleData.speed} mph`, centerX + 32, centerY + 2);

  }, [vehicleData, trackData, mapLayers]);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex gap-4 h-[400px]">
          {/* Main map area */}
          <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
            {/* Map canvas */}
            <div ref={mapRef} className="w-full h-full relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="w-full h-full"
              />
              
              {/* Offline indicator */}
              {isOffline && (
                <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
                  Offline Mode
                </div>
              )}

              {/* Vehicle popup */}
              {showVehiclePopup && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8 bg-popover border rounded-lg p-3 shadow-lg min-w-[200px]">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Speed:</span>
                      <span>{vehicleData.speed} mph</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RPM:</span>
                      <span>{vehicleData.rpm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heading:</span>
                      <span>{vehicleData.heading}°</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Zoom to
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Route From Here
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map controls */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <MapPlus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <Map className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={isFollowing ? "default" : "outline"}
                onClick={handleCenterOnVehicle}
                title="Center on vehicle"
              >
                <LocateFixed className="w-4 h-4" />
              </Button>
            </div>

            {/* Layer toggles */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              {mapLayers.map((layer) => (
                <Toggle
                  key={layer.id}
                  pressed={layer.enabled}
                  onPressedChange={() => toggleLayer(layer.id)}
                  size="sm"
                  title={`Toggle ${layer.name}`}
                >
                  <span className="text-xs">{layer.name}</span>
                </Toggle>
              ))}
            </div>

            {/* Privacy mode toggle */}
            <div className="absolute bottom-2 right-2">
              <Toggle
                pressed={isPrivacyMode}
                onPressedChange={setIsPrivacyMode}
                size="sm"
                title="Privacy mode"
              >
                <MapPinned className="w-4 h-4" />
              </Toggle>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-48 space-y-4">
            {/* GPS Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">GPS Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coords:</span>
                  <span className="font-mono">
                    {formatCoordinates(vehicleData.lat, vehicleData.lng)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span>{vehicleData.accuracy}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className={getNetworkStatusColor(networkStatus)}>
                    {networkStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Update:</span>
                  <span>{formatTime(vehicleData.timestamp)}</span>
                </div>
              </div>
            </div>

            {/* Current Metrics */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed:</span>
                  <span>{vehicleData.speed} mph</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heading:</span>
                  <span>{vehicleData.heading}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RPM:</span>
                  <span>{vehicleData.rpm}</span>
                </div>
              </div>
            </div>

            {/* Export controls */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Export</h4>
              <div className="space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportGPX}
                  className="w-full justify-start"
                >
                  Export GPX
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadSnapshot}
                  className="w-full justify-start"
                >
                  Download PNG
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Playback controls */}
        <div className="mt-4 space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Track Playback</h4>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlayPause}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <div className="w-3 h-3 bg-current" />
                ) : (
                  <div className="w-0 h-0 border-l-[6px] border-l-current border-y-[4px] border-y-transparent" />
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                {Math.round(playbackSpeed[0] * 100) / 100}x
              </span>
            </div>
          </div>

          {/* Timeline scrubber */}
          <div className="space-y-2">
            <Slider
              value={playbackPosition}
              onValueChange={handlePlaybackPositionChange}
              max={trackData.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>30m ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* Speed control */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Playback Speed</label>
            <Slider
              value={playbackSpeed}
              onValueChange={handlePlaybackSpeedChange}
              min={0.1}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}