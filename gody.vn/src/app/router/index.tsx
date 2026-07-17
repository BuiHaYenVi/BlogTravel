import { createBrowserRouter, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
/* eslint-disable react-refresh/only-export-components */
import MainLayout from '../../shared/layouts/MainLayout';
import NotFoundPage from '../../shared/components/NotFoundPage';

import BlogDetailPage from '../../features/blog/pages/BlogDetailPage';
import SpotDetailPage from '../../features/destination/pages/SpotDetailPage';

// Lazy loading features
const HomePage = lazy(() => import('../../features/home/pages/HomePage'));
const DestinationListPage = lazy(() => import('../../features/destination/pages/DestinationListPage'));
const DestinationDetailPage = lazy(() => import('../../features/destination/pages/DestinationDetailPage'));
const ReviewCreatePage = lazy(() => import('../../features/destination/pages/ReviewCreatePage'));
const BlogListPage = lazy(() => import('../../features/blog/pages/BlogListPage'));
const BlogCreatePage = lazy(() => import('../../features/blog/pages/BlogCreatePage'));
const BlogGuidePage = lazy(() => import('../../features/blog/pages/BlogGuidePage'));
const AuthPage = lazy(() => import('../../features/auth/pages/AuthPage'));
const OnboardingPage = lazy(() => import('../../features/auth/pages/OnboardingPage'));
const ProfilePage = lazy(() => import('../../features/user/pages/ProfilePage'));
const ProfileEditPage = lazy(() => import('../../features/user/pages/ProfileEditPage'));
const GroupListPage = lazy(() => import('../../features/group/pages/GroupListPage'));
const GroupDetailPage = lazy(() => import('../../features/group/pages/GroupDetailPage'));
const CreateGroupPage = lazy(() => import('../../features/group/pages/CreateGroupPage'));
const SearchPage = lazy(() => import('../../features/search/pages/SearchPage'));
const NotificationsPage = lazy(() => import('../../features/notification/pages/NotificationsPage'));
const CompanionPage = lazy(() => import('../../features/companion/pages/CompanionPage'));
const TripCreationPage = lazy(() => import('../../features/companion/pages/TripCreationPage'));
const TripDetailPage = lazy(() => import('../../features/companion/pages/TripDetailPage'));
const TripDetailView = lazy(() => import('../../features/trip/pages/TripDetailView'));

// Admin pages
const AdminLayout = lazy(() => import('../../features/admin/layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('../../features/admin/pages/AdminDashboardPage'));
const AdminUserListPage = lazy(() => import('../../features/admin/pages/UserListPage'));
const AdminUserDetailPage = lazy(() => import('../../features/admin/pages/AdminUserDetailPage'));
const AdminBlogListPage = lazy(() => import('../../features/admin/pages/BlogListPage'));
const AdminBlogDetailPage = lazy(() => import('../../features/admin/pages/AdminBlogDetailPage'));
const AdminGroupListPage = lazy(() => import('../../features/admin/pages/AdminGroupListPage'));
const AdminGroupDetailPage = lazy(() => import('../../features/admin/pages/AdminGroupDetailPage'));
const AdminGroupPostDetailPage = lazy(() => import('../../features/admin/pages/AdminGroupPostDetailPage'));
const AdminHashtagPage = lazy(() => import('../../features/admin/pages/AdminHashtagPage'));
const AdminLocationPage = lazy(() => import('../../features/admin/pages/AdminLocationPage'));
const AdminTripListPage = lazy(() => import('../../features/admin/pages/AdminTripListPage'));
const AdminRBACPage = lazy(() => import('../../features/admin/pages/AdminRBACPage'));
const AdminReportListPage = lazy(() => import('../../features/admin/pages/ReportListPage'));
const AdminSettingsPage = lazy(() => import('../../features/admin/pages/AdminSettingsPage'));
const AdminAuditLogPage = lazy(() => import('../../features/admin/pages/AdminAuditLogPage'));
const AdminProfilePage = lazy(() => import('../../features/admin/pages/AdminProfilePage'));
const AdminStoryListPage = lazy(() => import('../../features/admin/pages/AdminStoryListPage'));

// Fallback loader
const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
  </div>
);

// Determine basename for Laragon/Apache subdirectory hosting
const getBasename = () => {
  const path = window.location.pathname;
  
  // Tự động tìm basename dựa trên thư mục gody.vn
  const godyIndex = path.indexOf('/gody.vn');
  if (godyIndex !== -1) {
    return path.substring(0, godyIndex + 8);
  }

  // Mặc định trong môi trường dev hoặc nếu không có tiền tố là root
  return '';
};

const basename = getBasename();

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'search',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: 'companion',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: <CompanionPage />,
          },
          {
            path: 'create',
            element: <TripCreationPage />,
          },
          {
            path: 'trip/:id',
            element: <TripDetailPage />,
          },
        ]
      },
      {
        path: 'trip/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TripDetailView />
          </Suspense>
        ),
      },
      // Destination Routes
      {
        path: 'destination/:slug/spot/:spotId',
        element: <SpotDetailPage />,
      },
      {
        path: 'destination/:slug/review/create',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReviewCreatePage />
          </Suspense>
        ),
      },
      {
        path: 'destination/:slug',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DestinationDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'destination',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DestinationListPage />
          </Suspense>
        ),
      },
      // Blog Routes
      {
        path: 'blog',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BlogListPage />
          </Suspense>
        ),
      },
      {
        path: 'blog/create',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BlogCreatePage />
          </Suspense>
        ),
      },
      {
        path: 'blog/guide',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BlogGuidePage />
          </Suspense>
        ),
      },
      {
        path: 'blog/:id',
        element: <BlogDetailPage />,
      },
      // User & Group Routes
      {
        path: 'profile/edit',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfileEditPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'profile/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'group',
        element: (
          <Suspense fallback={<PageLoader />}>
            <GroupListPage />
          </Suspense>
        ),
      },
      {
        path: 'group/create',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CreateGroupPage />
          </Suspense>
        ),
      },
      {
        path: 'group/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <GroupDetailPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <Suspense fallback={<PageLoader />}>
        <OnboardingPage />
      </Suspense>
    ),
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminLayout />
      </Suspense>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUserListPage /> },
      { path: 'users/:id', element: <AdminUserDetailPage /> },
      { path: 'blogs', element: <AdminBlogListPage /> },
      { path: 'blogs/:id', element: <AdminBlogDetailPage /> },
      { path: 'groups', element: <AdminGroupListPage /> },
      { path: 'groups/:id', element: <AdminGroupDetailPage /> },
      { path: 'groups/posts/:id', element: <AdminGroupPostDetailPage /> },
      { path: 'groups/:groupId/post/:postId', element: <AdminGroupPostDetailPage /> },
      { path: 'hashtags', element: <AdminHashtagPage /> },
      { path: 'locations', element: <AdminLocationPage /> },
      { path: 'trips', element: <AdminTripListPage /> },
      { path: 'roles', element: <AdminRBACPage /> },
      { path: 'reports', element: <AdminReportListPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'logs', element: <AdminAuditLogPage /> },
      { path: 'profile', element: <AdminProfilePage /> },
      { path: 'stories', element: <AdminStoryListPage /> },
    ]
  },
], {
  basename: basename
});
