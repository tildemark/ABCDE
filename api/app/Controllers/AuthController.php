<?php

namespace App\Controllers;

use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use CodeIgniter\API\ResponseTrait;

class AuthController extends ResourceController
{
    use ResponseTrait;

    protected $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    private function getRequestData()
    {
        // Check if request is JSON
        $json = $this->request->getJSON(true);
        return $json ?: $this->request->getPost();
    }

    public function register()
    {
        $data = $this->getRequestData();

        $rules = [
            'username' => 'required|is_unique[users.username]',
            'email'    => 'required|valid_email|is_unique[users.email]',
            'password' => 'required|min_length[6]'
        ];

        if (!$this->validate($rules, $data)) {
            return $this->fail($this->validator->getErrors());
        }

        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);

        $this->userModel->insert($data);

        return $this->respondCreated(['message' => 'User registered successfully.']);
    }

    public function login()
    {
        $data = $this->getRequestData();

        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return $this->failValidationErrors('Email and password are required.');
        }

        $user = $this->userModel->where('email', $email)->first();

        if (!$user || !password_verify($password, $user['password'])) {
            return $this->failUnauthorized('Invalid credentials');
        }

        $key = getenv('JWT_SECRET');
        $payload = [
            'iss' => base_url(),
            'aud' => base_url(),
            'iat' => time(),
            'exp' => time() + 3600, // Token expires in 1 hour
            'sub' => $user['id']
        ];

        $token = JWT::encode($payload, $key, 'HS256');

        return $this->respond(['token' => $token]);
    }

    public function profile()
    {
        return $this->respond([
            'message' => 'Protected route accessed!',
            'user'    => $this->request->user, // This is set in the AuthFilter
        ]);
    }
}
