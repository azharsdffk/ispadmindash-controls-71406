import {
  LayoutDashboard,
  Wrench,
  MapPin,
  Users,
  User,
  DollarSign,
  Calculator,
  BarChart3,
  FileText,
  Activity,
  TrendingUp,
  Layers,
  Target,
  Coins,
  Wallet,
  Archive,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdminTabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const mainAdminTabs: AdminTabConfig[] = [
  { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'tickets', label: 'التذاكر', icon: Wrench },
  { id: 'technicians', label: 'الفنيين', icon: MapPin },
  { id: 'subscribers', label: 'المشتركين', icon: Users },
  { id: 'customers', label: 'بوابة العميل', icon: User },
  { id: 'finance', label: 'المالية', icon: DollarSign },
  { id: 'accounting', label: 'المحاسبة', icon: Calculator },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'statements', label: 'القوائم المالية', icon: FileText },
  { id: 'activity', label: 'السجل', icon: Activity },
];

export const accountingSubTabs: AdminTabConfig[] = [
  { id: 'overview', label: 'نظرة عامة', icon: Activity },
  { id: 'financial', label: 'التحليل المالي', icon: TrendingUp },
  { id: 'entries', label: 'القيود', icon: FileText },
  { id: 'ledger', label: 'دفتر الأستاذ', icon: Layers },
  { id: 'balance', label: 'الميزانية', icon: Target },
  { id: 'income', label: 'قائمة الدخل', icon: Coins },
  { id: 'cashflow', label: 'التدفقات', icon: Wallet },
  { id: 'advanced', label: 'متقدمة', icon: Archive },
];

export const getOrderedTabs = (
  tabs: AdminTabConfig[],
  order: string[]
): AdminTabConfig[] => {
  if (!order || order.length === 0) return tabs;

  const tabMap = new Map(tabs.map((tab) => [tab.id, tab]));
  const orderedTabs: AdminTabConfig[] = [];

  // Add tabs in the specified order
  for (const id of order) {
    const tab = tabMap.get(id);
    if (tab) {
      orderedTabs.push(tab);
      tabMap.delete(id);
    }
  }

  // Add any remaining tabs that weren't in the order
  for (const tab of tabMap.values()) {
    orderedTabs.push(tab);
  }

  return orderedTabs;
};
