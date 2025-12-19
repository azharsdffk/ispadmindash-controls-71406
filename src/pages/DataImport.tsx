import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Loader2, Link as LinkIcon, Search, Globe, Database, CheckCircle2, User, Lock, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportHistory } from "@/components/import/ImportHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { smartSearch, type Subscriber } from "@/services/api/subscriberSearch";

const DataImport = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [nationalProjectUrl, setNationalProjectUrl] = useState("");
  const [sasUrl, setSasUrl] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);
  const [subscriberResult, setSubscriberResult] = useState<Subscriber | null>(null);
  
  // SAS credentials
  const [sasUsername, setSasUsername] = useState("");
  const [sasPassword, setSasPassword] = useState("");
  
  // National Project credentials
  const [nationalUsername, setNationalUsername] = useState("");
  const [nationalPassword, setNationalPassword] = useState("");
  
  const { toast } = useToast();

  const handleQuickFetch = async () => {
    if (!serviceId.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رقم الخدمة أو رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setImportResult(null);
    setSubscriberResult(null);
    
    try {
      setProgress(30);
      
      const result = await smartSearch(serviceId.trim());
      
      setProgress(100);
      
      if (result.success && result.subscriber) {
        setSubscriberResult(result.subscriber);
        toast({
          title: "تم جلب البيانات ✅",
          description: `تم العثور على المشترك: ${result.subscriber.name}`,
        });
      } else if (result.success && result.subscribers && result.subscribers.length > 0) {
        // Multiple results - take the first one
        setSubscriberResult(result.subscribers[0]);
        toast({
          title: "تم جلب البيانات ✅",
          description: `تم العثور على ${result.count} مشترك`,
        });
      } else {
        toast({
          title: "لم يتم العثور",
          description: result.error || "لم يتم العثور على مشترك بهذا الرقم",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل جلب البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleUrlImport = async (source: 'sas' | 'national_project', url: string) => {
    if (!url.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء لصق رابط الصفحة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setImportResult(null);
    
    try {
      setProgress(20);
      toast({
        title: "جاري السحب...",
        description: source === 'sas' 
          ? "يتم سحب البيانات من SAS باستخدام Firecrawl..." 
          : "يتم تحليل الصفحة واستخراج بيانات المشتركين",
      });
      
      setProgress(40);
      
      // Use Firecrawl for SAS (SPA), regular import for national project
      const functionName = source === 'sas' ? 'firecrawl-scrape' : 'import-subscribers';
      const body = source === 'sas' 
        ? { url: url.trim() }
        : { source, url: url.trim() };
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      setProgress(100);
      
      if (error) throw error;
      
      if (!data.success && data.error) {
        throw new Error(data.error);
      }
      
      const result = data.data || data;
      setImportResult({ imported: result.imported, failed: result.failed });
      
      if (result.imported > 0) {
        toast({
          title: "تم السحب بنجاح! ✅",
          description: `تم استيراد ${result.imported} مشترك${result.failed > 0 ? ` (${result.failed} فشل)` : ''}`,
        });
      } else if (result.failed > 0) {
        const errorSample = result.errors?.slice(0, 2).join(', ') || 'حدثت أخطاء';
        toast({
          title: "فشل الاستيراد",
          description: errorSample,
          variant: "destructive",
        });
      } else {
        toast({
          title: "لم يتم العثور على بيانات",
          description: "تأكد من صحة الرابط أو جرب تصدير CSV",
          variant: "destructive",
        });
      }
      
      if (source === 'sas') {
        setSasUrl('');
      } else {
        setNationalProjectUrl('');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "خطأ في السحب",
        description: error.message || "فشل الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
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
    setImportResult(null);
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

      setImportResult({ imported: data.imported, failed: data.failed });

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
      setTimeout(() => setProgress(0), 1000);
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
              <h1 className="text-3xl font-bold mb-2">سحب البيانات</h1>
              <p className="text-muted-foreground">
                سحب بيانات المشتركين تلقائياً من صفحات الساس والمشروع الوطني
              </p>
            </div>

            {/* نتيجة الاستيراد */}
            {importResult && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>تم السحب:</strong> {importResult.imported} مشترك بنجاح
                  {importResult.failed > 0 && ` | ${importResult.failed} فشل`}
                </AlertDescription>
              </Alert>
            )}

            {/* سحب سريع */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  سحب سريع لبيانات مشترك
                </CardTitle>
                <CardDescription>
                  أدخل رقم الخدمة أو رقم الهاتف لجلب بيانات المشترك مباشرة من قاعدة البيانات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="رقم الخدمة (Service ID) أو رقم الهاتف"
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickFetch()}
                    />
                  </div>
                  <Button type="button" onClick={handleQuickFetch} disabled={loading}>
                    {loading ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="ml-2 h-4 w-4" />
                    )}
                    بحث
                  </Button>
                </div>
                {loading && progress > 0 && (
                  <Progress value={progress} />
                )}
                
                {/* عرض نتيجة البحث */}
                {subscriberResult && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">بيانات المشترك</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">الاسم:</span>
                        <p className="font-medium">{subscriberResult.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الهاتف:</span>
                        <p className="font-medium" dir="ltr">{subscriberResult.phone}</p>
                      </div>
                      {subscriberResult.username && (
                        <div>
                          <span className="text-muted-foreground">رقم الخدمة:</span>
                          <p className="font-medium">{subscriberResult.username}</p>
                        </div>
                      )}
                      {subscriberResult.plan && (
                        <div>
                          <span className="text-muted-foreground">الباقة:</span>
                          <p className="font-medium">{subscriberResult.plan}</p>
                        </div>
                      )}
                      {subscriberResult.balance !== undefined && (
                        <div>
                          <span className="text-muted-foreground">الرصيد:</span>
                          <p className="font-medium">{subscriberResult.balance?.toLocaleString()} د.ع</p>
                        </div>
                      )}
                      {subscriberResult.address && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">العنوان:</span>
                          <p className="font-medium">{subscriberResult.address}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSubscriberResult(null);
                          setServiceId("");
                        }}
                      >
                        بحث جديد
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="sas-url" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sas-url">
                  <Globe className="h-4 w-4 ml-2" />
                  سحب من رابط SAS
                </TabsTrigger>
                <TabsTrigger value="national-project">
                  <LinkIcon className="h-4 w-4 ml-2" />
                  المشروع الوطني
                </TabsTrigger>
                <TabsTrigger value="csv-file">
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  ملف CSV
                </TabsTrigger>
              </TabsList>

              {/* سحب من رابط SAS */}
              <TabsContent value="sas-url">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-500" />
                      سحب المشتركين من صفحة SAS
                    </CardTitle>
                    <CardDescription>
                      الصق رابط صفحة المشتركين من نظام SAS وسيتم سحب جميع البيانات تلقائياً
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        <strong>كيفية الاستخدام:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>افتح صفحة المشتركين في نظام SAS</li>
                          <li>انسخ رابط الصفحة من شريط العنوان</li>
                          <li>الصق الرابط هنا واضغط "سحب البيانات"</li>
                        </ol>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sas-username" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          اسم المستخدم
                        </Label>
                        <Input
                          id="sas-username"
                          placeholder="أدخل اسم المستخدم"
                          value={sasUsername}
                          onChange={(e) => setSasUsername(e.target.value)}
                          disabled={loading}
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sas-password" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          كلمة المرور
                        </Label>
                        <Input
                          id="sas-password"
                          type="password"
                          placeholder="أدخل كلمة المرور"
                          value={sasPassword}
                          onChange={(e) => setSasPassword(e.target.value)}
                          disabled={loading}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sas-url">رابط صفحة SAS</Label>
                      <Textarea
                        id="sas-url"
                        placeholder="الصق رابط صفحة المشتركين هنا..."
                        value={sasUrl}
                        onChange={(e) => setSasUrl(e.target.value)}
                        disabled={loading}
                        className="min-h-[80px] font-mono text-sm"
                        dir="ltr"
                      />
                    </div>

                    {loading && progress > 0 && (
                      <div className="space-y-2">
                        <Progress value={progress} />
                        <p className="text-sm text-muted-foreground text-center">
                          جاري تحليل الصفحة واستخراج البيانات...
                        </p>
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={() => handleUrlImport('sas', sasUrl)}
                      disabled={loading || !sasUrl.trim()}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="ml-2 h-5 w-5" />
                      )}
                      سحب جميع المشتركين من SAS
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* المشروع الوطني */}
              <TabsContent value="national-project">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-green-500" />
                      سحب المشتركين من المشروع الوطني
                    </CardTitle>
                    <CardDescription>
                      الصق رابط صفحة المشتركين من المشروع الوطني وسيتم سحب جميع البيانات تلقائياً
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                      <Globe className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-sm">
                        <strong>كيفية الاستخدام:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>افتح صفحة المشتركين في المشروع الوطني</li>
                          <li>انسخ رابط الصفحة من شريط العنوان</li>
                          <li>الصق الرابط هنا واضغط "سحب البيانات"</li>
                        </ol>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="national-username" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          اسم المستخدم
                        </Label>
                        <Input
                          id="national-username"
                          placeholder="أدخل اسم المستخدم"
                          value={nationalUsername}
                          onChange={(e) => setNationalUsername(e.target.value)}
                          disabled={loading}
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="national-password" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          كلمة المرور
                        </Label>
                        <Input
                          id="national-password"
                          type="password"
                          placeholder="أدخل كلمة المرور"
                          value={nationalPassword}
                          onChange={(e) => setNationalPassword(e.target.value)}
                          disabled={loading}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="national-url">رابط صفحة المشروع الوطني</Label>
                      <Textarea
                        id="national-url"
                        placeholder="الصق رابط صفحة المشتركين هنا..."
                        value={nationalProjectUrl}
                        onChange={(e) => setNationalProjectUrl(e.target.value)}
                        disabled={loading}
                        className="min-h-[80px] font-mono text-sm"
                        dir="ltr"
                      />
                    </div>

                    {loading && progress > 0 && (
                      <div className="space-y-2">
                        <Progress value={progress} />
                        <p className="text-sm text-muted-foreground text-center">
                          جاري تحليل الصفحة واستخراج البيانات...
                        </p>
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={() => handleUrlImport('national_project', nationalProjectUrl)}
                      disabled={loading || !nationalProjectUrl.trim()}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="ml-2 h-5 w-5" />
                      )}
                      سحب جميع المشتركين من المشروع الوطني
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ملف CSV */}
              <TabsContent value="csv-file">
                <Card>
                  <CardHeader>
                    <CardTitle>استيراد من ملف CSV</CardTitle>
                    <CardDescription>
                      ارفع ملف CSV يحتوي على بيانات المشتركين
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <FileSpreadsheet className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>تنسيق الملف:</strong> يجب أن يحتوي على أعمدة: name, phone, email, address, plan
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="csv-file">ملف CSV</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleSASFileUpload}
                        disabled={loading}
                      />
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
