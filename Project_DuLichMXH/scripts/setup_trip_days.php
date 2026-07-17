<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    echo "Ensuring 'trip_days' table exists...\n";

    $sql = "CREATE TABLE IF NOT EXISTS trip_days (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL,
        date DATE,
        activities JSONB DEFAULT '[]',
        budget DECIMAL(15, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, day_number)
    );";

    $conn->exec($sql);
    echo "Table 'trip_days' is ready.\n";

    // Migrate data if trips still has itinerary
    $trips = $conn->query("SELECT id, itinerary FROM trips WHERE itinerary IS NOT NULL")->fetchAll();
    foreach ($trips as $trip) {
        $itinerary = json_decode($trip['itinerary'], true);
        if (is_array($itinerary)) {
            foreach ($itinerary as $day) {
                $stmt = $conn->prepare("INSERT INTO trip_days (trip_id, day_number, date, activities) 
                                        VALUES (:trip_id, :day_number, :date, :activities)
                                        ON CONFLICT (trip_id, day_number) DO UPDATE 
                                        SET date = EXCLUDED.date, activities = EXCLUDED.activities");
                $stmt->execute([
                    'trip_id' => $trip['id'],
                    'day_number' => $day['dayNumber'] ?? $day['day_number'] ?? 1,
                    'date' => $day['date'] ?? null,
                    'activities' => json_encode($day['activities'] ?? [])
                ]);
            }
        }
    }
    echo "Data migration completed.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>