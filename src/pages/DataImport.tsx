import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Loader2, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportHistory } from "@/components/import/ImportHistory";
import { importFromNationalProject } from "@/services/importers/nationalProject";
import { importFromSAS } from "@/services/importers/sas";

const DataImport = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nationalProjectUrl, setNationalProjectUrl] = useState("");
  const [nationalProjectKey, setNationalProjectKey] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleNationalProjectImport = async () => {
    if (!nationalProjectUrl) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رابط API",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const results = await importFromNationalProject(nationalProjectUrl, nationalProjectKey);
      
      if (results.failed === -1) {
        toast({
          title: "فشل الاستيراد",
          description: results.errors.join(', '),
          variant: "destructive",
        });
      } else if (results.errors.length > 0) {
        toast({
          title: "تم الاستيراد مع أخطاء",
          description: `${results.success} نجح، ${results.failed} فشل`,
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: `تم استيراد ${results.success} مشترك بنجاح`,
        });
      }
      
      setNationalProjectUrl('');
      setNationalProjectKey('');
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSASImport = async () => {
    if (!csvFile) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار ملف CSV",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const csvText = await csvFile.text();
      const results = await importFromSAS(csvText);
      
      if (results.failed === -1) {
        toast({
          title: "فشل الاستيراد",
          description: results.errors.join(', '),
          variant: "destructive",
        });
      } else if (results.errors.length > 0) {
        toast({
          title: "تم الاستيراد مع أخطاء",
          description: `${results.success} نجح، ${results.failed} فشل`,
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: `تم استيراد ${results.success} مشترك بنجاح`,
        });
      }
      
      setCsvFile(null);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-foreground">استيراد البيانات</h1>

            <Tabs defaultValue="national-project" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="national-project">
                  <LinkIcon className="h-4 w-4 ml-2" />
                  National Project
                </TabsTrigger>
                <TabsTrigger value="sas">
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  SAS (CSV)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="national-project">
                <Card className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="api-url">رابط API للمشروع الوطني</Label>
                    <Input
                      id="api-url"
                      type="url"
                      placeholder="https://api.nationalproject.example/subscribers"
                      value={nationalProjectUrl}
                      onChange={(e) => setNationalProjectUrl(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-key">API Key (اختياري)</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter API key if required"
                      value={nationalProjectKey}
                      onChange={(e) => setNationalProjectKey(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    onClick={handleNationalProjectImport}
                    disabled={loading || !nationalProjectUrl}
                    className="w-full"
                  >
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    استيراد من National Project
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="sas">
                <Card className="p-6">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">اختر ملف CSV من SAS</h3>
                      <p className="text-sm text-muted-foreground">
                        الأعمدة المطلوبة: ID, Full Name, Mobile, Email, Address, Service Plan, Balance
                      </p>
                      {csvFile && (
                        <p className="text-sm text-primary mt-2">
                          الملف المحدد: {csvFile.name}
                        </p>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      id="csv-upload"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      disabled={loading}
                    />
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('csv-upload')?.click()}
                        disabled={loading}
                      >
                        اختر ملف CSV
                      </Button>
                      <Button
                        onClick={handleSASImport}
                        disabled={loading || !csvFile}
                      >
                        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        استيراد
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="p-6">
              <ImportHistory />
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default DataImport;
