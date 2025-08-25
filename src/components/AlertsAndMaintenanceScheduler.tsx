"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BadgeAlert, 
  CircleAlert, 
  TriangleAlert, 
  OctagonAlert, 
  Calendar as CalendarIcon, 
  CalendarPlus, 
  CalendarDays,
  ClockAlert,
  CalendarX 
} from "lucide-react";
import { toast } from "sonner";

// Mock data types
interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  diagnosis: string;
  firstSeen: Date;
  lastOccurred: Date;
  count: number;
  snoozedUntil?: Date;
}

interface MaintenanceItem {
  id: string;
  type: "oil" | "brakes" | "inspection" | "custom";
  title: string;
  description: string;
  lastService?: Date;
  nextDue: Date;
  intervalMiles?: number;
  intervalDays?: number;
  isOverdue: boolean;
}

interface MaintenanceSchedule {
  date: Date;
  items: MaintenanceItem[];
  isRecommended: boolean;
  servicePartner?: {
    name: string;
    phone: string;
    email: string;
  };
}

// Mock data
const mockAlerts: Alert[] = [
  {
    id: "1",
    severity: "critical",
    title: "Engine Temperature Critical",
    description: "Coolant temperature exceeding safe limits",
    diagnosis: "Check coolant level, inspect for leaks. Do not drive if temperature remains high.",
    firstSeen: new Date(Date.now() - 24 * 60 * 60 * 1000),
    lastOccurred: new Date(Date.now() - 30 * 60 * 1000),
    count: 5
  },
  {
    id: "2",
    severity: "warning",
    title: "Low Tire Pressure",
    description: "Front left tire pressure below recommended",
    diagnosis: "Check tire pressure and inflate to 32 PSI. Inspect for punctures.",
    firstSeen: new Date(Date.now() - 48 * 60 * 60 * 1000),
    lastOccurred: new Date(Date.now() - 2 * 60 * 60 * 1000),
    count: 3
  },
  {
    id: "3",
    severity: "info",
    title: "Service Reminder",
    description: "Oil change due in 500 miles",
    diagnosis: "Schedule routine oil change at your earliest convenience.",
    firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastOccurred: new Date(Date.now() - 24 * 60 * 60 * 1000),
    count: 1
  }
];

const mockMaintenanceItems: MaintenanceItem[] = [
  {
    id: "1",
    type: "oil",
    title: "Oil Change",
    description: "5W-30 synthetic oil change",
    lastService: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    nextDue: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    intervalMiles: 5000,
    intervalDays: 90,
    isOverdue: false
  },
  {
    id: "2",
    type: "brakes",
    title: "Brake Inspection",
    description: "Brake pad and rotor inspection",
    lastService: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    nextDue: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    intervalDays: 180,
    isOverdue: true
  }
];

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "critical": return <OctagonAlert className="h-4 w-4" />;
    case "warning": return <TriangleAlert className="h-4 w-4" />;
    case "info": return <CircleAlert className="h-4 w-4" />;
    default: return <CircleAlert className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical": return "destructive";
    case "warning": return "secondary";
    case "info": return "outline";
    default: return "outline";
  }
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const generateCalendarFile = (date: Date, title: string, description: string) => {
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Vehicle Dashboard//Maintenance Scheduler//EN
BEGIN:VEVENT
UID:${Date.now()}@vehicledashboard.com
DTSTART:${formatDate(date)}
DTEND:${formatDate(new Date(date.getTime() + 60 * 60 * 1000))}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}_${date.toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function AlertsAndMaintenanceScheduler({ className }: { className?: string }) {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [maintenanceItems] = useState<MaintenanceItem[]>(mockMaintenanceItems);
  const [alertFilter, setAlertFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAlertsDialog, setShowAlertsDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (alertFilter === "all") return true;
      return alert.severity === alertFilter;
    });
  }, [alerts, alertFilter]);

  const criticalAlertsCount = alerts.filter(a => a.severity === "critical").length;
  const highestSeverityAlert = alerts.find(a => a.severity === "critical") || 
                               alerts.find(a => a.severity === "warning") || 
                               alerts[0];

  const snoozeAlert = useCallback((alertId: string, duration: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, snoozedUntil: new Date(Date.now() + duration * 60 * 60 * 1000) }
        : alert
    ));
    toast.success(`Alert snoozed for ${duration} hours`);
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast.success("Alert dismissed");
  }, []);

  const scheduleService = useCallback((date: Date, title: string, description: string) => {
    generateCalendarFile(date, title, description);
    toast.success("Service appointment scheduled and calendar invite created");
  }, []);

  const exportMaintenanceHistory = useCallback((format: 'ics' | 'csv') => {
    if (format === 'ics') {
      const events = maintenanceItems.map(item => ({
        date: item.nextDue,
        title: item.title,
        description: item.description
      }));
      
      // Generate ICS for all upcoming maintenance
      events.forEach(event => {
        generateCalendarFile(event.date, event.title, event.description);
      });
      toast.success("Maintenance schedule exported as ICS files");
    } else {
      // Generate CSV
      const csvContent = [
        "Type,Title,Description,Last Service,Next Due,Interval Miles,Interval Days,Status",
        ...maintenanceItems.map(item => [
          item.type,
          item.title,
          item.description,
          item.lastService?.toLocaleDateString() || "N/A",
          item.nextDue.toLocaleDateString(),
          item.intervalMiles || "N/A",
          item.intervalDays || "N/A",
          item.isOverdue ? "Overdue" : "Scheduled"
        ].join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance_schedule_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Maintenance history exported as CSV");
    }
  }, [maintenanceItems]);

  return (
    <div className={className}>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BadgeAlert className="h-5 w-5 text-primary" />
                Alerts & Maintenance
              </CardTitle>
              <CardDescription>
                System alerts and maintenance scheduling
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportMaintenanceHistory('csv')}
              >
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportMaintenanceHistory('ics')}
              >
                Export ICS
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Alert Banner */}
          <Card 
            className="bg-muted border-border cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => setShowAlertsDialog(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={criticalAlertsCount > 0 ? "destructive" : "secondary"}>
                      {alerts.length} Active
                    </Badge>
                    {criticalAlertsCount > 0 && (
                      <Badge variant="destructive">
                        {criticalAlertsCount} Critical
                      </Badge>
                    )}
                  </div>
                  {highestSeverityAlert && (
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(highestSeverityAlert.severity)}
                      <span className="text-sm font-medium">
                        {highestSeverityAlert.title}
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="alerts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-4">
              <div className="flex items-center justify-between">
                <Select value={alertFilter} onValueChange={setAlertFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Alerts</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {filteredAlerts.map((alert) => (
                  <Card key={alert.id} className="bg-muted border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {getSeverityIcon(alert.severity)}
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatRelativeTime(alert.firstSeen)}
                            </span>
                            {alert.count > 1 && (
                              <Badge variant="outline">{alert.count}x</Badge>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {alert.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {getSeverityIcon(alert.severity)}
                                  {alert.title}
                                </DialogTitle>
                                <DialogDescription>
                                  First seen {alert.firstSeen.toLocaleString()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Description</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {alert.description}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Diagnosis & Next Steps</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {alert.diagnosis}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      const date = new Date();
                                      date.setDate(date.getDate() + 1);
                                      scheduleService(date, `Service: ${alert.title}`, alert.diagnosis);
                                    }}
                                  >
                                    Schedule Service
                                  </Button>
                                  <Select onValueChange={(value) => snoozeAlert(alert.id, parseInt(value))}>
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Snooze" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1 hour</SelectItem>
                                      <SelectItem value="4">4 hours</SelectItem>
                                      <SelectItem value="24">24 hours</SelectItem>
                                      <SelectItem value="168">1 week</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => dismissAlert(alert.id)}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-muted border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarDays className="h-4 w-4" />
                      Upcoming Maintenance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {maintenanceItems.map((item) => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={item.isOverdue ? "destructive" : "secondary"}>
                              {item.type.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {item.nextDue.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              scheduleService(item.nextDue, item.title, item.description);
                            }}
                          >
                            <CalendarPlus className="h-3 w-3 mr-1" />
                            Schedule
                          </Button>
                        </div>
                        {item !== maintenanceItems[maintenanceItems.length - 1] && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-muted border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarIcon className="h-4 w-4" />
                      Service Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border-border"
                      modifiers={{
                        maintenance: maintenanceItems.map(item => item.nextDue),
                        overdue: maintenanceItems.filter(item => item.isOverdue).map(item => item.nextDue)
                      }}
                      modifiersStyles={{
                        maintenance: { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' },
                        overdue: { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Full Alerts Dialog */}
      <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Active Alerts</DialogTitle>
            <DialogDescription>
              Manage and triage all active vehicle alerts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={alertFilter} onValueChange={setAlertFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className="bg-muted border-border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {getSeverityIcon(alert.severity)}
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(alert.firstSeen)}
                          </span>
                          {alert.count > 1 && (
                            <Badge variant="outline">{alert.count}x</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Diagnosis:</strong> {alert.diagnosis}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => {
                            const date = new Date();
                            date.setDate(date.getDate() + 1);
                            scheduleService(date, `Service: ${alert.title}`, alert.diagnosis);
                          }}
                        >
                          Schedule Service
                        </Button>
                        <Select onValueChange={(value) => snoozeAlert(alert.id, parseInt(value))}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Snooze" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="4">4 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="168">1 week</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}