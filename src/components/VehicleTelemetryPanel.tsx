"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Gauge, 
  CircleGauge, 
  MonitorPause, 
  MonitorOff, 
  FileCheck2, 
  History, 
  SquareActivity,
  ChartNoAxesCombined,
  Scan,
  MonitorCheck
} from 'lucide-react';

interface TelemetryData {
  speed: number;
  rpm: number;
  fuelLevel: number;
  batteryVoltage: number;
  coolantTemp: number;
  instantMPG: number;
  timestamp: number;
}

interface DiagnosticCode {
  id: string;
  code: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  count: number;
  freezeFrame?: string;
  suggestedFix?: string;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  active: boolean;
}

interface VehicleTelemetryPanelProps {
  className?: string;
  onConnectionRequest?: () => void;
}

export default function VehicleTelemetryPanel({ 
  className = "",
  onConnectionRequest
}: VehicleTelemetryPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [telemetryData, setTelemetryData] = useState<TelemetryData>({
    speed: 0,
    rpm: 0,
    fuelLevel: 75,
    batteryVoltage: 12.6,
    coolantTemp: 195,
    instantMPG: 28.5,
    timestamp: Date.now()
  });
  
  const [diagnosticCodes, setDiagnosticCodes] = useState<DiagnosticCode[]>([
    {
      id: '1',
      code: 'P0171',
      description: 'System Too Lean (Bank 1)',
      severity: 'warning',
      count: 3,
      freezeFrame: 'RPM: 1850, Load: 45%, Temp: 185°F',
      suggestedFix: 'Check air intake and fuel injectors'
    },
    {
      id: '2',
      code: 'P0420',
      description: 'Catalyst System Efficiency Below Threshold',
      severity: 'critical',
      count: 1,
      freezeFrame: 'RPM: 2100, Load: 65%, Temp: 210°F',
      suggestedFix: 'Replace catalytic converter'
    }
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'ENGINE',
      message: 'Check Engine Light',
      severity: 'critical',
      active: true
    },
    {
      id: '2',
      type: 'ABS',
      message: 'ABS System Warning',
      severity: 'warning',
      active: false
    },
    {
      id: '3',
      type: 'OIL',
      message: 'Low Oil Pressure',
      severity: 'warning',
      active: false
    }
  ]);

  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [historyPeriod, setHistoryPeriod] = useState<'1m' | '5m' | '30m'>('1m');

  // Simulate telemetry updates
  useEffect(() => {
    if (!isConnected || isPaused) return;

    const interval = setInterval(() => {
      setTelemetryData(prev => ({
        ...prev,
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 10),
        rpm: Math.max(0, Math.min(6000, prev.rpm + (Math.random() - 0.5) * 200)),
        fuelLevel: Math.max(0, Math.min(100, prev.fuelLevel + (Math.random() - 0.5) * 0.1)),
        batteryVoltage: Math.max(11, Math.min(14, prev.batteryVoltage + (Math.random() - 0.5) * 0.1)),
        coolantTemp: Math.max(160, Math.min(220, prev.coolantTemp + (Math.random() - 0.5) * 2)),
        instantMPG: Math.max(10, Math.min(50, prev.instantMPG + (Math.random() - 0.5) * 2)),
        timestamp: Date.now()
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, isPaused]);

  const handleClearCodes = useCallback(() => {
    setDiagnosticCodes([]);
    toast.success("Diagnostic codes cleared successfully");
  }, []);

  const handleRequestFreezeFrame = useCallback(() => {
    toast.info("Freeze frame data requested");
  }, []);

  const handleToggleLogging = useCallback(() => {
    setIsLogging(prev => {
      const newState = !prev;
      toast.success(newState ? "Live logging started" : "Live logging stopped");
      return newState;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => {
      const newState = !prev;
      toast.info(newState ? "Telemetry paused" : "Telemetry resumed");
      return newState;
    });
  }, []);

  const handleDownloadSnapshot = useCallback(() => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      telemetry: telemetryData,
      diagnosticCodes,
      alerts: alerts.filter(alert => alert.active)
    };
    
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-snapshot-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Telemetry snapshot downloaded");
  }, [telemetryData, diagnosticCodes, alerts]);

  const connectToOBD = useCallback(() => {
    setIsConnected(true);
    toast.success("Connected to OBD-II port");
  }, []);

  const MetricTile = ({ 
    title, 
    value, 
    unit, 
    icon: Icon 
  }: { 
    title: string; 
    value: number; 
    unit: string; 
    icon: React.ComponentType<any>; 
  }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold text-foreground mb-1">
          {value.toFixed(title === 'Battery' ? 1 : 0)}
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className="h-8 flex items-end">
          <div className="w-full h-2 bg-muted rounded-sm overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.random() * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const GaugeDisplay = ({ 
    title, 
    value, 
    max, 
    unit,
    color = "text-primary" 
  }: { 
    title: string; 
    value: number; 
    max: number; 
    unit: string;
    color?: string;
  }) => {
    const percentage = (value / max) * 100;
    
    return (
      <div className="flex flex-col items-center space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="relative">
          <CircleGauge className="h-20 w-20 text-muted" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${color}`}>{value.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
        <Progress value={percentage} className="w-20" />
      </div>
    );
  };

  if (!isConnected) {
    return (
      <Card className={`bg-card border-border ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MonitorOff className="h-5 w-5" />
            Vehicle Telemetry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-12">
            <MonitorOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No OBD Connection
            </h3>
            <p className="text-muted-foreground mb-6">
              Connect to your vehicle's OBD-II port to view live telemetry data.
            </p>
            <Button 
              onClick={onConnectionRequest || connectToOBD}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Scan className="h-4 w-4 mr-2" />
              Connect to OBD-II
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Gauge className="h-5 w-5" />
            Vehicle Telemetry
            {isPaused && <Badge variant="secondary">Paused</Badge>}
            {isLogging && <Badge className="bg-destructive text-destructive-foreground">Recording</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
              className="text-muted-foreground hover:text-foreground"
            >
              {isPaused ? <MonitorCheck className="h-4 w-4" /> : <MonitorPause className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSnapshot}
              className="text-muted-foreground hover:text-foreground"
            >
              <FileCheck2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricTile 
            title="Speed" 
            value={telemetryData.speed} 
            unit="mph" 
            icon={Gauge} 
          />
          <MetricTile 
            title="RPM" 
            value={telemetryData.rpm} 
            unit="rpm" 
            icon={CircleGauge} 
          />
          <MetricTile 
            title="Fuel" 
            value={telemetryData.fuelLevel} 
            unit="%" 
            icon={SquareActivity} 
          />
          <MetricTile 
            title="Battery" 
            value={telemetryData.batteryVoltage} 
            unit="V" 
            icon={SquareActivity} 
          />
          <MetricTile 
            title="Coolant" 
            value={telemetryData.coolantTemp} 
            unit="°F" 
            icon={SquareActivity} 
          />
          <MetricTile 
            title="MPG" 
            value={telemetryData.instantMPG} 
            unit="mpg" 
            icon={ChartNoAxesCombined} 
          />
        </div>

        <Tabs defaultValue="gauges" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gauges">Gauges</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="codes">DTC Codes</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gauges" className="mt-4">
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-8">
                <GaugeDisplay
                  title="Speedometer"
                  value={telemetryData.speed}
                  max={120}
                  unit="mph"
                  color="text-primary"
                />
                <GaugeDisplay
                  title="Tachometer"
                  value={telemetryData.rpm}
                  max={6000}
                  unit="rpm"
                  color="text-chart-2"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.active 
                      ? alert.severity === 'critical' 
                        ? 'bg-destructive/10 border-destructive/20' 
                        : 'bg-orange-500/10 border-orange-500/20'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.active
                        ? alert.severity === 'critical' 
                          ? 'bg-destructive' 
                          : 'bg-orange-500'
                        : 'bg-muted-foreground'
                    }`} />
                    <div>
                      <p className="font-medium text-foreground">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.type}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={alert.active ? "destructive" : "secondary"}
                  >
                    {alert.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="codes" className="mt-4">
            <div className="space-y-3">
              {diagnosticCodes.length === 0 ? (
                <div className="text-center py-6">
                  <MonitorCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No diagnostic codes found</p>
                </div>
              ) : (
                diagnosticCodes.map(code => (
                  <div key={code.id} className="border border-border rounded-lg overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedCode(expandedCode === code.id ? null : code.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={code.severity === 'critical' ? 'destructive' : 'secondary'}
                          >
                            {code.code}
                          </Badge>
                          <span className="text-foreground font-medium">{code.description}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Count: {code.count}
                        </div>
                      </div>
                    </div>
                    
                    {expandedCode === code.id && (
                      <div className="px-4 pb-4 bg-muted/30">
                        <div className="space-y-2 text-sm">
                          {code.freezeFrame && (
                            <div>
                              <span className="font-medium text-foreground">Freeze Frame:</span>
                              <p className="text-muted-foreground">{code.freezeFrame}</p>
                            </div>
                          )}
                          {code.suggestedFix && (
                            <div>
                              <span className="font-medium text-foreground">Suggested Fix:</span>
                              <p className="text-muted-foreground">{code.suggestedFix}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="controls" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      disabled={diagnosticCodes.length === 0}
                      className="w-full"
                    >
                      Clear Codes
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Diagnostic Codes</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently clear all diagnostic trouble codes. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearCodes}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Clear Codes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button 
                  variant="outline"
                  onClick={handleRequestFreezeFrame}
                  className="w-full"
                >
                  Request Freeze Frame
                </Button>

                <Button
                  variant={isLogging ? "destructive" : "default"}
                  onClick={handleToggleLogging}
                  className="w-full"
                >
                  {isLogging ? 'Stop' : 'Start'} Live Log
                </Button>

                <Button
                  variant="outline"
                  onClick={handleTogglePause}
                  className="w-full"
                >
                  {isPaused ? 'Resume' : 'Pause'} Telemetry
                </Button>
              </div>

              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Historical Data</span>
                  <div className="flex space-x-1">
                    {(['1m', '5m', '30m'] as const).map(period => (
                      <Button
                        key={period}
                        size="sm"
                        variant={historyPeriod === period ? "default" : "outline"}
                        onClick={() => setHistoryPeriod(period)}
                        className="text-xs"
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <History className="h-4 w-4" />
                  <span>Showing data for last {historyPeriod}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}