<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\UserModel;

class UserController extends BaseController
{
    public function index()
    {
        $userModel = new UserModel();
        $role = $this->request->getVar('role');
        
        if ($role) {
            $users = $userModel->where('role', $role)->findAll();
        } else {
            $users = $userModel->findAll();
        }
        
        // Remove password fields for security
        foreach ($users as &$user) {
            unset($user['password']);
        }
        
        return $this->response->setJSON([
            'status' => true,
            'data'   => $users
        ]);
    }

    public function create()
    {
        $rules = [
            'name'     => 'required',
            'email'    => 'required|valid_email|is_unique[app_users.email]',
            'role'     => 'required|in_list[HOD,Admin,Supervisi,Karyawan]',
            'password' => 'required|min_length[6]'
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status' => false,
                'errors' => $this->validator->getErrors()
            ])->setStatusCode(400);
        }

        $json = $this->request->getJSON();

        $data = [
            'id'       => sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)),
            'name'     => $json->name ?? $this->request->getVar('name'),
            'email'    => $json->email ?? $this->request->getVar('email'),
            'role'     => $json->role ?? $this->request->getVar('role'),
            'phone'    => $json->phone ?? $this->request->getVar('phone'),
            'gender'   => $json->gender ?? $this->request->getVar('gender'),
            'position' => $json->position ?? $this->request->getVar('position'),
            'status'   => $json->status ?? $this->request->getVar('status') ?? 'Active',
            'password' => password_hash($json->password ?? $this->request->getVar('password'), PASSWORD_BCRYPT)
        ];

        $userModel = new UserModel();
        if (!$userModel->insert($data)) {
            return $this->response->setJSON([
                'status' => false,
                'errors' => $userModel->errors()
            ])->setStatusCode(500);
        }

        unset($data['password']);

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'User created successfully',
            'data'    => $data
        ]);
    }

    public function update($id = null)
    {
        $userModel = new UserModel();
        $user = $userModel->find($id);

        if (!$user) {
            return $this->response->setJSON(['status' => false, 'message' => 'User not found'])->setStatusCode(404);
        }

        $json = $this->request->getJSON();
        $data = [
            'name'     => $json->name ?? $this->request->getVar('name') ?? $user['name'],
            'phone'    => $json->phone ?? $this->request->getVar('phone') ?? $user['phone'],
            'gender'   => $json->gender ?? $this->request->getVar('gender') ?? $user['gender'],
            'position' => $json->position ?? $this->request->getVar('position') ?? $user['position'],
            'role'     => $json->role ?? $this->request->getVar('role') ?? $user['role'],
            'status'   => $json->status ?? $this->request->getVar('status') ?? $user['status'],
        ];

        $password = $json->password ?? $this->request->getVar('password');
        if (!empty($password)) {
            $data['password'] = password_hash($password, PASSWORD_BCRYPT);
        }

        $userModel->update($id, $data);

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'User updated successfully'
        ]);
    }

    public function delete($id = null)
    {
        $userModel = new UserModel();
        if (!$userModel->find($id)) {
            return $this->response->setJSON(['status' => false, 'message' => 'User not found'])->setStatusCode(404);
        }

        $userModel->delete($id);

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'User deleted successfully'
        ]);
    }
}
