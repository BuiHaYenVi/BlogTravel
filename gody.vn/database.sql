-- ============================================================================
-- GODY.VN TRAVEL PLATFORM - DEFINITIVE COMPREHENSIVE DATABASE
-- Target: PostgreSQL
-- Structure: SERIAL IDs for easy management
-- Content: Full 63 Provinces + Rich Attractions + Rich Experiences (Blogs)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SCHEMA DEFINITION
-- ----------------------------------------------------------------------------

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(512),
    full_name VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    phone VARCHAR(20),
    role_id INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    joining_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destinations (Provinces/Locations)
CREATE TABLE destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_desc TEXT,
    introduction TEXT,
    image VARCHAR(512),
    cover_image VARCHAR(512),
    region VARCHAR(100),
    avg_rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    visited_count INTEGER DEFAULT 0
);

-- Attractions (Points of Interest)
CREATE TABLE attractions (
    id SERIAL PRIMARY KEY,
    destination_id INTEGER REFERENCES destinations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    image VARCHAR(512),
    description TEXT,
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    opening_hours VARCHAR(255),
    price VARCHAR(255),
    category VARCHAR(100)
);

-- Blogs (Experiences/Travel Reviews)
CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    title VARCHAR(512) NOT NULL,
    short_intro TEXT,
    content TEXT NOT NULL,
    cover_image VARCHAR(512),
    post_type VARCHAR(50) DEFAULT 'blog',
    likes_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    start_date DATE,
    total_days INTEGER,
    cost VARCHAR(100),
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups (Travel Communities)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    cover_image VARCHAR(512),
    member_count INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Memberships
CREATE TABLE group_members (
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

-- Comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social: Follows
CREATE TABLE follows (
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (follower_id, following_id)
);

-- Plans (Itinerary Builder)
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    destination_id INTEGER REFERENCES destinations(id),
    description TEXT,
    cover_image TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    total_days INT,
    status VARCHAR(50) DEFAULT 'draft',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plan Days
CREATE TABLE plan_days (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
    day_index INT NOT NULL,
    date DATE,
    UNIQUE(plan_id, day_index)
);

-- Plan Points of Interest
CREATE TABLE plan_pois (
    id SERIAL PRIMARY KEY,
    day_id INTEGER REFERENCES plan_days(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    poi_type VARCHAR(50),
    sort_order INT DEFAULT 0,
    time_assigned TIME,
    description TEXT
);

-- ----------------------------------------------------------------------------
-- 2. SEED DATA
-- ----------------------------------------------------------------------------

-- Users
INSERT INTO users (username, email, avatar, full_name, bio, followers_count, following_count) VALUES
('thuystran', 'thuy@example.com', 'https://i.pravatar.cc/100?img=3', 'Thuý Trần Nguyễn', 'Yêu du lịch và thích khám phá những vùng đất mới.', 1250, 450),
('hoanganh', 'anh@example.com', 'https://i.pravatar.cc/100?img=12', 'Hoàng Anh', 'Travel Blogger chuyên về du lịch tự túc.', 8900, 120),
('doantan', 'doan@example.com', 'https://i.pravatar.cc/100?img=4', 'Doan Tan Sinh', 'Nhiếp ảnh gia nghiệp dư, đam mê xê dịch.', 2300, 150),
('scarlett', 'scarlett@example.com', 'https://i.pravatar.cc/100?img=5', 'Scarlett Tran', 'Người kể chuyện qua những chuyến đi.', 5600, 300);

-- 63 Provinces (Destinations)
INSERT INTO destinations (name, slug, short_desc, introduction, image, cover_image, region, visited_count) VALUES
('An Giang', 'an-giang', 'Vùng đất tâm linh và rừng tràm xanh ngắt', 'An Giang nổi tiếng với miếu Bà Chúa Xứ linh thiêng và rừng tràm Trà Sư xanh mướt.', 'https://images.unsplash.com/photo-1599818815155-2e6b72a6b47c', 'https://images.unsplash.com/photo-1599818815155-2e6b72a6b47c', 'Miền Tây', 179977),
('Bà Rịa - Vũng Tàu', 'ba-ria-vung-tau', 'Thành phố biển sôi động', 'Điểm đến nghỉ dưỡng quen thuộc với những bãi biển đẹp và hải sản tươi ngon.', 'https://images.unsplash.com/photo-1582236353342-999335e97669', 'https://images.unsplash.com/photo-1582236353342-999335e97669', 'Miền Nam', 850000),
('Đà Nẵng', 'da-nang', 'Thành phố của những cây cầu', 'Thành phố đáng sống nhất Việt Nam với biển Mỹ Khê và Bà Nà Hills.', 'https://images.unsplash.com/photo-1559592442-9e54238a2917', 'https://images.unsplash.com/photo-1559592442-9e54238a2917', 'Miền Trung', 345221),
('Hà Nội', 'ha-noi', 'Thủ đô ngàn năm văn hiến', 'Trái tim của cả nước với bề dày lịch sử và văn hóa.', 'https://images.unsplash.com/photo-1509030464150-15f65034f074', 'https://images.unsplash.com/photo-1509030464150-15f65034f074', 'Miền Bắc', 980000),
('TP. Hồ Chí Minh', 'ho-chi-minh', 'Sài Gòn năng động', 'Trung tâm kinh tế, tài chính và văn hóa lớn nhất Việt Nam.', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'Miền Nam', 1200000),
('Lâm Đồng', 'lam-dong', 'Thành phố ngàn hoa Đà Lạt', 'Khí hậu ôn hòa, muôn hoa khoe sắc quanh năm tại Đà Lạt.', 'https://images.unsplash.com/photo-1559197331-516-4d8458bb5052', 'https://images.unsplash.com/photo-1559197331-516-4d8458bb5052', 'Tây Nguyên', 512000),
('Kiên Giang', 'kien-giang', 'Đảo Ngọc Phú Quốc', 'Thiên đường du lịch biển đảo lớn nhất Việt Nam.', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3', 'Miền Tây', 950000),
('Bắc Giang', 'bac-giang', 'Quê hương vải thiều', 'Vùng đất giàu truyền thống lịch sử.', 'https://images.unsplash.com/photo-1496372412473-e8548ffd82bc', 'https://images.unsplash.com/photo-1496372412473-e8548ffd82bc', 'Miền Bắc', 45000),
('Bắc Kạn', 'bac-kan', 'Hồ Ba Bể thơ mộng', 'Hồ nước ngọt thiên nhiên lớn nhất Việt Nam.', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', 'Miền Bắc', 32000),
('Bạc Liêu', 'bac-lieu', 'Xứ sở Công tử Bạc Liêu', 'Nổi tiếng với đờn ca tài tử và nhà Công tử Bạc Liêu.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 56000),
('Bắc Ninh', 'bac-ninh', 'Kinh đô Quan họ', 'Vùng đất văn hiến với dân ca Quan họ Bắc Ninh.', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'Miền Bắc', 78000),
('Bến Tre', 'ben-tre', 'Xứ sở dừa', 'Vùng đất miệt vườn sông nước đặc trưng.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 89000),
('Bình Định', 'binh-dinh', 'Quy Nhơn biển xanh', 'Thành phố biển với Kỳ Co, Eo Gió đẹp mê hồn.', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Miền Trung', 210000),
('Bình Dương', 'binh-duong', 'Công nghiệp năng động', 'Thủ phủ công nghiệp phía Nam.', 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b', 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b', 'Miền Nam', 120000),
('Bình Phước', 'binh-phuoc', 'Đất đỏ cao su', 'Vùng đất cao su bạt ngàn.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Miền Nam', 34000),
('Bình Thuận', 'binh-thuan', 'Mũi Né nắng gió', 'Thiên đường nghỉ dưỡng với những đồi cát bay.', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Miền Trung', 450000),
('Cà Mau', 'ca-mau', 'Đất mũi cực Nam', 'Nơi cuối cùng của dải đất hình chữ S.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Miền Tây', 67000),
('Cần Thơ', 'can-tho', 'Chợ nổi Cái Răng', 'Thủ phủ miền Tây sông nước.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 560000),
('Cao Bằng', 'cao-bang', 'Thác Bản Giốc', 'Kỳ quan thiên nhiên hùng vĩ miền biên viễn.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 43000),
('Đắk Lắk', 'dak-lak', 'Thủ phủ Cà phê', 'Vùng đất huyền thoại với văn hóa cồng chiêng.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Tây Nguyên', 123000),
('Đắk Nông', 'dak-nong', 'Công viên địa chất', 'Khám phá hệ thống hang động núi lửa Krông Nô.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Tây Nguyên', 45000),
('Điện Biên', 'dien-bien', 'Chiến thắng hào hùng', 'Di tích lịch sử lừng lẫy năm châu.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 34000),
('Đồng Nai', 'dong-nai', 'Vườn quốc gia Cát Tiên', 'Hệ sinh thái đa dạng bậc nhất phía Nam.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Miền Nam', 156000),
('Đồng Tháp', 'dong-thap', 'Xứ sở Sen hồng', 'Làng hoa Sa Đéc rực rỡ sắc màu.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 98000),
('Gia Lai', 'gia-lai', 'Biển Hồ Pleiku', 'Mắt ngọc của vùng cao nguyên.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Tây Nguyên', 87000),
('Hà Giang', 'ha-giang', 'Cao nguyên đá', 'Cung đường phượt hùng vĩ nhất Việt Nam.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 120000),
('Hà Nam', 'ha-nam', 'Chùa Tam Chúc', 'Quần thể du lịch tâm linh lớn nhất thế giới.', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'Miền Bắc', 67000),
('Hà Tĩnh', 'ha-tinh', 'Núi Hồng Sông Lam', 'Quê hương của đại thi hào Nguyễn Du.', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Miền Trung', 45000),
('Hải Dương', 'hai-duong', 'Đảo Cò Chi Lăng', 'Vùng đất giàu truyền thống lịch sử.', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'Miền Bắc', 89000),
('Hải Phòng', 'hai-phong', 'Thành phố Cảng', 'Cát Bà xanh mát, Đồ Sơn sóng vỗ.', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Miền Bắc', 340000),
('Hậu Giang', 'hau-giang', 'Lung Ngọc Hoàng', 'Khu bảo tồn thiên nhiên ngập nước.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 45000),
('Hòa Bình', 'hoa-binh', 'Thung lũng Mai Châu', 'Bản sắc văn hóa các dân tộc vùng cao.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 123000),
('Hưng Yên', 'hung-yen', 'Phố Hiến cổ kính', 'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến.', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'Miền Bắc', 56000),
('Khánh Hòa', 'khanh-hoa', 'Nha Trang biển gọi', 'Thành phố du lịch biển nổi tiếng thế giới.', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Miền Trung', 1200000),
('Kon Tum', 'kon-tum', 'Măng Đen mờ sương', 'Đà Lạt thứ hai của vùng Tây Nguyên.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Tây Nguyên', 56000),
('Lai Châu', 'lai-chau', 'Đèo Ô Quy Hồ', 'Một trong tứ đại đỉnh đèo hùng vĩ.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 23000),
('Lạng Sơn', 'lang-son', 'Mẫu Sơn quanh năm mây phủ', 'Vùng đất biên cương giàu bản sắc.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 89000),
('Lào Cai', 'lao-cai', 'Sa Pa sương mù', 'Đỉnh Fansipan cao nhất Đông Dương.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 450000),
('Long An', 'long-an', 'Đất ngập nước Láng Sen', 'Cửa ngõ miền Tây Nam Bộ.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 12000),
('Nam Định', 'nam-dinh', 'Phủ Giầy Đền Trần', 'Vùng đất linh thiêng ngàn năm.', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'Miền Bắc', 98000),
('Nghệ An', 'nghe-an', 'Quê Bác thân thương', 'Bãi biển Cửa Lò xanh ngắt.', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Miền Trung', 230000),
('Ninh Bình', 'ninh-binh', 'Tuyệt tình cốc', 'Cố đô Hoa Lư lịch sử.', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Miền Bắc', 340000),
('Ninh Thuận', 'ninh-thuan', 'Vịnh Vĩnh Hy', 'Vườn quốc gia Núi Chúa hoang sơ.', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Miền Trung', 56000),
('Phú Thọ', 'phu-tho', 'Đền Hùng linh thiêng', 'Cội nguồn của dân tộc Việt Nam.', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'Miền Bắc', 150000),
('Phú Yên', 'phu-yen', 'Ghềnh Đá Đĩa', 'Hoa vàng trên cỏ xanh.', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Miền Trung', 123000),
('Quảng Bình', 'quang-binh', 'Vương quốc hang động', 'Sơn Đoòng hùng vĩ nhất thế giới.', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Miền Trung', 210000),
('Quảng Nam', 'quang-nam', 'Phố cổ Hội An', 'Di sản văn hóa thế giới trường tồn.', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Miền Trung', 450000),
('Quảng Ngãi', 'quang-ngai', 'Đảo Lý Sơn', 'Vương quốc tỏi giữa trùng dương.', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Miền Trung', 110000),
('Quảng Ninh', 'quang-ninh', 'Vịnh Hạ Long', 'Kỳ quan thiên nhiên thế giới.', 'https://images.unsplash.com/photo-1559592442-9e54238a2917', 'https://images.unsplash.com/photo-1559592442-9e54238a2917', 'Miền Bắc', 1200000),
('Quảng Trị', 'quang-tri', 'Vĩ tuyến 17', 'Thành cổ Quảng Trị bất tử.', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Miền Trung', 34000),
('Sóc Trăng', 'soc-trang', 'Chùa Dơi', 'Bản sắc văn hóa Khmer đặc sắc.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 67000),
('Sơn La', 'son-la', 'Đèo Pha Đin', 'Cánh đồng Mộc Châu xanh mướt.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 156000),
('Tây Ninh', 'tay-ninh', 'Núi Bà Đen', 'Tòa thánh Tây Ninh lộng lẫy.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Miền Nam', 234000),
('Thái Bình', 'thai-binh', 'Chùa Keo cổ kính', 'Quê hương của lúa gạo miền Bắc.', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'https://images.unsplash.com/photo-1528605105345-5344ea20e269', 'Miền Bắc', 45000),
('Thái Nguyên', 'thai-nguyen', 'Hồ Núi Cốc', 'Đệ nhất danh trà Tân Cương.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 56000),
('Thanh Hóa', 'thanh-hoa', 'Bãi biển Sầm Sơn', 'Thành nhà Hồ di sản thế giới.', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Miền Trung', 456000),
('Thừa Thiên Huế', 'thua-thien-hue', 'Cố đô Huế', 'Vẻ đẹp trầm mặc và thơ mộng bên sông Hương.', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Miền Trung', 432000),
('Tiền Giang', 'tien-giang', 'Cù lao Thới Sơn', 'Vùng đất miệt vườn Mỹ Tho.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 123000),
('Trà Vinh', 'tra-vinh', 'Ao Bà Om', 'Thành phố của những cây cổ thụ.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 43000),
('Tuyên Quang', 'tuyen-quang', 'Cây đa Tân Trào', 'Di tích lịch sử cách mạng.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 34000),
('Vĩnh Long', 'vinh-long', 'Chợ nổi Trà Ôn', 'Trái cây đặc sản miền sông nước.', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'https://images.unsplash.com/photo-1599059021750-844b3739f674', 'Miền Tây', 56000),
('Vĩnh Phúc', 'vinh-phuc', 'Tam Đảo sương mờ', 'Khu nghỉ dưỡng lý tưởng gần Hà Nội.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 123000),
('Yên Bái', 'yen-bai', 'Mù Cang Chải', 'Ruộng bậc thang vàng óng mùa lúa chín.', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9', 'Miền Bắc', 67000);

-- Detailed Blogs (Experiences) for Major Provinces
INSERT INTO blogs (author_id, destination_id, title, short_intro, content, cover_image, likes_count, comment_count, views_count, tags) VALUES
-- An Giang
(4, (SELECT id FROM destinations WHERE slug = 'an-giang'), 'Check-In Ngay 3 Điểm Đến Ở Việt Nam Chất Lừ Như "Hollywood"', 'Gợi ý các điểm check-in có dòng chữ đẹp như ở Hollywood mà không cần phải qua tận nước Mỹ xa xôi.', 'Khám phá Núi Sam, Hồ Tà Pạ và Rừng Tràm Trà Sư với những góc chụp ảnh siêu chất...', 'https://images.unsplash.com/photo-1599818815155-2e6b72a6b47c', 156, 12, 1200, 'An Giang, Hollywood, Checkin'),
(3, (SELECT id FROM destinations WHERE slug = 'an-giang'), 'Chùa Tà Pạ - Tuyệt Đẹp Ngôi Chùa Lơ Lửng Trên Không Của Xứ Sở Thần Tiên Bảy Núi An Giang', 'Chùa Tà Pạ là điểm du lịch tâm linh nổi tiếng của xứ An Giang. Nhìn từ xa bạn sẽ thấy chùa như đang bay lơ lửng trên không.', 'Chùa được xây dựng theo kiến trúc Khmer đặc trưng, nằm trên đỉnh núi Tà Pạ thơ mộng...', 'https://images.unsplash.com/photo-1596402184320-417d717867cd', 89, 5, 850, 'An Giang, Tam Linh, Chua Ta Pa'),

-- Đà Nẵng
(2, (SELECT id FROM destinations WHERE slug = 'da-nang'), 'Top 5 quán hải sản ngon bổ rẻ tại Đà Nẵng không phải ai cũng biết', 'Đến Đà Nẵng mà không ăn hải sản thì thật thiếu sót. Đây là danh sách các quán "ruột" của dân địa phương.', 'Từ quán hải sản Năm Rảnh đến Bé Mặn, đây là những lựa chọn tốt nhất...', 'https://images.unsplash.com/photo-1555546271-2911fcfea81f', 245, 45, 3500, 'Da Nang, Hai San, Am Thuc'),
(1, (SELECT id FROM destinations WHERE slug = 'da-nang'), 'Lịch trình du lịch Đà Nẵng 3 ngày 2 đêm tự túc trọn gói', 'Chia sẻ mọi chi phí và điểm đến hấp dẫn nhất cho chuyến đi Đà Nẵng tiết kiệm.', 'Ngày 1: Bán đảo Sơn Trà - Ngũ Hành Sơn. Ngày 2: Bà Nà Hills. Ngày 3: Cù Lao Chàm...', 'https://images.unsplash.com/photo-1559592442-9e54238a2917', 512, 88, 7200, 'Da Nang, Lich Trinh, Review'),

-- Lâm Đồng (Đà Lạt)
(2, (SELECT id FROM destinations WHERE slug = 'lam-dong'), 'Review 10 quán cafe view thung lũng cực chill tại Đà Lạt', 'Nếu bạn muốn tìm một nơi để "trốn" thế giới, đây là danh sách dành cho bạn.', 'Từ tiệm cà phê Túi Mơ To đến Lululola, mỗi nơi một vẻ đẹp riêng biệt...', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 890, 120, 15000, 'Da Lat, Cafe, Chill'),
(4, (SELECT id FROM destinations WHERE slug = 'lam-dong'), 'Săn mây Đà Lạt: Kinh nghiệm tìm địa điểm và thời điểm chuẩn nhất', 'Cảm giác đứng giữa biển mây bồng bềnh là trải nghiệm khó quên nhất tại thành phố sương mù.', 'Hãy ghé đồi chè Cầu Đất vào lúc 5 giờ sáng để có cơ hội săn mây thành công nhất...', 'https://images.unsplash.com/photo-1559197331-516-4d8458bb5052', 670, 95, 12000, 'Da Lat, San May, Travel'),

-- Kiên Giang (Phú Quốc)
(3, (SELECT id FROM destinations WHERE slug = 'kien-giang'), 'Review Phú Quốc 4 ngày 3 đêm cho cặp đôi mới nhất 2024', 'Lên lịch trình lãng mạn tại đảo ngọc, từ ngắm hoàng hôn Dinh Cậu đến cáp treo Hòn Thơm.', 'Khám phá các resort 5 sao và những bãi biển đẹp nhất Phú Quốc...', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3', 432, 56, 4800, 'Phu Quoc, Romance, Couple'),

-- Hà Nội
(1, (SELECT id FROM destinations WHERE slug = 'ha-noi'), 'Ăn sập Hà Nội: 20 món ngon phố cổ nhất định phải thử', 'Từ bún chả Obama đến phở Thìn Lò Đúc, hành trình ẩm thực không thể dừng lại.', 'Hà Nội không chỉ có 36 phố phường mà còn có hàng ngàn món ăn đặc sắc...', 'https://images.unsplash.com/photo-1509030464150-15f65034f074', 1200, 230, 25000, 'Ha Noi, Food, Am Thuc');

-- Attractions (Seed more real data)
INSERT INTO attractions (destination_id, name, address, image, description, rating, review_count, category) VALUES
((SELECT id FROM destinations WHERE slug = 'an-giang'), 'Núi Sam - Miếu Bà Chúa Xứ', 'Phường Núi Sam, Châu Đốc, An Giang', 'https://images.unsplash.com/photo-1599818815155-2e6b72a6b47c', 'Điểm du lịch tâm linh linh thiêng nhất miền Tây.', 4.9, 1528, 'Tâm linh'),
((SELECT id FROM destinations WHERE slug = 'an-giang'), 'Rừng Tràm Trà Sư', 'Văn Giáo, Tịnh Biên, An Giang', 'https://images.unsplash.com/photo-1596402184320-417d717867cd', 'Hệ sinh thái rừng ngập mặn tuyệt đẹp.', 4.8, 1299, 'Thiên nhiên'),
((SELECT id FROM destinations WHERE slug = 'da-nang'), 'Cầu Vàng (Golden Bridge)', 'Bà Nà Hills, Đà Nẵng', 'https://images.unsplash.com/photo-1559592442-9e54238a2917', 'Biểu tượng du lịch mới của Việt Nam.', 4.9, 5620, 'Văn hóa'),
((SELECT id FROM destinations WHERE slug = 'lam-dong'), 'Hồ Tuyền Lâm', 'Đà Lạt, Lâm Đồng', 'https://images.unsplash.com/photo-1559197331-516-4d8458bb5052', 'Hồ nước ngọt lớn nhất Đà Lạt với vẻ đẹp thơ mộng.', 4.8, 4500, 'Thiên nhiên');

-- Groups
INSERT INTO groups (name, category, description, cover_image, member_count) VALUES
('Hội Review An Giang', 'Culture', 'Nơi chia sẻ những góc nhìn chân thực về vùng đất Bảy Núi.', 'https://images.unsplash.com/photo-1599818815155-2e6b72a6b47c', 125034),
('Nghiện Đà Lạt', 'Relax', 'Cộng đồng dành cho những ai yêu mến thành phố sương mù Đà Lạt.', 'https://images.unsplash.com/photo-1559197331-516-4d8458bb5052', 89312);
