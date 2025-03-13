<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run()
    {
        $data = [
            [
                'username' => 'admin',
                'email' => 'admin@example.com',
                'password' => password_hash('password', PASSWORD_DEFAULT),
            ],
            [
                'username' => 'user1',
                'email' => 'user1@example.com',
                'password' => password_hash('password', PASSWORD_DEFAULT),
            ],
        ];

        $this->db->table('users')->insertBatch($data);
    }
}
