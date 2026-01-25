/**
 * حساب المسافة بين نقطتين باستخدام صيغة Haversine
 * @param lat1 خط العرض للنقطة الأولى
 * @param lon1 خط الطول للنقطة الأولى
 * @param lat2 خط العرض للنقطة الثانية
 * @param lon2 خط الطول للنقطة الثانية
 * @returns المسافة بالكيلومتر
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * حساب المسافة الإجمالية لمسار من نقاط متعددة
 */
export const calculateTotalDistance = (
  points: Array<{ latitude: number; longitude: number }>
): number => {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return totalDistance;
};

/**
 * حساب الوقت المستغرق بين نقطتين زمنيتين
 * @returns الوقت بالدقائق
 */
export const calculateTimeDuration = (
  startTime: string | Date,
  endTime: string | Date
): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return (end - start) / (1000 * 60); // بالدقائق
};

/**
 * تنسيق الوقت من دقائق إلى ساعات ودقائق
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 0) return '0 دقيقة';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins} دقيقة`;
  } else if (mins === 0) {
    return `${hours} ساعة`;
  } else {
    return `${hours} ساعة و ${mins} دقيقة`;
  }
};

/**
 * تنسيق المسافة بوحدات مناسبة
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} متر`;
  }
  return `${km.toFixed(2)} كم`;
};

export interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface DailyRouteStats {
  date: string;
  totalDistance: number;
  totalTime: number;
  pointsCount: number;
  startTime: string | null;
  endTime: string | null;
  averageSpeed: number;
}

/**
 * تجميع نقاط المواقع حسب اليوم
 */
export const groupLocationsByDay = (
  locations: LocationPoint[]
): Map<string, LocationPoint[]> => {
  const grouped = new Map<string, LocationPoint[]>();
  
  locations.forEach((loc) => {
    const date = new Date(loc.recorded_at).toISOString().split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(loc);
  });
  
  // ترتيب كل مجموعة حسب الوقت
  grouped.forEach((points, date) => {
    points.sort((a, b) => 
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
  });
  
  return grouped;
};

/**
 * حساب إحصائيات المسار اليومي
 */
export const calculateDailyStats = (
  locations: LocationPoint[]
): DailyRouteStats => {
  if (locations.length === 0) {
    return {
      date: '',
      totalDistance: 0,
      totalTime: 0,
      pointsCount: 0,
      startTime: null,
      endTime: null,
      averageSpeed: 0,
    };
  }
  
  const sortedLocations = [...locations].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  
  const totalDistance = calculateTotalDistance(sortedLocations);
  const startTime = sortedLocations[0].recorded_at;
  const endTime = sortedLocations[sortedLocations.length - 1].recorded_at;
  const totalTime = calculateTimeDuration(startTime, endTime);
  
  // حساب متوسط السرعة (كم/ساعة)
  const averageSpeed = totalTime > 0 ? (totalDistance / (totalTime / 60)) : 0;
  
  return {
    date: new Date(startTime).toISOString().split('T')[0],
    totalDistance,
    totalTime,
    pointsCount: locations.length,
    startTime,
    endTime,
    averageSpeed,
  };
};

/**
 * حساب إحصائيات متعددة الأيام
 */
export const calculateMultiDayStats = (
  locations: LocationPoint[]
): DailyRouteStats[] => {
  const grouped = groupLocationsByDay(locations);
  const stats: DailyRouteStats[] = [];
  
  grouped.forEach((points, date) => {
    const dailyStats = calculateDailyStats(points);
    dailyStats.date = date;
    stats.push(dailyStats);
  });
  
  return stats.sort((a, b) => b.date.localeCompare(a.date)); // الأحدث أولاً
};
