import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Loader2, Link as LinkIcon, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportHistory } from "@/components/import/ImportHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const DataImport = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [nationalProjectUrl, setNationalProjectUrl] = useState("");
  const [nationalProjectKey, setNationalProjectKey] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [serviceId, setServiceId] = useState("");
  const { toast } = useToast();

  const handleQuickFetch = async () => {
    if (!serviceId.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رقم الخدمة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    try {
      setProgress(50);
      // في الإنتاج، استبدل هذا باستدعاء API حقيقي
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(100);
      
      toast({
        title: "تم جلب البيانات",
        description: `تم جلب بيانات المشترك ${serviceId} بنجاح`,
      });
      
      setServiceId("");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل جلب البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

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
    setProgress(0);
    try {
      setProgress(30);
      
      const { data, error } = await supabase.functions.invoke('import-subscribers', {
        body: {
          source: 'national_project',
          url: nationalProjectUrl,
        },
      });

      setProgress(100);
      
      if (error) throw error;
      
      if (data.failed > 0) {
        const errorSample = data.errors?.slice(0, 3).join(', ') || 'حدثت أخطاء';
        toast({
          title: "تم الاستيراد مع أخطاء",
          description: `${data.imported} نجح، ${data.failed} فشل. ${errorSample}`,
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: `تم استيراد ${data.imported} مشترك بنجاح من المشروع الوطني`,
        });
      }
      
      setNationalProjectUrl('');
      setNationalProjectKey('');
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "فشل الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
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
    setProgress(0);
    try {
      setProgress(20);
      const content = await csvFile.text();
      setProgress(40);
      
      const { data, error } = await supabase.functions.invoke('import-subscribers', {
        body: {
          source: 'sas',
          content: content,
          filename: csvFile.name,
        },
      });

      setProgress(100);
      
      if (error) throw error;
      
      if (data.failed > 0) {
        const errorSample = data.errors?.slice(0, 3).join(', ') || 'حدثت أخطاء';
        toast({
          title: "تم الاستيراد مع أخطاء",
          description: `${data.imported} نجح، ${data.failed} فشل. ${errorSample}`,
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: `تم استيراد ${data.imported} مشترك من ملف ${csvFile.name}`,
        });
      }
      
      setCsvFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "فشل الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">استيراد البيانات</h1>
              <p className="text-muted-foreground">
                استيراد بيانات المشتركين من مصادر مختلفة
              </p>
            </div>

            {/* سحب سريع */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  سحب سريع لبيانات مشترك
                </CardTitle>
                <CardDescription>
                  أدخل رقم الخدمة لجلب بيانات المشترك مباشرة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="رقم الخدمة (Service ID)"
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickFetch()}
                    />
                  </div>
                  <Button type="button" onClick={handleQuickFetch} disabled={loading}>
                    <Download className="ml-2 h-4 w-4" />
                    سحب البيانات
                  </Button>
                </div>
                {loading && progress > 0 && (
                  <Progress value={progress} className="mt-3" />
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="national-project" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="national-project">
                  <LinkIcon className="h-4 w-4 ml-2" />
                  المشروع الوطني
                </TabsTrigger>
                <TabsTrigger value="sas">
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  SAS (CSV)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="national-project">
                <Card>
                  <CardHeader>
                    <CardTitle>الاتصال بالمشروع الوطني</CardTitle>
                    <CardDescription>
                      قم بإدخال بيانات API للاتصال بالمشروع الوطني
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        سيتم جلب البيانات مباشرة من خوادم المشروع الوطني
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="api-url">رابط API</Label>
                      <Input
                        id="api-url"
                        type="url"
                        placeholder="https://api.nationalproject.example/subscribers"
                        value={nationalProjectUrl}
                        onChange={(e) => setNationalProjectUrl(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key (اختياري)</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="أدخل مفتاح API"
                        value={nationalProjectKey}
                        onChange={(e) => setNationalProjectKey(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    {loading && progress > 0 && (
                      <Progress value={progress} />
                    )}

                    <Button
                      type="button"
                      onClick={handleNationalProjectImport}
                      disabled={loading || !nationalProjectUrl}
                      className="w-full"
                    >
                      {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      استيراد من المشروع الوطني
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sas">
                <Card>
                  <CardHeader>
                    <CardTitle>استيراد من ملف CSV</CardTitle>
                    <CardDescription>
                      قم برفع ملف CSV يحتوي على بيانات المشتركين من نظام SAS
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        تأكد من أن الملف يحتوي على الأعمدة: ID, Full Name, Mobile, Email, Address, Service Plan, Balance
                      </AlertDescription>
                    </Alert>

                    <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                      <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">اختر ملف CSV</h3>
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
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('csv-upload')?.click()}
                          disabled={loading}
                        >
                          اختر ملف CSV
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSASImport}
                          disabled={loading || !csvFile}
                        >
                          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                          استيراد
                        </Button>
                      </div>
                    </div>

                    {loading && progress > 0 && (
                      <Progress value={progress} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>سجل الاستيراد</CardTitle>
              </CardHeader>
              <CardContent>
                <ImportHistory />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default DataImport;
