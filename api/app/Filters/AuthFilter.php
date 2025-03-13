<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $header = $request->getHeaderLine('Authorization');

        if (!$header) {
            return response()->setJSON(['error' => 'Missing Authorization header'])->setStatusCode(401);
        }

        try {
            $key = getenv('JWT_SECRET');
            $token = str_replace('Bearer ', '', $header);
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            // Add user info to request for later use
            $request->user = (array) $decoded;
        } catch (\Exception $e) {
            return response()->setJSON(['error' => 'Invalid or expired token'])->setStatusCode(401);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // No post-processing needed
    }
}
