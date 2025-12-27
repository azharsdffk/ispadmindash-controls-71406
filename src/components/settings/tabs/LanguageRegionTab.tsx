import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Globe, Calendar, Clock, MapPin, Save, Languages
} from "lucide-react";

export const LanguageRegionTab = () => {
  const [settings, setSettings] = useState({
    language: 'ar',
    country: 'IQ',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '12h',
    timezone: 'Asia/Baghdad',
    currency: 'IQD',
    weekStart: 'saturday',
  });

  const languages = [
    { value: 'ar', label: 'العربية', flag: '🇮🇶' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'ku', label: 'کوردی', flag: '🇮🇶' },
  ];

  const countries = [
    { value: 'IQ', label: 'العراق', flag: '🇮🇶' },
    { value: 'SA', label: 'السعودية', flag: '🇸🇦' },
    { value: 'AE', label: 'الإمارات', flag: '🇦🇪' },
    { value: 'JO', label: 'الأردن', flag: '🇯🇴' },
    { value: 'EG', label: 'مصر', flag: '🇪🇬' },
  ];

  const dateFormats = [
    { value: 'dd/MM/yyyy', label: '31/12/2024' },
    { value: 'MM/dd/yyyy', label: '12/31/2024' },
    { value: 'yyyy-MM-dd', label: '2024-12-31' },
    { value: 'dd-MM-yyyy', label: '31-12-2024' },
  ];

  const timeFormats = [
    { value: '12h', label: '12 ساعة (AM/PM)' },
    { value: '24h', label: '24 ساعة' },
  ];

  const timezones = [
    { value: 'Asia/Baghdad', label: 'بغداد (GMT+3)' },
    { value: 'Asia/Riyadh', label: 'الرياض (GMT+3)' },
    { value: 'Asia/Dubai', label: 'دبي (GMT+4)' },
    { value: 'Africa/Cairo', label: 'القاهرة (GMT+2)' },
    { value: 'Europe/London', label: 'لندن (GMT+0)' },
  ];

  const currencies = [
    { value: 'IQD', label: 'دينار عراقي (IQD)', symbol: 'د.ع' },
    { value: 'USD', label: 'دولار أمريكي (USD)', symbol: '$' },
    { value: 'SAR', label: 'ريال سعودي (SAR)', symbol: 'ر.س' },
    { value: 'AED', label: 'درهم إماراتي (AED)', symbol: 'د.إ' },
  ];

  const weekStarts = [
    { value: 'saturday', label: 'السبت' },
    { value: 'sunday', label: 'الأحد' },
    { value: 'monday', label: 'الاثنين' },
  ];

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save to localStorage for now
    localStorage.setItem('user_locale_settings', JSON.stringify(settings));
    toast.success('تم حفظ إعدادات اللغة والمنطقة');
  };

  useEffect(() => {
    const saved = localStorage.getItem('user_locale_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading locale settings:', e);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* اللغة والدولة */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5 text-primary" />
            اللغة والدولة
          </CardTitle>
          <CardDescription>اختر لغة وموقع التطبيق</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                اللغة
              </Label>
              <Select value={settings.language} onValueChange={(v) => updateSetting('language', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                الدولة
              </Label>
              <Select value={settings.country} onValueChange={(v) => updateSetting('country', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التاريخ والوقت */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            التاريخ والوقت
          </CardTitle>
          <CardDescription>تخصيص تنسيق التاريخ والوقت</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                تنسيق التاريخ
              </Label>
              <Select value={settings.dateFormat} onValueChange={(v) => updateSetting('dateFormat', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                تنسيق الوقت
              </Label>
              <Select value={settings.timeFormat} onValueChange={(v) => updateSetting('timeFormat', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المنطقة الزمنية</Label>
              <Select value={settings.timezone} onValueChange={(v) => updateSetting('timezone', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>بداية الأسبوع</Label>
              <Select value={settings.weekStart} onValueChange={(v) => updateSetting('weekStart', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekStarts.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* العملة */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            💰 العملة
          </CardTitle>
          <CardDescription>العملة الافتراضية للمعاملات المالية</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={settings.currency} onValueChange={(v) => updateSetting('currency', v)}>
            <SelectTrigger className="max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{currency.symbol}</span>
                    <span>{currency.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 ml-2" />
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
};
