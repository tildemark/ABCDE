<?php

namespace App\Helpers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use CodeIgniter\Config\BaseConfig;

class JwtHelper
{
    private static string $secretKey = "your_secret_key_here";
    private static string $algo = "HS256";
    private static int $tokenExpiration = 3600; // 1 hour

    /**
     * Generate JWT Token
     */
    public static function generateToken(array $data): string
    {
        $issuedAt = time();
        $expireAt = $issuedAt + self::$tokenExpiration;

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expireAt,
            'data' => $data
        ];

        return JWT::encode($payload, self::$secretKey, self::$algo);
    }

    /**
     * Validate JWT Token
     */
    public static function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::$secretKey, self::$algo));
            return (array)$decoded->data;
        } catch (\Exception $e) {
            return null;
        }
    }
}
