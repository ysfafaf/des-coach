<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\CoachingSessionModel;
use App\Models\EmailNotificationModel;
use App\Models\UserModel;

class CoachingController extends BaseController
{
    public function index()
    {
        $coachingModel = new CoachingSessionModel();
        $userId = $this->request->getVar('userId');
        
        if ($userId) {
            $sessions = $coachingModel->groupStart()
                                      ->where('employeeId', $userId)
                                      ->orWhere('coachId', $userId)
                                      ->groupEnd()
                                      ->findAll();
        } else {
            $sessions = $coachingModel->findAll();
        }
        
        return $this->response->setJSON([
            'status' => true,
            'data'   => $sessions
        ]);
    }

    public function create()
    {
        $rules = [
            'employeeId' => 'required',
            'coachId'    => 'required',
            'topic'      => 'required',
            'category'   => 'required',
            'date'       => 'required|valid_date',
            'startTime'  => 'required',
            'endTime'    => 'required',
            'mode'       => 'required|in_list[Online,Offline]',
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status' => false,
                'errors' => $this->validator->getErrors()
            ])->setStatusCode(400);
        }

        $json = $this->request->getJSON();

        // Validasi maksimal 2 jam
        $start = strtotime($json->startTime ?? $this->request->getVar('startTime'));
        $end = strtotime($json->endTime ?? $this->request->getVar('endTime'));
        
        if (($end - $start) > 7200) {
            return $this->response->setJSON([
                'status'  => false,
                'message' => 'Sesi coaching maksimal 2 jam.'
            ])->setStatusCode(400);
        }

        $data = [
            'id'              => sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)),
            'employeeId'      => $json->employeeId ?? $this->request->getVar('employeeId'),
            'coachId'         => $json->coachId ?? $this->request->getVar('coachId'),
            'topic'           => $json->topic ?? $this->request->getVar('topic'),
            'category'        => $json->category ?? $this->request->getVar('category'),
            'date'            => $json->date ?? $this->request->getVar('date'),
            'startTime'       => $json->startTime ?? $this->request->getVar('startTime'),
            'endTime'         => $json->endTime ?? $this->request->getVar('endTime'),
            'mode'            => $json->mode ?? $this->request->getVar('mode'),
            'meetingLink'     => $json->meetingLink ?? $this->request->getVar('meetingLink'),
            'roomName'        => $json->roomName ?? $this->request->getVar('roomName'),
            'reminderMinutes' => $json->reminderMinutes ?? $this->request->getVar('reminderMinutes') ?? 0,
            'status'          => 'Scheduled'
        ];

        $coachingModel = new CoachingSessionModel();
        $coachingModel->insert($data);

        // Simulasi notifikasi email ke Coach
        $userModel = new UserModel();
        $coach = $userModel->find($data['coachId']);
        if ($coach) {
            $emailModel = new EmailNotificationModel();
            $emailModel->insert([
                'id' => sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)),
                'recipientEmail' => $coach['email'],
                'subject' => 'Jadwal Coaching Baru: ' . $data['topic'],
                'body' => 'Anda memiliki jadwal coaching baru pada ' . $data['date'] . ' jam ' . $data['startTime'],
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Jadwal coaching berhasil dibuat.',
            'data'    => $data
        ]);
    }

    public function start($id)
    {
        $coachingModel = new CoachingSessionModel();
        if (!$coachingModel->find($id)) {
            return $this->response->setJSON(['status' => false, 'message' => 'Sesi tidak ditemukan'])->setStatusCode(404);
        }

        $coachingModel->update($id, ['status' => 'Active']);
        return $this->response->setJSON(['status' => true, 'message' => 'Sesi coaching dimulai']);
    }

    public function end($id)
    {
        $coachingModel = new CoachingSessionModel();
        if (!$coachingModel->find($id)) {
            return $this->response->setJSON(['status' => false, 'message' => 'Sesi tidak ditemukan'])->setStatusCode(404);
        }

        $json = $this->request->getJSON();
        
        $updateData = [
            'status'          => 'Completed',
            'isCompleted'     => true,
            'notes'           => $json->notes ?? $this->request->getVar('notes'),
            'followUp'        => isset($json->followUp) ? json_encode($json->followUp) : null,
            'rating'          => $json->rating ?? $this->request->getVar('rating'),
            'feedbackComment' => $json->feedbackComment ?? $this->request->getVar('feedbackComment'),
            'isAnonymous'     => $json->isAnonymous ?? $this->request->getVar('isAnonymous') ?? false,
        ];

        $coachingModel->update($id, $updateData);
        return $this->response->setJSON(['status' => true, 'message' => 'Sesi coaching selesai disimpan']);
    }
}
