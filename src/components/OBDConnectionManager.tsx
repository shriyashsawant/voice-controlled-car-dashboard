"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Signal,
  SignalMedium,
  SignalZero,
  BluetoothSearching,
  Usb,
  MonitorCheck,
  Nfc,
  InspectionPanel,
  CardSim,
  MonitorOff,
  ChevronsDownUp,
  WifiHigh,
  WifiZero } from
"lucide-react";
import { toast } from "sonner";

type ConnectionState = "disconnected" | "scanning" | "paired" | "connected";
type AdapterType = "bluetooth" | "wifi" | "usb" | "elm327";
type Protocol = "ISO 15765" | "SAE J1850" | "ISO 9141" | "KWP2000" | "CAN";

interface OBDAdapter {
  id: string;
  name: string;
  type: AdapterType;
  rssi?: number;
  battery?: number;
  protocol?: Protocol;
  lastSeen: Date;
  isPaired: boolean;
  isConnected: boolean;
  encrypted?: boolean;
}

interface RawCommand {
  command: string;
  response: string;
  timestamp: Date;
}

export default function OBDConnectionManager() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [adapters, setAdapters] = useState<OBDAdapter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rawCommands, setRawCommands] = useState<RawCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null);
  const [pairingDialog, setPairingDialog] = useState(false);
  const [pairingProgress, setPairingProgress] = useState(0);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    setAdapters([
    {
      id: "bt-001",
      name: "ELM327 v1.5",
      type: "bluetooth",
      rssi: -65,
      battery: 85,
      lastSeen: new Date(Date.now() - 120000),
      isPaired: true,
      isConnected: false
    },
    {
      id: "wifi-001",
      name: "OBDLink MX WiFi",
      type: "wifi",
      rssi: -45,
      lastSeen: new Date(Date.now() - 30000),
      isPaired: false,
      isConnected: false
    }]
    );
  }, []);

  const addToLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString();
    setConnectionLog((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    setConnectionState("scanning");
    addToLog("Started scanning for OBD adapters");

    // Simulate progressive discovery
    setTimeout(() => {
      setAdapters((prev) => [...prev, {
        id: "bt-002",
        name: "BAFX Products BT Reader",
        type: "bluetooth",
        rssi: -78,
        battery: 92,
        lastSeen: new Date(),
        isPaired: false,
        isConnected: false
      }]);
      addToLog("Found new Bluetooth adapter: BAFX Products BT Reader");
    }, 2000);

    setTimeout(() => {
      setIsScanning(false);
      setConnectionState("disconnected");
      addToLog("Scan completed");
      toast.success("Scan completed", {
        description: "Found 1 new adapter"
      });
    }, 5000);
  }, [addToLog]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setConnectionState("disconnected");
    addToLog("Scanning stopped by user");
    toast.info("Scanning stopped");
  }, [addToLog]);

  const startPairing = useCallback((adapterId: string) => {
    const adapter = adapters.find((a) => a.id === adapterId);
    if (!adapter) return;

    setPairingDialog(true);
    setPairingProgress(0);
    addToLog(`Starting pairing with ${adapter.name}`);

    // Simulate pairing progress
    const interval = setInterval(() => {
      setPairingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setPairingDialog(false);

          // Update adapter state
          setAdapters((prev) => prev.map((a) =>
          a.id === adapterId ? { ...a, isPaired: true } : a
          ));

          addToLog(`Successfully paired with ${adapter.name}`);
          toast.success("Pairing successful", {
            description: `Connected to ${adapter.name}`
          });
          return 100;
        }
        return prev + 20;
      });
    }, 500);
  }, [adapters, addToLog]);

  const connectAdapter = useCallback((adapterId: string) => {
    const adapter = adapters.find((a) => a.id === adapterId);
    if (!adapter) return;

    setConnectionState("connected");
    setSelectedAdapter(adapterId);

    // Update adapter state
    setAdapters((prev) => prev.map((a) =>
    a.id === adapterId ?
    {
      ...a,
      isConnected: true,
      protocol: "ISO 15765" as Protocol,
      encrypted: a.type === "wifi"
    } :
    { ...a, isConnected: false }
    ));

    addToLog(`Connected to ${adapter.name} via ${adapter.type.toUpperCase()}`);
    addToLog(`Protocol negotiated: ISO 15765 (CAN)`);

    toast.success("Connection established", {
      description: `Connected to ${adapter.name} with ISO 15765 protocol`
    });
  }, [adapters, addToLog]);

  const disconnectAdapter = useCallback(() => {
    setConnectionState("disconnected");
    setSelectedAdapter(null);

    setAdapters((prev) => prev.map((a) => ({ ...a, isConnected: false })));

    addToLog("Disconnected from OBD adapter");
    toast.info("Disconnected from adapter");
  }, [addToLog]);

  const forgetAdapter = useCallback((adapterId: string) => {
    const adapter = adapters.find((a) => a.id === adapterId);
    if (!adapter) return;

    setAdapters((prev) => prev.filter((a) => a.id !== adapterId));

    if (selectedAdapter === adapterId) {
      setSelectedAdapter(null);
      setConnectionState("disconnected");
    }

    addToLog(`Forgot adapter: ${adapter.name}`);
    toast.success("Adapter forgotten", {
      description: `Removed ${adapter.name} from paired devices`
    });
  }, [adapters, selectedAdapter, addToLog]);

  const runHealthCheck = useCallback(() => {
    if (connectionState !== "connected") {
      toast.error("No adapter connected", {
        description: "Connect an adapter first to run health check"
      });
      return;
    }

    addToLog("Running OBD health check...");

    // Simulate health check
    setTimeout(() => {
      const codesCount = Math.floor(Math.random() * 5);
      addToLog(`Health check completed: ${codesCount} diagnostic codes found`);

      if (codesCount === 0) {
        toast.success("Health check passed", {
          description: "No diagnostic codes found"
        });
      } else {
        toast.info("Health check completed", {
          description: `Found ${codesCount} diagnostic codes`
        });
      }
    }, 2000);
  }, [connectionState, addToLog]);

  const sendRawCommand = useCallback(() => {
    if (!currentCommand.trim() || connectionState !== "connected") return;

    const command: RawCommand = {
      command: currentCommand,
      response: `OK\r\n41 ${Math.random().toString(16).substring(2, 8).toUpperCase()}\r\n>`,
      timestamp: new Date()
    };

    setRawCommands((prev) => [...prev, command]);
    setCurrentCommand("");
    addToLog(`Sent raw command: ${command.command}`);
  }, [currentCommand, connectionState, addToLog]);

  const exportLog = useCallback(() => {
    const logContent = connectionLog.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `obd-connection-log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Log exported", {
      description: "Connection log downloaded successfully"
    });
  }, [connectionLog]);

  const getSignalIcon = (rssi?: number) => {
    if (!rssi) return SignalZero;
    if (rssi > -50) return Signal;
    if (rssi > -70) return SignalMedium;
    return SignalZero;
  };

  const getAdapterIcon = (type: AdapterType) => {
    switch (type) {
      case "bluetooth":return BluetoothSearching;
      case "wifi":return WifiHigh;
      case "usb":return Usb;
      case "elm327":return CardSim;
      default:return Nfc;
    }
  };

  const getConnectionStateColor = (state: ConnectionState) => {
    switch (state) {
      case "connected":return "text-green-500";
      case "paired":return "text-yellow-500";
      case "scanning":return "text-blue-500";
      default:return "text-muted-foreground";
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 !w-[109px] !h-full">
            <InspectionPanel className="h-5 w-5" />
            OBD Connection
          </span>
          <div className={`text-sm font-medium !w-[46%] !h-[23px] ${getConnectionStateColor(connectionState)}`}>
            {connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}
            {isScanning && <BluetoothSearching className="inline ml-1 h-4 w-4 animate-spin" />}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex flex-wrap gap-2">
          {!isScanning ?
          <Button
            onClick={startScanning}
            variant="outline"
            size="sm"
            className="flex items-center gap-2">

              <BluetoothSearching className="h-4 w-4" />
              Start Scan
            </Button> :

          <Button
            onClick={stopScanning}
            variant="outline"
            size="sm"
            className="flex items-center gap-2">

              <MonitorOff className="h-4 w-4" />
              Stop Scan
            </Button>
          }
          
          <Button
            onClick={runHealthCheck}
            variant="outline"
            size="sm"
            disabled={connectionState !== "connected"}
            className="flex items-center gap-2">

            <MonitorCheck className="h-4 w-4" />
            Health Check
          </Button>
        </div>

        {/* Auto-reconnect Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Auto-reconnect</span>
          <Button
            variant={autoReconnect ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoReconnect(!autoReconnect)}>

            {autoReconnect ? "On" : "Off"}
          </Button>
        </div>

        {/* Adapter List */}
        <div className="space-y-2">
          {adapters.map((adapter) => {
            const SignalIcon = getSignalIcon(adapter.rssi);
            const AdapterIcon = getAdapterIcon(adapter.type);

            return (
              <Card key={adapter.id} className="bg-muted/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AdapterIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{adapter.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{adapter.type.toUpperCase()}</span>
                          {adapter.rssi &&
                          <span className="flex items-center gap-1">
                              <SignalIcon className="h-3 w-3" />
                              {adapter.rssi}dBm
                            </span>
                          }
                          {adapter.battery &&
                          <span>{adapter.battery}%</span>
                          }
                          {adapter.encrypted &&
                          <span className="text-green-400">🔒</span>
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!adapter.isPaired ?
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startPairing(adapter.id)}>

                          Pair
                        </Button> :
                      !adapter.isConnected ?
                      <Button
                        size="sm"
                        onClick={() => connectAdapter(adapter.id)}>

                          Connect
                        </Button> :

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={disconnectAdapter}>

                          Disconnect
                        </Button>
                      }
                      
                      {adapter.isPaired &&
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => forgetAdapter(adapter.id)}
                        className="text-destructive hover:text-destructive">

                          Forget
                        </Button>
                      }
                    </div>
                  </div>
                  
                  {adapter.protocol && adapter.isConnected &&
                  <div className="mt-2 text-xs text-muted-foreground">
                      Protocol: {adapter.protocol}
                    </div>
                  }
                </CardContent>
              </Card>);

          })}
        </div>

        {/* Advanced Console Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2">

          <ChevronsDownUp className="h-4 w-4" />
          {showAdvanced ? "Hide" : "Show"} Advanced Console
        </Button>

        {/* Raw Command Console */}
        {showAdvanced &&
        <Card className="bg-secondary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Raw Command Console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                placeholder="Enter AT/ELM command (e.g., ATZ, 01 05)"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendRawCommand()}
                disabled={connectionState !== "connected"}
                className="font-mono text-sm" />

                <Button
                onClick={sendRawCommand}
                disabled={!currentCommand.trim() || connectionState !== "connected"}
                size="sm">

                  Send
                </Button>
              </div>
              
              <div className="bg-background p-3 rounded border max-h-32 overflow-y-auto font-mono text-xs space-y-2">
                {rawCommands.length === 0 ?
              <div className="text-muted-foreground">No commands sent yet</div> :

              rawCommands.slice(-5).map((cmd, idx) =>
              <div key={idx} className="space-y-1">
                      <div className="text-blue-400">&gt; {cmd.command}</div>
                      <div className="text-green-400 whitespace-pre-line">{cmd.response}</div>
                    </div>
              )
              }
              </div>
            </CardContent>
          </Card>
        }

        {/* Export Log */}
        <Button
          onClick={exportLog}
          variant="outline"
          size="sm"
          className="w-full">

          Export Connection Log
        </Button>

        {/* Pairing Progress Dialog */}
        <Dialog open={pairingDialog} onOpenChange={setPairingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pairing in Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Establishing connection to OBD adapter...
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pairingProgress}%` }} />

              </div>
              <div className="text-xs text-muted-foreground">
                {pairingProgress < 50 && "Requesting Bluetooth permissions..."}
                {pairingProgress >= 50 && pairingProgress < 100 && "Authenticating device..."}
                {pairingProgress === 100 && "Pairing completed!"}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>);

}