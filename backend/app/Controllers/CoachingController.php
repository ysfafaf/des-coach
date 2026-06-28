<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\CoachingSessionModel;
use App\Models\EmailNotificationModel;
use App\Models\SessionReplyModel;
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

        $sessions = $this->attachRepliesToSessions($sessions);
        
        return $this->response->setJSON([
            'status' => true,
            'data'   => $sessions
        ]);
    }

    private function attachRepliesToSessions(array $sessions): array
    {
        if (empty($sessions)) {
            return $sessions;
        }

        $sessionIds = array_column($sessions, 'id');
        $replyModel = new SessionReplyModel();
        $userModel = new UserModel();

        $replies = $replyModel->whereIn('sessionId', $sessionIds)
                              ->orderBy('timestamp', 'ASC')
                              ->findAll();

        $repliesBySession = [];
        foreach ($replies as $reply) {
            $author = $userModel->find($reply['authorId']);
            $repliesBySession[$reply['sessionId']][] = [
                'id'         => $reply['id'],
                'authorName' => $author['name'] ?? 'Unknown',
                'authorRole' => $author['role'] ?? 'HOD',
                'content'    => $reply['content'],
                'timestamp'  => $reply['timestamp'],
            ];
        }

        foreach ($sessions as &$session) {
            $session['replies'] = $repliesBySession[$session['id']] ?? [];
        }

        return $sessions;
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

    public function update($id)
    {
        $coachingModel = new CoachingSessionModel();
        $session = $coachingModel->find($id);

        if (!$session) {
            return $this->response->setJSON(['status' => false, 'message' => 'Sesi tidak ditemukan'])->setStatusCode(404);
        }

        if ($session['status'] !== 'Scheduled') {
            return $this->response->setJSON([
                'status'  => false,
                'message' => 'Hanya sesi berstatus Scheduled yang dapat diedit.'
            ])->setStatusCode(400);
        }

        $json = $this->request->getJSON();

        $startTime = $json->startTime ?? $this->request->getVar('startTime') ?? $session['startTime'];
        $endTime = $json->endTime ?? $this->request->getVar('endTime') ?? $session['endTime'];
        $start = strtotime($startTime);
        $end = strtotime($endTime);

        if (($end - $start) <= 0) {
            return $this->response->setJSON([
                'status'  => false,
                'message' => 'Jam selesai harus setelah jam mulai.'
            ])->setStatusCode(400);
        }

        if (($end - $start) > 7200) {
            return $this->response->setJSON([
                'status'  => false,
                'message' => 'Sesi coaching maksimal 2 jam.'
            ])->setStatusCode(400);
        }

        $mode = $json->mode ?? $this->request->getVar('mode') ?? $session['mode'];

        $updateData = [
            'topic'           => $json->topic ?? $this->request->getVar('topic') ?? $session['topic'],
            'category'        => $json->category ?? $this->request->getVar('category') ?? $session['category'],
            'date'            => $json->date ?? $this->request->getVar('date') ?? $session['date'],
            'startTime'       => $startTime,
            'endTime'         => $endTime,
            'mode'            => $mode,
            'meetingLink'     => $mode === 'Online'
                ? ($json->meetingLink ?? $this->request->getVar('meetingLink') ?? $session['meetingLink'])
                : null,
            'roomName'        => $mode === 'Offline'
                ? ($json->roomName ?? $this->request->getVar('roomName') ?? $session['roomName'])
                : null,
            'reminderMinutes' => $json->reminderMinutes ?? $this->request->getVar('reminderMinutes') ?? $session['reminderMinutes'],
        ];

        if (isset($json->coachId) || $this->request->getVar('coachId')) {
            $updateData['coachId'] = $json->coachId ?? $this->request->getVar('coachId');
        }

        $coachingModel->update($id, $updateData);
        $updated = $coachingModel->find($id);
        $updatedWithReplies = $this->attachRepliesToSessions([$updated])[0];

        // Notify employee about schedule change
        $userModel = new UserModel();
        $employee = $userModel->find($updated['employeeId']);
        if ($employee) {
            $emailModel = new EmailNotificationModel();
            $emailModel->insert([
                'id' => sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)),
                'recipientEmail' => $employee['email'],
                'subject' => 'Jadwal Coaching Diperbarui: ' . $updated['topic'],
                'body' => 'Coach Anda telah memperbarui jadwal sesi coaching pada ' . $updated['date'] . ' jam ' . $updated['startTime'] . ' - ' . $updated['endTime'] . '. Mohon ikuti jadwal yang telah ditetapkan.',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Jadwal coaching berhasil diperbarui.',
            'data'    => $updatedWithReplies
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
        $existing = $coachingModel->find($id);
        
        $updateData = [
            'status'      => 'Completed',
            'isCompleted' => true,
        ];

        if (isset($json->notes) || $this->request->getVar('notes') !== null) {
            $updateData['notes'] = $json->notes ?? $this->request->getVar('notes');
        }
        if (isset($json->followUp) || $this->request->getVar('followUp') !== null) {
            $followUp = $json->followUp ?? $this->request->getVar('followUp');
            $updateData['followUp'] = is_array($followUp) ? json_encode($followUp) : $followUp;
        }
        if (isset($json->rating) || $this->request->getVar('rating') !== null) {
            $updateData['rating'] = $json->rating ?? $this->request->getVar('rating');
        }
        if (isset($json->feedbackComment) || $this->request->getVar('feedbackComment') !== null) {
            $updateData['feedbackComment'] = $json->feedbackComment ?? $this->request->getVar('feedbackComment');
        }
        if (isset($json->isAnonymous) || $this->request->getVar('isAnonymous') !== null) {
            $updateData['isAnonymous'] = $json->isAnonymous ?? $this->request->getVar('isAnonymous') ?? false;
        }

        // Preserve existing notes/followUp when only submitting feedback
        if (!isset($updateData['notes']) && !empty($existing['notes'])) {
            $updateData['notes'] = $existing['notes'];
        }
        if (!isset($updateData['followUp']) && !empty($existing['followUp'])) {
            $updateData['followUp'] = $existing['followUp'];
        }

        $coachingModel->update($id, $updateData);
        return $this->response->setJSON(['status' => true, 'message' => 'Sesi coaching selesai disimpan']);
    }
}
