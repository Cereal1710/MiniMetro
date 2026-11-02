import { CampaignScenario } from '../types/game';

export const CAMPAIGN_SCENARIOS: CampaignScenario[] = [
  {
    id: 'typhoon_yagi',
    cityId: 'hanoi',
    titleVi: 'Kịch bản 1: Cơn Bão Lịch Sử',
    titleEn: 'Scenario 1: Historic Typhoon',
    subtitleVi: 'Sông dâng cao, ga ngập nước, sơ tán người dân an toàn',
    subtitleEn: 'Rising waters, flooded stations, safe citizen evacuation',
    descriptionVi: 'Mưa giông tầm tã trút xuống Hà Nội khiến một số ga ven sông bị ngập. Lượng người đổ dồn về tàu điện ngầm tăng vọt. Hãy đảm bảo mạng lưới không bị sụp đổ và sơ tán an toàn 150 hành khách!',
    descriptionEn: 'Torrential downpours hit Hanoi, submerging riverside stations. Passenger demand surges. Keep the network from collapsing and safely transport 150 passengers!',
    targetPassengers: 150,
    timeLimitDays: 4,
    initialLines: 3,
    initialTrains: 3,
    initialCarriages: 2,
    initialMoney: 1500,
    fixedWeather: 'flooded',
    specialRulesVi: [
      'Thời tiết mưa ngập liên tục, các ga ven sông bị hạn chế tốc độ tàu (-40%).',
      'Nhu cầu đi tàu của hành khách tăng +40% do ngập đường bộ.',
      'Mục tiêu: Đạt 150 hành khách trước 24:00 Ngày thứ 4 mà không để vỡ ga.'
    ],
    specialRulesEn: [
      'Continuous flooding; trains travel at -40% speed around flooded stations.',
      'Passenger influx +40% due to flooded city roadways.',
      'Goal: Deliver 150 passengers before 24:00 Day 4 without any station collapse.'
    ],
    starThresholds: {
      oneStar: 150,
      twoStarDays: 3, // within 3 days
      threeStarDays: 2 // within 2 days
    }
  },
  {
    id: 'stadium_rush',
    cityId: 'hanoi',
    titleVi: 'Kịch bản 2: Đại Nhạc Hội Sân Vận Động Mỹ Đình',
    titleEn: 'Scenario 2: Stadium Grand Concert',
    subtitleVi: 'Hàng ngàn người đổ về ga Ngôi sao (★), kiểm soát điểm nóng',
    subtitleEn: 'Thousands rushing to the Star (★) station, control the hotspot',
    descriptionVi: 'Đại nhạc hội quy tụ hàng vạn khán giả diễn ra tại Mỹ Đình. Hành khách mang biểu tượng Ngôi sao (★) xuất hiện dày đặc vào giờ cao điểm. Hãy bố trí đoàn tàu tăng cường để giải tỏa áp lực.',
    descriptionEn: 'A massive national stadium concert draws thousands to My Dinh. Star (★) passengers emerge en masse during peak hours. Deploy extra carriages to relieve the surge.',
    targetPassengers: 250,
    timeLimitDays: 3,
    initialLines: 4,
    initialTrains: 4,
    initialCarriages: 3,
    initialMoney: 2500,
    fixedWeather: 'sunny',
    specialRulesVi: [
      'Ga Mỹ Đình mang hình Ngôi sao (★) và thu hút lượng khách khổng lồ.',
      'Giờ cao điểm kéo dài hơn bình thường.',
      'Mục tiêu: Vận chuyển an toàn 250 hành khách trước Ngày thứ 3.'
    ],
    specialRulesEn: [
      'My Dinh Stadium is a Star (★) station with massive passenger accumulation.',
      'Extended rush-hour surges.',
      'Goal: Deliver 250 passengers safely before Day 3 ends.'
    ],
    starThresholds: {
      oneStar: 250,
      twoStarDays: 2.5,
      threeStarDays: 2
    }
  },
  {
    id: 'budget_master',
    cityId: 'hanoi',
    titleVi: 'Kịch bản 3: Thắt Lưng Buộc Bụng',
    titleEn: 'Scenario 3: Budget Master',
    subtitleVi: 'Giới hạn tối đa 2 tuyến ray, tối ưu chi phí & đạt doanh thu cao',
    subtitleEn: 'Strict 2-line limit, optimize transit costs & achieve high revenue',
    descriptionVi: 'Thành phố siết chặt ngân sách quy hoạch. Bạn chỉ được sử dụng tối đa 2 tuyến ray chính để vận chuyển 200 hành khách và tích lũy ít nhất $3.500 ngân sách hoạt động.',
    descriptionEn: 'City transit department limits network to only 2 routes. Deliver 200 passengers and accumulate at least $3,500 in operating budget.',
    targetPassengers: 200,
    timeLimitDays: 5,
    initialLines: 2,
    initialTrains: 3,
    initialCarriages: 1,
    initialMoney: 800,
    fixedWeather: 'sunny',
    specialRulesVi: [
      'Chỉ được dùng tối đa 2 tuyến metro, không thể mua thêm tuyến mới.',
      'Cần tích lũy đủ $3.500 ngân sách cùng với 200 khách để thắng.',
      'Bắt buộc quản lý lộ trình xoay vòng hiệu quả để tránh nghẽn ga.'
    ],
    specialRulesEn: [
      'Strict limit of 2 metro lines; no new lines can be purchased.',
      'Must accumulate $3,500 budget in addition to 200 passengers to win.',
      'Requires smart route planning and turnaround management.'
    ],
    starThresholds: {
      oneStar: 200,
      twoStarDays: 4,
      threeStarDays: 3
    }
  }
];
