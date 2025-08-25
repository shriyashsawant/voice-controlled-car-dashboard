"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Scan, 
  Share2, 
  FileCheck, 
  Check, 
  ListChecks, 
  MonitorCheck,
  CopyCheck,
  BadgeCheck,
  QrCode,
  Maximize2
} from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticSystem {
  id: string;
  name: string;
  checked: boolean;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  findings?: string[];
  dtcs?: Array<{
    code: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface DiagnosticReport {
  id: string;
  timestamp: Date;
  vehicleInfo: {
    vin: string;
    make: string;
    model: string;
    year: number;
  };
  systems: DiagnosticSystem[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warningIssues: number;
  };
}

const DIAGNOSTIC_SYSTEMS: DiagnosticSystem[] = [
  {
    id: 'engine',
    name: 'Engine Management',
    checked: true,
    status: 'pending',
    progress: 0,
  },
  {
    id: 'transmission',
    name: 'Transmission',
    checked: true,
    status: 'pending',
    progress: 0,
  },
  {
    id: 'emissions',
    name: 'Emissions Control',
    checked: true,
    status: 'pending',
    progress: 0,
  },
  {
    id: 'safety',
    name: 'Safety Systems',
    checked: true,
    status: 'pending',
    progress: 0,
  },
  {
    id: 'brakes',
    name: 'Brake System',
    checked: false,
    status: 'pending',
    progress: 0,
  },
  {
    id: 'electrical',
    name: 'Electrical System',
    checked: false,
    status: 'pending',
    progress: 0,
  },
];

export default function DiagnosticReportCard() {
  const [isScanning, setIsScanning] = useState(false);
  const [systems, setSystems] = useState<DiagnosticSystem[]>(DIAGNOSTIC_SYSTEMS);
  const [currentReport, setCurrentReport] = useState<DiagnosticReport | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const toggleSystemCheck = useCallback((systemId: string) => {
    setSystems(prev => prev.map(system => 
      system.id === systemId 
        ? { ...system, checked: !system.checked }
        : system
    ));
  }, []);

  const simulateSystemScan = useCallback(async (system: DiagnosticSystem): Promise<DiagnosticSystem> => {
    // Simulate scanning process
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const mockFindings = [
      'Sensor reading nominal',
      'No fault codes detected',
      'Performance within normal parameters',
      'Minor calibration drift detected',
      'Intermittent signal variance',
    ];

    const mockDtcs = [
      { code: 'P0171', description: 'System Too Lean (Bank 1)', severity: 'medium' as const },
      { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold', severity: 'high' as const },
      { code: 'B1234', description: 'Battery Voltage Low', severity: 'low' as const },
    ];

    const hasIssues = Math.random() > 0.7;
    
    return {
      ...system,
      status: 'completed',
      progress: 100,
      findings: mockFindings.slice(0, Math.floor(Math.random() * 3) + 1),
      dtcs: hasIssues ? mockDtcs.slice(0, Math.floor(Math.random() * 2) + 1) : [],
    };
  }, []);

  const startDiagnosticScan = useCallback(async () => {
    const selectedSystems = systems.filter(s => s.checked);
    if (selectedSystems.length === 0) {
      toast.error('Please select at least one system to scan');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setEstimatedTime(selectedSystems.length * 3);

    // Reset system statuses
    setSystems(prev => prev.map(system => ({
      ...system,
      status: system.checked ? 'pending' : system.status,
      progress: 0,
      findings: undefined,
      dtcs: undefined,
    })));

    try {
      const completedSystems: DiagnosticSystem[] = [];
      
      for (let i = 0; i < selectedSystems.length; i++) {
        const system = selectedSystems[i];
        
        // Mark as running
        setSystems(prev => prev.map(s => 
          s.id === system.id ? { ...s, status: 'running' } : s
        ));

        // Simulate scan
        const completedSystem = await simulateSystemScan(system);
        completedSystems.push(completedSystem);

        // Update progress
        setScanProgress(((i + 1) / selectedSystems.length) * 100);
        setEstimatedTime(Math.max(0, (selectedSystems.length - i - 1) * 3));

        // Update system status
        setSystems(prev => prev.map(s => 
          s.id === system.id ? completedSystem : s
        ));
      }

      // Generate report
      const report: DiagnosticReport = {
        id: Date.now().toString(),
        timestamp: new Date(),
        vehicleInfo: {
          vin: '1HGBH41JXMN109186',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
        },
        systems: completedSystems,
        summary: {
          totalIssues: completedSystems.reduce((acc, s) => acc + (s.dtcs?.length || 0), 0),
          criticalIssues: completedSystems.reduce((acc, s) => 
            acc + (s.dtcs?.filter(d => d.severity === 'high').length || 0), 0),
          warningIssues: completedSystems.reduce((acc, s) => 
            acc + (s.dtcs?.filter(d => d.severity === 'medium').length || 0), 0),
        },
      };

      setCurrentReport(report);
      toast.success('Diagnostic scan completed successfully');
      
    } catch (error) {
      toast.error('Diagnostic scan failed');
      setSystems(prev => prev.map(s => ({ ...s, status: 'error' })));
    } finally {
      setIsScanning(false);
      setScanProgress(0);
      setEstimatedTime(0);
    }
  }, [systems, simulateSystemScan]);

  const cancelScan = useCallback(() => {
    setIsScanning(false);
    setScanProgress(0);
    setEstimatedTime(0);
    toast.info('Diagnostic scan cancelled - partial results saved');
  }, []);

  const exportPdf = useCallback(() => {
    if (!currentReport) return;
    
    // Simulate PDF export
    setTimeout(() => {
      toast.success('Report exported as PDF');
    }, 1000);
  }, [currentReport]);

  const shareReport = useCallback((method: 'link' | 'email') => {
    if (!currentReport || !consentGiven) return;

    if (method === 'link') {
      // Simulate generating secure link
      setTimeout(() => {
        const mockLink = `https://reports.cardiag.com/share/${currentReport.id}?expires=7d`;
        navigator.clipboard?.writeText(mockLink);
        toast.success('Secure link copied to clipboard (expires in 7 days)');
        setIsShareDialogOpen(false);
      }, 1500);
    } else if (method === 'email') {
      // Simulate email sharing
      setTimeout(() => {
        toast.success('Report sent via email');
        setIsShareDialogOpen(false);
      }, 1000);
    }
  }, [currentReport, consentGiven]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-chart-3 text-foreground';
      case 'low': return 'bg-chart-4 text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4 text-chart-5" />;
      case 'running': return <MonitorCheck className="w-4 h-4 text-primary animate-pulse" />;
      case 'error': return <div className="w-4 h-4 rounded-full bg-destructive" />;
      default: return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Diagnostic Reports</CardTitle>
            <CardDescription className="text-muted-foreground">
              Generate comprehensive vehicle system reports
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isReportViewOpen} onOpenChange={setIsReportViewOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!currentReport}
                  className="border-border hover:bg-muted"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  View Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Diagnostic Report</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {currentReport?.timestamp.toLocaleDateString()} - {currentReport?.vehicleInfo.year} {currentReport?.vehicleInfo.make} {currentReport?.vehicleInfo.model}
                  </DialogDescription>
                </DialogHeader>
                
                {currentReport && (
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="bg-muted border-border">
                      <TabsTrigger value="summary" className="data-[state=active]:bg-background">Summary</TabsTrigger>
                      <TabsTrigger value="systems" className="data-[state=active]:bg-background">Systems</TabsTrigger>
                      <TabsTrigger value="dtcs" className="data-[state=active]:bg-background">DTCs</TabsTrigger>
                      <TabsTrigger value="recommendations" className="data-[state=active]:bg-background">Recommendations</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <Card className="bg-muted/50 border-border">
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-foreground">{currentReport.summary.totalIssues}</div>
                            <div className="text-sm text-muted-foreground">Total Issues</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50 border-border">
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-destructive">{currentReport.summary.criticalIssues}</div>
                            <div className="text-sm text-muted-foreground">Critical</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50 border-border">
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-chart-3">{currentReport.summary.warningIssues}</div>
                            <div className="text-sm text-muted-foreground">Warnings</div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">Vehicle Information</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>VIN: {currentReport.vehicleInfo.vin}</div>
                          <div>Vehicle: {currentReport.vehicleInfo.year} {currentReport.vehicleInfo.make} {currentReport.vehicleInfo.model}</div>
                          <div>Scan Date: {currentReport.timestamp.toLocaleString()}</div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="systems" className="space-y-4">
                      {currentReport.systems.map((system) => (
                        <Card key={system.id} className="bg-muted/50 border-border">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(system.status)}
                              <CardTitle className="text-base text-foreground">{system.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {system.findings && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Findings:</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {system.findings.map((finding, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <Check className="w-3 h-3 mt-0.5 text-chart-5 flex-shrink-0" />
                                      {finding}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="dtcs" className="space-y-4">
                      {currentReport.systems
                        .filter(system => system.dtcs && system.dtcs.length > 0)
                        .map((system) => (
                          <Card key={system.id} className="bg-muted/50 border-border">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base text-foreground">{system.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                              {system.dtcs?.map((dtc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded bg-background border-border border">
                                  <div>
                                    <div className="font-mono text-sm text-foreground">{dtc.code}</div>
                                    <div className="text-sm text-muted-foreground">{dtc.description}</div>
                                  </div>
                                  <Badge className={getSeverityColor(dtc.severity)}>
                                    {dtc.severity}
                                  </Badge>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        ))}
                    </TabsContent>
                    
                    <TabsContent value="recommendations" className="space-y-4">
                      <Card className="bg-muted/50 border-border">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-foreground mb-3">Recommended Actions</h3>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <BadgeCheck className="w-4 h-4 mt-0.5 text-chart-5 flex-shrink-0" />
                              Schedule routine maintenance within 500 miles
                            </li>
                            <li className="flex items-start gap-2">
                              <BadgeCheck className="w-4 h-4 mt-0.5 text-chart-3 flex-shrink-0" />
                              Address P0420 catalyst efficiency issue
                            </li>
                            <li className="flex items-start gap-2">
                              <BadgeCheck className="w-4 h-4 mt-0.5 text-chart-4 flex-shrink-0" />
                              Monitor battery voltage levels
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </DialogContent>
            </Dialog>
            
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!currentReport}
                  className="border-border hover:bg-muted"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Share Diagnostic Report</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Choose how you'd like to share this report
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <Card className="bg-muted/50 border-border p-4">
                    <h4 className="font-medium text-foreground mb-2">Privacy Notice</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Sharing will upload anonymized vehicle diagnostic data to secure cloud storage. 
                      Personal information like VIN will be masked unless explicitly included.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="consent" 
                        checked={consentGiven}
                        onCheckedChange={(checked) => setConsentGiven(!!checked)}
                      />
                      <label htmlFor="consent" className="text-sm text-foreground">
                        I consent to sharing anonymized diagnostic data
                      </label>
                    </div>
                  </Card>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => shareReport('link')}
                      disabled={!consentGiven}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate Link
                    </Button>
                    <Button 
                      onClick={() => shareReport('email')}
                      disabled={!consentGiven}
                      variant="outline"
                      className="border-border hover:bg-muted"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      Email Report
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={exportPdf}
                    variant="outline" 
                    className="w-full border-border hover:bg-muted"
                  >
                    <CopyCheck className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="bg-muted border-border">
            <TabsTrigger value="scan" className="data-[state=active]:bg-background">Quick Scan</TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-background">Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scan" className="space-y-4">
            <Card className="bg-muted/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground">Select Systems to Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systems.map((system) => (
                  <div key={system.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={system.id}
                      checked={system.checked}
                      onCheckedChange={() => toggleSystemCheck(system.id)}
                      disabled={isScanning}
                    />
                    <label
                      htmlFor={system.id}
                      className="text-sm font-medium text-foreground flex-1 cursor-pointer"
                    >
                      {system.name}
                    </label>
                    {getStatusIcon(system.status)}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button 
                onClick={startDiagnosticScan}
                disabled={isScanning || systems.filter(s => s.checked).length === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Scan className="w-4 h-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Start Diagnostic Scan'}
              </Button>
              {isScanning && (
                <Button 
                  onClick={cancelScan}
                  variant="outline"
                  className="border-border hover:bg-muted"
                >
                  Cancel
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="progress" className="space-y-4">
            {isScanning && (
              <Card className="bg-muted/50 border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Overall Progress</span>
                    <span className="text-muted-foreground">{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    Estimated time remaining: {Math.floor(estimatedTime / 60)}:{(estimatedTime % 60).toString().padStart(2, '0')}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-3">
              {systems
                .filter(system => system.checked)
                .map((system) => (
                  <Card key={system.id} className="bg-muted/50 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(system.status)}
                          <span className="font-medium text-foreground">{system.name}</span>
                        </div>
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {system.status}
                        </Badge>
                      </div>
                      
                      {system.status === 'running' && (
                        <Progress value={system.progress} className="h-1" />
                      )}
                      
                      {system.findings && system.findings.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground mb-1">Latest findings:</div>
                          <div className="text-sm text-foreground">
                            {system.findings[system.findings.length - 1]}
                          </div>
                        </div>
                      )}
                      
                      {system.dtcs && system.dtcs.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {system.dtcs.map((dtc, idx) => (
                            <Badge key={idx} className={getSeverityColor(dtc.severity)} >
                              {dtc.code}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {currentReport && !isScanning && (
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">Latest Report</div>
                  <div className="text-sm text-muted-foreground">
                    {currentReport.timestamp.toLocaleDateString()} - {currentReport.summary.totalIssues} issues found
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsReportViewOpen(true)}
                    className="border-border hover:bg-muted"
                  >
                    <ListChecks className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}