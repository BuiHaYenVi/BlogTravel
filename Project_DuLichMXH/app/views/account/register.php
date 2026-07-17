<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng ký - Travel Blog</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary-gradient: linear-gradient(135deg, #18a7c7 0%, #b17f868b 100%); --accent-color: #667eea; }
        body {
            background: url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80') no-repeat center center fixed;
            background-size: cover; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; margin: 0;
        }
        .register-card {
            background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);
            border-radius: 24px; padding: 35px 40px; width: 100%; max-width: 450px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .app-logo { width: 60px; height: 60px; background: var(--primary-gradient); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: white; font-size: 28px; }
        .input-group { background: #f1f3f5; border-radius: 12px; border: 2px solid transparent; margin-bottom: 15px; transition: 0.3s; }
        .input-group:focus-within { border-color: var(--accent-color); background: #fff; }
        .form-control { background: transparent; border: none; padding: 10px; font-size: 0.95rem; }
        .form-control:focus { box-shadow: none; }
        .btn-register { background: var(--primary-gradient); border: none; border-radius: 12px; padding: 14px; font-weight: 700; color: white; transition: 0.3s; margin-top: 10px; }
        .btn-register:hover { transform: translateY(-2px); opacity: 0.9; shadow: 0 5px 15px rgba(0,0,0,0.2); }
    </style>
</head>
<body>
<div class="register-card text-center">
    <div class="app-logo"><i class="fa-solid fa-user-plus"></i></div>
    <h2 class="fw-bold mb-1">Tạo tài khoản</h2>
    <p class="text-muted small mb-4">Khám phá và chia sẻ hành trình của bạn</p>

    <form action="<?= URLROOT ?>/public/index.php?url=register_submit" method="POST" class="text-start">
        <label class="small fw-bold ms-1 text-muted">Họ và Tên</label>
        <div class="input-group">
            <span class="ps-3 d-flex align-items-center text-muted"><i class="fa-regular fa-user"></i></span>
            <input type="text" class="form-control" name="fullname" placeholder="Nguyễn Văn A" required>
        </div>
        
        <label class="small fw-bold ms-1 text-muted">Email</label>
        <div class="input-group">
            <span class="ps-3 d-flex align-items-center text-muted"><i class="fa-regular fa-envelope"></i></span>
            <input type="email" class="form-control" name="email" placeholder="example@gmail.com" required>
        </div>

        <label class="small fw-bold ms-1 text-muted">Mật khẩu</label>
        <div class="input-group">
            <span class="ps-3 d-flex align-items-center text-muted"><i class="fa-solid fa-lock"></i></span>
            <input type="password" class="form-control" name="password" id="password" placeholder="••••••••" required>
        </div>

        <label class="small fw-bold ms-1 text-muted">Xác nhận mật khẩu</label>
        <div class="input-group">
            <span class="ps-3 d-flex align-items-center text-muted"><i class="fa-solid fa-check-double"></i></span>
            <input type="password" class="form-control" name="confirm_password" id="confirm_password" placeholder="••••••••" required>
        </div>

        <button type="submit" class="btn btn-register w-100 shadow-sm">ĐĂNG KÝ NGAY</button>
    </form>

    <p class="mt-4 small text-muted">Đã có tài khoản? 
        <a href="<?= URLROOT ?>/public/index.php?url=login" class="text-decoration-none fw-bold" style="color: var(--accent-color);">
            Đăng nhập
        </a>
    </p>
</div>

<script>
    const form = document.querySelector('form');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');

    form.addEventListener('submit', function(e) {
        if (password.value !== confirmPassword.value) {
            e.preventDefault();
            alert('Mật khẩu xác nhận không trùng khớp!');
        }
    });
</script>

</body>
</html>