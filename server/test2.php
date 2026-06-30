<?php
try {
    $pdo = new PDO("pgsql:host=aws-1-ap-southeast-1.pooler.supabase.com;port=5432;dbname=postgres", "postgres.pzlgtdpdsqukcictafob", "kpgacor1234@");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "USERS:\n";
    $stmt = $pdo->query("SELECT id, name, email, role, is_active FROM users");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    echo "\nDELETING ALL SESSIONS...\n";
    $pdo->exec("TRUNCATE TABLE feedback_replies CASCADE");
    $pdo->exec("TRUNCATE TABLE feedback CASCADE");
    $pdo->exec("TRUNCATE TABLE followups CASCADE");
    $pdo->exec("TRUNCATE TABLE coaching_sessions CASCADE");
    $pdo->exec("TRUNCATE TABLE schedules CASCADE");
    echo "DONE DELETING.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
