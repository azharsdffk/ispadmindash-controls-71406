import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const PromotionalOffersManager = () => {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>العروض الترويجية</CardTitle>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة عرض
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قريباً... سيتم إضافة نظام العروض الترويجية
        </div>
      </CardContent>
    </Card>
  );
};
