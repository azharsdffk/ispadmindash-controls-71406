import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportHistory } from "@/components/import/ImportHistory";

const DataImport = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nationalProjectUrl, setNationalProjectUrl] = useState("");
  const [sasUrl, setSasUrl] = useState("");
  const { toast } = useToast();

  const handleImportFromUrl = async (source: string, url: string) => {
    if (!url) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط الصفحة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Call edge function to import data
      const { data, error } = await supabase.functions.invoke("import-subscribers", {
        body: { source, url },
      });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: `تم استيراد ${data.imported} مشترك من ${source}`,
      });

      // Clear input
      if (source === "national_project") {
        setNationalProjectUrl("");
      } else {
        setSasUrl("");
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل استيراد البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Call edge function to process CSV/Excel
        const { data, error } = await supabase.functions.invoke("import-subscribers", {
          body: { 
            source: "file",
            content,
            filename: file.name,
          },
        });

        if (error) throw error;

        toast({
          title: "تم بنجاح",
          description: `تم استيراد ${data.imported} مشترك من الملف`,
        });
      };

      reader.readAsText(file);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل استيراد الملف",
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

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">استيراد من رابط</TabsTrigger>
                <TabsTrigger value="file">استيراد من ملف</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">المشروع الوطني</h3>
                      <div className="space-y-2">
                        <Label htmlFor="nationalProject">رابط صفحة المشروع الوطني</Label>
                        <div className="flex gap-2">
                          <Input
                            id="nationalProject"
                            value={nationalProjectUrl}
                            onChange={(e) => setNationalProjectUrl(e.target.value)}
                            placeholder="https://example.com/subscribers"
                            disabled={loading}
                          />
                          <Button
                            onClick={() => handleImportFromUrl("national_project", nationalProjectUrl)}
                            disabled={loading || !nationalProjectUrl}
                          >
                            <Download className="ml-2 h-4 w-4" />
                            استيراد
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">نظام SAS</h3>
                      <div className="space-y-2">
                        <Label htmlFor="sas">رابط صفحة SAS</Label>
                        <div className="flex gap-2">
                          <Input
                            id="sas"
                            value={sasUrl}
                            onChange={(e) => setSasUrl(e.target.value)}
                            placeholder="https://sas.example.com/data"
                            disabled={loading}
                          />
                          <Button
                            onClick={() => handleImportFromUrl("sas", sasUrl)}
                            disabled={loading || !sasUrl}
                          >
                            <Download className="ml-2 h-4 w-4" />
                            استيراد
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="file">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">استيراد من ملف Excel أو CSV</h3>
                      <div className="space-y-2">
                        <Label htmlFor="file">اختر ملف</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="file"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileImport}
                            disabled={loading}
                          />
                          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          يجب أن يحتوي الملف على الأعمدة: الاسم، الهاتف، العنوان، البريد الإلكتروني (اختياري)
                        </p>
                      </div>
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
