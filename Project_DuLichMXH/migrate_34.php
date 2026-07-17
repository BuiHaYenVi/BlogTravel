<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/app/Config/Database.php';

try {
    $db = \App\Config\Database::getInstance()->getConnection();
    
    $targetNames = [
        'Hà Nội', 'Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Thừa Thiên Huế', 
        'An Giang', 'Bắc Ninh', 'Cao Bằng', 'Cà Mau', 'Đắk Lắk', 'Đồng Nai', 'Đồng Tháp', 
        'Điện Biên', 'Gia Lai', 'Hà Tĩnh', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lạng Sơn', 
        'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ninh', 'Quảng Ngãi', 
        'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa', 'Tuyên Quang', 'Vĩnh Long'
    ];
    
    $stmt = $db->query("SELECT id, name FROM locations WHERE type='province'");
    $provinces = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $keepIds = [];
    $deleteIds = [];
    
    foreach ($provinces as $p) {
        if (in_array($p['name'], $targetNames)) {
            $alreadyKept = false;
            foreach ($keepIds as $kid) {
                if ($kid['name'] === $p['name']) {
                    $alreadyKept = true;
                    break;
                }
            }
            if (!$alreadyKept) {
                $keepIds[] = ['id' => $p['id'], 'name' => $p['name']];
            } else {
                $deleteIds[] = $p['id'];
            }
        } else {
            $deleteIds[] = $p['id'];
        }
    }
    
    $inParams = implode(',', array_fill(0, count($deleteIds), '?'));
    
    // check column name in blogs table (is it location_id or destination_id?)
    $stmt2 = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'blogs'");
    $cols = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($cols, 'column_name');
    echo "Columns in blogs: " . implode(", ", $colNames) . "\n";
    
    $destCol = in_array('location_id', $colNames) ? 'location_id' : (in_array('destination_id', $colNames) ? 'destination_id' : null);
    
    if ($destCol) {
        $stmtUpdateBlogs = $db->prepare("UPDATE blogs SET $destCol=NULL WHERE $destCol IN ($inParams)");
        $stmtUpdateBlogs->execute($deleteIds);
    }
    
    // check columns in group_posts
    $stmt3 = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'group_posts'");
    $cols3 = $stmt3->fetchAll(PDO::FETCH_ASSOC);
    $colNames3 = array_column($cols3, 'column_name');
    $destCol3 = in_array('location_id', $colNames3) ? 'location_id' : (in_array('destination_id', $colNames3) ? 'destination_id' : null);
    if ($destCol3) {
        $stmtUpdateGroupPosts = $db->prepare("UPDATE group_posts SET $destCol3=NULL WHERE $destCol3 IN ($inParams)");
        $stmtUpdateGroupPosts->execute($deleteIds);
    }
    
    // check user_checkins
    $stmt4 = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_checkins'");
    $cols4 = $stmt4->fetchAll(PDO::FETCH_ASSOC);
    if(count($cols4) > 0) {
        $stmtDeleteCheckins = $db->prepare("DELETE FROM user_checkins WHERE location_id IN ($inParams)");
        $stmtDeleteCheckins->execute($deleteIds);
    }

    $stmtDeleteSpots = $db->prepare("DELETE FROM locations WHERE parent_id IN ($inParams)");
    $stmtDeleteSpots->execute($deleteIds);
    
    $stmtDeleteProv = $db->prepare("DELETE FROM locations WHERE id IN ($inParams)");
    $stmtDeleteProv->execute($deleteIds);
    
    echo "Success!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
