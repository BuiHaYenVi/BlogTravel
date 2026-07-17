import { create } from 'zustand';

interface Activity {
  time: string;
  activity_title: string;
  location_name: string;
  description: string;
}

interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
}

interface TripState {
  id: string;
  title: string;
  location: string;
  participants: number;
  status: 'preparing' | 'ongoing' | 'completed';
  itinerary: DayPlan[];
  tags: string[];
}

export const useTripStore = create<TripState>(() => ({
  id: "1",
  title: "Khám phá Đà Lạt - Thành phố ngàn hoa",
  location: "Đà Lạt, Lâm Đồng",
  participants: 12,
  status: "preparing",
  tags: ["Camping", "Hiking", "Adventure", "Food"],
  itinerary: [
    {
      day: 1,
      date: "20/05/2026",
      activities: [
        {
          time: "08:00",
          activity_title: "Tập trung & Khởi hành",
          location_name: "Bến xe Thành Bưởi",
          description: "Mọi người tập trung đúng giờ để kiểm tra hành lý và bắt đầu hành trình lên cao nguyên."
        },
        {
          time: "14:00",
          activity_title: "Check-in Homestay",
          location_name: "The Dreamer Homestay",
          description: "Nhận phòng, nghỉ ngơi sau chuyến đi dài và chuẩn bị đồ đạc cho buổi chiều."
        },
        {
          time: "16:30",
          activity_title: "Ngắm hoàng hôn",
          location_name: "Tiệm Cà Phê Túi Mơ To",
          description: "Thưởng thức cafe trong không gian mộng mơ và ngắm nhìn toàn cảnh thành phố lúc lên đèn."
        }
      ]
    },
    {
      day: 2,
      date: "21/05/2026",
      activities: [
        {
          time: "05:00",
          activity_title: "Săn mây đại ngàn",
          location_name: "Đồi chè Cầu Đất",
          description: "Trải nghiệm cảm giác đứng trên thảm mây trắng xóa và hít thở không khí trong lành buổi sớm."
        },
        {
          time: "10:00",
          activity_title: "Tham quan vườn dâu",
          location_name: "Vườn dâu Biofresh",
          description: "Tự tay hái những trái dâu tây chín mọng và tìm hiểu về quy trình trồng dâu công nghệ cao."
        }
      ]
    }
  ]
}));
