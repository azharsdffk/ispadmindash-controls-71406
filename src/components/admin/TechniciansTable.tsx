import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX, Eye } from 'lucide-react';

export const TechniciansTable = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      // Get all users with technician role
      const { data: techRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'technician');

      if (!techRoles) return;

      const techIds = techRoles.map(r => r.user_id);

      // Get profiles and login info
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', techIds);

      // Get ticket stats for each technician
      const techsWithStats = await Promise.all(
        (profiles || []).map(async (tech) => {
          const { count: completedCount } = await supabase
            .from('maintenance_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('technician_id', tech.id)
            .eq('status', 'closed');

          const { count: ongoingCount } = await supabase
            .from('maintenance_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('technician_id', tech.id)
            .in('status', ['open', 'in_progress']);

          return {
            ...tech,
            completedTickets: completedCount || 0,
            ongoingTickets: ongoingCount || 0,
          };
        })
      );

      setTechnicians(techsWithStats);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">إدارة الفنيين</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>التذاكر المنجزة</TableHead>
                <TableHead>التذاكر الجارية</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">{tech.full_name}</TableCell>
                  <TableCell>{tech.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      {tech.completedTickets}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                      {tech.ongoingTickets}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(tech.created_at).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      <UserCheck className="h-3 w-3 ml-1" />
                      نشط
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="bg-primary text-white hover:bg-primary/90">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
