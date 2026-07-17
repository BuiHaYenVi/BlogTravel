import { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Users, 
  Lock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  X, 
  ChevronRight,
  Info,
  Save,
  MoreVertical,
  Unlock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { roleService } from '../../../services/roleService';

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  userCount: number;
  level: number;
  color: string;
  isSystem: boolean;
  permissions: {
    category: string;
    actions: { name: string; key: string; enabled: boolean }[];
  }[];
}

const AdminRBACPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', slug: '', description: '', level: 1, color: '#334155' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response: any = await roleService.getRoles();
      if (response?.data) {
        const mappedRoles = response.data.map((r: any) => ({
          id: r.id.toString(),
          name: r.name,
          slug: r.slug,
          description: r.description || 'Không có mô tả.',
          userCount: parseInt(r.users_count) || 0,
          level: r.level || 0,
          color: r.color || '#334155',
          isSystem: !!r.is_system,
          permissions: r.permissions_grouped || []
        }));
        setRoles(mappedRoles);
        if (mappedRoles.length > 0) {
          setSelectedRole(mappedRoles[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePermission = (groupIndex: number, actionIndex: number) => {
    if (!selectedRole || !isEditing) return;

    const newRoles = roles.map(r => {
      if (r.id === selectedRole.id) {
        const newPerms = [...r.permissions];
        const newGroup = { ...newPerms[groupIndex] };
        const newActions = [...newGroup.actions];
        newActions[actionIndex] = { ...newActions[actionIndex], enabled: !newActions[actionIndex].enabled };
        newGroup.actions = newActions;
        newPerms[groupIndex] = newGroup;
        const updatedRole = { ...r, permissions: newPerms };
        setSelectedRole(updatedRole);
        return updatedRole;
      }
      return r;
    });
    setRoles(newRoles);
  };

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.slug) return;
    setIsSaving(true);
    try {
      await roleService.createRole(newRole);
      setIsCreating(false);
      setNewRole({ name: '', slug: '', description: '', level: 1, color: '#334155' });
      fetchData();
    } catch (error) {
      alert("Thêm vai trò thất bại!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await roleService.deleteRole(selectedRole.id);
      setIsDeleting(false);
      fetchData();
    } catch (error) {
      alert("Xóa vai trò thất bại! Có thể vai trò này là mặc định hệ thống hoặc đang có người dùng sử dụng.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      // Flatten permissions for API
      const enabledPermissions = selectedRole.permissions
        .flatMap(group => group.actions)
        .filter(action => action.enabled)
        .map(action => action.key);

      await roleService.updateRolePermissions(selectedRole.id, enabledPermissions);
      alert("Đã lưu thay đổi cho vai trò " + selectedRole.name);
      setIsEditing(false);
    } catch (error) {
      alert("Lưu thất bại!");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[500px]">
       <div className="w-12 h-12 border-4 border-pastel-orange border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Phân quyền & Vai trò</h1>
          <p className="text-slate-500 text-sm mt-1">Cấu hình các cấp độ truy cập và quyền hạn cho nhân viên quản trị.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/10"
        >
          <Plus size={18} />
          Thêm vai trò mới
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left: Role List */}
        <div className="xl:col-span-4 space-y-4">
           {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => { setSelectedRole(role); setIsEditing(false); }}
                className={clsx(
                  "w-full text-left p-6 rounded-[2rem] border transition-all relative group overflow-hidden",
                  selectedRole?.id === role.id 
                    ? "bg-white border-pastel-orange shadow-xl shadow-orange-500/5 ring-4 ring-orange-50" 
                    : "bg-white border-slate-100/60 hover:border-slate-200/80 shadow-sm"
                )}
              >
                 <div className="flex items-start justify-between">
                    <div 
                      className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm text-white",
                        selectedRole?.id === role.id ? "opacity-100" : "opacity-40"
                      )}
                      style={{ backgroundColor: role.color || '#334155' }}
                    >
                       <Shield size={24} />
                    </div>
                    {selectedRole?.id === role.id && (
                      <motion.div layoutId="active-indicator" className="bg-pastel-orange w-2 h-10 rounded-full absolute -right-1 top-1/2 -translate-y-1/2"></motion.div>
                    )}
                 </div>
                 <div className="mt-6">
                    <h3 className="text-lg font-black text-slate-900">{role.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium line-clamp-2">{role.description}</p>
                 </div>
                 <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Users size={14} className="text-slate-400" />
                       <span className="text-xs font-bold text-slate-600 tabular-nums">{role.userCount} thành viên</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       Lvl {role.level}
                    </div>
                 </div>
              </button>
           ))}
        </div>

        {/* Right: Permissions Grid */}
        <div className="xl:col-span-8">
           <AnimatePresence mode="wait">
              {selectedRole ? (
                <motion.div
                  key={selectedRole.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden h-full"
                >
                   {/* Role Summary Header */}
                   <div className="p-10 border-b border-slate-50 bg-gradient-to-br from-white to-slate-50/50">
                      <div className="flex items-start justify-between">
                         <div className="space-y-2">
                            <div className="flex items-center gap-3">
                               <h2 className="text-3xl font-black text-slate-900">{selectedRole.name}</h2>
                               <div 
                                 className="w-4 h-4 rounded-full border border-white shadow-sm"
                                 style={{ backgroundColor: selectedRole.color }}
                               ></div>
                               {selectedRole.level >= 10 && (
                                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Cấp cao nhất</span>
                               )}
                            </div>
                            <p className="text-slate-500 font-medium max-w-xl">{selectedRole.description}</p>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => setIsDeleting(true)}
                              className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 rounded-2xl transition-all shadow-sm"
                              title="Xóa vai trò"
                            >
                               <Trash2 size={20} />
                            </button>
                            <button 
                              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                              disabled={isSaving}
                              className={clsx(
                                "px-6 py-3 bg-pastel-orange text-white rounded-2xl text-sm font-black shadow-lg shadow-pastel-orange/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50",
                                isSaving && "animate-pulse"
                              )}
                            >
                               {isSaving ? <RefreshCw size={18} className="animate-spin" /> : (isEditing ? <Save size={18} /> : <Edit size={18} />)}
                               {isSaving ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa quyền')}
                            </button>
                         </div>
                      </div>
                   </div>

                   {/* Permissions Content */}
                   <div className="p-10 space-y-12">
                      {isEditing && (
                         <div className="bg-amber-50 border border-amber-100/60 p-5 rounded-3xl flex items-center gap-4 text-amber-900">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                               <AlertTriangle size={24} />
                            </div>
                            <div>
                               <p className="text-sm font-bold">Bạn đang trong chế độ chỉnh sửa!</p>
                               <p className="text-xs opacity-75 font-medium">Thay đổi sẽ ảnh hưởng ngay lập tức đến {selectedRole.userCount} người dùng thuộc vai trò này.</p>
                            </div>
                         </div>
                      )}

                      {selectedRole.permissions.map((group, idx) => (
                         <div key={idx} className="space-y-6">
                            <div className="flex items-center gap-4">
                               <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{group.category}</h4>
                               <div className="h-px bg-slate-50 flex-1"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {group.actions.map((action, actionIdx) => (
                                  <div 
                                    key={actionIdx} 
                                    className={clsx(
                                      "p-6 rounded-3xl border transition-all flex items-center justify-between",
                                      action.enabled ? "bg-white border-slate-100" : "bg-slate-50/50 border-slate-50 opacity-60"
                                    )}
                                  >
                                     <div className="flex items-center gap-4">
                                        <div className={clsx(
                                          "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                          action.enabled ? "bg-pastel-orange/10 text-pastel-orange" : "bg-white text-slate-300"
                                        )}>
                                           {action.enabled ? <ShieldCheck size={20} /> : <Lock size={20} />}
                                        </div>
                                        <div>
                                           <p className="text-sm font-black text-slate-800">{action.name}</p>
                                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{action.key}</p>
                                        </div>
                                     </div>
                                     
                                     {isEditing ? (
                                       <button 
                                          onClick={() => handleTogglePermission(idx, actionIdx)}
                                          className={clsx(
                                         "w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none",
                                         action.enabled ? "bg-pastel-orange" : "bg-slate-200"
                                       )}>
                                          <div className={clsx(
                                            "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200",
                                            action.enabled ? "translate-x-7" : "translate-x-1"
                                          )}></div>
                                       </button>
                                     ) : (
                                       action.enabled ? <CheckCircle size={20} className="text-emerald-500" /> : <X size={20} className="text-slate-300" />
                                     )}
                                  </div>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>

                   {/* Footer */}
                   <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                               <img key={i} src={`https://i.pravatar.cc/150?u=${i + selectedRole.id}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" />
                            ))}
                         </div>
                         <p className="text-xs text-slate-400 font-medium italic">và {selectedRole.userCount - 3} người khác đang sử dụng vai trò này.</p>
                      </div>
                      <button className="text-[11px] font-black text-pastel-orange uppercase tracking-widest hover:underline flex items-center gap-2">
                         Xem tất cả thành viên <ChevronRight size={14} />
                      </button>
                   </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm h-full flex items-center justify-center p-20 text-center">
                   <div className="max-w-xs space-y-4">
                      <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto">
                         <Shield size={40} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-400">Chọn một vai trò để xem chi tiết quyền hạn</h3>
                   </div>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>

      {/* Create Role Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 border border-slate-100"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Thêm vai trò quản trị mới</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tên hiển thị</label>
                      <input 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-bold"
                        placeholder="Ví dụ: Kiểm duyệt viên"
                        value={newRole.name}
                        onChange={e => setNewRole({...newRole, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mã (Slug)</label>
                      <input 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-bold"
                        placeholder="Ví dụ: moderator"
                        value={newRole.slug}
                        onChange={e => setNewRole({...newRole, slug: e.target.value})}
                      />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mô tả nhiệm vụ</label>
                   <textarea 
                     className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm min-h-[80px]"
                     placeholder="Quyền hạn và trách nhiệm của vai trò này..."
                     value={newRole.description}
                     onChange={e => setNewRole({...newRole, description: e.target.value})}
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cấp độ (Level)</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-bold"
                        value={newRole.level}
                        onChange={e => setNewRole({...newRole, level: parseInt(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Màu sắc định danh</label>
                      <input 
                        type="color"
                        className="w-full h-[44px] p-1 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all cursor-pointer"
                        value={newRole.color}
                        onChange={e => setNewRole({...newRole, color: e.target.value})}
                      />
                   </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 px-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCreateRole}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50"
                >
                  {isSaving ? 'Đang tạo...' : 'Tạo vai trò'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleting && selectedRole && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleting(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-100"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Xác nhận xóa vai trò</h3>
              <p className="text-sm text-slate-500 text-center mb-8 px-4 leading-relaxed">
                Bạn có chắc chắn muốn xóa vai trò <strong>{selectedRole.name}</strong>? 
                Hành động này sẽ thất bại nếu vai trò là mặc định hệ thống hoặc đang có người dùng thuộc vai trò này.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="flex-1 py-3 px-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteRole}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {isSaving ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRBACPage;
