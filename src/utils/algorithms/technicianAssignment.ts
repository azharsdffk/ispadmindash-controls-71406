// خوارزميات توزيع المهام على الفنيين

export interface Technician {
  id: string;
  name: string;
  specialization?: string;
  available: boolean;
  current_location?: { lat: number; lng: number };
}

export interface MaintenanceTask {
  id: string;
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  issue_description: string;
  subscriber_location?: { lat: number; lng: number };
}

export interface AssignmentScore {
  technician_id: string;
  score: number;
  factors: {
    availability: number;
    distance: number;
    specialization: number;
    workload: number;
  };
  estimated_arrival_minutes: number;
}

/**
 * حساب المسافة بين نقطتين (Haversine formula)
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * حساب أفضل فني لمهمة معينة
 */
export const calculateBestTechnician = (
  task: MaintenanceTask,
  technicians: Technician[],
  currentAssignments: { [technicianId: string]: number } = {}
): AssignmentScore[] => {
  
  const scores: AssignmentScore[] = technicians.map(tech => {
    let availabilityScore = tech.available ? 100 : 0;
    let distanceScore = 50; // درجة افتراضية
    let specializationScore = 50; // درجة افتراضية
    let workloadScore = 100;
    
    // حساب درجة المسافة
    if (tech.current_location && task.subscriber_location) {
      const distance = calculateDistance(
        tech.current_location.lat,
        tech.current_location.lng,
        task.subscriber_location.lat,
        task.subscriber_location.lng
      );
      
      // كلما كانت المسافة أقل، كانت الدرجة أعلى
      distanceScore = Math.max(0, 100 - (distance * 10));
    }
    
    // حساب درجة التخصص
    if (tech.specialization) {
      const issueKeywords = task.issue_description.toLowerCase();
      if (issueKeywords.includes(tech.specialization.toLowerCase())) {
        specializationScore = 100;
      } else if (tech.specialization.toLowerCase().includes('عام')) {
        specializationScore = 70;
      }
    }
    
    // حساب درجة حمل العمل
    const currentTasks = currentAssignments[tech.id] || 0;
    workloadScore = Math.max(0, 100 - (currentTasks * 20));
    
    // حساب الدرجة النهائية (مرجحة)
    const finalScore = (
      availabilityScore * 0.4 +
      distanceScore * 0.3 +
      specializationScore * 0.2 +
      workloadScore * 0.1
    );
    
    // تقدير وقت الوصول
    let estimatedArrival = 60; // افتراضي 60 دقيقة
    if (tech.current_location && task.subscriber_location) {
      const distance = calculateDistance(
        tech.current_location.lat,
        tech.current_location.lng,
        task.subscriber_location.lat,
        task.subscriber_location.lng
      );
      // افتراض سرعة 40 كم/ساعة
      estimatedArrival = Math.ceil((distance / 40) * 60);
    }
    
    return {
      technician_id: tech.id,
      score: Math.round(finalScore),
      factors: {
        availability: Math.round(availabilityScore),
        distance: Math.round(distanceScore),
        specialization: Math.round(specializationScore),
        workload: Math.round(workloadScore)
      },
      estimated_arrival_minutes: estimatedArrival
    };
  });

  return scores.sort((a, b) => b.score - a.score);
};

/**
 * توزيع تلقائي للمهام على الفنيين المتاحين
 */
export const autoAssignTasks = (
  tasks: MaintenanceTask[],
  technicians: Technician[]
): { task_id: string; technician_id: string; score: number }[] => {
  
  const assignments: { task_id: string; technician_id: string; score: number }[] = [];
  const techWorkload: { [id: string]: number } = {};
  
  // ترتيب المهام حسب الأولوية
  const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
  const sortedTasks = [...tasks].sort((a, b) => 
    priorityWeight[b.priority] - priorityWeight[a.priority]
  );
  
  sortedTasks.forEach(task => {
    const scores = calculateBestTechnician(task, technicians, techWorkload);
    
    if (scores.length > 0 && scores[0].score > 30) {
      const bestMatch = scores[0];
      assignments.push({
        task_id: task.id,
        technician_id: bestMatch.technician_id,
        score: bestMatch.score
      });
      
      techWorkload[bestMatch.technician_id] = (techWorkload[bestMatch.technician_id] || 0) + 1;
    }
  });
  
  return assignments;
};

/**
 * تحسين مسار الفني (TSP - Traveling Salesman Problem مبسط)
 */
export const optimizeTechnicianRoute = (
  technicianLocation: { lat: number; lng: number },
  taskLocations: Array<{ id: string; lat: number; lng: number }>
): string[] => {
  
  if (taskLocations.length === 0) return [];
  if (taskLocations.length === 1) return [taskLocations[0].id];
  
  // استخدام خوارزمية الجار الأقرب (Nearest Neighbor)
  const route: string[] = [];
  const remaining = [...taskLocations];
  let currentLocation = technicianLocation;
  
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    remaining.forEach((location, index) => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        location.lat,
        location.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    const nearest = remaining[nearestIndex];
    route.push(nearest.id);
    currentLocation = { lat: nearest.lat, lng: nearest.lng };
    remaining.splice(nearestIndex, 1);
  }
  
  return route;
};
