import { CityMapConfig } from '../types/game';

export const HANOI_DETAILED_MAP: CityMapConfig = {
  id: 'hanoi',
  nameVi: 'Hà Nội — Thủ Đô Ngàn Năm',
  nameEn: 'Hanoi — The Millennial Capital',
  descriptionVi: 'Bản đồ đại đô thị Hà Nội siêu chi tiết. Sông Hồng uốn lượn, Bãi Giữa xanh ngát, Hồ Tây lộng gió cùng hệ thống 6 cầu vượt sông và các tuyến metro Cát Linh - Hà Đông, Nhổn - Ga Hà Nội.',
  descriptionEn: 'Ultra-detailed metropolitan Hanoi transit map. Meandering Red River, lush River Island, scenic West Lake, 6 iconic bridges, and real metro lines.',
  version: 3,
  worldWidth: 2400,
  worldHeight: 1700,

  // Water Polygons: Sông Hồng, Bãi Giữa island, Hồ Tây, Hồ Trúc Bạch, Hồ Hoàn Kiếm, Hồ Bảy Mẫu, Hồ Linh Đàm, Sông Đuống
  riverPolygons: [
    // 1. Sông Hồng (The Majestic Red River - 32 high-resolution geodesic coordinates)
    {
      name: 'Sông Hồng (Red River)',
      points: [
        // West/North shore (North bank: Đông Anh / Mê Linh / Long Biên / Gia Lâm)
        { x: 380, y: 0 },
        { x: 450, y: 110 },
        { x: 540, y: 220 },
        { x: 670, y: 300 },
        { x: 840, y: 350 },
        { x: 1060, y: 360 },
        { x: 1260, y: 440 },
        { x: 1410, y: 550 },
        { x: 1510, y: 670 },
        { x: 1550, y: 810 },
        { x: 1580, y: 960 },
        { x: 1660, y: 1100 },
        { x: 1760, y: 1250 },
        { x: 1880, y: 1420 },
        { x: 2000, y: 1580 },
        { x: 2060, y: 1700 },

        // River mouth width boundary
        { x: 2190, y: 1700 },
        { x: 2120, y: 1550 },
        { x: 1990, y: 1380 },
        { x: 1860, y: 1200 },
        { x: 1770, y: 1040 },
        { x: 1690, y: 890 },
        { x: 1640, y: 740 },
        { x: 1540, y: 590 },
        { x: 1380, y: 460 },
        { x: 1180, y: 370 },
        { x: 970, y: 300 },
        { x: 780, y: 240 },
        { x: 610, y: 160 },
        { x: 490, y: 60 },
        { x: 440, y: 0 }
      ]
    },

    // 2. Bãi Giữa Sông Hồng (Iconic Alluvial Island beneath Long Biên Bridge)
    {
      name: 'Bãi Giữa Sông Hồng (Alluvial River Island)',
      isIsland: true,
      points: [
        { x: 1360, y: 680 },
        { x: 1410, y: 650 },
        { x: 1470, y: 690 },
        { x: 1510, y: 770 },
        { x: 1520, y: 860 },
        { x: 1490, y: 940 },
        { x: 1440, y: 960 },
        { x: 1390, y: 910 },
        { x: 1360, y: 820 },
        { x: 1350, y: 740 }
      ]
    },

    // 3. Hồ Tây (West Lake - realistic organic shoreline with Quảng An peninsula)
    {
      name: 'Hồ Tây (West Lake)',
      isWaterBody: true,
      points: [
        { x: 910, y: 500 },
        { x: 990, y: 480 },
        { x: 1080, y: 490 },
        { x: 1150, y: 530 },
        { x: 1200, y: 590 },
        // Quảng An Peninsula & Phủ Tây Hồ indentation
        { x: 1180, y: 630 },
        { x: 1130, y: 620 },
        { x: 1110, y: 660 },
        { x: 1160, y: 690 },
        // Đường Thanh Niên eastern bank
        { x: 1140, y: 725 },
        { x: 1070, y: 740 },
        { x: 990, y: 730 },
        { x: 930, y: 690 },
        { x: 880, y: 630 },
        { x: 870, y: 570 }
      ]
    },

    // 4. Hồ Trúc Bạch (Scenic lake separated by Thanh Nien causeway)
    {
      name: 'Hồ Trúc Bạch',
      isWaterBody: true,
      points: [
        { x: 1155, y: 685 },
        { x: 1210, y: 680 },
        { x: 1235, y: 720 },
        { x: 1205, y: 745 },
        { x: 1160, y: 730 }
      ]
    },

    // 5. Hồ Hoàn Kiếm / Hồ Gươm (Sword Lake with Turtle Tower)
    {
      name: 'Hồ Hoàn Kiếm (Sword Lake)',
      isWaterBody: true,
      points: [
        { x: 1260, y: 840 },
        { x: 1290, y: 835 },
        { x: 1310, y: 870 },
        { x: 1295, y: 920 },
        { x: 1265, y: 930 },
        { x: 1245, y: 885 }
      ]
    },

    // 6. Hồ Bảy Mẫu & Hồ Ba Mẫu (Công viên Thống Nhất)
    {
      name: 'Hồ Bảy Mẫu (Công viên Thống Nhất)',
      isWaterBody: true,
      points: [
        { x: 1180, y: 1040 },
        { x: 1240, y: 1030 },
        { x: 1265, y: 1075 },
        { x: 1235, y: 1120 },
        { x: 1180, y: 1105 }
      ]
    },

    // 7. Hồ Linh Đàm (Bán đảo Linh Đàm phía Nam)
    {
      name: 'Hồ Linh Đàm (Linh Dam Peninsula Lake)',
      isWaterBody: true,
      points: [
        { x: 990, y: 1380 },
        { x: 1080, y: 1360 },
        { x: 1140, y: 1400 },
        { x: 1110, y: 1470 },
        { x: 1030, y: 1485 },
        { x: 970, y: 1435 }
      ]
    },

    // 8. Hồ Giảng Võ
    {
      name: 'Hồ Giảng Võ',
      isWaterBody: true,
      points: [
        { x: 955, y: 870 },
        { x: 995, y: 865 },
        { x: 1010, y: 900 },
        { x: 975, y: 915 },
        { x: 950, y: 890 }
      ]
    },

    // 9. Sông Đuống (Branching northeast toward Đông Anh / Bắc Ninh)
    {
      name: 'Sông Đuống (Duong River)',
      points: [
        { x: 1380, y: 460 },
        { x: 1530, y: 400 },
        { x: 1720, y: 350 },
        { x: 1940, y: 310 },
        { x: 2150, y: 280 },
        { x: 2400, y: 260 },
        // other side
        { x: 2400, y: 330 },
        { x: 2160, y: 350 },
        { x: 1950, y: 380 },
        { x: 1740, y: 420 },
        { x: 1560, y: 470 },
        { x: 1410, y: 550 }
      ]
    }
  ],

  // Iconic Bridges across Red River
  bridges: [
    {
      id: 'bridge-long-bien',
      nameVi: 'Cầu Long Biên (1902)',
      nameEn: 'Long Bien Bridge (Eiffel)',
      type: 'cantilever',
      p1: { x: 1320, y: 775 },
      p2: { x: 1480, y: 725 },
      color: '#B45309',
      width: 14,
      towers: 4,
      yearBuilt: 1902,
      descriptionVi: 'Cây cầu thép lịch sử hơn 120 năm tuổi vắt qua Sông Hồng, chứng nhân hào hùng của Thủ đô.',
      descriptionEn: 'Historic 120-year-old steel cantilever bridge designed by Gustave Eiffel company.'
    },
    {
      id: 'bridge-nhat-tan',
      nameVi: 'Cầu Nhật Tân (2015)',
      nameEn: 'Nhat Tan Cable Bridge',
      type: 'cable_stayed',
      p1: { x: 980, y: 395 },
      p2: { x: 1110, y: 310 },
      color: '#06B6D4',
      width: 16,
      towers: 5,
      yearBuilt: 2015,
      descriptionVi: 'Cầu dây văng 5 trụ tháp kim cương rực rỡ tượng trưng cho 5 cửa ô Hà Nội, cửa ngõ sân bay Quốc tế.',
      descriptionEn: 'Stunning 5-diamond-tower cable-stayed bridge symbolizing the 5 historic city gates of Hanoi.'
    },
    {
      id: 'bridge-thang-long',
      nameVi: 'Cầu Thăng Long (1985)',
      nameEn: 'Thang Long Truss Bridge',
      type: 'truss',
      p1: { x: 670, y: 350 },
      p2: { x: 745, y: 255 },
      color: '#64748B',
      width: 14,
      yearBuilt: 1985,
      descriptionVi: 'Cầu giàn thép 2 tầng đồ sộ nối liền Vành đai 3 và sân bay Quốc tế Nội Bài.',
      descriptionEn: 'Massive dual-deck steel truss bridge connecting Ring Road 3 and Noi Bai Airport.'
    },
    {
      id: 'bridge-chuong-duong',
      nameVi: 'Cầu Chương Dương (1985)',
      nameEn: 'Chuong Duong Bridge',
      type: 'girder',
      p1: { x: 1360, y: 840 },
      p2: { x: 1510, y: 795 },
      color: '#475569',
      width: 13,
      yearBuilt: 1985,
      descriptionVi: 'Cầu thép trọng yếu nối trung tâm Hoàn Kiếm sang Gia Lâm và Quốc lộ 5.',
      descriptionEn: 'Vital highway bridge connecting central Hoan Kiem to Long Bien and Highway 5.'
    },
    {
      id: 'bridge-vinh-tuy',
      nameVi: 'Cầu Vĩnh Tuy (2008-2023)',
      nameEn: 'Vinh Tuy Bridge',
      type: 'girder',
      p1: { x: 1500, y: 1065 },
      p2: { x: 1660, y: 1010 },
      color: '#3B82F6',
      width: 16,
      yearBuilt: 2023,
      descriptionVi: 'Cây cầu đúc hẫng rộng 8 làn xe hiện đại, điểm nối Vành đai 2 trên cao sang Long Biên.',
      descriptionEn: 'Modern 8-lane expressway bridge linking Ring Road 2 elevated highway to Long Bien.'
    },
    {
      id: 'bridge-thanh-tri',
      nameVi: 'Cầu Thanh Trì (2007)',
      nameEn: 'Thanh Tri Bridge',
      type: 'girder',
      p1: { x: 1620, y: 1290 },
      p2: { x: 1780, y: 1235 },
      color: '#64748B',
      width: 14,
      yearBuilt: 2007,
      descriptionVi: 'Cầu bê tông cốt thép dự ứng lực dài nhất tuyến Vành đai 3 phía Nam.',
      descriptionEn: 'Major Ring Road 3 southern bridge carrying trans-Vietnam highway traffic.'
    }
  ],

  // Heritage & Modern Landmarks
  landmarks: [
    {
      id: 'thap-rua',
      nameVi: 'Tháp Rùa — Hồ Gươm',
      nameEn: 'Turtle Tower (Sword Lake)',
      category: 'heritage',
      x: 1278,
      y: 885,
      yearBuilt: '1886',
      iconType: 'pagoda',
      badgeText: 'Hồ Gươm',
      descriptionVi: 'Biểu tượng thiêng liêng của Thăng Long - Hà Nội ngàn năm văn hiến, nằm trên gò đất giữa Hồ Hoàn Kiếm.',
      descriptionEn: 'Sacred symbol of thousand-year-old Hanoi, resting in the center of Sword Lake.'
    },
    {
      id: 'lang-bac',
      nameVi: 'Lăng Chủ Tịch Hồ Chí Minh',
      nameEn: 'Ho Chi Minh Mausoleum',
      category: 'government',
      x: 1090,
      y: 775,
      yearBuilt: '1975',
      iconType: 'mausoleum',
      badgeText: 'Ba Đình',
      descriptionVi: 'Quảng trường Ba Đình lịch sử và Lăng Bác — trái tim chính trị của cả nước.',
      descriptionEn: 'Historic Ba Dinh Square and Ho Chi Minh Mausoleum — political heart of Vietnam.'
    },
    {
      id: 'van-mieu',
      nameVi: 'Văn Miếu — Quốc Tử Giám',
      nameEn: 'Temple of Literature (1070)',
      category: 'heritage',
      x: 1130,
      y: 855,
      yearBuilt: '1070',
      iconType: 'temple',
      badgeText: 'Văn Miếu',
      descriptionVi: 'Trường đại học đầu tiên của Việt Nam với Khuê Văn Các danh tiếng và 82 bia tiến sĩ bằng đá.',
      descriptionEn: 'Vietnam’s first university (1070) with the iconic Khue Van Cac pavilion.'
    },
    {
      id: 'nha-hat-lon',
      nameVi: 'Nhà Hát Lớn Hà Nội',
      nameEn: 'Hanoi Opera House (1911)',
      category: 'culture',
      x: 1330,
      y: 910,
      yearBuilt: '1911',
      iconType: 'opera',
      badgeText: 'Tràng Tiền',
      descriptionVi: 'Công trình kiến trúc tân cổ điển Pháp tráng lệ tại Quảng trường Cách mạng Tháng Tám.',
      descriptionEn: 'Magnificent French neoclassical opera house in August Revolution Square.'
    },
    {
      id: 'ga-ha-noi',
      nameVi: 'Ga Hà Nội (Ga Hàng Cỏ)',
      nameEn: 'Hanoi Central Railway Station',
      category: 'transport',
      x: 1140,
      y: 915,
      yearBuilt: '1902',
      iconType: 'train',
      badgeText: 'Ga Trung Tâm',
      descriptionVi: 'Đầu mối đường sắt Bắc - Nam hơn 120 năm tuổi và ga ngầm trung tâm của Metro Tuyến 3.',
      descriptionEn: 'Historic North-South railway terminus and underground hub of Metro Line 3.'
    },
    {
      id: 'san-bay-noi-bai',
      nameVi: 'Sân Bay Quốc Tế Nội Bài',
      nameEn: 'Noi Bai International Airport (HAN)',
      category: 'transport',
      x: 990,
      y: 120,
      yearBuilt: '1978',
      iconType: 'airport',
      badgeText: 'Sân Bay T1-T2',
      descriptionVi: 'Cửa ngõ hàng không quốc tế lớn nhất miền Bắc, tương lai kết nối Metro Tuyến 2.',
      descriptionEn: 'Largest international aviation gateway of Northern Vietnam.'
    },
    {
      id: 'svd-my-dinh',
      nameVi: 'Sân Vận Động Quốc Gia Mỹ Đình',
      nameEn: 'My Dinh National Stadium',
      category: 'modern',
      x: 540,
      y: 930,
      yearBuilt: '2003',
      iconType: 'stadium',
      badgeText: 'Mỹ Đình',
      descriptionVi: 'Trung tâm thể thao quốc gia với sức chứa 40.000 chỗ ngồi, điểm hẹn các sự kiện lớn.',
      descriptionEn: 'Vietnam’s 40,000-seat national stadium and major sports complex.'
    },
    {
      id: 'keangnam-72',
      nameVi: 'Keangnam Landmark 72',
      nameEn: 'Keangnam Hanoi Landmark Tower',
      category: 'modern',
      x: 660,
      y: 980,
      yearBuilt: '2011',
      iconType: 'tower',
      badgeText: '72 Tầng',
      descriptionVi: 'Tòa tháp chọc trời cao 350m, biểu tượng kinh tế năng động phía Tây Thủ đô.',
      descriptionEn: '350m-high skyscraper tower dominating Western Hanoi skyline.'
    },
    {
      id: 'chua-tran-quoc',
      nameVi: 'Chùa Trấn Quốc & Hồ Tây',
      nameEn: 'Tran Quoc Pagoda',
      category: 'heritage',
      x: 1145,
      y: 690,
      yearBuilt: 'TK VI',
      iconType: 'pagoda',
      badgeText: 'Trấn Quốc',
      descriptionVi: 'Ngôi chùa cổ nhất Thăng Long (hơn 1.500 năm tuổi) tọa lạc trên bán đảo xinh đẹp ở Hồ Tây.',
      descriptionEn: 'Oldest Buddhist pagoda in Hanoi (over 1,500 years old) on West Lake.'
    },
    {
      id: 'bat-trang',
      nameVi: 'Làng Gốm Bát Tràng',
      nameEn: 'Bat Trang Ceramic Village',
      category: 'culture',
      x: 1860,
      y: 1460,
      yearBuilt: 'TK XIV',
      iconType: 'temple',
      badgeText: 'Làng Gốm',
      descriptionVi: 'Làng nghề gốm sứ truyền thống trứ danh ven dòng Sông Hồng có từ thời Lý - Trần.',
      descriptionEn: 'Famed traditional pottery and ceramics heritage village beside the Red River.'
    }
  ],

  // Parks and green spaces
  parks: [
    {
      id: 'park-bach-thao',
      nameVi: 'Công viên Bách Thảo',
      nameEn: 'Botanical Gardens',
      points: [
        { x: 1040, y: 730 },
        { x: 1080, y: 725 },
        { x: 1075, y: 760 },
        { x: 1035, y: 755 }
      ]
    },
    {
      id: 'park-thong-nhat',
      nameVi: 'Công viên Thống Nhất',
      nameEn: 'Thong Nhat Park',
      points: [
        { x: 1160, y: 1010 },
        { x: 1270, y: 1000 },
        { x: 1290, y: 1130 },
        { x: 1165, y: 1135 }
      ]
    },
    {
      id: 'park-cau-giay',
      nameVi: 'Công viên Cầu Giấy',
      nameEn: 'Cau Giay Park',
      points: [
        { x: 670, y: 880 },
        { x: 730, y: 870 },
        { x: 740, y: 920 },
        { x: 675, y: 925 }
      ]
    },
    {
      id: 'park-yen-so',
      nameVi: 'Công viên Yên Sở',
      nameEn: 'Yen So Eco Park',
      points: [
        { x: 1330, y: 1380 },
        { x: 1470, y: 1360 },
        { x: 1490, y: 1490 },
        { x: 1320, y: 1480 }
      ]
    }
  ],

  // Arterial Ring Roads (Vành Đai 1, 2, 3)
  arterialRoads: [
    {
      id: 'ring-1',
      nameVi: 'Vành Đai 1 (Đê La Thành - Xã Đàn)',
      nameEn: 'Ring Road 1',
      isRing: true,
      points: [
        { x: 1010, y: 820 },
        { x: 1050, y: 920 },
        { x: 1120, y: 990 },
        { x: 1240, y: 1020 },
        { x: 1350, y: 980 }
      ]
    },
    {
      id: 'ring-2',
      nameVi: 'Vành Đai 2 (Nhật Tân - Cầu Giấy - Trường Chinh - Vĩnh Tuy)',
      nameEn: 'Ring Road 2 (Elevated Expressway)',
      isRing: true,
      points: [
        { x: 990, y: 400 },
        { x: 890, y: 550 },
        { x: 830, y: 720 },
        { x: 810, y: 880 },
        { x: 870, y: 1040 },
        { x: 1010, y: 1120 },
        { x: 1220, y: 1150 },
        { x: 1390, y: 1130 },
        { x: 1510, y: 1060 }
      ]
    },
    {
      id: 'ring-3',
      nameVi: 'Vành Đai 3 (Thăng Long - Phạm Văn Đồng - Khuất Duy Tiến - Thanh Trì)',
      nameEn: 'Ring Road 3 Expressway',
      isRing: true,
      points: [
        { x: 680, y: 350 },
        { x: 640, y: 560 },
        { x: 620, y: 750 },
        { x: 620, y: 950 },
        { x: 740, y: 1160 },
        { x: 960, y: 1280 },
        { x: 1240, y: 1330 },
        { x: 1460, y: 1320 },
        { x: 1640, y: 1280 }
      ]
    }
  ],

  // Administrative District Badges for Map
  districts: [
    { nameVi: 'Q. HOÀN KIẾM', nameEn: 'HOAN KIEM', x: 1260, y: 810 },
    { nameVi: 'Q. BA ĐÌNH', nameEn: 'BA DINH', x: 1050, y: 750 },
    { nameVi: 'Q. TÂY HỒ', nameEn: 'TAY HO', x: 1020, y: 540 },
    { nameVi: 'Q. CẦU GIẤY', nameEn: 'CAU GIAY', x: 730, y: 830 },
    { nameVi: 'Q. ĐỐNG ĐA', nameEn: 'DONG DA', x: 1060, y: 940 },
    { nameVi: 'Q. HAI BÀ TRƯNG', nameEn: 'HAI BA TRUNG', x: 1290, y: 1040 },
    { nameVi: 'Q. LONG BIÊN', nameEn: 'LONG BIEN', x: 1560, y: 760 },
    { nameVi: 'Q. THANH XUÂN', nameEn: 'THANH XUAN', x: 840, y: 1110 },
    { nameVi: 'Q. NAM TỪ LIÊM', nameEn: 'NAM TU LIEM', x: 550, y: 970 },
    { nameVi: 'Q. BẮC TỪ LIÊM', nameEn: 'BAC TU LIEM', x: 440, y: 720 },
    { nameVi: 'Q. HÀ ĐÔNG', nameEn: 'HA DONG', x: 570, y: 1340 },
    { nameVi: 'Q. HOÀNG MAI', nameEn: 'HOANG MAI', x: 1220, y: 1280 },
    { nameVi: 'H. ĐÔNG ANH', nameEn: 'DONG ANH', x: 1260, y: 310 },
    { nameVi: 'H. GIA LÂM', nameEn: 'GIA LAM', x: 1780, y: 880 }
  ],

  // 10 Initial Stations spanning the entire vibrant Hanoi metropolis:
  initialStations: [
    {
      id: 'hn-hoan-kiem',
      shape: 'circle',
      x: 1250,
      y: 860,
      name: 'Hoàn Kiếm (Phố Cổ)',
      districtVi: 'Hoàn Kiếm',
      historicalNoteVi: 'Trái tim của Thủ đô, 36 phố phường sầm uất và Hồ Gươm cổ kính.'
    },
    {
      id: 'hn-cat-linh',
      shape: 'triangle',
      x: 1020,
      y: 890,
      name: 'Cát Linh (Hub Tuyến 2A & 3)',
      districtVi: 'Đống Đa / Ba Đình',
      historicalNoteVi: 'Ga trung chuyển chính kết nối Metro Tuyến 2A và Metro Tuyến 3.'
    },
    {
      id: 'hn-long-bien',
      shape: 'square',
      x: 1420,
      y: 750,
      name: 'Long Biên (Đầu Cầu Sông Hồng)',
      districtVi: 'Long Biên',
      historicalNoteVi: 'Cửa ngõ kết nối đôi bờ Sông Hồng qua cây cầu Long Biên lịch sử.'
    },
    {
      id: 'hn-cau-giay',
      shape: 'diamond',
      x: 770,
      y: 840,
      name: 'Cầu Giấy (Cửa Ngõ Tây)',
      districtVi: 'Cầu Giấy',
      historicalNoteVi: 'Trung tâm hành chính và giáo dục lớn, điểm đầu ngầm của Metro Tuyến 3.'
    },
    {
      id: 'hn-tay-ho',
      shape: 'star',
      x: 1120,
      y: 590,
      name: 'Tây Hồ (Phủ Tây Hồ / Quảng An)',
      districtVi: 'Tây Hồ',
      historicalNoteVi: 'Bán đảo Quảng An thơ mộng và thắng cảnh đệ nhất ven Hồ Tây.'
    },
    {
      id: 'hn-ba-dinh',
      shape: 'circle',
      x: 1070,
      y: 760,
      name: 'Ba Đình (Lăng Bác / Hoàng Thành)',
      districtVi: 'Ba Đình',
      historicalNoteVi: 'Quảng trường Ba Đình lịch sử, Hoàng Thành Thăng Long và Phủ Chủ Tịch.'
    },
    {
      id: 'hn-thuong-dinh',
      shape: 'square',
      x: 870,
      y: 1040,
      name: 'Thượng Đình (Royal City / Ngã Tư Sở)',
      districtVi: 'Thanh Xuân',
      historicalNoteVi: 'Ga Metro Tuyến 2A kết nối đại đô thị Royal City và Ngã Tư Sở sầm uất.'
    },
    {
      id: 'hn-my-dinh',
      shape: 'cross',
      x: 550,
      y: 910,
      name: 'Mỹ Đình (Sân Vận Động Quốc Gia)',
      districtVi: 'Nam Từ Liêm',
      historicalNoteVi: 'Trung tâm thể thao quốc gia, Trung tâm Hội nghị Quốc gia và các khu đô thị mới.'
    },
    {
      id: 'hn-giap-bat',
      shape: 'square',
      x: 1180,
      y: 1230,
      name: 'Giáp Bát (Bến Xe Cửa Ngõ Nam)',
      districtVi: 'Hoàng Mai',
      historicalNoteVi: 'Đầu mối xe khách liên tỉnh phía Nam kết nối các tỉnh duyên hải Bắc Bộ.'
    },
    {
      id: 'hn-linh-dam',
      shape: 'circle',
      x: 1040,
      y: 1370,
      name: 'Linh Đàm (Bán Đảo Xanh)',
      districtVi: 'Hoàng Mai',
      historicalNoteVi: 'Bán đảo sinh thái với mật độ dân cư và nhu cầu giao thông cực lớn.'
    }
  ],

  // Comprehensive Station Pool (38 stations covering actual Metro 2A, Metro 3, Line 1, Line 2, and major hubs!)
  stationPool: [
    {
      shape: 'star',
      x: 1040,
      y: 150,
      name: 'Sân Bay Quốc Tế Nội Bài',
      districtVi: 'Sóc Sơn',
      specialHubType: 'airport',
      historicalNoteVi: 'Cảng hàng không quốc tế cửa ngõ thủ đô, lưu lượng hành khách liên lục địa.'
    },
    // Real Metro Line 2A Stations (Cát Linh - Hà Đông)
    {
      shape: 'triangle',
      x: 950,
      y: 960,
      name: 'Thái Hà (Metro 2A)',
      districtVi: 'Đống Đa',
      historicalNoteVi: 'Ga trên cao Tuyến 2A tại phố Thái Hà sầm uất.'
    },
    {
      shape: 'star',
      x: 380,
      y: 1040,
      name: 'Smart City (Tây Mỗ)',
      districtVi: 'Nam Từ Liêm',
      historicalNoteVi: 'Đại đô thị thông minh hiện đại phía Tây thủ đô kết nối tuyến đường sắt tương lai.'
    },
    {
      shape: 'circle',
      x: 770,
      y: 1140,
      name: 'Vành Đai 3 (Nguyễn Trãi)',
      districtVi: 'Thanh Xuân',
      historicalNoteVi: 'Nút giao đa tầng hiện đại giữa Metro 2A và đường Vành Đai 3.'
    },
    {
      shape: 'diamond',
      x: 690,
      y: 1220,
      name: 'Phùng Khoang',
      districtVi: 'Nam Từ Liêm',
      historicalNoteVi: 'Ga Metro 2A phục vụ các trường đại học lớn Hà Nội.'
    },
    {
      shape: 'square',
      x: 610,
      y: 1300,
      name: 'Văn Quán',
      districtVi: 'Hà Đông',
      historicalNoteVi: 'Cửa ngõ khu đô thị Văn Quán và hồ điều hòa.'
    },
    {
      shape: 'pentagon',
      x: 530,
      y: 1380,
      name: 'Hà Đông (Quang Trung)',
      districtVi: 'Hà Đông',
      historicalNoteVi: 'Trung tâm hành chính quận Hà Đông trên trục đường Quang Trung.'
    },
    {
      shape: 'star',
      x: 430,
      y: 1470,
      name: 'Yên Nghĩa (Depot 2A)',
      districtVi: 'Hà Đông',
      historicalNoteVi: 'Ga cuối cùng và Depot phía Tây Nam của Tuyến 2A Cát Linh - Hà Đông.'
    },

    // Real Metro Line 3 Stations (Nhổn - Ga Hà Nội)
    {
      shape: 'circle',
      x: 1130,
      y: 920,
      name: 'Ga Hà Nội (Lê Duẩn)',
      districtVi: 'Hoàn Kiếm / Đống Đa',
      historicalNoteVi: 'Ga ngầm hiện đại trung tâm nối Metro Tuyến 3 với hệ thống đường sắt quốc gia.'
    },
    {
      shape: 'diamond',
      x: 1100,
      y: 860,
      name: 'Văn Miếu (Quốc Tử Giám)',
      districtVi: 'Đống Đa',
      historicalNoteVi: 'Ga ngầm Metro 3 tiếp giáp trường đại học đầu tiên của Việt Nam.'
    },
    {
      shape: 'cross',
      x: 900,
      y: 860,
      name: 'Kim Mã (Metro 3 Ngầm)',
      districtVi: 'Ba Đình',
      historicalNoteVi: 'Điểm chuyển tiếp giữa đoạn chạy trên cao và đoạn đi ngầm sâu của Metro 3.'
    },
    {
      shape: 'triangle',
      x: 700,
      y: 820,
      name: 'Chùa Hà (Cầu Giấy)',
      districtVi: 'Cầu Giấy',
      historicalNoteVi: 'Ga trên cao Metro 3 gần ngôi chùa cầu duyên nổi tiếng.'
    },
    {
      shape: 'circle',
      x: 620,
      y: 800,
      name: 'Đại Học Quốc Gia (Xuân Thủy)',
      districtVi: 'Cầu Giấy',
      historicalNoteVi: 'Khu liên hiệp các trường đại học lớn với hàng vạn sinh viên mỗi ngày.'
    },
    {
      shape: 'square',
      x: 490,
      y: 780,
      name: 'Cầu Diễn',
      districtVi: 'Bắc Từ Liêm',
      historicalNoteVi: 'Ga trên cao Metro 3 bắc qua dòng sông Nhuệ.'
    },
    {
      shape: 'diamond',
      x: 380,
      y: 760,
      name: 'Phú Diễn',
      districtVi: 'Bắc Từ Liêm',
      historicalNoteVi: 'Ga Metro 3 kết nối khu dân cư và các trường cao đẳng phía Tây.'
    },
    {
      shape: 'star',
      x: 250,
      y: 740,
      name: 'Nhổn (Depot Tuyến 3)',
      districtVi: 'Bắc Từ Liêm',
      historicalNoteVi: 'Ga đầu tuyến và khu Depot bảo dưỡng hiện đại của Metro Tuyến 3.'
    },

    // Ba Đình & Tây Hồ Landmarks
    {
      shape: 'circle',
      x: 1480,
      y: 220,
      name: 'Cổ Loa (Thành Cổ Đông Anh)',
      districtVi: 'Đông Anh',
      historicalNoteVi: 'Khu di tích lịch sử Thành Cổ Loa ngàn năm gắn liền với nỏ thần Kim Quy.'
    },
    {
      shape: 'triangle',
      x: 920,
      y: 510,
      name: 'Công Viên Nước Hồ Tây (Lạc Long Quân)',
      districtVi: 'Tây Hồ',
      historicalNoteVi: 'Khu giải trí nổi tiếng ven Hồ Tây trên đường Lạc Long Quân.'
    },
    {
      shape: 'triangle',
      x: 980,
      y: 430,
      name: 'Nhật Tân (Làng Hoa Đào)',
      districtVi: 'Tây Hồ',
      historicalNoteVi: 'Chân cầu Nhật Tân và thủ phủ làng hoa đào truyền thống của xứ Kinh Kỳ.'
    },
    {
      shape: 'pentagon',
      x: 1190,
      y: 720,
      name: 'Trúc Bạch (Thanh Niên)',
      districtVi: 'Ba Đình',
      historicalNoteVi: 'Đường Thanh Niên rợp bóng mát ngăn cách giữa Hồ Tây và Trúc Bạch.'
    },
    {
      shape: 'square',
      x: 960,
      y: 790,
      name: 'Liễu Giai (Lotte Center)',
      districtVi: 'Ba Đình',
      historicalNoteVi: 'Tòa tháp Lotte 65 tầng và khu ngoại giao đoàn sầm uất.'
    },

    // Hoàn Kiếm & Hai Bà Trưng Hubs
    {
      shape: 'cross',
      x: 1320,
      y: 890,
      name: 'Tràng Tiền (Nhà Hát Lớn)',
      districtVi: 'Hoàn Kiếm',
      historicalNoteVi: 'Trung tâm văn hóa nghệ thuật và kem Tràng Tiền danh tiếng.'
    },
    {
      shape: 'circle',
      x: 1270,
      y: 1010,
      name: 'Hai Bà Trưng (Phố Huế)',
      districtVi: 'Hai Bà Trưng',
      historicalNoteVi: 'Trục giao thương sôi động bậc nhất phía Nam phố cổ.'
    },
    {
      shape: 'diamond',
      x: 1200,
      y: 1090,
      name: 'Bạch Mai (Bệnh Viện)',
      districtVi: 'Hai Bà Trưng',
      historicalNoteVi: 'Trung tâm y tế lớn nhất miền Bắc với Bệnh viện Bạch Mai và Việt Pháp.'
    },
    {
      shape: 'square',
      x: 1420,
      y: 1100,
      name: 'Times City (Minh Khai)',
      districtVi: 'Hai Bà Trưng',
      historicalNoteVi: 'Đại đô thị hiện đại bên chân cầu Vĩnh Tuy.'
    },

    // Bờ Bắc & Qua Sông Hồng (Long Biên, Gia Lâm, Đông Anh, Sân bay)
    {
      shape: 'star',
      x: 980,
      y: 140,
      name: 'Sân Bay Nội Bài (T1-T2)',
      districtVi: 'Sóc Sơn',
      historicalNoteVi: 'Nhà ga quốc tế và quốc nội đón hàng triệu hành khách mỗi năm.'
    },
    {
      shape: 'circle',
      x: 1320,
      y: 330,
      name: 'Đông Anh (Bắc Sông Hồng)',
      districtVi: 'Đông Anh',
      historicalNoteVi: 'Vùng đất Thành Cổ Loa lịch sử và trung tâm phát triển đô thị phía Bắc.'
    },
    {
      shape: 'square',
      x: 1540,
      y: 680,
      name: 'Ngọc Lâm (Gia Lâm)',
      districtVi: 'Long Biên',
      historicalNoteVi: 'Khu dân cư nhộn nhịp bên bờ Bắc Sông Hồng.'
    },
    {
      shape: 'triangle',
      x: 1490,
      y: 870,
      name: 'Bồ Đề (Ven Sông)',
      districtVi: 'Long Biên',
      historicalNoteVi: 'Khu vực ven sông Hồng nhìn về toàn cảnh phố cổ Hà Nội.'
    },
    {
      shape: 'pentagon',
      x: 1720,
      y: 810,
      name: 'Sài Đồng (Khu Công Nghệ)',
      districtVi: 'Long Biên',
      historicalNoteVi: 'Trung tâm công nghiệp nhẹ và đô thị sinh thái phía Đông.'
    },
    {
      shape: 'circle',
      x: 1670,
      y: 950,
      name: 'Aeon Mall Long Biên',
      districtVi: 'Long Biên',
      historicalNoteVi: 'Trung tâm thương mại lớn điểm tựa giao thông đường Cổ Linh.'
    },
    {
      shape: 'diamond',
      x: 1840,
      y: 1440,
      name: 'Bát Tràng (Làng Gốm)',
      districtVi: 'Gia Lâm',
      historicalNoteVi: 'Điểm du lịch văn hóa truyền thống nức tiếng gần xa.'
    },

    // Khu vực Đông, Nam & Vệ Tinh (Ocean Park, Ecopark, Keangnam, Thanh Trì)
    {
      shape: 'pentagon',
      x: 2050,
      y: 1100,
      name: 'Ocean Park (Vinhomes Gia Lâm)',
      districtVi: 'Gia Lâm',
      historicalNoteVi: 'Thành phố biển hồ nhân tạo kỳ vĩ bậc nhất phía Đông Thủ đô.'
    },
    {
      shape: 'diamond',
      x: 650,
      y: 970,
      name: 'Keangnam (Mễ Trì)',
      districtVi: 'Nam Từ Liêm',
      historicalNoteVi: 'Tòa tháp tài chính và cộng đồng quốc tế sôi động.'
    },
    {
      shape: 'pentagon',
      x: 1960,
      y: 1350,
      name: 'Ecopark (Đô Thị Xanh)',
      districtVi: 'Gia Lâm / Văn Giang',
      historicalNoteVi: 'Đại đô thị sinh thái xanh bên dòng sông Bắc Hưng Hải hiền hòa.'
    },
    {
      shape: 'triangle',
      x: 1290,
      y: 1450,
      name: 'Thanh Trì (Tứ Hiệp / Pháp Vân)',
      districtVi: 'Thanh Trì',
      historicalNoteVi: 'Cửa ngõ cao tốc Pháp Vân - Cầu Giẽ huyết mạch nối về phương Nam.'
    },
    {
      shape: 'triangle',
      x: 1390,
      y: 1370,
      name: 'Yên Sở (Vành Đai 3)',
      districtVi: 'Hoàng Mai',
      historicalNoteVi: 'Công viên sinh thái hồ điều hòa lớn nhất Thủ đô.'
    },
    {
      shape: 'star',
      x: 770,
      y: 690,
      name: 'Nghĩa Đô (Hoàng Quốc Việt)',
      districtVi: 'Cầu Giấy',
      historicalNoteVi: 'Trục đường công nghệ viện nghiên cứu và công viên Nghĩa Đô.'
    },
    {
      shape: 'cross',
      x: 820,
      y: 420,
      name: 'Phú Thượng (Ciputra)',
      districtVi: 'Tây Hồ',
      historicalNoteVi: 'Khu đô thị quốc tế Nam Thăng Long ven hồ Tây.'
    }
  ],

  // Real Metro Line Presets: allows the user to instantly load actual lines!
  realLinesPreset: [
    {
      id: 'hn-preset-line-2a',
      nameVi: 'Tuyến 2A: Cát Linh — Hà Đông',
      nameEn: 'Line 2A: Cat Linh — Ha Dong',
      color: '#10B981',
      darkColor: '#047857',
      textColor: '#FFFFFF',
      stationIds: [
        'hn-cat-linh',
        'hn-thai-ha',
        'hn-thuong-dinh',
        'hn-vanh-dai-3',
        'hn-phung-khoang',
        'hn-van-quan',
        'hn-ha-dong',
        'hn-yen-nghia'
      ]
    },
    {
      id: 'hn-preset-line-3',
      nameVi: 'Tuyến 3: Nhổn — Ga Hà Nội',
      nameEn: 'Line 3: Nhon — Hanoi Station',
      color: '#F59E0B',
      darkColor: '#B45309',
      textColor: '#FFFFFF',
      stationIds: [
        'hn-nhon',
        'hn-phu-dien',
        'hn-cau-dien',
        'hn-dh-quoc-gia',
        'hn-chua-ha',
        'hn-cau-giay',
        'hn-kim-ma',
        'hn-cat-linh',
        'hn-van-mieu',
        'hn-ga-ha-noi'
      ]
    }
  ]
};
