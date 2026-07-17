import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Check, 
  Clock, 
  UserPlus, 
  ChevronLeft, 
  Share2, 
  Loader2, 
  X, 
  UserCheck, 
  LogOut, 
  Trash2,
  Pencil,
  Coins
} from 'lucide-react';
import { useCompanionStore } from '../store/useCompanionStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { TripEditModal } from '../components/TripEditModal';
import { InviteFriendsModal } from '../components/InviteFriendsModal';

const DB_LOCATION_MAP: Record<string, number> = {
  'hà nội': 1,
  'hồ chí minh': 2,
  'tp. hồ chí minh': 2,
  'đà nẵng': 3,
  'quảng ngãi': 4,
  'lâm đồng': 5,
  'an giang': 7,
  'bắc ninh': 23,
  'cà mau': 41,
  'cao bằng': 44,
  'cần thơ': 47,
  'đắk lắk': 52,
  'điện biên': 58,
  'đồng nai': 61,
  'đồng tháp': 64,
  'gia lai': 67,
  'hà tĩnh': 79,
  'hải phòng': 85,
  'hưng yên': 94,
  'khánh hòa': 97,
  'lai châu': 106,
  'lạng sơn': 109,
  'lào cai': 112,
  'nghệ an': 123,
  'ninh bình': 126,
  'quảng ninh': 146,
  'quảng trị': 149,
  'sơn la': 155,
  'tây ninh': 158,
  'thái nguyên': 164,
  'thanh hóa': 167,
  'thừa thiên huế': 170,
  'tp. huế': 170,
  'tuyên quang': 183,
  'vĩnh long': 186,
  'phú thọ': 199
};

const getDestinationId = (locationName: string): number => {
  const nameClean = locationName.toLowerCase().trim();
  for (const [key, val] of Object.entries(DB_LOCATION_MAP)) {
    if (nameClean.includes(key) || key.includes(nameClean)) {
      return val;
    }
  }
  return 1; // fallback
};

const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { 
    trips, 
    joinTrip, 
    fetchTripDetail, 
    fetchJoinRequests, 
    handleRequest,
    leaveTripAction,
    removeMemberAction,
    deleteTripAction,
    toggleActivityAction,
    updateTripAction,
    inviteFriendAction,
    acceptInvitationAction,
    rejectInvitationAction,
    fetchMutualFriends
  } = useCompanionStore();
  
  const [isJoining, setIsJoining] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showSuccessDialog = (title: string, message: string, onConfirm?: () => void) => {
    setDialog({ isOpen: true, type: 'success', title, message, onConfirm });
  };

  const showErrorDialog = (title: string, message: string) => {
    setDialog({ isOpen: true, type: 'error', title, message });
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setDialog({ isOpen: true, type: 'confirm', title, message, onConfirm, onCancel });
  };
  
  const trip = trips.find(t => t.id === id);
  const isOwner = currentUser?.id && trip?.creator && (String(currentUser.id) === String(trip.user_id || ''));
  const userStatus = trip?.userStatus;
  const isJoined = joined || userStatus === 'pending' || userStatus === 'accepted';

  const itineraryArray = Array.isArray(trip?.itinerary) ? trip.itinerary : [];
  const totalDays = itineraryArray.length;
  const completedDays = itineraryArray.filter(day => day.completed).length;
  const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 105 - 5 /* to avoid division by zero handles */) : 0;
  // Let's keep it simple:
  const progressPercentReal = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  useEffect(() => {
    if (userStatus === 'pending' || userStatus === 'accepted') {
      setJoined(true);
    } else {
      setJoined(false);
    }
  }, [userStatus]);

  useEffect(() => {
    const loadDetail = async () => {
      if (id) {
        setIsLoading(true);
        await fetchTripDetail(id);
        setIsLoading(false);
      }
    };
    loadDetail();
  }, [id, fetchTripDetail]);

  useEffect(() => {
    const loadRequests = async () => {
      if (id && isOwner) {
        setRequestsLoading(true);
        const data = await fetchJoinRequests(id);
        setRequests(data);
        setRequestsLoading(false);
      }
    };
    loadRequests();
  }, [id, isOwner, fetchJoinRequests]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-orange-500 animate-spin" />
          <p className="text-slate-500 font-bold">Đang tải chi tiết chuyến đi...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Không tìm thấy chuyến đi</h2>
          <button 
            onClick={() => navigate('/companion')}
            className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const handleJoin = async () => {
    if (!id) return;
    if (userStatus === 'accepted') {
      showSuccessDialog('Thông báo', 'Bạn đã là thành viên của chuyến đi này!');
      return;
    }
    setIsJoining(true);
    const success = await joinTrip(id, 'Tôi muốn tham gia chuyến đi này!');
    setIsJoining(false);
    if (success) {
      setJoined(true);
      showSuccessDialog('Thành công', 'Gửi yêu cầu tham gia thành công! Vui lòng chờ chủ chuyến đi phê duyệt.');
    } else {
      showErrorDialog('Thất bại', 'Không thể gửi yêu cầu tham gia. Có thể bạn đã gửi yêu cầu trước đó.');
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    showConfirmDialog(
      'Rời khỏi chuyến đi',
      'Bạn có chắc chắn muốn rời khỏi chuyến đi này?',
      async () => {
        setIsProcessing(true);
        const success = await leaveTripAction(id);
        setIsProcessing(false);
        if (success) {
          showSuccessDialog('Rời chuyến đi', 'Đã rời chuyến đi thành công.');
          setJoined(false);
        } else {
          showErrorDialog('Thất bại', 'Thao tác rời đoàn thất bại.');
        }
      }
    );
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!id) return;
    showConfirmDialog(
      'Loại thành viên',
      `Bạn có chắc chắn muốn loại ${name} khỏi đoàn thám hiểm?`,
      async () => {
        const success = await removeMemberAction(id, userId);
        if (success) showSuccessDialog('Thành công', `Đã loại ${name} khỏi đoàn.`);
        else showErrorDialog('Thất bại', 'Thao tác loại thành viên thất bại.');
      }
    );
  };

  const handleDeleteTrip = async () => {
    if (!id) return;
    showConfirmDialog(
      'Giải tán chuyến đi',
      'CẢNH BÁO: Bạn có chắc chắn muốn giải tán chuyến đi này? Hành động này không thể hoàn tác.',
      async () => {
        setIsProcessing(true);
        const success = await deleteTripAction(id);
        setIsProcessing(false);
        if (success) {
          showSuccessDialog('Giải tán thành công', 'Đã giải tán chuyến đi thành công.', () => {
            navigate('/companion');
          });
        } else {
          showErrorDialog('Thất bại', 'Thao tác giải tán chuyến đi thất bại.');
        }
      }
    );
  };

  const onHandleRequest = async (userId: string, action: 'accept' | 'reject') => {
    if (!id) return;
    const success = await handleRequest(id, userId, action);
    if (success) {
      setRequests(prev => prev.filter(r => String(r.user_id) !== String(userId)));
      showSuccessDialog(
        action === 'accept' ? 'Chấp nhận' : 'Từ chối',
        action === 'accept' ? 'Đã chấp nhận thành viên!' : 'Đã từ chối yêu cầu tham gia.'
      );
    } else {
      showErrorDialog('Thất bại', 'Thao tác xử lý yêu cầu thất bại.');
    }
  };

  const handleToggleActivity = async (activityId: string, currentStatus: boolean) => {
    if (!id || !isOwner || togglingId) return;
    setTogglingId(activityId);
    const success = await toggleActivityAction(id, activityId, !currentStatus);
    setTogglingId(null);
    if (!success) {
      showErrorDialog('Thất bại', 'Không thể cập nhật trạng thái hoạt động. Vui lòng thử lại.');
    }
  };

  const handleStartTrip = async () => {
    if (!id || !trip) return;
    setIsProcessing(true);
    try {
      const destinationId = getDestinationId(trip.location);
      const tripData = {
        title: trip.title,
        location: trip.location,
        destination_id: destinationId,
        start_date: trip.startDate,
        end_date: trip.endDate,
        max_participants: trip.participants,
        description: trip.description || '',
        budget: trip.budget || 0,
        itinerary: trip.itinerary,
        tags: trip.tags,
        status: 'ongoing'
      };
      
      const success = await updateTripAction(id, tripData);
      if (success) {
        showSuccessDialog('Khởi hành', 'Chuyến đi đã chính thức bắt đầu!');
      } else {
        showErrorDialog('Thất bại', 'Không thể bắt đầu chuyến đi.');
      }
    } catch (e: any) {
      showErrorDialog('Lỗi hệ thống', e.message || 'Lỗi không xác định');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!id || !trip) return;
    showConfirmDialog(
      'Kết thúc chuyến đi',
      'Bạn có chắc chắn muốn kết thúc chuyến đi này không?',
      async () => {
        setIsProcessing(true);
        try {
          const updatedItinerary = trip.itinerary.map(day => ({
            ...day,
            completed: true
          }));

          const destinationId = getDestinationId(trip.location);
          const tripData = {
            title: trip.title,
            location: trip.location,
            destination_id: destinationId,
            start_date: trip.startDate,
            end_date: trip.endDate,
            max_participants: trip.participants,
            description: trip.description || '',
            budget: trip.budget || 0,
            itinerary: updatedItinerary,
            tags: trip.tags,
            status: 'completed'
          };
          
          const success = await updateTripAction(id, tripData);
          if (success) {
            showSuccessDialog('Hoàn thành', 'Chúc mừng! Chuyến đi của bạn đã hoàn thành tốt đẹp.');
          } else {
            showErrorDialog('Thất bại', 'Không thể kết thúc chuyến đi.');
          }
        } catch (e: any) {
          showErrorDialog('Lỗi hệ thống', e.message || 'Lỗi không xác định');
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  const handleToggleDay = async (dayNumber: number, currentCompleted: boolean) => {
    if (!id || !trip || isProcessing) return;
    setIsProcessing(true);
    try {
      const updatedItinerary = trip.itinerary.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            completed: !currentCompleted
          };
        }
        return day;
      });

      const destinationId = getDestinationId(trip.location);
      const tripData = {
        title: trip.title,
        location: trip.location,
        destination_id: destinationId,
        start_date: trip.startDate,
        end_date: trip.endDate,
        max_participants: trip.participants,
        description: trip.description || '',
        budget: trip.budget || 0,
        itinerary: updatedItinerary,
        tags: trip.tags,
        status: trip.status
      };
      
      const success = await updateTripAction(id, tripData);
      if (!success) {
        showErrorDialog('Thất bại', 'Không thể cập nhật trạng thái ngày.');
      }
    } catch (e: any) {
      showErrorDialog('Lỗi hệ thống', e.message || 'Lỗi không xác định');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      const success = await acceptInvitationAction(id);
      if (success) {
        setJoined(true);
        showSuccessDialog('Thành công', 'Chúc mừng! Bạn đã đồng ý tham gia chuyến đi thành công.');
      } else {
        showErrorDialog('Thất bại', 'Không thể đồng ý tham gia chuyến đi. Vui lòng thử lại.');
      }
    } catch (e: any) {
      showErrorDialog('Lỗi hệ thống', e.message || 'Lỗi không xác định');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectInvitation = async () => {
    if (!id) return;
    showConfirmDialog(
      'Từ chối lời mời',
      'Bạn có chắc chắn muốn từ chối lời mời này không?',
      async () => {
        setIsProcessing(true);
        try {
          const success = await rejectInvitationAction(id);
          if (success) {
            setJoined(false);
            showSuccessDialog('Từ chối thành công', 'Bạn đã từ chối lời mời tham gia chuyến đi.');
          } else {
            showErrorDialog('Thất bại', 'Thao tác từ chối thất bại. Vui lòng thử lại.');
          }
        } catch (e: any) {
          showErrorDialog('Lỗi hệ thống', e.message || 'Lỗi không xác định');
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  const steps = [
    { label: 'Chuẩn bị', id: 'preparing' },
    { label: 'Đang diễn ra', id: 'ongoing' },
    { label: 'Hoàn thành', id: 'completed' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === trip.status);

  const getButtonText = () => {
    if (isJoining) return 'Đang gửi yêu cầu...';
    if (userStatus === 'accepted') return 'Bạn là thành viên';
    if (isJoined) return 'Đã gửi yêu cầu';
    if (userStatus === 'rejected') return 'Gửi lại yêu cầu';
    return 'Tham gia chuyến đi';
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="relative h-[450px] w-full overflow-hidden">
        <img 
          src={trip.bannerImage} 
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-8 left-6 right-6 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex gap-2">
            {isOwner && (
              <>
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="p-3 bg-orange-500/20 backdrop-blur-md rounded-full text-orange-100 hover:bg-orange-500/40 transition-all border border-orange-500/30"
                  title="Chỉnh sửa chuyến đi"
                >
                  <Pencil size={24} />
                </button>
                <button 
                  onClick={handleDeleteTrip}
                  disabled={isProcessing}
                  className="p-3 bg-red-500/20 backdrop-blur-md rounded-full text-red-100 hover:bg-red-500/40 transition-all border border-red-500/30"
                  title="Giải tán chuyến đi"
                >
                  <Trash2 size={24} />
                </button>
              </>
            )}
            <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all">
              <Share2 size={24} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-8 right-8 text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 leading-tight"
          >
            {trip.title}
          </motion.h1>
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2 text-orange-400 font-bold">
              <MapPin size={20} />
              <span>{trip.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <Users size={20} />
              <span>{trip.currentParticipants}/{trip.participants} người tham gia</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Coins size={20} />
              <span>{trip.budget && Number(trip.budget) > 0 
                ? `${Number(trip.budget).toLocaleString('vi-VN')} đ` 
                : 'Tự túc / Miễn phí'}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-12">
        {/* Participants Section */}
        <div className="mb-16">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <Users className="text-orange-500" size={24} />
            Đoàn thám hiểm ({trip.participantList?.length || 0})
          </h3>
          <div className="flex flex-wrap gap-6">
            {/* Creator always shown first */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <img 
                  src={trip.creator?.avatar || 'https://i.pravatar.cc/150'} 
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-orange-100 shadow-lg" 
                  alt="Trưởng đoàn" 
                />
                <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm uppercase">
                  Trưởng đoàn
                </div>
              </div>
              <span className="text-xs font-bold text-slate-900">{trip.creator?.name}</span>
            </div>

            {/* Other participants */}
            {trip.participantList?.map((p) => (
              <div key={p.user_id} className="flex flex-col items-center gap-2 relative group">
                <div className="relative">
                  <img 
                    src={p.avatar || 'https://i.pravatar.cc/150'} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm" 
                    alt={p.full_name} 
                  />
                  {isOwner && (
                    <button 
                      onClick={() => handleRemoveMember(String(p.user_id), p.full_name)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-600">{p.full_name}</span>
              </div>
            ))}

            {/* Empty slots (Only shown if status is preparing and current user is Trưởng đoàn) */}
            {trip.status === 'preparing' && Array.from({ length: Math.max(0, trip.participants - (trip.participantList?.length || 0) - 1) }).map((_, i) => {
              if (isOwner) {
                return (
                  <button 
                    key={i} 
                    onClick={() => setShowInviteModal(true)}
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all cursor-pointer shadow-sm group/slot active:scale-95 shrink-0"
                    title="Mời bạn bè tham gia"
                  >
                    <UserPlus size={20} className="group-hover/slot:scale-110 transition-transform" />
                  </button>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Owner Management Section */}
        {isOwner && (
          <div className="mb-16 bg-orange-50 rounded-[2.5rem] p-8 border border-orange-100">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <UserCheck className="text-orange-500" />
              Quản lý yêu cầu tham gia
            </h2>
            
            {requestsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-orange-500" />
              </div>
            ) : requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.user_id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <img src={req.avatar || 'https://i.pravatar.cc/150'} alt={req.full_name} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{req.full_name}</p>
                        <p className="text-xs text-slate-500">@{req.username}</p>
                        {req.note && <p className="text-sm text-slate-600 mt-1 italic">"{req.note}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onHandleRequest(req.user_id, 'accept')}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                      >
                        <Check size={20} />
                      </button>
                      <button 
                        onClick={() => onHandleRequest(req.user_id, 'reject')}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 font-medium text-center py-4 bg-white/50 rounded-2xl">
                Chưa có yêu cầu tham gia nào mới.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between relative mb-16">
          <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 -z-10" />
          {steps.map((step, index) => {
            const isActive = index <= currentStepIndex;
            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 ring-4 ring-orange-50' : 'bg-slate-200 text-slate-400'
                }`}>
                  {index < currentStepIndex ? <Check size={20} strokeWidth={3} /> : <span className="font-bold">{index + 1}</span>}
                </div>
                <span className={`text-sm font-black ${isActive ? 'text-orange-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-12">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-2 h-8 bg-orange-500 rounded-full" />
              Lịch trình chi tiết
            </h2>

            {/* Progress Bar for Details Page */}
            {(trip.status === 'ongoing' || trip.status === 'completed') && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-2.5">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Tiến độ hành trình</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Đoàn thám hiểm đã đi qua {completedDays}/{totalDays} ngày</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600">{progressPercentReal}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${progressPercentReal}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-16">
            {trip.itinerary.map((day) => (
              <div key={day.id} className="relative">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-black shadow-lg">
                      {day.dayNumber}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Ngày {day.dayNumber}</h3>
                      <p className="text-slate-400 font-bold">{day.date}</p>
                    </div>
                  </div>

                  {isOwner && (trip.status === 'ongoing' || trip.status === 'completed') && (
                    <button
                      onClick={() => handleToggleDay(day.dayNumber, !!day.completed)}
                      disabled={isProcessing}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 border ${
                        day.completed
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-100 hover:bg-emerald-600'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-500'
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                      <span>{day.completed ? 'Đã hoàn thành' : 'Hoàn thành ngày này'}</span>
                    </button>
                  )}
                </div>

                {/* Horizontal Timeline Container */}
                <div className="relative group">
                  {/* Timeline Background Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t-2 border-dashed border-gray-200 -translate-y-1/2 z-0" />

                  <div className="flex flex-row overflow-x-auto gap-6 p-6 scrollbar-none relative z-10">
                    {day.activities.map((activity, idx) => {
                      const isCompleted = (activity as any).completed;
                      const isToggling = togglingId === activity.id;

                      return (
                        <motion.div 
                          key={activity.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1 }}
                          className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden relative group/card hover:shadow-xl transition-all duration-300"
                        >
                          {/* Timeline Node Point */}
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-orange-50 z-20" />
                          
                          {/* Time Badge */}
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10 uppercase tracking-wider">
                            <Clock size={10} />
                            <span>{activity.time}</span>
                          </div>

                          {/* Action Buttons (Owner only) */}
                          {isOwner && (
                            <button
                              onClick={() => handleToggleActivity(activity.id, !!isCompleted)}
                              disabled={!!togglingId}
                              className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 shadow-lg ${
                                isCompleted 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-white/90 text-slate-400 hover:text-orange-500'
                              } disabled:opacity-50`}
                            >
                              {isToggling ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Check size={14} strokeWidth={4} />
                              )}
                            </button>
                          )}

                          {/* Card Cover */}
                          <div className="w-full h-40 overflow-hidden">
                            <img 
                              src={(activity as any).image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop"} 
                              alt={activity.title}
                              className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                            />
                            {isCompleted && (
                               <div className="absolute inset-0 bg-emerald-500/10 backdrop-grayscale-[0.5] pointer-events-none" />
                            )}
                          </div>

                          {/* Card Body */}
                          <div className="p-4">
                            <h4 className={`text-base font-bold mb-1 line-clamp-1 transition-colors ${
                              isCompleted ? 'text-emerald-700' : 'text-gray-800 group-hover/card:text-orange-600'
                            }`}>
                              {activity.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                              <MapPin size={10} className="text-orange-500 shrink-0" />
                              <span className="truncate">{activity.location}</span>
                            </div>
                            
                            <p className="mt-3 text-xs text-gray-500 line-clamp-2 leading-relaxed italic">
                              "{activity.description}"
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Add Activity Button Card (Owner only) */}
                    {isOwner && (
                      <button 
                        onClick={() => setShowEditModal(true)}
                        className="w-72 h-[264px] flex-shrink-0 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500 transition-all text-gray-400 group/add"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover/add:bg-orange-100 transition-colors">
                          <UserPlus size={24} />
                        </div>
                        <span className="font-bold text-sm uppercase tracking-widest">Thêm hoạt động</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-12 border-t border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-6">Chủ đề chuyến đi</h3>
          <div className="flex flex-wrap gap-2">
            {trip.tags.map(tag => (
              <span key={tag} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="max-w-4xl mx-auto flex gap-3">
          {!isOwner ? (
            userStatus === 'invited' ? (
              <div className="flex-1 flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-orange-50 rounded-[2rem] border border-orange-100 w-full">
                <div className="text-orange-850 font-black text-sm md:ml-4 flex items-center gap-2">
                  <span>📩 Bạn được Trưởng đoàn mời tham gia chuyến đi này!</span>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleAcceptInvitation}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <Check size={16} strokeWidth={3} />
                    <span>Đồng ý tham gia</span>
                  </button>
                  <button 
                    onClick={handleRejectInvitation}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-red-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <X size={16} strokeWidth={3} />
                    <span>Từ chối</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleJoin}
                  disabled={isJoining || (isJoined && userStatus !== 'rejected' && userStatus !== 'accepted')}
                  className={`flex-1 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
                    userStatus === 'accepted'
                    ? 'bg-emerald-500 text-white shadow-emerald-500/40 cursor-default'
                    : isJoined && userStatus !== 'rejected'
                    ? 'bg-orange-400 text-white shadow-orange-400/40 cursor-default' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/40'
                  } disabled:opacity-70`}
                >
                  {isJoining ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (userStatus === 'accepted' || (isJoined && userStatus !== 'rejected')) ? (
                    <Check size={24} />
                  ) : (
                    <UserPlus size={24} />
                  )}
                  <span className="text-lg">
                    {getButtonText()}
                  </span>
                </button>

                {userStatus === 'accepted' && (
                  <button 
                    onClick={handleLeave}
                    disabled={isProcessing}
                    className="px-8 bg-slate-100 text-slate-600 font-black rounded-[2rem] hover:bg-slate-200 transition-all flex items-center gap-2"
                  >
                    <LogOut size={20} />
                    <span>Rời đoàn</span>
                  </button>
                )}
              </>
            )
          ) : (
            <div className="flex-1 flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-orange-50 rounded-[2rem] border border-orange-100">
              <div className="text-orange-800 font-black text-sm md:ml-4">
                💼 Trưởng đoàn: {currentUser?.name}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {trip.status === 'preparing' && (
                  <button 
                    onClick={handleStartTrip}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2"
                  >
                    <span>Bắt đầu chuyến đi</span>
                  </button>
                )}
                {trip.status === 'ongoing' && (
                  <button 
                    onClick={handleCompleteTrip}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <span>Kết thúc chuyến đi</span>
                  </button>
                )}
                {trip.status === 'completed' && (
                  <div className="px-6 py-3 bg-blue-100 text-blue-700 font-bold rounded-2xl border border-blue-200">
                    Chuyến đi đã kết thúc
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <TripEditModal 
          isOpen={showEditModal} 
          onClose={() => setShowEditModal(false)} 
          trip={trip} 
        />
      )}

      {showInviteModal && (
        <InviteFriendsModal 
          isOpen={showInviteModal} 
          onClose={() => setShowInviteModal(false)} 
          trip={trip} 
        />
      )}

      <AnimatePresence>
        {dialog.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (dialog.type !== 'confirm') {
                  setDialog(prev => ({ ...prev, isOpen: false }));
                }
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-sm flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 z-10"
            >
              <div className={`p-5 rounded-[2.2rem] mb-5 flex items-center justify-center ${
                dialog.type === 'success' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30' :
                dialog.type === 'error' ? 'bg-red-50 text-red-500 dark:bg-red-950/30' :
                'bg-orange-50 text-orange-500 dark:bg-orange-950/30'
              }`}>
                {dialog.type === 'success' && <Check size={36} strokeWidth={4} />}
                {dialog.type === 'error' && <X size={36} strokeWidth={4} />}
                {(dialog.type === 'confirm' || dialog.type === 'warning') && <Clock size={36} strokeWidth={4} />}
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{dialog.title}</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {dialog.message}
              </p>

              <div className="flex gap-3 w-full">
                {dialog.type === 'confirm' ? (
                  <>
                    <button
                      onClick={() => {
                        setDialog(prev => ({ ...prev, isOpen: false }));
                        if (dialog.onCancel) dialog.onCancel();
                      }}
                      className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all border border-slate-100 dark:border-slate-700 active:scale-95 text-sm"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => {
                        setDialog(prev => ({ ...prev, isOpen: false }));
                        if (dialog.onConfirm) dialog.onConfirm();
                      }}
                      className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-orange-200 dark:shadow-none active:scale-95 text-sm"
                    >
                      Xác nhận
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setDialog(prev => ({ ...prev, isOpen: false }));
                      if (dialog.onConfirm) dialog.onConfirm();
                    }}
                    className={`w-full py-3.5 font-bold rounded-2xl transition-all active:scale-95 text-sm ${
                      dialog.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none' :
                      dialog.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-none' :
                      'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-none'
                    }`}
                  >
                    Đồng ý
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripDetailPage;
