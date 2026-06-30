<?php
try {
    $pdo = new PDO("pgsql:host=aws-1-ap-southeast-1.pooler.supabase.com;port=5432;dbname=postgres", "postgres.pzlgtdpdsqukcictafob", "kpgacor1234@");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT token FROM users WHERE email='admin@desnet.id'");
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "TOKEN=" . $res['token'] . "\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
