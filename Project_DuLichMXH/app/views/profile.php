<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile | <?= $user['username'] ?></title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            --ig-bg: #fafafa;
            --ig-stroke: #dbdbdb;
            --ig-link: #00376b;
        }

        body { background-color: var(--ig-bg); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        
        .profile-container { max-width: 935px; margin: 0 auto; padding: 30px 20px; }

        /* Avatar & Gradient Wrapper */
        .avatar-container { display: flex; justify-content: center; margin-bottom: 20px; }
        .avatar-gradient {
            padding: 3px;
            background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
            border-radius: 50%;
            display: inline-block;
        }
        .profile-img {
            width: 77px; height: 77px; /* Mobile size */
            border-radius: 50%; border: 2px solid #fff; object-fit: cover;
        }

        /* Responsive Avatar */
        @media (min-width: 768px) {
            .profile-img { width: 150px; height: 150px; border-width: 4px; }
            .avatar-container { margin-bottom: 0; }
        }

        /* Typography & Stats */
        .username { font-size: 20px; font-weight: 300; margin-bottom: 0; }
        .stat-item { margin-right: 40px; cursor: pointer; }
        .stat-count { font-weight: 600; }
        
        /* Mobile Stats Bar */
        @media (max-width: 767px) {
            .stats-row { border-top: 1px solid var(--ig-stroke); padding: 10px 0; justify-content: space-around !important; }
            .stat-item { margin-right: 0; text-align: center; font-size: 14px; }
            .stat-count { display: block; }
        }

        /* Buttons */
        .btn-edit { 
            background-color: #efefef; border: none; font-weight: 600; 
            border-radius: 8px; padding: 5px 15px; font-size: 14px;
        }
        .btn-edit:hover { background-color: #dbdbdb; }

        /* Highlights */
        .highlight-item { text-align: center; margin-right: 15px; min-width: 75px; }
        .highlight-circle {
            width: 64px; height: 64px; border-radius: 50%;
            border: 1px solid var(--ig-stroke); padding: 3px;
            object-fit: cover; margin-bottom: 5px;
        }
        @media (min-width: 768px) {
            .highlight-circle { width: 77px; height: 77px; }
            .highlight-item { margin-right: 30px; }
        }

        /* Post Grid */
        .post-grid-item { position: relative; aspect-ratio: 1/1; overflow: hidden; background-color: #eee; }
        .post-grid-item img { width: 100%; height: 100%; object-fit: cover; transition: filter 0.2s; }
        .post-grid-item:hover img { filter: brightness(0.8); }

        /* Navbar Bottom (Mobile Only) */
        .mobile-nav {
            position: fixed; bottom: 0; left: 0; width: 100%;
            background: #fff; border-top: 1px solid var(--ig-stroke);
            display: flex; justify-content: space-around; padding: 10px 0;
            z-index: 1000;
        }
        @media (min-width: 768px) { .mobile-nav { display: none; } }
    </style>
</head>
<body>

<div class="profile-container">
    <div class="row align-items-center mb-md-5 mb-3">
        <div class="col-md-4 avatar-container">
            <div class="avatar-gradient">
                <img src="<?= $user['avatar'] ?>" class="profile-img" alt="Avatar">
            </div>
        </div>
        <div class="col-md-8 text-center text-md-start">
            <div class="d-md-flex align-items-center mb-3">
                <h2 class="username me-4 mb-3 mb-md-0"><?= $user['username'] ?> <i class="fas fa-certificate text-primary fs-6"></i></h2>
                <div class="d-flex justify-content-center">
                    <button class="btn btn-primary btn-sm fw-bold me-2 px-3">Follow</button>
                    <button class="btn btn-edit me-2">Message</button>
                    <button class="btn btn-edit"><i class="fas fa-user-plus"></i></button>
                </div>
            </div>

            <div class="d-none d-md-flex mb-3">
                <div class="stat-item"><span class="stat-count"><?= $user['posts_count'] ?></span> bài viết</div>
                <div class="stat-item"><span class="stat-count"><?= $user['followers'] ?></span> người theo dõi</div>
                <div class="stat-item"><span class="stat-count"><?= $user['following'] ?></span> đang theo dõi</div>
            </div>

            <div class="bio px-3 px-md-0">
                <p class="fw-bold mb-0"><?= $user['fullname'] ?></p>
                <p class="mb-0 text-muted">🌍 Digital Nomad | Exploring the world</p>
                <p class="mb-0 text-muted">📸 <?= $user['bio'] ?></p>
                <a href="#" class="text-decoration-none fw-bold" style="color: var(--ig-link);"><?= $user['website'] ?></a>
            </div>
        </div>
    </div>

    <div class="d-flex d-md-none stats-row">
        <div class="stat-item"><span class="stat-count"><?= $user['posts_count'] ?></span><small>bài viết</small></div>
        <div class="stat-item"><span class="stat-count"><?= $user['followers'] ?></span><small>người theo dõi</small></div>
        <div class="stat-item"><span class="stat-count"><?= $user['following'] ?></span><small>đang theo dõi</small></div>
    </div>

    <div class="d-flex overflow-auto py-3 mb-4 no-scrollbar">
        <div class="highlight-item">
            <img src="https://picsum.photos/100/100?random=11" class="highlight-circle">
            <div class="small">Paris</div>
        </div>
        <div class="highlight-item">
            <img src="https://picsum.photos/100/100?random=12" class="highlight-circle">
            <div class="small">Bali</div>
        </div>
        <div class="highlight-item">
            <img src="https://picsum.photos/100/100?random=13" class="highlight-circle">
            <div class="small">Đà Lạt</div>
        </div>
        <div class="highlight-item">
            <div class="highlight-circle d-flex align-items-center justify-content-center bg-white border-dashed">
                <i class="fas fa-plus text-muted"></i>
            </div>
            <div class="small">Mới</div>
        </div>
    </div>

    <div class="border-top d-flex justify-content-center mb-1">
        <div class="p-3 fw-bold small text-muted border-top border-dark" style="margin-top:-1px; letter-spacing: 1px;">
            <i class="fas fa-th me-2"></i> BÀI VIẾT
        </div>
    </div>

    <div class="row g-1 g-md-4">
        <?php foreach($posts as $post): ?>
        <div class="col-4">
            <div class="post-grid-item">
                <img src="<?= $post['image'] ?>" alt="Post Image">
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<div class="mobile-nav">
    <i class="fas fa-home fs-4"></i>
    <i class="fas fa-search fs-4"></i>
    <i class="far fa-plus-square fs-4"></i>
    <i class="far fa-heart fs-4"></i>
    <img src="<?= $user['avatar'] ?>" class="rounded-circle" style="width:24px; height:24px; border:1px solid #000">
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>