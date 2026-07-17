-- 1. Tạo bảng trung gian user_interests
CREATE TABLE IF NOT EXISTS user_interests (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_tag ON user_interests(tag_id);

-- 2. Tạo bảng trung gian trip_tags
CREATE TABLE IF NOT EXISTS trip_tags (
    trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (trip_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_tags_trip ON trip_tags(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_tags_tag ON trip_tags(tag_id);
