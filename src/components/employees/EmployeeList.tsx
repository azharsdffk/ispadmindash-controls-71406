import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Ban, CheckCircle } from "lucide-react";

export const EmployeeList = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles and roles separately for each employee
      const employeesWithDetails = await Promise.all(
        (data || []).map(async (employee) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone, username")
            .eq("id", employee.user_id)
            .single();

          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", employee.user_id)
            .single();

          return {
            ...employee,
            profiles: profile,
            user_roles: role,
          };
        })
      );

      setEmployees(employeesWithDetails);
    } catch (error: any) {
      console.error("Error loading employees:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل بيانات الموظفين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const toggleEmployeeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: `تم ${!currentStatus ? "تفعيل" : "تعطيل"} الموظف`,
      });

      loadEmployees();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحديث حالة الموظف",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">قائمة الموظفين</h2>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">رقم الموظف</TableHead>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">اسم المستخدم</TableHead>
            <TableHead className="text-right">الهاتف</TableHead>
            <TableHead className="text-right">المنصب</TableHead>
            <TableHead className="text-right">الصلاحية</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.employee_code}</TableCell>
              <TableCell>{employee.full_name}</TableCell>
              <TableCell>{employee.profiles?.username || "-"}</TableCell>
              <TableCell>{employee.phone}</TableCell>
              <TableCell>{employee.position || "-"}</TableCell>
              <TableCell>
                <Badge variant={employee.user_roles?.role === "admin" ? "default" : "secondary"}>
                  {employee.user_roles?.role === "admin" ? "مدير" : 
                   employee.user_roles?.role === "accountant" ? "محاسب" : "فني"}
                </Badge>
              </TableCell>
              <TableCell>
                {employee.active ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="ml-1 h-3 w-3" />
                    نشط
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <Ban className="ml-1 h-3 w-3" />
                    معطل
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={employee.active ? "destructive" : "default"}
                  onClick={() => toggleEmployeeStatus(employee.id, employee.active)}
                >
                  {employee.active ? "تعطيل" : "تفعيل"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {employees.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          لا يوجد موظفين حالياً
        </div>
      )}
    </div>
  );
};
