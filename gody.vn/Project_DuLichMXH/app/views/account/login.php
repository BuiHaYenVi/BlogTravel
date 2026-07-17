<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập - Travel Blog</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary-gradient: linear-gradient(135deg, #18a7c7 0%, #b17f868b 100%); --accent-color: #667eea; }
        body {
            background: url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80') no-repeat center center fixed;
            background-size: cover; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;
        }
        .login-card {
            background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);
            border-radius: 24px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .app-logo {
            width: 70px; height: 70px; background: var(--primary-gradient); border-radius: 18px;
            display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 32px;
        }
        .input-group { background: #f1f3f5; border-radius: 12px; border: 2px solid transparent; transition: 0.3s; margin-bottom: 15px; }
        .input-group:focus-within { border-color: var(--accent-color); background: #fff; }
        .form-control { background: transparent; border: none; padding: 12px; }
        .form-control:focus { box-shadow: none; background: transparent; }
        .btn-login { background: var(--primary-gradient); border: none; border-radius: 12px; padding: 14px; font-weight: 700; color: white; }
        .divider { display: flex; align-items: center; margin: 25px 0; color: #b2bec3; font-size: 0.85rem; }
        .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #dfe6e9; }
        .divider:not(:empty)::before { margin-right: 15px; }
        .divider:not(:empty)::after { margin-left: 15px; }
        .social-btn { border-radius: 12px; border: 1px solid #dfe6e9; background: white; padding: 10px; font-weight: 600; text-decoration: none; color: #333; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
<div class="login-card text-center">
    <div class="app-logo"><i class="fa-solid fa-paper-plane"></i></div>
    <h2 class="fw-bold">Travel Blog</h2>
    <p class="text-muted small mb-4">Khám phá thế giới cùng chúng tôi</p>

    <form action="<?= URLROOT ?>/public/index.php?url=authenticate" method="POST" class="text-start">
        <div class="input-group">
            <span class="ps-3 d-flex align-items-center text-muted"><i class="fa-regular fa-envelope"></i></span>
            <input type="email" class="form-control" name="email" placeholder="Email của bạn" required>
        </div>
        <div class="input-group">
            <span class="ps-3 d-flex align-items-center text-muted"><i class="fa-solid fa-lock"></i></span>
            <input type="password" class="form-control" name="password" placeholder="Mật khẩu" required>
        </div>
        <button type="submit" class="btn btn-login w-100 shadow-sm mt-2">ĐĂNG NHẬP</button>
        
        <div class="divider">Hoặc tiếp tục với</div>
        
        <div class="row g-2">
            <div class="col-6">
                <a href="#" class="social-btn">
                    <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="18" class="me-2"> Google
                </a>
            </div>
            <div class="col-6">
                <a href="#" class="social-btn text-primary"><i class="fa-brands fa-facebook me-2 fs-5"></i> Facebook</a>
            </div>
        </div>
    </form>
    <p class="mt-4 small text-muted">Chưa có tài khoản? <a href="<?= URLROOT ?>/public/index.php?url=register" class="text-decoration-none fw-bold" style="color: var(--accent-color);">Đăng ký ngay</a></p>
</div>
</body>
</html>