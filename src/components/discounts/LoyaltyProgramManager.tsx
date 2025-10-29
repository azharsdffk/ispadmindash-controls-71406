import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const LoyaltyProgramManager = () => {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>برنامج الولاء</CardTitle>
        <Button>
          <Settings className="h-4 w-4 ml-2" />
          إعدادات
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          قريباً... سيتم إضافة نظام نقاط الولاء
        </div>
      </CardContent>
    </Card>
  );
};
