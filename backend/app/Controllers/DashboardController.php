<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\CoachingSessionModel;

class DashboardController extends BaseController
{
    public function stats()
    {
        $coachingModel = new CoachingSessionModel();
        $db = \Config\Database::connect();

        $year = date('Y');
        
        // 1. Jumlah coaching per bulan (menggunakan raw query untuk kompatibilitas fungsi tanggal PostgreSQL)
        $monthlyQuery = $db->query("
            SELECT EXTRACT(MONTH FROM date) as month, COUNT(id) as total 
            FROM coaching_sessions 
            WHERE status = 'Completed' AND EXTRACT(YEAR FROM date) = ? 
            GROUP BY EXTRACT(MONTH FROM date) 
            ORDER BY month ASC
        ", [$year]);
        $monthlyCount = $monthlyQuery->getResultArray();

        $monthlyData = array_fill(1, 12, 0);
        foreach ($monthlyCount as $row) {
            $monthlyData[(int)$row['month']] = (int)$row['total'];
        }

        // 2. Top 10 kategori topik
        $topCatQuery = $db->query("
            SELECT category, COUNT(id) as total 
            FROM coaching_sessions 
            WHERE status = 'Completed' 
            GROUP BY category 
            ORDER BY total DESC 
            LIMIT 10
        ");
        $topCategories = $topCatQuery->getResultArray();

        return $this->response->setJSON([
            'status' => true,
            'data'   => [
                'monthly'       => array_values($monthlyData),
                'topCategories' => $topCategories
            ]
        ]);
    }

    public function export()
    {
        // Dalam implementasi nyata, di sini akan digunakan library PhpSpreadsheet untuk menghasilkan file .xlsx
        // Saat ini API mengembalikan data JSON mentah yang dapat di-export via frontend (misal dengan library xlsx di React)
        
        $db = \Config\Database::connect();
        $query = $db->query("
            SELECT 
                cs.date as tanggal,
                CONCAT(cs.\"startTime\", ' - ', cs.\"endTime\") as durasi,
                cs.topic as topik,
                coach.name as coach_name,
                cs.mode as pelaksanaan,
                COALESCE(cs.\"roomName\", cs.\"meetingLink\") as tempat_atau_link,
                cs.rating,
                emp.name as employee_name
            FROM coaching_sessions cs
            JOIN app_users coach ON coach.id = cs.\"coachId\"
            JOIN app_users emp ON emp.id = cs.\"employeeId\"
            WHERE cs.status = 'Completed'
            ORDER BY cs.date DESC
        ");

        $sessions = $query->getResultArray();
        
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data untuk export siap',
            'data'    => $sessions
        ]);
    }
}
