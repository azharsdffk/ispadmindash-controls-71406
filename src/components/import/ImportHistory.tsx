import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const ImportHistory = () => {
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImports();
  }, []);

  const loadImports = async () => {
    try {
      const { data, error } = await supabase
        .from("import_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setImports(data || []);
    } catch (error) {
      console.error("Error loading imports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">سجل الاستيراد</h3>
      
      {imports.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">لا يوجد سجل استيراد</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المصدر</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">تم الاستيراد</TableHead>
              <TableHead className="text-right">فشل</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {imports.map((imp) => (
              <TableRow key={imp.id}>
                <TableCell>{imp.source}</TableCell>
                <TableCell>{imp.import_type}</TableCell>
                <TableCell>{imp.records_imported}</TableCell>
                <TableCell>{imp.records_failed}</TableCell>
                <TableCell>
                  <Badge variant={imp.status === "completed" ? "default" : imp.status === "failed" ? "destructive" : "secondary"}>
                    {imp.status === "completed" ? "مكتمل" : imp.status === "failed" ? "فشل" : "قيد المعالجة"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(imp.created_at).toLocaleString("ar-IQ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
