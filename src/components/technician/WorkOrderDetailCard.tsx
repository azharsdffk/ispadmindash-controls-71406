import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Clock,
  Wrench,
  User,
  Navigation,
  AlertTriangle,
  FileText,
  Play,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface WorkOrder {
  id: string;
  ticket_number: string;
  issue_description: string;
  issue_type: string | null;
  priority: string;
  status: string;
  scheduled_date: string | null;
  created_at: string;
  subscriber: {
    name: string;
    phone: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

interface WorkOrderDetailCardProps {
  order: WorkOrder;
  onStartWork: (ticketId: string) => void;
  isWorkActive: boolean;
  onOpenDiagnosis: (issueType: string) => void;
}

const WorkOrderDetailCard = ({ 
  order, 
  onStartWork, 
  isWorkActive,
  onOpenDiagnosis 
}: WorkOrderDetailCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent": return "عاجل";
      case "high": return "مرتفع";
      case "medium": return "متوسط";
      default: return "منخفض";
    }
  };

  const openGoogleMaps = () => {
    if (order.subscriber.latitude && order.subscriber.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${order.subscriber.latitude},${order.subscriber.longitude}`;
      window.open(url, '_blank');
    } else if (order.subscriber.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.subscriber.address)}`;
      window.open(url, '_blank');
    }
  };

  const callSubscriber = () => {
    if (order.subscriber.phone) {
      window.location.href = `tel:${order.subscriber.phone}`;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
      {/* Header with priority */}
      <div className={`h-2 ${getPriorityColor(order.priority)}`} />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">{order.ticket_number}</span>
            <Badge className={getPriorityColor(order.priority)}>
              {getPriorityLabel(order.priority)}
            </Badge>
          </div>
          {order.scheduled_date && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(order.scheduled_date), "dd/MM HH:mm")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Issue Info */}
        <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">نوع العطل</p>
              <p className="text-slate-300">{order.issue_type || "غير محدد"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">وصف المشكلة</p>
              <p className="text-slate-300 text-sm">{order.issue_description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-3 h-3" />
            <span>وقت الطلب: {format(new Date(order.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}</span>
          </div>
        </div>

        {/* Subscriber Info */}
        <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">{order.subscriber.name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300" dir="ltr">{order.subscriber.phone}</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={callSubscriber}
              className="h-8"
            >
              <Phone className="w-3 h-3 ml-1" />
              اتصال
            </Button>
          </div>

          {order.subscriber.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-sm">{order.subscriber.address}</span>
            </div>
          )}
        </div>

        {/* Navigation Button */}
        {(order.subscriber.latitude || order.subscriber.address) && (
          <Button 
            onClick={openGoogleMaps} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Navigation className="w-4 h-4 ml-2" />
            فتح في خرائط جوجل
            <ExternalLink className="w-3 h-3 mr-2" />
          </Button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {order.issue_type && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenDiagnosis(order.issue_type!)}
            >
              <Wrench className="w-4 h-4 ml-1" />
              تشخيص سريع
            </Button>
          )}
          {!isWorkActive && (
            <Button
              onClick={() => onStartWork(order.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 ml-1" />
              بدء العمل
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderDetailCard;
