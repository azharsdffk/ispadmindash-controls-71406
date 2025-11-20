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
  const [sasUrl, setSasUrl] = useState("");
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
        description: "الرجاء إدخال رابط الصفحة",
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

  const handleSASFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleSASImportWithContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleSASImportWithContent = async (content: string, filename: string) => {
    setLoading(true);
    setProgress(0);
    try {
      setProgress(30);
      const { data, error } = await supabase.functions.invoke('import-subscribers', {
        body: {
          source: 'file',
          content,
          filename,
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
          description: `تم استيراد ${data.imported} مشترك بنجاح من الملف`,
        });
      }
    } catch (error: any) {
      console.error('File import error:', error);
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || 'حدث خطأ أثناء استيراد الملف',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleSASImport = async () => {
    if (!sasUrl) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رابط API للبيانات",
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
          source: 'sas',
          url: sasUrl,
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
          description: `تم استيراد ${data.imported} مشترك بنجاح من SAS`,
        });
      }
      
      setSasUrl('');
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
                    <CardTitle>استيراد من المشروع الوطني</CardTitle>
                    <CardDescription>
                      أدخل رابط صفحة المشروع الوطني لسحب بيانات المشتركين تلقائياً
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        سيتم سحب جميع بيانات المشتركين من الصفحة المدخلة تلقائياً
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="national-url">رابط صفحة المشروع الوطني</Label>
                      <Input
                        id="national-url"
                        type="url"
                        placeholder="https://nationalproject.example.com/subscribers"
                        value={nationalProjectUrl}
                        onChange={(e) => setNationalProjectUrl(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-sm text-muted-foreground">
                        ملاحظة: إذا كانت الصفحة تتطلب تسجيل دخول أو تستخدم JavaScript لتحميل البيانات، 
                        قد تحتاج لتصدير البيانات كملف CSV واستيرادها بدلاً من استخدام الرابط المباشر.
                      </p>
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
                      سحب البيانات من المشروع الوطني
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sas">
                <Card>
                  <CardHeader>
                    <CardTitle>استيراد من SAS</CardTitle>
                    <CardDescription>
                      أدخل رابط صفحة SAS لسحب بيانات المشتركين تلقائياً
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        سيتم سحب جميع بيانات المشتركين من الصفحة المدخلة تلقائياً
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertDescription className="text-sm space-y-2">
                          <p className="font-semibold">📡 كيف تحصل على رابط API من صفحة SAS:</p>
                          <ol className="list-decimal mr-5 space-y-1 text-xs">
                            <li>افتح صفحة SAS في المتصفح</li>
                            <li>اضغط F12 لفتح Developer Tools</li>
                            <li>اذهب لتبويب Network</li>
                            <li>حدّث الصفحة وابحث عن طلب API يُرجع بيانات المشتركين</li>
                            <li>انسخ رابط الطلب (Request URL) والصقه هنا</li>
                          </ol>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label htmlFor="sas-url">رابط API للسحب المباشر من الويب</Label>
                        <Input
                          id="sas-url"
                          type="url"
                          placeholder="https://api.sas.com/v1/subscribers?format=json"
                          value={sasUrl}
                          onChange={(e) => setSasUrl(e.target.value)}
                          disabled={loading}
                          dir="ltr"
                        />
                        <p className="text-xs text-muted-foreground">
                          الصق رابط API الذي حصلت عليه من Developer Tools
                        </p>
                      </div>
                      
                      <div className="border-t pt-4 space-y-2">
                        <Label htmlFor="sas-file">البديل: ارفع ملف CSV</Label>
                        <Input
                          id="sas-file"
                          type="file"
                          accept=".csv,.xlsx"
                          onChange={handleSASFileUpload}
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                          إذا لم تتمكن من الحصول على رابط API، صدّر البيانات كـ CSV
                        </p>
                      </div>
                    </div>

                    {loading && progress > 0 && (
                      <Progress value={progress} />
                    )}

                    <Button
                      type="button"
                      onClick={handleSASImport}
                      disabled={loading || !sasUrl}
                      className="w-full"
                    >
                      {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      سحب البيانات من SAS
                    </Button>
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
