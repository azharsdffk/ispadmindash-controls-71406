// جميع المحافظات العراقية مع مناطقها
export interface District {
  id: string;
  name: string;
}

export interface Governorate {
  id: string;
  name: string;
  districts: District[];
}

export const iraqGovernorates: Governorate[] = [
  {
    id: 'baghdad',
    name: 'بغداد',
    districts: [
      { id: 'karkh', name: 'الكرخ' },
      { id: 'rusafa', name: 'الرصافة' },
      { id: 'adhamiya', name: 'الأعظمية' },
      { id: 'kadhimiya', name: 'الكاظمية' },
      { id: 'mansour', name: 'المنصور' },
      { id: 'sadr_city', name: 'مدينة الصدر' },
      { id: 'karrada', name: 'الكرادة' },
      { id: 'dora', name: 'الدورة' },
      { id: 'bayaa', name: 'البياع' },
      { id: 'shula', name: 'الشعلة' },
      { id: 'jihad', name: 'حي الجهاد' },
      { id: 'amil', name: 'حي العامل' },
      { id: 'ghazaliya', name: 'الغزالية' },
      { id: 'hurriya', name: 'الحرية' },
      { id: 'shaab', name: 'الشعب' },
      { id: 'zayouna', name: 'زيونة' },
      { id: 'palestine', name: 'فلسطين' },
      { id: 'mashtal', name: 'المشتل' },
      { id: 'abu_ghraib', name: 'أبو غريب' },
      { id: 'mahmudiya', name: 'المحمودية' },
      { id: 'tarmiya', name: 'الطارمية' },
      { id: 'mada\'in', name: 'المدائن' },
    ]
  },
  {
    id: 'basra',
    name: 'البصرة',
    districts: [
      { id: 'basra_center', name: 'مركز البصرة' },
      { id: 'zubair', name: 'الزبير' },
      { id: 'abu_khaseeb', name: 'أبو الخصيب' },
      { id: 'shatt_arab', name: 'شط العرب' },
      { id: 'qurna', name: 'القرنة' },
      { id: 'mudaina', name: 'المدينة' },
      { id: 'faw', name: 'الفاو' },
      { id: 'safwan', name: 'سفوان' },
      { id: 'umm_qasr', name: 'أم قصر' },
      { id: 'hartha', name: 'الهارثة' },
      { id: 'tanuma', name: 'التنومة' },
      { id: 'ashar', name: 'العشار' },
      { id: 'jumhuriya', name: 'الجمهورية' },
    ]
  },
  {
    id: 'nineveh',
    name: 'نينوى',
    districts: [
      { id: 'mosul', name: 'الموصل' },
      { id: 'telafar', name: 'تلعفر' },
      { id: 'sinjar', name: 'سنجار' },
      { id: 'hamdaniya', name: 'الحمدانية' },
      { id: 'sheikhan', name: 'الشيخان' },
      { id: 'tilkaif', name: 'تلكيف' },
      { id: 'bashiqa', name: 'بعشيقة' },
      { id: 'hatra', name: 'الحضر' },
      { id: 'baaj', name: 'البعاج' },
      { id: 'makhmur', name: 'مخمور' },
      { id: 'aqra', name: 'عقرة' },
      { id: 'qayyara', name: 'القيارة' },
      { id: 'hammam_alil', name: 'حمام العليل' },
    ]
  },
  {
    id: 'erbil',
    name: 'أربيل',
    districts: [
      { id: 'erbil_center', name: 'مركز أربيل' },
      { id: 'soran', name: 'سوران' },
      { id: 'shaqlawa', name: 'شقلاوة' },
      { id: 'koya', name: 'كويسنجق' },
      { id: 'rawanduz', name: 'راوندوز' },
      { id: 'choman', name: 'جومان' },
      { id: 'mergasur', name: 'ميركه سور' },
      { id: 'makhmur_erbil', name: 'مخمور' },
      { id: 'khalifan', name: 'خليفان' },
      { id: 'ankawa', name: 'عنكاوا' },
      { id: 'kasnazan', name: 'كسنزان' },
    ]
  },
  {
    id: 'sulaymaniyah',
    name: 'السليمانية',
    districts: [
      { id: 'sulaymaniyah_center', name: 'مركز السليمانية' },
      { id: 'halabja', name: 'حلبجة' },
      { id: 'ranya', name: 'رانية' },
      { id: 'penjwin', name: 'بنجوين' },
      { id: 'darbandikhan', name: 'دربندخان' },
      { id: 'chamchamal', name: 'جمجمال' },
      { id: 'kalar', name: 'كلار' },
      { id: 'dokan', name: 'دوكان' },
      { id: 'sharbazher', name: 'شاربازير' },
      { id: 'qaradagh', name: 'قرة داغ' },
      { id: 'said_sadiq', name: 'سيد صادق' },
      { id: 'pishdar', name: 'بشدر' },
    ]
  },
  {
    id: 'duhok',
    name: 'دهوك',
    districts: [
      { id: 'duhok_center', name: 'مركز دهوك' },
      { id: 'zakho', name: 'زاخو' },
      { id: 'amedi', name: 'العمادية' },
      { id: 'akre', name: 'عقرة' },
      { id: 'semel', name: 'سيميل' },
      { id: 'bardarash', name: 'بردرش' },
      { id: 'shekhan_duhok', name: 'شيخان' },
      { id: 'mangesh', name: 'مانكيش' },
      { id: 'batifa', name: 'باتيفا' },
    ]
  },
  {
    id: 'kirkuk',
    name: 'كركوك',
    districts: [
      { id: 'kirkuk_center', name: 'مركز كركوك' },
      { id: 'hawija', name: 'الحويجة' },
      { id: 'daquq', name: 'داقوق' },
      { id: 'dibis', name: 'دبس' },
      { id: 'altun_kupri', name: 'التون كوبري' },
      { id: 'taza', name: 'طوز خورماتو' },
      { id: 'riyadh', name: 'الرياض' },
      { id: 'rashad', name: 'الرشاد' },
      { id: 'multaqa', name: 'الملتقى' },
    ]
  },
  {
    id: 'diyala',
    name: 'ديالى',
    districts: [
      { id: 'baquba', name: 'بعقوبة' },
      { id: 'muqdadiya', name: 'المقدادية' },
      { id: 'khanaqin', name: 'خانقين' },
      { id: 'baladruz', name: 'بلدروز' },
      { id: 'kifri', name: 'كفري' },
      { id: 'khalis', name: 'الخالص' },
      { id: 'mandali', name: 'مندلي' },
      { id: 'saadiya', name: 'السعدية' },
      { id: 'jalawla', name: 'جلولاء' },
      { id: 'abu_sayda', name: 'أبو صيدا' },
    ]
  },
  {
    id: 'anbar',
    name: 'الأنبار',
    districts: [
      { id: 'ramadi', name: 'الرمادي' },
      { id: 'fallujah', name: 'الفلوجة' },
      { id: 'hit', name: 'هيت' },
      { id: 'haditha', name: 'حديثة' },
      { id: 'ana', name: 'عنه' },
      { id: 'rawa', name: 'راوة' },
      { id: 'qaim', name: 'القائم' },
      { id: 'rutba', name: 'الرطبة' },
      { id: 'khalidiya', name: 'الخالدية' },
      { id: 'karma', name: 'الكرمة' },
      { id: 'amiriya', name: 'العامرية' },
      { id: 'habbaniya', name: 'الحبانية' },
    ]
  },
  {
    id: 'najaf',
    name: 'النجف',
    districts: [
      { id: 'najaf_center', name: 'مركز النجف' },
      { id: 'kufa', name: 'الكوفة' },
      { id: 'manathira', name: 'المناذرة' },
      { id: 'mishkhab', name: 'المشخاب' },
      { id: 'hira', name: 'الحيرة' },
      { id: 'abbasiya', name: 'العباسية' },
      { id: 'haidariya', name: 'الحيدرية' },
    ]
  },
  {
    id: 'karbala',
    name: 'كربلاء',
    districts: [
      { id: 'karbala_center', name: 'مركز كربلاء' },
      { id: 'hindiya', name: 'الهندية' },
      { id: 'ain_tamr', name: 'عين التمر' },
      { id: 'husseiniya', name: 'الحسينية' },
      { id: 'jdaidat_shat', name: 'جديدة الشط' },
      { id: 'hur', name: 'الحر' },
    ]
  },
  {
    id: 'babil',
    name: 'بابل',
    districts: [
      { id: 'hilla', name: 'الحلة' },
      { id: 'mahawil', name: 'المحاويل' },
      { id: 'musayyib', name: 'المسيب' },
      { id: 'hashimiya', name: 'الهاشمية' },
      { id: 'qasim', name: 'القاسم' },
      { id: 'madhatiya', name: 'المدحتية' },
      { id: 'iskandariya', name: 'الإسكندرية' },
      { id: 'shomali', name: 'الشوملي' },
      { id: 'kifil', name: 'الكفل' },
    ]
  },
  {
    id: 'wasit',
    name: 'واسط',
    districts: [
      { id: 'kut', name: 'الكوت' },
      { id: 'numaniya', name: 'النعمانية' },
      { id: 'hay', name: 'الحي' },
      { id: 'suwaira', name: 'الصويرة' },
      { id: 'aziziya', name: 'العزيزية' },
      { id: 'badra', name: 'بدرة' },
      { id: 'jassan', name: 'جصان' },
      { id: 'sheik_saad', name: 'الشيخ سعد' },
      { id: 'zubaidiya', name: 'الزبيدية' },
      { id: 'ahrar', name: 'الأحرار' },
    ]
  },
  {
    id: 'maysan',
    name: 'ميسان',
    districts: [
      { id: 'amara', name: 'العمارة' },
      { id: 'ali_gharbi', name: 'علي الغربي' },
      { id: 'ali_sharqi', name: 'علي الشرقي' },
      { id: 'maimouna', name: 'الميمونة' },
      { id: 'kahla', name: 'الكحلاء' },
      { id: 'qalat_saleh', name: 'قلعة صالح' },
      { id: 'majar_kabir', name: 'المجر الكبير' },
      { id: 'islah', name: 'الإصلاح' },
      { id: 'sayed_ahmad_rifai', name: 'السيد أحمد الرفاعي' },
    ]
  },
  {
    id: 'dhi_qar',
    name: 'ذي قار',
    districts: [
      { id: 'nasiriya', name: 'الناصرية' },
      { id: 'suq_shuyukh', name: 'سوق الشيوخ' },
      { id: 'shatra', name: 'الشطرة' },
      { id: 'rifai', name: 'الرفاعي' },
      { id: 'chibayish', name: 'الجبايش' },
      { id: 'gharraf', name: 'الغراف' },
      { id: 'fajr', name: 'الفجر' },
      { id: 'islah_dhi_qar', name: 'الإصلاح' },
      { id: 'badaa', name: 'البدء' },
      { id: 'nasr', name: 'النصر' },
      { id: 'dawaya', name: 'الدواية' },
    ]
  },
  {
    id: 'muthanna',
    name: 'المثنى',
    districts: [
      { id: 'samawa', name: 'السماوة' },
      { id: 'rumaitha', name: 'الرميثة' },
      { id: 'khidhir', name: 'الخضر' },
      { id: 'warka', name: 'الوركاء' },
      { id: 'salman', name: 'السلمان' },
      { id: 'majid', name: 'المجد' },
      { id: 'dawwar', name: 'الدوار' },
    ]
  },
  {
    id: 'qadisiyyah',
    name: 'القادسية',
    districts: [
      { id: 'diwaniya', name: 'الديوانية' },
      { id: 'afak', name: 'عفك' },
      { id: 'shamiya', name: 'الشامية' },
      { id: 'hamza', name: 'الحمزة' },
      { id: 'daghara', name: 'الدغارة' },
      { id: 'sumer', name: 'سومر' },
      { id: 'shanafiya', name: 'الشنافية' },
      { id: 'ghamas', name: 'غماس' },
      { id: 'saniya', name: 'السنية' },
    ]
  },
  {
    id: 'saladin',
    name: 'صلاح الدين',
    districts: [
      { id: 'tikrit', name: 'تكريت' },
      { id: 'samarra', name: 'سامراء' },
      { id: 'baiji', name: 'بيجي' },
      { id: 'dour', name: 'الدور' },
      { id: 'shirqat', name: 'الشرقاط' },
      { id: 'balad', name: 'بلد' },
      { id: 'tooz', name: 'طوز خورماتو' },
      { id: 'dujail', name: 'الدجيل' },
      { id: 'ishaqi', name: 'الإسحاقي' },
      { id: 'yathrib', name: 'يثرب' },
      { id: 'faris', name: 'الفارس' },
      { id: 'alam', name: 'العلم' },
      { id: 'mukaishifa', name: 'المكيشيفة' },
    ]
  },
];

// دالة للحصول على المناطق حسب المحافظة
export const getDistrictsByGovernorate = (governorateId: string): District[] => {
  const governorate = iraqGovernorates.find(g => g.id === governorateId);
  return governorate?.districts || [];
};

// دالة للحصول على اسم المنطقة الكامل
export const getFullRegionName = (governorateId: string, districtId: string): string => {
  const governorate = iraqGovernorates.find(g => g.id === governorateId);
  const district = governorate?.districts.find(d => d.id === districtId);
  
  if (governorate && district) {
    return `${governorate.name} - ${district.name}`;
  }
  return '';
};
